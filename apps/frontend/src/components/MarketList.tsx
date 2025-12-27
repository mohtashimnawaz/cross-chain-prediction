import React, { useEffect, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { useWallet } from '../contexts/WalletContext'
import { fetchMarkets, Market } from '../utils/solana'
import MarketDetail from './MarketDetail'

const DEFAULT_PROGRAM_ID = process.env.NEXT_PUBLIC_PREDICTION_PROGRAM_ID || 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkgSgK6z7uJc'

export default function MarketList({ onSelectMarket } : { onSelectMarket?: (m: Market)=>void }) {
  const { solConnection } = useWallet()
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Market | null>(null)

  async function load() {
    setLoading(true)
    try {
      const programId = new PublicKey(DEFAULT_PROGRAM_ID)
      const ms = await fetchMarkets(solConnection, programId)
      if (ms.length === 0) {
        // fallback to local sample markets.json for a nicer dev experience
        try {
          const j = await fetch('/markets.json').then(r => r.json())
          const mapped = j.map((s: any) => {
            try {
              return {
                pubkey: new PublicKey(s.pubkey),
                marketId: Number(s.marketId),
                outcomes: [BigInt(s.outcomes[0]), BigInt(s.outcomes[1])],
                vault: new PublicKey(s.vault),
                vaultBump: Number(s.vaultBump),
                vaultBalance: BigInt(s.vaultBalance),
              }
            } catch (err) {
              // If any value is invalid (e.g., base58), fall back to a safe placeholder using program id
              return {
                pubkey: new PublicKey(DEFAULT_PROGRAM_ID),
                marketId: Number(s.marketId) || 0,
                outcomes: [BigInt(s.outcomes?.[0] || 0n), BigInt(s.outcomes?.[1] || 0n)],
                vault: new PublicKey(DEFAULT_PROGRAM_ID),
                vaultBump: Number(s.vaultBump) || 0,
                vaultBalance: BigInt(s.vaultBalance || 0n),
              }
            }
          })
          setMarkets(mapped)
          return
        } catch (e2) {
          // ignore fallback errors
          console.info('fallback markets failed', e2)
        }
      }
      setMarkets(ms)
    } catch (e) {
      console.error(e)
      setMarkets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium text-lg">Available Markets</h2>
        <div className="flex gap-2 items-center">
          <button onClick={load} className="px-3 py-1 bg-gray-100 rounded border">Refresh</button>
          <button onClick={async ()=>{
            try {
              const j = await fetch('/markets.json').then(r=>r.json());
              const mapped = j.map((s:any)=>({
                pubkey: new PublicKey((s.pubkey) || DEFAULT_PROGRAM_ID),
                marketId: Number(s.marketId),
                outcomes: [BigInt(s.outcomes[0]), BigInt(s.outcomes[1])],
                vault: new PublicKey((s.vault) || DEFAULT_PROGRAM_ID),
                vaultBump: Number(s.vaultBump),
                vaultBalance: BigInt(s.vaultBalance),
              }))
              setMarkets(mapped)
            } catch (e) { console.error('load sample failed', e) }
          }} className="px-3 py-1 bg-gray-50 rounded border">Load sample</button>
          <div className="text-sm text-gray-500">{loading ? 'Loading…' : `${markets.length} markets`}</div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {loading && Array.from({length:4}).map((_,i)=>(
          <div key={i} className="p-4 rounded bg-white card">
            <div className="h-36 rounded skeleton"></div>
            <div className="mt-3 h-4 w-3/4 skeleton rounded"></div>
            <div className="mt-2 h-3 w-1/2 skeleton rounded"></div>
          </div>
        ))}

        {!loading && markets.map(m => {
          const a = BigInt(m.outcomes[0])
          const b = BigInt(m.outcomes[1])
          const total = a + b
          const pctB = total === 0n ? 50 : Number((b * 100n) / total)
          return (
            <div key={m.pubkey.toBase58()} className="p-4 rounded bg-white card cursor-pointer" onClick={() => { setSelected(m); onSelectMarket?.(m) }}>
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="M12 2l3 7h7l-5.6 4.1 2 7L12 16l-6.4 4.1 2-7L2 9h7l3-7z" fill="#e6e9f2"/></svg>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="font-medium">Market #{m.marketId}</div>
                    <div className="text-xs text-gray-400">Vault: {m.vault.toBase58().slice(0,6)}…</div>
                  </div>

                  <div className="mt-3">
                    <div className="text-xs text-gray-500">Outcome 0</div>
                    <div className="text-sm font-medium">{m.outcomes[0].toString()}</div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs text-gray-500">Outcome 1</div>
                    <div className="text-sm font-medium">{m.outcomes[1].toString()}</div>
                  </div>

                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="progress-filled" style={{ width: `${pctB}%` }} />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Outcome 1: {pctB}%</div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {selected && (
          <div className="mt-4 md:col-span-2">
            <MarketDetail market={selected} onClose={() => setSelected(null)} onRefresh={load} />
          </div>
        )}

        {!loading && markets.length === 0 && (
          <div className="text-sm text-gray-500">No markets found — loading fallback local sample data.</div>
        )}
      </div>
    </div>
  )
}
