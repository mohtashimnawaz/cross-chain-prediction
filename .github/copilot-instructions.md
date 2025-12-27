# Copilot / AI Agent Instructions — cross-chain-prediction

Purpose
- Short guide for AI coding agents to become productive quickly in this repository. Use this file as the single source of explicit, repository-specific guidance for builds, tests, patterns, and boundaries.

NOTE
- When I created this file the repository had no source files or README. Update the sections below with exact commands, paths and examples once the project files exist.


Getting started (cross-chain-prediction quickstart)
Prerequisites:
- Install Solana CLI (https://docs.solana.com/cli/install) and Anchor CLI (https://project-serum.github.io/anchor/getting-started/installation).
- Ensure Node 18+ and npm installed for JS tests.

1. Build and test the Solana Anchor program:
   - `anchor build` (from repo root; builds `programs/prediction_market`)
   - `anchor test` (runs integration tests in `programs/prediction_market/tests/`)
   - To run only JS/TS tests: `cd programs/prediction_market && npm install && npm test` (note: `@project-serum/anchor` should be resolvable from npm; if not, follow Anchor install docs or use the exact version permitted by your environment)
2. Build and test Solidity contracts:
   - Contracts are in `contracts/`. Use Foundry or Hardhat for EVM tests.
   - Example (Foundry): `forge test --match-contract PredictionMarketAdapter`
   - Example (Hardhat): `npx hardhat test contracts/PredictionMarketAdapter.sol`
3. CI/CD:
   - See `.github/workflows/anchor.yml` for build/test pipeline (runs on push/PR)
4. Integration and scripts:
   - See `docs/INTEGRATION.md` for cross-chain message and PDA derivation details
   - Add scripts to `scripts/` for PDA derivation, compose message construction, and E2E flows


Architecture & patterns
- Solana program: `programs/prediction_market` (Anchor, LayerZero V2 integration, zero-copy state)
- Solidity adapter: `contracts/PredictionMarketAdapter.sol` (inherits OFTAdapter, uses OptionsBuilder)
- Cross-chain flow: EVM user calls `placeBetCrossChain`, USDC is sent via LayerZero to Solana PDA, composeMsg triggers `lz_compose` on Solana
- Key pattern: All cross-chain token transfers must target the program vault PDA, not user wallets. PDA derivation must match between EVM and Solana (see `docs/INTEGRATION.md`).
- Compose message is always Solidity ABI-encoded (address, uint64, uint8) and decoded in Solana with a helper.


Testing and CI
- Anchor: `anchor test` (runs local validator, compiles, and tests Solana program)
- JS/TS: `npm test` in `programs/prediction_market` (runs Mocha/Anchor tests)
- Solidity: `forge test` or `npx hardhat test` in `contracts/`
- CI: `.github/workflows/anchor.yml` runs all build/test steps on push/PR


Conventions & project specifics
- All cross-chain token flows use LayerZero V2 OFT and lzCompose (see `contracts/PredictionMarketAdapter.sol`)
- Vault PDA derivation: always use `[b"vault", market_pubkey.to_bytes()]` (see `docs/INTEGRATION.md`)
- Compose message: always ABI encode (address, uint64, uint8) for cross-chain bets
- Add new markets via `initialize_market` (see Anchor program)
- Add new outcomes by extending the `outcomes` array in `MarketAccount` (Rust)

Safety & scope for automated edits
- Never add or modify infrastructure provisioning (k8s manifests, terraform) without explicit acceptance criteria and passing CI.
- Avoid changes that increase external RPC calls in automated PRs — prefer mocks or integration flags.

When changing ML code or model weights
- Add a small, fast unit/integration test using synthetic data (include deterministic seed).
- Document any training parameters or datasets in `models/README.md` or `notebooks/`.
- If model artifacts are large, reference them via URLs or CI artifacts rather than committing binaries.


Key files & patterns
- Solana program: `programs/prediction_market/src/lib.rs` (Anchor, LayerZero V2, lz_compose)
- Solidity adapter: `contracts/PredictionMarketAdapter.sol` (OFTAdapter, OptionsBuilder, composeMsg)
- Integration: `docs/INTEGRATION.md` (PDA derivation, compose message, security)
- JS/TS tests: `programs/prediction_market/tests/prediction_market.test.ts`

How to update this file
- Add or edit the "Known commands" block below with exact shell commands and one-line purpose for each.
- Add explicit examples of important tests (`pytest tests/test_predictor.py::test_simple_case`) and a short reproduction snippet.


Known commands
- Build Solana: `anchor build` (from repo root)
- Test Solana: `anchor test` (from repo root)
- Test JS/TS: `cd programs/prediction_market && npm install && npm test`
- Build Solidity: `forge build` or `npx hardhat compile` in `contracts/`
- Test Solidity: `forge test` or `npx hardhat test` in `contracts/`
- Lint JS/TS: `npx eslint .` in `programs/prediction_market` (if configured)


If anything is unclear
- Create a short issue or PR titled `chore: document project commands and entrypoints` with findings and proposed commands.


Contact / ownership
- For Solana/Anchor or LayerZero integration, contact the protocol architect or see `docs/INTEGRATION.md` for technical details.

---
Feedback request
- If you'd like, I can (a) run an automated scan once source files exist and fill concrete commands, and (b) expand the "Known commands" section with exact invocations and examples from real files. Reply with permission to proceed.
