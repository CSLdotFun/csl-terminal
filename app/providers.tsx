"use client"

import "@rainbow-me/rainbowkit/styles.css"
import { RainbowKitProvider, lightTheme, connectorsForWallets } from "@rainbow-me/rainbowkit"
import {
  metaMaskWallet, walletConnectWallet, rainbowWallet,
  trustWallet, injectedWallet, coinbaseWallet,
} from "@rainbow-me/rainbowkit/wallets"
import { WagmiProvider, createConfig, http } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { robinhoodChain } from "@/lib/chain"

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "csl_walletconnect"

// EVM wallets only — this is Robinhood Chain (Arbitrum Orbit L2). No Phantom /
// Solana wallets. MetaMask and Robinhood Wallet (injected) lead, then the rest.
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

// CSL-branded LIGHT modal — matches the terminal's own cream/lime look,
// not RainbowKit's dark default.
const cslTheme = lightTheme({
  accentColor: "#CDF60A",
  accentColorForeground: "#0e1512",
  borderRadius: "large",
  overlayBlur: "small",
})
cslTheme.colors.modalBackground = "#faf9f6"
cslTheme.colors.modalBorder = "rgba(14,21,18,0.08)"
cslTheme.colors.modalText = "#0e1512"
cslTheme.colors.modalTextSecondary = "rgba(14,21,18,0.5)"
cslTheme.colors.modalTextDim = "rgba(14,21,18,0.3)"
cslTheme.colors.profileForeground = "#ffffff"
cslTheme.colors.profileAction = "rgba(14,21,18,0.06)"
cslTheme.colors.profileActionHover = "rgba(14,21,18,0.1)"
cslTheme.colors.connectButtonBackground = "#ffffff"
cslTheme.colors.connectButtonText = "#0e1512"
cslTheme.colors.generalBorder = "rgba(14,21,18,0.08)"
cslTheme.colors.menuItemBackground = "rgba(14,21,18,0.04)"
cslTheme.colors.closeButton = "rgba(14,21,18,0.5)"
cslTheme.colors.closeButtonBackground = "rgba(14,21,18,0.06)"
cslTheme.fonts.body = "inherit"

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={cslTheme} modalSize="compact" appInfo={{ appName: "CSL" }} locale="en">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
