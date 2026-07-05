"use client"

import { useEffect, useState } from "react"
import TNav from "@/components/TNav"

const API = process.env.NEXT_PUBLIC_API_URL || ""

export default function Vault() {
  const [stats, setStats] = useState<{ open: boolean; tvl: number; depositors: number } | null>(null)
  useEffect(() => {
    if (!API) return
    fetch(`${API}/api/vault`, { cache: "no-store" }).then((r) => r.json()).then(setStats).catch(() => {})
  }, [])
  return (
    <div className="min-h-screen bg-[#050b14] text-white">
      <TNav active="vault" title="Vault" />
      <main className="max-w-[900px] mx-auto px-5 py-10">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h1 className="text-3xl font-bold tracking-[-0.02em]">CSL Liquidity Vault</h1>
          <span className="text-[11px] px-2.5 py-1 rounded-full border border-amber-500/40 text-amber-400">OPENS AT LAUNCH</span>
        </div>
        <p className="text-white/50 mb-10 max-w-[640px] leading-relaxed">
          Deposit USDC, be the house. The vault takes the other side of trader positions
          and earns protocol fees — losses and gains are shared pro-rata by depositors.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          <Card label="TVL" value={stats ? `$${stats.tvl.toFixed(2)}` : "$0.00"} />
          <Card label="Depositors" value={stats ? String(stats.depositors) : "0"} />
          <Card label="APR" value="—" />
          <Card label="Your deposit" value="$0.00" />
        </div>

        <h2 className="text-lg font-semibold mb-3">How it works</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <Step n="01" t="Deposit USDC" d="Funds enter the shared vault on Solana. Withdraw any time after a short cooldown." />
          <Step n="02" t="Vault trades against traders" d="Every long or short on CSL is matched against vault liquidity, within per-market open-interest caps." />
          <Step n="03" t="Earn fees" d="Taker fees (0.06% of notional) and net trader losses accrue to the vault; net trader wins are paid from it." />
        </div>

        <h2 className="text-lg font-semibold mb-3">Protocol parameters</h2>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden mb-10">
          <table className="w-full text-sm">
            <tbody>
              <Row k="Taker fee" v="0.06% of notional" />
              <Row k="Maintenance margin" v="0.5%" />
              <Row k="Max leverage" v="20x, isolated" />
              <Row k="Funding" v="hourly, drifts within ±0.08%/h" />
              <Row k="Settlement" v="USDC on Solana" />
              <Row k="Markets" v="17 curated skin perps" />
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-blue-500/25 bg-blue-500/[0.06] p-4 text-sm text-white/60 leading-relaxed">
          The vault opens together with USDC deposits at public launch — the numbers above
          are the real protocol parameters, and TVL starts from a true zero. No pre-seeded
          balances, no projected APRs. Follow <a href="https://x.com/csldotfun" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">@csldotfun</a> for the launch date.
        </div>
      </main>
    </div>
  )
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3.5">
      <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{label}</div>
      <div className="font-mono font-semibold">{value}</div>
    </div>
  )
}
function Step({ n, t, d }: { n: string; t: string; d: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-blue-400 font-mono text-sm mb-2">{n}</div>
      <h3 className="font-semibold mb-1.5">{t}</h3>
      <p className="text-white/50 text-sm leading-relaxed">{d}</p>
    </div>
  )
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr className="border-t border-white/5 first:border-0">
      <td className="px-4 py-2.5 text-white/45 text-xs uppercase tracking-wider">{k}</td>
      <td className="px-4 py-2.5 text-right font-mono text-sm">{v}</td>
    </tr>
  )
}
