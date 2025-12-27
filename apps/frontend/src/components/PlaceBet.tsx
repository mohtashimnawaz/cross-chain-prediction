import React, { useState } from 'react'
import { ethers } from 'ethers'
import { useWallet } from '../contexts/WalletContext'
import { getAdapterContract } from '../utils/evm'

export default function PlaceBet({ defaultMarket } : { defaultMarket?: { marketId?: number, outcome?: number } } = {}) {
  const { ethProvider } = useWallet()
  const [contractAddr, setContractAddr] = useState(process.env.NEXT_PUBLIC_ADAPTER_ADDRESS || '')

  // Try runtime public file as fallback (no restart required)
  React.useEffect(()=>{
    if (contractAddr) return
    fetch('/deployed.json').then(r=>r.json()).then(j=>{
      if (j?.adapterAddress) setContractAddr(j.adapterAddress)
    }).catch(()=>{})
  }, [])
  const [dstEid, setDstEid] = useState<number>(101)
  const [amount, setAmount] = useState<string>('100')
  const [marketId, setMarketId] = useState<number>(defaultMarket?.marketId ?? 42)
  const [outcome, setOutcome] = useState<number>(defaultMarket?.outcome ?? 1)
  const [toPdaHex, setToPdaHex] = useState<string>('0x' + '00'.repeat(32))
  const [txHash, setTxHash] = useState<string | null>(null)
  const [composeHex, setComposeHex] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  function copyToClipboard(text: string){
    navigator.clipboard?.writeText(text).then(()=>{
      setStatus('Copied to clipboard')
    }).catch(()=>{
      setStatus('Copy failed')
    })
  }

  function validateInputs(){
    if (!contractAddr) return 'Adapter address required'
    if (Number(amount) <= 0) return 'Amount must be > 0'
    if (!Number.isInteger(marketId)) return 'Market ID must be an integer'
    if (!Number.isInteger(outcome)) return 'Outcome must be an integer'
    return null
  }

  async function handleEncode() {
    const v = validateInputs(); if (v) return setStatus(v)
    if (!ethProvider) return setStatus('Connect MetaMask')
    try {
      setStatus('Encoding compose message…')
      const signer = ethProvider.getSigner()
      const contract = getAdapterContract(signer, contractAddr)
      const encoded: string = await contract.encodeComposeMsg(await signer.getAddress(), marketId, outcome)
      setComposeHex(encoded)
      setStatus('Encoded')
    } catch (e: any) {
      console.error(e)
      setStatus('Failed to encode: ' + (e.message || e))
    }
  }

  async function handlePlaceBet() {
    const v = validateInputs(); if (v) return setStatus(v)
    if (!ethProvider) return setStatus('Connect MetaMask')
    try {
      setStatus('Sending transaction…')
      const signer = ethProvider.getSigner()
      const contract = getAdapterContract(signer, contractAddr).connect(signer)
      const tx = await contract.placeBetCrossChain(dstEid, ethers.utils.parseUnits(amount, 6), marketId, outcome, toPdaHex, {
        gasLimit: 500_000,
      })
      setStatus('Waiting for confirmation…')
      const rcpt = await tx.wait()
      setTxHash(rcpt.transactionHash)
      // find event and extract compose message
      const evt = rcpt.events?.find(e => e.event === 'CrossChainBetSent')
      if (evt && evt.args) {
        setComposeHex(evt.args.composeMsg)
      }
      setStatus('Transaction confirmed')
    } catch (e: any) {
      console.error(e)
      setStatus('Transaction failed: ' + (e.message || e))
    }
  }

  return (
    <div className="p-4 rounded bg-white">
      <div className="flex items-center justify-between">
        <h3 className="font-medium mb-2">Place Bet (EVM)</h3>
        <div className="text-sm text-gray-500">Status: {status ?? 'idle'}</div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="text-sm block">Adapter Contract Address</label>
          <input value={contractAddr} onChange={e=>setContractAddr(e.target.value)} className="mt-1 p-2 border rounded w-full" placeholder="0x..." />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm block">Amount (USDC)</label>
            <input value={amount} onChange={e=>setAmount(e.target.value)} className="mt-1 p-2 border rounded w-full" />
          </div>
          <div>
            <label className="text-sm block">Destination Chain ID</label>
            <input type="number" value={dstEid} onChange={e=>setDstEid(Number(e.target.value))} className="mt-1 p-2 border rounded w-full" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm block">Market ID</label>
            <input type="number" value={marketId} onChange={e=>setMarketId(Number(e.target.value))} className="mt-1 p-2 border rounded w-full" />
          </div>
          <div>
            <label className="text-sm block">Outcome</label>
            <input type="number" value={outcome} onChange={e=>setOutcome(Number(e.target.value))} className="mt-1 p-2 border rounded w-full" />
          </div>
        </div>

        <div>
          <label className="text-sm block">Solana PDA (bytes32 hex)</label>
          <input value={toPdaHex} onChange={e=>setToPdaHex(e.target.value)} className="mt-1 p-2 border rounded w-full" />
        </div>

        <div className="flex gap-2">
          <button onClick={handleEncode} className="px-4 py-2 bg-gray-100 rounded border">Encode</button>
          <button onClick={handlePlaceBet} className="px-4 py-2 bg-indigo-600 text-white rounded">Place Bet</button>
          {composeHex && <button onClick={()=>copyToClipboard(composeHex)} className="px-3 py-2 bg-gray-50 rounded border">Copy</button>}
        </div>

        {txHash && <div className="text-sm">Tx: <a target="_blank" rel="noreferrer" href={`https://etherscan.io/tx/${txHash}`}>{txHash}</a></div>}
        {composeHex && <pre className="mt-2 p-3 bg-gray-100 rounded text-sm break-all">{composeHex}</pre>}
      </div>
    </div>
  )
}
