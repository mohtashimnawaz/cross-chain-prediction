import React from 'react'
import WalletConnect from './components/WalletConnect'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Prediction Market — Frontend (Prototype)</h1>
        <p className="text-sm text-gray-600 mt-1">Demo UI for placing cross-chain bets (EVM → Solana)</p>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <section className="mb-6">
          <WalletConnect />
        </section>

        <section className="p-4 border rounded bg-white">
          <h2 className="font-medium">Market List (stub)</h2>
          <p className="text-sm text-gray-500">Markets will be listed here (read from Solana program).</p>
        </section>
      </main>
    </div>
  )
}
