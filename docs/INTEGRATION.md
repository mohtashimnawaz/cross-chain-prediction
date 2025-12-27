# Integration Notes — Cross-Chain Prediction Market

This document explains how EVM clients should derive PDAs (so that bridged tokens land in the Solana program vault), how to construct the compose message for `lz_compose`, and a sample TypeScript snippet using LayerZero V2 options.

## Derive the Solana PDA (vault)

The Solana program derives the vault PDA using the seeds:

- Seed 1: `b"vault"` (literal bytes)
- Seed 2: `market_pubkey.to_bytes()` (the market account's public key bytes)

On the client (TypeScript) you should compute it the same way:

```ts
import { PublicKey } from '@solana/web3.js';

// programId: the Prediction Market program id (PublicKey)
// marketPubkey: PublicKey (market account created or known)

const [vaultPda, bump] = await PublicKey.findProgramAddress(
  [Buffer.from('vault'), marketPubkey.toBuffer()],
  programId
);

// vaultPda.toBuffer() gives you the 32 bytes. Convert to hex and pack into bytes32 for EVM.
const vaultBytes32 = '0x' + Buffer.from(vaultPda.toBuffer()).toString('hex');
```

Pass `vaultBytes32` as the `to` address (32 bytes) in the OFT send param so tokens mint to that vault PDA.

> Note: both sides must agree exactly on the seed order and content. Mismatches will send tokens elsewhere or fail.

## Compose message format (ABI encoded)

The Solidity adapter will construct `composeMsg` using the standard Solidity ABI encoding (32-byte aligned):

- address (user EVM address)  => 32 bytes (right-aligned within 32)
- uint64 (marketId)          => 32 bytes (value in low bytes)
- uint8 (outcome)            => 32 bytes (value in low byte)

Solidity example (ethers.js):

```js
import { ethers } from 'ethers';

const composeMsg = ethers.utils.defaultAbiCoder.encode(
  ['address', 'uint64', 'uint8'],
  [userAddress, marketId, outcome]
);
```

On Solana, the program decodes this 96-byte payload by extracting the last 20 bytes of the first 32 for the address, the last 8 bytes of the second 32 for `market_id`, and the last byte of the third 32 for `outcome`.

## OptionsBuilder / Executor Options (LayerZero V2)

You should configure execution options so that:

1. The recipient on Solana is the vault PDA (`to` bytes32) — this ensures minted tokens land in the program-owned vault.
2. A compose option is included to call the Prediction Market program's `lz_compose` instruction in the same transaction so the program can consume the newly-arrived tokens atomically.

Pseudocode (TypeScript / `layerzero-v2/options`):

```ts
import { OptionsBuilder } from 'layerzero-v2/options';

const builder = new OptionsBuilder();

// 1) Request executor to deposit/mint tokens into `vaultPda`
builder.addExecutorLzReceiveOption({ to: vaultPdaBytes32 });

// 2) Request executor to call compose on the prediction program
builder.addExecutorLzComposeOption({ programId: predictionProgramBytes32, composeMsg });

const options = builder.build();

// Then call the OFT adapter's send with the options and to = vaultPdaBytes32

```

Exact APIs differ depending on the layerzero-v2 package version; the important part is: ensure the `to` in the SendParam is the vault PDA and the compose option carries the `composeMsg`.

## Security & Reliability Notes

- Always check PDAs with the Solana program's expected seeds. The EVM client is authoritative for derivation for sending; cross-check in tests.
- Compose messages should be ABI encoded with explicit types to avoid accidental differences in encoding/decoding.
- The Solana program should compute the delta between `vault` token balance and the previous known balance stored in the `Market` state to determine `bet_amount` safely (this avoids needing the amount inside the payload while still verifying tokens arrived).
- For production, include replay protections (e.g., incrementing nonces or storing recently-processed tx hashes) to avoid duplicate composition processing.

## Next steps / TODOs

- Add a TypeScript utility in `scripts/` that takes a market id and returns `vaultBytes32` so frontends can consume it directly.
- Add end-to-end tests bridging from a local Ganache/Hardhat environment to a local Solana validator using a test executor that simulates LayerZero messaging.
