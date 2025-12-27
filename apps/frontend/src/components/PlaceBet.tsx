import React, { useState } from 'react'
import { ethers } from 'ethers'
import { useWallet } from '../contexts/WalletContext'
import { getAdapterContract } from '../utils/evm'

export default function PlaceBet() {
  const { ethProvider } = useWallet()
  const [contractAddr, setContractAddr] = useState('')
  const [dstEid, setDstEid] = useState<number>(101)
  const [amount, setAmount] = useState<string>('100')
  const [marketId, setMarketId] = useState<number>(42)
  const [outcome, setOutcome] = useState<number>(1)
  const [toPdaHex, setToPdaHex] = useState<string>('0x' + '00'.repeat(32))
  const [txHash, setTxHash] = useState<string | null>(null)
  const [composeHex, setComposeHex] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  async function handleEncode() {
    if (!ethProvider) return alert('Connect MetaMask')
    if (!contractAddr) return alert('Set adapter contract address')
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
    if (!ethProvider) return alert('Connect MetaMask')
    if (!contractAddr) return alert('Set adapter contract address')
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
    <div className="p-4 border rounded bg-white mt-4">
      <h3 className="font-medium mb-2">Place Bet (EVM)</h3>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm">Adapter Contract Address
          <input value={contractAddr} onChange={e=>setContractAddr(e.target.value)} className="ml-2 p-1 border rounded w-full" />
        </label>
        <label className="text-sm">Destination Chain ID
          <input type="number" value={dstEid} onChange={e=>setDstEid(Number(e.target.value))} className="ml-2 p-1 border rounded w-full" />
        </label>
        <label className="text-sm">Amount (USDC, 6 decimals)
          <input value={amount} onChange={e=>setAmount(e.target.value)} className="ml-2 p-1 border rounded w-full" />
        </label>
        <label className="text-sm">Market ID
          <input type="number" value={marketId} onChange={e=>setMarketId(Number(e.target.value))} className="ml-2 p-1 border rounded w-full" />
        </label>
        <label className="text-sm">Outcome
          <input type="number" value={outcome} onChange={e=>setOutcome(Number(e.target.value))} className="ml-2 p-1 border rounded w-full" />
        </label>
        <label className="text-sm">Solana PDA (bytes32 hex)
          <input value={toPdaHex} onChange={e=>setToPdaHex(e.target.value)} className="ml-2 p-1 border rounded w-full" />
        </label>
      </div>

      <div className="mt-3 flex gap-2">
        <button onClick={handleEncode} className="px-3 py-1 bg-gray-200 rounded">Encode composeMsg</button>
        <button onClick={handlePlaceBet} className="px-3 py-1 bg-indigo-600 text-white rounded">Place Bet</button>
      </div>

      <div className="mt-3 text-sm text-gray-600">Status: {status ?? 'idle'}</div>
      {txHash && <div className="mt-2 text-sm">Tx: <a target="_blank" rel="noreferrer" href={`https://etherscan.io/tx/${txHash}`}>{txHash}</a></div>}
      {composeHex && <div className="mt-2 text-sm break-all">ComposeBytes: {composeHex}</div>}
    </div>
  )
}
