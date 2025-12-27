use anchor_lang::prelude::*;
use anchor_spl::token::{TokenAccount, Token, Mint};
use anchor_lang::solana_program::sysvar::rent::Rent;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkgSgK6z7uJc");

#[program]
pub mod prediction_market {
    use super::*;

    pub fn initialize_market(ctx: Context<InitializeMarket>, market_id: u64) -> Result<()> {
        let market_key = ctx.accounts.market.to_account_info().key.clone();
        let market = &mut ctx.accounts.market;
        market.market_id = market_id;
        market.outcomes = [0u128, 0u128];

        // Derive vault PDA and verify the provided vault matches
        let (expected_vault, bump) = Pubkey::find_program_address(&[b"vault", market_key.as_ref()], ctx.program_id);
        if ctx.accounts.vault.key() != expected_vault {
            return err!(ErrorCode::InvalidVaultAccount);
        }
        market.vault = expected_vault;
        market.vault_bump = bump;
        market.vault_balance = 0u64;
        Ok(())
    }

    /// LzCompose handler - called by an executor after tokens have been minted/transferred to the vault PDA
    /// Payload is expected to be standard Solidity ABI encoding of (address user_evm_address, uint64 market_id, uint8 outcome)
    pub fn lz_compose(ctx: Context<LzCompose>, payload: Vec<u8>) -> Result<()> {
        // avoid double borrowing market account
        let market_key = ctx.accounts.market.to_account_info().key.clone();
        let market = &mut ctx.accounts.market;

        // Decode the ABI encoded payload (32-byte aligned words)
        let (user_evm_address, market_id, outcome) = decode_abi_payload(&payload)
            .map_err(|_| error!(ErrorCode::PayloadDecodeFailed))?;

        // Basic checks
        if market.market_id != market_id {
            return err!(ErrorCode::MarketMismatch);
        }

        // Verify the vault account passed matches the PDA derived from the market
        let (expected_vault, _bump) = Pubkey::find_program_address(&[b"vault", market_key.as_ref()], ctx.program_id);
        if ctx.accounts.vault.key() != expected_vault {
            return err!(ErrorCode::InvalidVaultAccount);
        }

        // Verify token mint matches expected bridged mint (USDC)
        if ctx.accounts.token_account.mint != ctx.accounts.usdc_mint.key() {
            return err!(ErrorCode::InvalidMint);
        }

        // Verify that tokens have arrived: compute delta = current vault balance - previous tracked balance
        let current_balance = ctx.accounts.token_account.amount;
        let prev_balance = market.vault_balance;
        require!(current_balance >= prev_balance, ErrorCode::InvalidVaultBalance);
        let delta = current_balance.checked_sub(prev_balance).ok_or(ErrorCode::MathError)?;
        require!(delta > 0, ErrorCode::NoNewFunds);

        // Update market outcome stats (supports 2 outcomes in this sample)
        let idx = outcome as usize;
        if idx >= market.outcomes.len() {
            return err!(ErrorCode::InvalidOutcome);
        }
        market.outcomes[idx] = market.outcomes[idx].checked_add(delta as u128).ok_or(ErrorCode::MathError)?;

        // Derive expected user position PDA: ["userpos", market_id_le_bytes, user_evm]
        let market_id_bytes = market_id.to_le_bytes();
        let (expected_userpos, userpos_bump) = Pubkey::find_program_address(&[b"userpos", &market_id_bytes, &user_evm_address], ctx.program_id);
        if ctx.accounts.user_position.key() != expected_userpos {
            return err!(ErrorCode::InvalidUserPosition);
        }

        // If user position does not exist, we require it be created off-chain by the caller/test harness to simplify this example
        if ctx.accounts.user_position.to_account_info().data_is_empty() {
            return err!(ErrorCode::InvalidUserPosition);
        }

        // Update user position (account must be created by caller/test harness)
        if ctx.accounts.user_position.to_account_info().data_is_empty() {
            return err!(ErrorCode::InvalidUserPosition);
        }

        let user_pos = &mut ctx.accounts.user_position;
        user_pos.market_id = market_id;
        user_pos.user_evm = user_evm_address;
        user_pos.amount = user_pos.amount.checked_add(delta).unwrap_or(delta);
        user_pos.outcome = outcome;

        // Update market vault balance
        market.vault_balance = current_balance;

        Ok(())
    }
}

// -----------------------------
// Accounts
// -----------------------------



#[account]
pub struct MarketAccount {
    pub market_id: u64,
    pub outcomes: [u128; 2],
    pub vault: Pubkey,
    pub vault_bump: u8,
    pub vault_balance: u64,
}

#[account]
pub struct UserPosition {
    pub market_id: u64,
    pub user_evm: [u8;20],
    pub amount: u64,
    pub outcome: u8,
}

#[derive(Accounts)]
pub struct InitializeMarket<'info> {
    #[account(init, payer = payer, space = 8 + std::mem::size_of::<MarketAccount>())]
    pub market: Account<'info, MarketAccount>,

    /// CHECK: Vault PDA (must be derived from the market pubkey) - validated in `initialize_market`
    #[account(mut)]
    pub vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LzCompose<'info> {
    // Market account (must be mutable to update balances)
    #[account(mut)]
    pub market: Account<'info, MarketAccount>,

    /// CHECK: Vault PDA where tokens are minted to - validated in `lz_compose`
    #[account(mut)]
    pub vault: UncheckedAccount<'info>,

    /// Token account for USDC holding the vault tokens
    pub token_account: Account<'info, TokenAccount>,

    /// USDC mint accounted for
    pub usdc_mint: Account<'info, Mint>,



    /// Executor/Caller - typically the LayerZero executor
    pub executor: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    // The user_position is expected to be an initialized Account<UserPosition> PDA with seeds ["userpos", market_id_le_bytes, user_evm]
    #[account(mut)]
    pub user_position: Account<'info, UserPosition>,
}

// -----------------------------
// Helpers
// -----------------------------

/// Decode the standard Solidity ABI-encoded bytes for (address, uint64, uint8)
/// Expects 32 bytes per value (total 96 bytes)
fn decode_abi_payload(data: &[u8]) -> Result<([u8;20], u64, u8)> {
    if data.len() != 96 {
        return Err(error!(ErrorCode::InvalidPayloadLength));
    }

    // address is in first 32 bytes, right-most 20 bytes are the address
    let mut addr = [0u8; 20];
    addr.copy_from_slice(&data[12..32]);

    // market_id is in next 32 bytes (big endian as per abi), take last 8 bytes
    let market_id_bytes = &data[32 + 24..32 + 32];
    let market_id = u64::from_be_bytes(market_id_bytes.try_into().unwrap());

    // outcome is in the next 32 bytes, take last byte
    let outcome = data[64 + 31];

    Ok((addr, market_id, outcome))
}

// -----------------------------
// Errors
// -----------------------------

#[error_code]
pub enum ErrorCode {
    #[msg("Payload decode failed")]
    PayloadDecodeFailed,
    #[msg("Market mismatch")]
    MarketMismatch,
    #[msg("Invalid vault account")]
    InvalidVaultAccount,
    #[msg("Invalid mint for bridged token")]
    InvalidMint,
    #[msg("Invalid vault balance")]
    InvalidVaultBalance,
    #[msg("No new funds detected")]
    NoNewFunds,
    #[msg("Math overflow or underflow")]
    MathError,
    #[msg("Invalid outcome")]
    InvalidOutcome,
    #[msg("Invalid user position account")]
    InvalidUserPosition,
    #[msg("Invalid payload length")]
    InvalidPayloadLength,
    #[msg("Missing bump")]
    MissingBump,
}
