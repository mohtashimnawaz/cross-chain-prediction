import { PublicKey, Connection } from '@solana/web3.js'

// Anchor account discriminator is 8 bytes
const ANCHOR_DISCRIMINATOR = 8

function readUint128LE(buf: Buffer, offset: number) {
  let res = 0n
  for (let i = 0; i < 16; i++) {
    res |= BigInt(buf[offset + i]) << BigInt(8 * i)
  }
  return res
}

export type Market = {
  pubkey: PublicKey
  marketId: number
  outcomes: [bigint, bigint]
  vault: PublicKey
  vaultBump: number
  vaultBalance: bigint
}

export function decodeMarketAccount(pubkey: PublicKey, data: Buffer): Market {
  if (data.length < ANCHOR_DISCRIMINATOR + 81) throw new Error('invalid market account data length')
  let offset = ANCHOR_DISCRIMINATOR
  const marketId = Number(data.readBigUInt64LE(offset))
  offset += 8
  const outcome0 = readUint128LE(data, offset)
  offset += 16
  const outcome1 = readUint128LE(data, offset)
  offset += 16
  const vaultBytes = data.slice(offset, offset + 32)
  const vault = new PublicKey(vaultBytes)
  offset += 32
  const vaultBump = data.readUInt8(offset)
  offset += 1
  const vaultBalance = data.readBigUInt64LE(offset)
  return {
    pubkey,
    marketId,
    outcomes: [outcome0, outcome1],
    vault,
    vaultBump,
    vaultBalance,
  }
}

export async function fetchMarkets(connection: Connection, programId: PublicKey) {
  const ACC_SIZE = 8 + 81
  const accounts = await connection.getProgramAccounts(programId, { filters: [{ dataSize: ACC_SIZE }] })
  return accounts.map(acc => decodeMarketAccount(acc.pubkey, Buffer.from(acc.account.data)))
}
