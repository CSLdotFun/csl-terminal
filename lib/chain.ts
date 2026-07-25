import { defineChain } from "viem"

// Robinhood Chain — Ethereum L2 on Arbitrum Orbit, gas paid in ETH.
// chainId 4663 (0x1237). USDG is the settlement stablecoin.
export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.robinhoodchain.com"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://robinhoodchain.blockscout.com" },
  },
})

// USDG — the settlement / collateral stablecoin on Robinhood Chain.
// Address is set via env so it can be pointed at the real token at launch.
export const USDG_ADDRESS = (process.env.NEXT_PUBLIC_USDG_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`
export const USDG_DECIMALS = 6

// Minimal ERC-20 ABI for balances + transfers.
export const ERC20_ABI = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
] as const
