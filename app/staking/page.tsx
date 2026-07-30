"use client"

import { useState } from "react"
import { Flame, TrendingUp, Users, Lock } from "lucide-react"
import TNav from "@/components/TNav"

export default function Staking() {
  const [amt, setAmt] = useState("")
  const [tab, setTab] = useState<"stake" | "unstake">("stake")

  return (
    <div className="min-h-screen bg-black text-[#f2f6fb]">
      <TNav active="staking" title="Staking" />

      <main className="relative z-10 max-w-[980px] mx-auto px-5 py-14">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h1 className="text-3xl font-bold tracking-[-0.02em]">$CSL Staking</h1>
          <span className="text-[11px] px-2.5 py-1 rounded-full border border-[#CDF60A]/40 bg-[#CDF60A]/10 text-[#CDF60A] font-semibold">DESIGN PREVIEW</span>
        </div>
        <p className="text-white/45 mb-10 max-w-[600px] leading-relaxed">
          Stake $CSL, earn a share of protocol revenue. Higher stake unlocks lower fees and
          higher leverage caps on the terminal. Layout below is final — numbers are mock until
          the $CSL contract is live.
        </p>

        {/* stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatCard icon={<Flame size={16} />} label="Total staked" value="—" />
          <StatCard icon={<Users size={16} />} label="Stakers" value="—" />
          <StatCard icon={<TrendingUp size={16} />} label="Reward APR" value="—" />
          <StatCard icon={<Lock size={16} />} label="Your stake" value="—" />
        </div>

        {/* stake/unstake card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-10">
          <div className="flex gap-1 mb-5 bg-white/5 p-1 rounded-lg w-fit">
            <button onClick={() => setTab("stake")} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${tab === "stake" ? "bg-[#CDF60A] text-black" : "text-white/50 hover:text-white"}`}>Stake</button>
            <button onClick={() => setTab("unstake")} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${tab === "unstake" ? "bg-[#CDF60A] text-black" : "text-white/50 hover:text-white"}`}>Unstake</button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-white/35 mb-2">{tab === "stake" ? "Amount to stake" : "Amount to unstake"}</div>
              <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-3 mb-2">
                <input value={amt} onChange={(e) => setAmt(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0.0" disabled
                  className="flex-1 bg-transparent outline-none font-mono text-lg disabled:cursor-not-allowed placeholder:text-white/20" />
                <span className="text-sm font-semibold text-white/40">$CSL</span>
              </div>
              <div className="flex gap-1.5 mb-5">
                {["25%", "50%", "75%", "MAX"].map((p) => (
                  <button key={p} disabled className="flex-1 py-1.5 rounded-md bg-white/5 text-xs font-semibold text-white/30 cursor-not-allowed">{p}</button>
                ))}
              </div>
              <button disabled className="w-full py-3 rounded-lg bg-white/10 text-white/40 font-semibold cursor-not-allowed">
                {tab === "stake" ? "Stake" : "Unstake"} — opens with $CSL
              </button>
            </div>

            <div className="rounded-xl bg-black/30 border border-white/5 p-4">
              <div className="text-[11px] uppercase tracking-wider text-white/35 mb-3">Your position</div>
              <Row k="Staked" v="0 $CSL" />
              <Row k="Pending rewards" v="0 USDG" />
              <Row k="Fee discount" v="—" />
              <Row k="Leverage boost" v="—" />
              <button disabled className="w-full mt-3 py-2.5 rounded-lg bg-[#CDF60A]/10 text-[#CDF60A]/40 text-sm font-semibold cursor-not-allowed border border-[#CDF60A]/20">
                Claim rewards
              </button>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-3">How it works</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <Step n="01" t="Stake $CSL" d="Lock $CSL into the staking contract. No lock-up beyond a short unstake cooldown." />
          <Step n="02" t="Earn protocol revenue" d="A share of taker fees and liquidation proceeds routes to stakers, paid in USDG." />
          <Step n="03" t="Unlock tiers" d="Higher stake unlocks lower taker fees and higher leverage caps on the terminal — scaled by tier, not flat." />
        </div>

        <div className="rounded-xl border border-[#CDF60A]/30 bg-[#CDF60A]/[0.05] p-4 text-sm text-white/55 leading-relaxed">
          This page is a design preview. Every number is a placeholder — staking opens for real
          once $CSL is deployed. Follow <a href="https://x.com/csldotfun" className="text-[#CDF60A] hover:underline" target="_blank" rel="noopener noreferrer">@csldotfun</a> for the launch.
        </div>
      </main>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/35 mb-1.5">{icon}{label}</div>
      <div className="font-mono font-semibold text-white/70">{value}</div>
    </div>
  )
}
function Step({ n, t, d }: { n: string; t: string; d: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-[#CDF60A] font-mono text-sm mb-2">{n}</div>
      <h3 className="font-semibold mb-1.5">{t}</h3>
      <p className="text-white/45 text-sm leading-relaxed">{d}</p>
    </div>
  )
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 text-sm border-b border-white/5 last:border-0">
      <span className="text-white/40">{k}</span>
      <span className="font-mono font-semibold">{v}</span>
    </div>
  )
}
