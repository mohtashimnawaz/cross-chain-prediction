# E2E Test Harness (OFT -> Solana compose simulation)

This directory contains guidance and scripts to run an end-to-end simulation of the OFT -> Solana compose flow.

Prereqs:
- Local Hardhat node (run in `contracts/`) for the EVM side
- Local Solana validator with Anchor CLI available and the program deployed (run `anchor test` or `anchor deploy` from repo root)

Steps:
1. Start a local Hardhat node
   - cd contracts
   - npx hardhat node

2. Generate an EVM compose message (writes to `e2e/out/compose.json`)
   - In another terminal: cd contracts && npx hardhat run --network localhost scripts/generate_compose.js

3. Deploy/verify the Solana program is available locally
   - From repo root, run `anchor test` (this will deploy the program to local validator and run tests)

4. Run the Anchor E2E test that consumes the compose message
   - cd programs/prediction_market
   - npm test  # mocha test will discover `e2e_from_evm.test.ts` and run it against local validator

Notes:
- The harness is intentionally minimal and demonstrates the payload flow and `lz_compose` handling. It does not attempt to fully automate launching the two local services.
- If you prefer, you can run `anchor test` first (it will start a validator and run all Anchor tests), then run the Hardhat script and the E2E test separately.

Happy testing! ✅
