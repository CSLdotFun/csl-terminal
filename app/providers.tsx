"use client"

import "@rainbow-me/rainbowkit/styles.css"
import { RainbowKitProvider, lightTheme, connectorsForWallets } from "@rainbow-me/rainbowkit"
import {
  phantomWallet, rainbowWallet, coinbaseWallet, metaMaskWallet,
  trustWallet, walletConnectWallet, injectedWallet,
} from "@rainbow-me/rainbowkit/wallets"
import { WagmiProvider, createConfig, http } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { robinhoodChain } from "@/lib/chain"

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "csl_walletconnect"

// Wallet list mirrors the standard RainbowKit picker: Phantom + the popular
// wallets. (Phantom supports EVM chains too, so it's fine on Robinhood Chain.)
const connectors = connectorsForWallets(
  [
    {
      groupName: "Popular",
      wallets: [
        phantomWallet, rainbowWallet, coinbaseWallet, metaMaskWallet,
        trustWallet, walletConnectWallet, injectedWallet,
      ],
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

// Light modal (matches the light site) with the "What is a wallet?" side panel.
// modalSize="wide" is what renders the two-column layout with the explainer.
const cslTheme = lightTheme({
  accentColor: "#CDF60A",
  accentColorForeground: "#1a1e05",
  borderRadius: "large",
  overlayBlur: "small",
})

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={cslTheme} modalSize="wide" appInfo={{ appName: "CSL" }}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
