# Prediction Market — Frontend (Next.js Prototype)

Quick start:

1. cd apps/frontend
2. npm install
3. npm run dev

What this scaffold includes:
- Next.js + React + TypeScript
- Tailwind CSS config
- `WalletContext` for MetaMask (EVM) and Phantom (Solana)
- Market list that reads `MarketAccount` from the Anchor program

Notes:
- To test locally, run a local Solana validator and deploy the program (see `e2e/README.md`), and optionally run a Hardhat node for EVM interactions.
- The UI now includes a dynamic market list with a fallback `public/markets.json` used when no on-chain markets are found, skeleton loading states, progress bars, and improved header and Place Bet layout for a better dev UX.
