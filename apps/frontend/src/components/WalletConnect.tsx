import React, { useState } from 'react'
import { ethers } from 'ethers'

export default function WalletConnect() {
  const [ethAddress, setEthAddress] = useState<string | null>(null)
  const [solAddress, setSolAddress] = useState<string | null>(null)

  async function connectMetaMask() {
    try {
      const anyWindow = window as any
      if (!anyWindow.ethereum) return alert('MetaMask not found')
      const provider = new ethers.providers.Web3Provider(anyWindow.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const addr = await signer.getAddress()
      setEthAddress(addr)
    } catch (e) {
      console.error(e)
      alert('Failed to connect MetaMask')
    }
  }

  async function connectPhantom() {
    try {
      const anyWindow = window as any
      if (!anyWindow.solana || !anyWindow.solana.isPhantom) return alert('Phantom wallet not found')
      const resp = await anyWindow.solana.connect()
      setSolAddress(resp.publicKey.toString())
    } catch (e) {
      console.error(e)
      alert('Failed to connect Phantom')
    }
  }

  return (
    <div className="p-4 bg-white border rounded">
      <h3 className="font-medium mb-2">Wallets</h3>
      <div className="flex gap-4 items-center">
        <div>
          <button onClick={connectMetaMask} className="px-3 py-1 bg-indigo-600 text-white rounded">
            Connect MetaMask
          </button>
          <div className="text-sm text-gray-600 mt-1">{ethAddress ?? 'Not connected'}</div>
        </div>

        <div>
          <button onClick={connectPhantom} className="px-3 py-1 bg-green-600 text-white rounded">
            Connect Phantom
          </button>
          <div className="text-sm text-gray-600 mt-1">{solAddress ?? 'Not connected'}</div>
        </div>
      </div>
    </div>
  )
}
