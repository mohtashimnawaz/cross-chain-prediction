import React from 'react'
import { Market } from '../utils/solana'

export default function MarketDetail({ market, onClose, onRefresh } : { market: Market, onClose: ()=>void, onRefresh: ()=>void }){
  return (
    <div className="p-4 border rounded bg-white">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium mb-1">Market #{market.marketId}</h3>
          <div className="text-sm text-gray-600">Vault: {market.vault.toBase58()}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={onRefresh} className="px-2 py-1 bg-gray-100 rounded">Refresh</button>
          <button onClick={onClose} className="px-2 py-1 bg-red-100 text-red-600 rounded">Close</button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs text-gray-500">Outcome 0</div>
          <div className="font-medium">{market.outcomes[0].toString()}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs text-gray-500">Outcome 1</div>
          <div className="font-medium">{market.outcomes[1].toString()}</div>
        </div>
      </div>

      <div className="mt-3 text-sm text-gray-600">Vault balance: {market.vaultBalance.toString()}</div>
    </div>
  )
}
