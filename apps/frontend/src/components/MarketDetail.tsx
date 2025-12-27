import React from 'react'
import { Market } from '../utils/solana'

export default function MarketDetail({ market, onClose, onRefresh } : { market: Market, onClose: ()=>void, onRefresh: ()=>void }){
  const a = BigInt(market.outcomes[0])
  const b = BigInt(market.outcomes[1])
  const total = a + b
  const pctA = total === 0n ? 50 : Number((a * 100n) / total)
  const pctB = total === 0n ? 50 : Number((b * 100n) / total)

  return (
    <div className="p-4 border rounded bg-white card">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium mb-1">Market #{market.marketId}</h3>
          <div className="text-sm text-gray-600">Vault: {market.vault.toBase58()}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={onRefresh} className="px-3 py-1 bg-gray-100 rounded">Refresh</button>
          <button onClick={onClose} className="px-3 py-1 bg-red-50 text-red-600 rounded">Close</button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <div>
          <div className="text-xs text-gray-500">Outcome 0</div>
          <div className="text-sm font-medium">{market.outcomes[0].toString()}</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2"><div className="progress-filled" style={{ width: `${pctA}%` }} /></div>
          <div className="text-xs text-gray-500 mt-1">{pctA}%</div>
        </div>

        <div>
          <div className="text-xs text-gray-500">Outcome 1</div>
          <div className="text-sm font-medium">{market.outcomes[1].toString()}</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2"><div className="progress-filled" style={{ width: `${pctB}%` }} /></div>
          <div className="text-xs text-gray-500 mt-1">{pctB}%</div>
        </div>

        <div className="text-sm text-gray-600">Vault balance: {market.vaultBalance.toString()}</div>
      </div>
    </div>
  )
}
