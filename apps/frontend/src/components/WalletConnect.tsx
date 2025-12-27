import React from 'react'
import { useWallet } from '../contexts/WalletContext'

export default function WalletConnect() {
  const { ethAddress, solAddress, connectMetaMask, connectPhantom } = useWallet()

  return (
    <div className="p-4 bg-white border rounded">
      <h3 className="font-medium mb-2">Wallets</h3>
      <div className="flex gap-4 items-center">
        <div>
          <button onClick={() => connectMetaMask().catch(e => alert(e.message))} className="px-3 py-1 bg-indigo-600 text-white rounded">
            Connect MetaMask
          </button>
          <div className="text-sm text-gray-600 mt-1">{ethAddress ?? 'Not connected'}</div>
        </div>

        <div>
          <button onClick={() => connectPhantom().catch(e => alert(e.message))} className="px-3 py-1 bg-green-600 text-white rounded">
            Connect Phantom
          </button>
          <div className="text-sm text-gray-600 mt-1">{solAddress ?? 'Not connected'}</div>
        </div>
      </div>
    </div>
  )
}
