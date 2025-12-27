# Cross-Chain Prediction Market

This project demonstrates a cross-chain flow where an EVM user sends native USDC via LayerZero OFT to a Solana Prediction Market and composes a remote instruction (`lz_compose`) so the Solana program consumes the funds atomically.

Structure
- `programs/prediction_market` — Anchor (Solana) program implementing `initialize_market` and `lz_compose` and tests.
- `contracts/` — Solidity `PredictionMarketAdapter.sol` (OFT adapter) + Hardhat tests that validate encoding & event emission.
- `docs/INTEGRATION.md` — Integration notes for PDA derivation, compose message format, and security guidance.
- `scripts/derive_vault.js` — utility to derive vault PDA and print bytes32 for use on EVM side.

Quick commands
- Build & test Anchor program (local):
  - `anchor build`
  - `anchor test`
- Run EVM tests (Hardhat):
  - `cd contracts && npm ci && npm test`

CI
- GitHub Actions has jobs to build and test the Anchor program and run EVM tests. See `.github/workflows/anchor.yml`.

Notes
- For local EVM tests you need Node + npm and `hardhat` dev deps (see `contracts/package.json`).
- For Anchor tests you need the Solana CLI and Anchor CLI installed. If `@project-serum/anchor` cannot be fetched via npm in your environment, run Anchor's Rust tests (`anchor test`) using the installed Anchor CLI.

If you'd like, I can try to run the EVM tests in CI and fix any failures reported there.

CI: This branch will run the full test matrix (Anchor + EVM).