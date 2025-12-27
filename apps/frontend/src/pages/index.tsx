import Head from 'next/head'
import WalletConnect from '../components/WalletConnect'
import MarketList from '../components/MarketList'
import PlaceBet from '../components/PlaceBet'

export default function Home() {
  const [selectedMarket, setSelectedMarket] = React.useState<{ marketId?: number, outcome?: number } | undefined>(undefined)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Head>
        <title>Prediction Market — Frontend</title>
      </Head>

      <header className="bg-gradient-to-r from-indigo-600 to-teal-400 text-white">
        <div className="max-w-6xl mx-auto p-6 flex items-center gap-4">
          <img src="/logo.svg" alt="logo" className="w-10 h-10 rounded-md shadow" />
          <div>
            <h1 className="text-2xl font-bold">Prediction Market</h1>
            <p className="text-sm opacity-90">Cross-chain bets demo — EVM → Solana</p>
          </div>
          <div className="ml-auto text-sm opacity-90">Local dev</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <aside className="md:col-span-2">
          <section className="mb-6">
            <WalletConnect />
          </section>

          <section className="p-4 rounded bg-gradient-to-b from-white to-gray-50">
            <h2 className="font-semibold text-lg">Markets</h2>
            <p className="text-sm text-gray-500 mt-1">On-chain markets discovered by scanning the program accounts. Tap a card for details.</p>
            <div className="mt-4">
              <MarketList onSelectMarket={(m)=>{ setSelectedMarket({ marketId: m.marketId, outcome: Number(m.outcomes[1]) > Number(m.outcomes[0]) ? 1 : 0 }) }} />
            </div>
          </section>
        </aside>

        <aside className="md:col-span-1">
          <section className="p-4 border rounded bg-white">
            <h2 className="font-medium">Place a Bet</h2>
            <p className="text-sm text-gray-500">Quickly encode and send a cross-chain bet via the adapter.</p>
            <div className="mt-3">
              <PlaceBet defaultMarket={selectedMarket} />
            </div>
          </section>
        </aside>
      </main>
    </div>
  )
}
