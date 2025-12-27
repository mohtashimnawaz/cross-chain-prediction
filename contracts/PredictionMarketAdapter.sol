// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/*
  NOTE: The actual import paths for LayerZero V2 packages depend on how you installed them.
  Replace the following imports with the correct package paths from `layerzero-v2` in your project.
*/
import "@openzeppelin/contracts/access/Ownable.sol";
// import "@layerzerolabs/contracts-v2/contracts/adapters/OFTAdapter.sol";
// import "@layerzerolabs/contracts-v2/contracts/options/OptionsBuilder.sol";

/// @title PredictionMarketAdapter
/// @notice Adapter that sends USDC via LayerZero V2 to a Solana prediction market and composes a bet instruction
contract PredictionMarketAdapter is Ownable /*, OFTAdapter */ {
    // Placeholder for the USDC token address used by the OFTAdapter
    address public usdcOFT;

    // Address of the Solana program (as bytes32 or any agreed representation) - used only for comments/examples
    // In practice the `to` field of `SendParam` must be the Solana program's PDA (vault) bytes (32 bytes)

    // Include composeMsg in the event so tests can verify encoding and help integration
    event CrossChainBetSent(uint16 dstChainId, bytes32 to, uint64 marketId, uint8 outcome, uint256 amount, bytes composeMsg);

    constructor(address _endpoint, address _usdcOFT) /* OFTAdapter(_endpoint, _usdcOFT) */ Ownable(msg.sender) {
        usdcOFT = _usdcOFT;
    }

    /// @notice Encode the compose message used for lz_compose (ABI encoding)
    function encodeComposeMsg(address sender, uint64 marketId, uint8 outcome) public pure returns (bytes memory) {
        return abi.encode(sender, marketId, outcome);
    }

    /// @notice Place a bet cross-chain: send _amount of USDC via OFT to Solana and attach a composed message
    function placeBetCrossChain(
        uint16 _dstEid,
        uint256 _amount,
        uint64 _marketId,
        uint8 _outcome,
        bytes32 _solanaProgramPdaBytes
    ) external payable {
        require(_amount > 0, "Zero amount");

        // Build compose message using standard ABI encode (same decoding expected on Solana):
        bytes memory composeMsg = encodeComposeMsg(msg.sender, _marketId, _outcome);

        // In a real deployment you would build OptionsBuilder and call _lzSend. For unit tests we emit the full payload.
        emit CrossChainBetSent(_dstEid, _solanaProgramPdaBytes, _marketId, _outcome, _amount, composeMsg);
    }

    // --- Helper/Notes ---

    /*
      How to derive the Solana PDA (off-chain) to pass as `_solanaProgramPdaBytes`:

      On the client (TypeScript / Node), use the Solana SDK to derive the PDA deterministically using the same seeds
      used by the Solana program. For example, if the Solana program derives the vault PDA with:

        seeds = ["vault", marketPubkey.toBytes()]
        const [vaultPda, bump] = PublicKey.findProgramAddress(seeds, programId)

      convert the `vaultPda` into a 32-byte value and pass it as `bytes32` in Solidity. Ensure endianness stays as the
      canonical Solana PublicKey (big-endian byte order as produced by PublicKey::toBytes()).

      Example (TypeScript):

        import { PublicKey } from '@solana/web3.js';

        const marketPubkey = new PublicKey('<market-pubkey>');
        const [vaultPda] = await PublicKey.findProgramAddress(
          [Buffer.from('vault'), marketPubkey.toBuffer()],
          predictionProgramId
        );

        // vaultPda.toBuffer() is 32 bytes - convert to hex and pack into bytes32 to be used by the EVM client

      Security note: The EVM client must compute the same PDA the Solana program expects. If seeds or ordering
      differ the tokens will be minted to a different PDA (or fail). Always verify PDA derivation logic in both
      contracts/clients and tests.
    */
}
