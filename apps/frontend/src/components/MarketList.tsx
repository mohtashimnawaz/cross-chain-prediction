import React, { useEffect, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { useWallet } from '../contexts/WalletContext'
import { fetchMarkets, Market } from '../utils/solana'
import MarketDetail from './MarketDetail'

const DEFAULT_PROGRAM_ID = 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkgSgK6z7uJc'

export default function MarketList() {
  const { solConnection } = useWallet()
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Market | null>(null)

  async function load() {
    setLoading(true)
    try {
      const programId = new PublicKey(DEFAULT_PROGRAM_ID)
      const ms = await fetchMarkets(solConnection, programId)
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
        <h2 className="font-medium">Markets</h2>
        <div className="flex gap-2">
          <button onClick={load} className="px-2 py-1 bg-gray-200 rounded">Refresh</button>
          <div className="text-sm text-gray-500">{loading ? 'Loading…' : `${markets.length} markets`}</div>
        </div>
      </div>

      <div className="grid gap-3">
        {markets.map(m => (
          <div key={m.pubkey.toBase58()} className="p-3 bg-white border rounded hover:shadow cursor-pointer" onClick={() => setSelected(m)}>
            <div className="flex justify-between">
              <div>Market #{m.marketId}</div>
              <div className="text-sm text-gray-500">Vault: {m.vault.toBase58().slice(0,6)}…</div>
            </div>
            <div className="text-sm text-gray-600 mt-2">Outcome 0: {m.outcomes[0].toString()} • Outcome 1: {m.outcomes[1].toString()}</div>
          </div>
        ))}

        {selected && (
          <div className="mt-4">
            <MarketDetail market={selected} onClose={() => setSelected(null)} onRefresh={load} />
          </div>
        )}

        {markets.length === 0 && !loading && (
          <div className="text-sm text-gray-500">No markets found (make sure local Solana validator is running and program is deployed).</div>
        )}
      </div>
    </div>
  )
}
