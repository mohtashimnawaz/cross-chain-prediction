import Head from 'next/head'
import WalletConnect from '../components/WalletConnect'
import MarketList from '../components/MarketList'
import PlaceBet from '../components/PlaceBet'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Head>
        <title>Prediction Market — Frontend</title>
      </Head>

      <header className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Prediction Market — Frontend (Prototype)</h1>
        <p className="text-sm text-gray-600 mt-1">Demo UI for placing cross-chain bets (EVM → Solana)</p>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <section className="mb-6">
          <WalletConnect />
        </section>

        <section className="p-4 border rounded bg-white">
          <h2 className="font-medium">Market List</h2>
          <p className="text-sm text-gray-500">Below are on-chain markets discovered by scanning the program's accounts.</p>
          <div className="mt-4">
            <MarketList />
            <PlaceBet />
          </div>
        </section>
      </main>
    </div>
  )
}
