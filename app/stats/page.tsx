"use client"

import { useEffect, useMemo, useState } from "react"
import TNav from "@/components/TNav"

const API = process.env.NEXT_PUBLIC_API_URL || ""
const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })
const money = (n: number) => `$${fmt(n)}`

type M = { key: string; name: string; image: string; price: number; change24h: number; funding: number }

export default function Stats() {
  const [markets, setMarkets] = useState<M[]>([])
  const [source, setSource] = useState<string | null>(null)
  const [err, setErr] = useState(false)

  useEffect(() => {
    let stop = false
    const pull = async () => {
      if (!API) { setErr(true); return }
      try {
        const res = await fetch(`${API}/api/markets`, { cache: "no-store" })
        if (!res.ok) throw new Error()
        const d = await res.json()
        if (stop) return
        setMarkets(d.markets)
        setSource(d.mock ? "simulated" : d.source || "live")
        setErr(false)
      } catch { if (!stop) setErr(true) }
    }
    pull()
    const id = setInterval(pull, 5000)
    return () => { stop = true; clearInterval(id) }
  }, [])

  const { gainer, loser, avgFunding, totalRef } = useMemo(() => {
    if (!markets.length) return { gainer: null as M | null, loser: null as M | null, avgFunding: 0, totalRef: 0 }
    const sorted = [...markets].sort((a, b) => b.change24h - a.change24h)
    return {
      gainer: sorted[0],
      loser: sorted[sorted.length - 1],
      avgFunding: markets.reduce((s, m) => s + (m.funding || 0), 0) / markets.length,
      totalRef: markets.reduce((s, m) => s + m.price, 0),
    }
  }, [markets])

  return (
    <div className="min-h-screen bg-[#050b14] text-white">
      <TNav active="stats" title="Stats" />
      <main className="max-w-[1100px] mx-auto px-5 py-10">
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <h1 className="text-3xl font-bold tracking-[-0.02em]">Market stats</h1>
          {source && !err && (
            <span className={`text-[11px] px-2.5 py-1 rounded-full border ${source === "simulated" ? "border-amber-500/40 text-amber-400" : "border-emerald-500/40 text-emerald-400"}`}>
              {source === "simulated" ? "SIMULATED FEED" : `LIVE · ${source.toUpperCase()}`}
            </span>
          )}
        </div>

        {err ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-5 text-sm text-white/60">
            Price engine unreachable — stats show nothing rather than stale or fake numbers. Try refreshing in a minute.
          </div>
        ) : !markets.length ? (
          <div className="text-white/30 text-sm">Loading live data…</div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
              <Card label="Listed markets" value={String(markets.length)} />
              <Card label="Basket value (1 of each)" value={money(totalRef)} />
              <Card label="Top 24h" value={gainer ? `${gainer.name.split("|")[1]?.trim() ?? gainer.name} ${gainer.change24h >= 0 ? "+" : ""}${fmt(gainer.change24h, 2)}%` : "—"} cls="text-emerald-400" />
              <Card label="Worst 24h" value={loser ? `${loser.name.split("|")[1]?.trim() ?? loser.name} ${fmt(loser.change24h, 2)}%` : "—"} cls="text-red-400" />
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead><tr className="text-white/40 text-[11px] uppercase border-b border-white/10">
                  <th className="text-left font-medium px-4 py-2.5">Market</th>
                  <th className="text-right font-medium px-2">Price</th>
                  <th className="text-right font-medium px-2">24h</th>
                  <th className="text-right font-medium px-4">Funding / 1h</th>
                </tr></thead>
                <tbody>
                  {[...markets].sort((a, b) => b.price - a.price).map((m) => (
                    <tr key={m.key} className="border-t border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5"><a href="/trade" className="text-xs hover:text-blue-400">{m.name}</a></td>
                      <td className="px-2 text-right font-mono text-xs">{money(m.price)}</td>
                      <td className={`px-2 text-right font-mono text-xs ${m.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>{m.change24h >= 0 ? "+" : ""}{fmt(m.change24h, 2)}%</td>
                      <td className={`px-4 text-right font-mono text-xs ${m.funding >= 0 ? "text-emerald-400" : "text-red-400"}`}>{m.funding >= 0 ? "+" : ""}{fmt((m.funding || 0) * 100, 4)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs text-white/35">
              Avg funding across markets: {avgFunding >= 0 ? "+" : ""}{fmt(avgFunding * 100, 4)}%/h · refreshes every 5s.
              Volume and open-interest stats arrive with USDC accounts at launch.
            </p>
          </>
        )}
      </main>
    </div>
  )
}

function Card({ label, value, cls = "" }: { label: string; value: string; cls?: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3.5">
      <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{label}</div>
      <div className={`font-mono font-semibold text-sm ${cls}`}>{value}</div>
    </div>
  )
}
