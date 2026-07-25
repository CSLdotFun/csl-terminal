"use client"

import "@rainbow-me/rainbowkit/styles.css"
import { RainbowKitProvider, darkTheme, connectorsForWallets } from "@rainbow-me/rainbowkit"
import {
  metaMaskWallet, walletConnectWallet, rainbowWallet,
  trustWallet, injectedWallet, coinbaseWallet,
} from "@rainbow-me/rainbowkit/wallets"
import { WagmiProvider, createConfig, http } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { robinhoodChain } from "@/lib/chain"

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "csl_walletconnect"

// EVM wallets only — this is Robinhood Chain (Arbitrum Orbit L2). No Phantom /
// EVM wallets only. MetaMask and Robinhood Wallet (injected) lead, then the rest.
const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [metaMaskWallet, injectedWallet, walletConnectWallet],
    },
    {
      groupName: "More",
      wallets: [rainbowWallet, trustWallet, coinbaseWallet],
    },
  ],
  { appName: "CSL", projectId }
)

const config = createConfig({
  connectors,
  chains: [robinhoodChain],
  transports: { [robinhoodChain.id]: http(process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.mainnet.chain.robinhood.com") },
  ssr: true,
})

const queryClient = new QueryClient()

// CSL-branded dark modal: near-black surfaces, CSL green accent.
const cslTheme = darkTheme({
  accentColor: "#35F26B",
  accentColorForeground: "#04140d",
  borderRadius: "large",
  overlayBlur: "small",
})
// tighten the palette to match the terminal
cslTheme.colors.modalBackground = "#0a1017"
cslTheme.colors.modalBorder = "rgba(255,255,255,0.08)"
cslTheme.colors.profileForeground = "#0e151d"
cslTheme.colors.connectButtonBackground = "#0e151d"
cslTheme.fonts.body = "inherit"

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={cslTheme} modalSize="compact" appInfo={{ appName: "CSL" }}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
