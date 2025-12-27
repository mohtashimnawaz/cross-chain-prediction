#!/usr/bin/env node
// Simple helper to initialize a market on the local Anchor program
// Usage: node scripts/init_market.js <marketId>

const anchor = require('@project-serum/anchor');
const { PublicKey, SystemProgram } = anchor.web3;

async function main() {
  const marketId = Number(process.argv[2] || 42);
  console.log('Initializing market', marketId);

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.PredictionMarket;
  if (!program) {
    console.error('PredictionMarket program not found in Anchor workspace. Run `anchor build` first or ensure ANCHOR_PROVIDER_URL is set and IDL is present.');
    process.exit(1);
  }

  const marketKeypair = anchor.web3.Keypair.generate();
  const [vaultPda, _bump] = await PublicKey.findProgramAddress([
    Buffer.from('vault'),
    marketKeypair.publicKey.toBytes(),
  ], program.programId);

  const tx = await program.rpc.initializeMarket(new anchor.BN(marketId), {
    accounts: {
      market: marketKeypair.publicKey,
      vault: vaultPda,
      payer: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [marketKeypair],
  });

  console.log('Initialized market', marketId, 'marketPubkey=', marketKeypair.publicKey.toBase58(), 'vault=', vaultPda.toBase58());
  console.log('Tx:', tx);
}

main().catch(err => { console.error(err); process.exit(1) });
