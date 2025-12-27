import React, { createContext, useContext, useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { Connection, PublicKey } from '@solana/web3.js'

type WalletContextType = {
  ethAddress: string | null
  solAddress: string | null
  ethProvider: ethers.providers.Web3Provider | null
  solConnection: Connection
  connectMetaMask: () => Promise<void>
  connectPhantom: () => Promise<void>
}

const DEFAULT_RPC = process.env.VITE_SOLANA_RPC || 'http://localhost:8899'
const DEFAULT_PROGRAM = process.env.VITE_PREDICTION_PROGRAM_ID || 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkgSgK6z7uJc'

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export const WalletProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [ethAddress, setEthAddress] = useState<string | null>(null)
  const [solAddress, setSolAddress] = useState<string | null>(null)
  const [ethProvider, setEthProvider] = useState<ethers.providers.Web3Provider | null>(null)

  const solConnection = new Connection(DEFAULT_RPC, 'confirmed')

  useEffect(() => {
    // detect already connected wallets
    const anyWindow = window as any
    if (anyWindow?.ethereum && anyWindow.ethereum.selectedAddress) {
      setEthAddress(anyWindow.ethereum.selectedAddress)
      setEthProvider(new ethers.providers.Web3Provider(anyWindow.ethereum))
    }
    if (anyWindow?.solana && anyWindow.solana.isPhantom && anyWindow.solana.publicKey) {
      setSolAddress(anyWindow.solana.publicKey.toString())
    }
  }, [])

  async function connectMetaMask() {
    const anyWindow = window as any
    if (!anyWindow.ethereum) throw new Error('MetaMask not found')
    const provider = new ethers.providers.Web3Provider(anyWindow.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const addr = await signer.getAddress()
    setEthAddress(addr)
    setEthProvider(provider)
  }

  async function connectPhantom() {
    const anyWindow = window as any
    if (!anyWindow.solana || !anyWindow.solana.isPhantom) throw new Error('Phantom not found')
    const resp = await anyWindow.solana.connect()
    setSolAddress(resp.publicKey.toString())
  }

  return (
    <WalletContext.Provider
      value={{ ethAddress, solAddress, ethProvider, solConnection, connectMetaMask, connectPhantom }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
