import { ethers } from 'ethers'

// Minimal ABI for the functions/events we need
export const PREDICTION_ADAPTER_ABI = [
  'function encodeComposeMsg(address sender, uint64 marketId, uint8 outcome) public view returns (bytes)',
  'function placeBetCrossChain(uint16 _dstEid, uint256 _amount, uint64 _marketId, uint8 _outcome, bytes32 _solanaProgramPdaBytes) external payable',
  'event CrossChainBetSent(uint16 dstChainId, bytes32 to, uint64 marketId, uint8 outcome, uint256 amount, bytes composeMsg)'
]

export function getAdapterContract(provider: ethers.providers.Web3Provider | ethers.providers.Provider, address: string) {
  return new ethers.Contract(address, PREDICTION_ADAPTER_ABI, provider)
}
