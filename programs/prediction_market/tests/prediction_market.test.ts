import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from '@solana/spl-token';

describe('prediction_market', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.PredictionMarket as Program<any>;

  it('initialize market', async () => {
    // create a new market account
    const marketKeypair = anchor.web3.Keypair.generate();

    // derive vault PDA based on market public key
    const [vaultPda, _bump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('vault'), marketKeypair.publicKey.toBytes()],
      program.programId
    );

    await program.rpc.initializeMarket(new anchor.BN(42), {
      accounts: {
        market: marketKeypair.publicKey,
        vault: vaultPda,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [marketKeypair],
    });

    const marketAccount = await program.account.marketAccount.fetch(marketKeypair.publicKey);
    // assert market id
    if (marketAccount.marketId.toNumber() !== 42) {
      throw new Error('market id mismatch');
    }
  });

  it('lz_compose processes incoming funds and updates state', async () => {
    const marketKeypair = anchor.web3.Keypair.generate();
    const marketId = 7;

    const [vaultPda, vaultBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('vault'), marketKeypair.publicKey.toBytes()],
      program.programId
    );

    await program.rpc.initializeMarket(new anchor.BN(marketId), {
      accounts: {
        market: marketKeypair.publicKey,
        vault: vaultPda,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [marketKeypair],
    });

    // Create a test USDC mint and mint some tokens into the vault's token account
    const mint = await createMint(provider.connection, provider.wallet.payer, provider.wallet.publicKey, null, 6);
    const vaultTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer,
      mint,
      vaultPda
    );

    // Mint 1000 tokens to the vault
    await mintTo(provider.connection, provider.wallet.payer, mint, vaultTokenAccount.address, provider.wallet.publicKey, 1000);

    // Build payload: 32-byte address (right-aligned 20 bytes), 32-byte marketId (big-endian last 8 bytes), 32-byte outcome (last byte)
    const userEvmAddress = Buffer.alloc(20, 0x11); // dummy 20 byte address
    const payload = Buffer.alloc(96);
    // address
    userEvmAddress.copy(payload, 12);
    // marketId (big endian in last 8 bytes)
    payload.writeBigUInt64BE(BigInt(marketId), 32 + 24);
    // outcome
    payload[64 + 31] = 1;

    // Derive expected user position PDA
    const marketIdLE = Buffer.alloc(8);
    marketIdLE.writeBigUInt64LE(BigInt(marketId));
    const [userPosPda, userPosBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('userpos'), marketIdLE, userEvmAddress],
      program.programId
    );

    // Call lz_compose as the executor (use the provider wallet for simplicity)
    await program.rpc.lzCompose(Array.from(payload), {
      accounts: {
        market: marketKeypair.publicKey,
        vault: vaultPda,
        tokenAccount: vaultTokenAccount.address,
        usdcMint: mint,
        userPosition: userPosPda,
        executor: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    });

    // Fetch market state and verify outcome updated
    const marketAccount = await program.account.marketAccount.fetch(marketKeypair.publicKey);
    const outcomeTotals = marketAccount.outcomes;
    if (BigInt(outcomeTotals[1]) === BigInt(0)) {
      throw new Error('outcome not updated');
    }

    // Fetch user position account raw data and parse
    const userPosAccountInfo = await provider.connection.getAccountInfo(userPosPda);
    if (!userPosAccountInfo) throw new Error('user position account not found');
    const data = userPosAccountInfo.data;
    // parse fields: market_id (u64 LE) at 0..8, user_evm 8..28, amount 28..36 (u64 LE), outcome 36
    const parsedMarketId = Number(data.readBigUInt64LE(0));
    if (parsedMarketId !== marketId) throw new Error('user pos market id mismatch');
    const parsedOutcome = data[36];
    if (parsedOutcome !== 1) throw new Error('user pos outcome mismatch');
  });
});
