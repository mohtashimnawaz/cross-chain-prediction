#!/usr/bin/env node
// Simple utility to derive the vault PDA and print it as 0x-prefixed bytes32
const { PublicKey } = require('@solana/web3.js');

async function main() {
  const [programId, market] = process.argv.slice(2);
  if (!programId || !market) {
    console.error('Usage: node derive_vault.js <programId> <marketPubkey>');
    process.exit(1);
  }

  const program = new PublicKey(programId);
  const marketPub = new PublicKey(market);
  const [vaultPda] = await PublicKey.findProgramAddress([
    Buffer.from('vault'),
    marketPub.toBuffer(),
  ], program);

  console.log('vault PDA:', vaultPda.toBase58());
  console.log('vault bytes32:', '0x' + Buffer.from(vaultPda.toBuffer()).toString('hex'));
}

main().catch(err => { console.error(err); process.exit(1); });