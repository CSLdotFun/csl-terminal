"use client"

import { PrivyProvider } from "@privy-io/react-auth"
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana"

// Login methods (Twitter, Google, Phantom) are configured in the Privy dashboard.
// We only theme the default Privy modal and enable Solana external wallets.
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId="cmr6oo33w00w00cjxl9thvmh3"
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#3b82f6",
          logo: "/new-csl-logo.png",
          walletChainType: "solana-only",
        },
        externalWallets: {
          solana: { connectors: toSolanaWalletConnectors() },
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}
