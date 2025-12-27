import React from 'react'
import { useWallet } from '../contexts/WalletContext'

export default function WalletConnect() {
  const { ethAddress, solAddress, connectMetaMask, connectPhantom } = useWallet()

  return (
    <div className="p-4 bg-white rounded border">
      <div className="flex items-center justify-between">
        <h3 className="font-medium mb-2">Wallets</h3>
        <div className="text-sm text-gray-500">{ethAddress ? 'Connected' : 'Not connected'}</div>
      </div>

      <div className="flex gap-4 items-center mt-2">
        <div className="flex-1">
          <button onClick={() => connectMetaMask().catch(e => alert(e.message))} className="w-full px-3 py-2 bg-indigo-600 text-white rounded shadow">
            Connect MetaMask
          </button>
          <div className="text-xs text-gray-500 mt-2 truncate">{ethAddress ?? 'Not connected'}</div>
        </div>

        <div className="flex-1">
          <button onClick={() => connectPhantom().catch(e => alert(e.message))} className="w-full px-3 py-2 bg-green-600 text-white rounded shadow">
            Connect Phantom
          </button>
          <div className="text-xs text-gray-500 mt-2 truncate">{solAddress ?? 'Not connected'}</div>
        </div>
      </div>
    </div>
  )
}
