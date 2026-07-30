"use client"

import { Lock } from "lucide-react"
import TNav from "@/components/TNav"

export default function Staking() {
  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#0e1512]">
      <TNav active="staking" light title="Staking" />
      <main className="relative z-10 max-w-[700px] mx-auto px-5 py-20 text-center">
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-[#CDF60A]/10 border border-[#CDF60A]/40 flex items-center justify-center">
          <Lock size={22} className="text-[#5f7a05]" />
        </div>
        <h1 className="text-2xl font-bold tracking-[-0.02em] mb-2">Staking opens with $CSL</h1>
        <p className="text-[#0e1512]/50 max-w-[480px] mx-auto leading-relaxed mb-6">
          $CSL hasn&apos;t launched yet — staking needs a real, liquid token to stake and reward,
          not a placeholder ticker. Once $CSL is live (see the <a href="https://docs.csl.fun/roadmap.html" className="text-[#5f7a05] hover:underline">roadmap</a>),
          staking tiers unlock: leverage caps and maker rebates that scale with stake, plus a
          say in which markets list next.
        </p>
        <a href="https://x.com/csldotfun" target="_blank" rel="noopener noreferrer" className="inline-block px-5 py-2.5 rounded-lg bg-[#CDF60A] hover:bg-[#d9fa3a] text-[#0e1512] text-sm font-semibold">
          Follow @csldotfun for the launch
        </a>
      </main>
    </div>
  )
}
