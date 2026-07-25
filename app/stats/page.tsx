"use client"

import { useEffect, useMemo, useState } from "react"
import TNav from "@/components/TNav"
import SkinSides from "@/components/SkinSides"
import { ICONS } from "../trade/icons"

const API = process.env.NEXT_PUBLIC_API_URL || ""
const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })
const money = (n: number) => `$${fmt(n)}`

type M = { key: string; name: string; wear?: string; icon?: string | null; image: string; price: number; change24h: number; funding: number }

/* one icon renderer for the whole page: the live Steam image when the API has
   resolved it, our bundled file otherwise, never an empty box */
function SkinIcon({ m, className = "w-12 h-9" }: { m: M; className?: string }) {
  // Same icon priority as the trade terminal: live Steam image from the API →
  // the official transparent Steam render bundled in ICONS → local file. Never empty.
  const [src, setSrc] = useState<string>(m.icon || ICONS[m.key] || `/${m.image}`)
  useEffect(() => { setSrc(m.icon || ICONS[m.key] || `/${m.image}`) }, [m.key, m.icon, m.image])
  return (
    <span className={`${className} rounded-lg bg-gradient-to-br from-black/[0.04] to-black/[0.01] ring-1 ring-black/5 flex items-center justify-center shrink-0 overflow-hidden`}>
      <img src={src} alt="" className="max-w-[86%] max-h-[86%] object-contain drop-shadow"
        onError={() => { if (src !== `/${m.image}`) setSrc(`/${m.image}`) }} />
    </span>
  )
}

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
    <div className="min-h-screen bg-[#faf9f6] text-[#0e1512]">
      <TNav active="stats" title="Stats" light />
      <SkinSides left="/cs2-karambit-fade-knife.jpg" right="/cs2-m9-bayonet-doppler.jpg" />
      <main className="relative z-10 max-w-[1100px] mx-auto px-5 py-10">
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <h1 className="text-3xl font-bold tracking-[-0.02em]">Market stats</h1>
          {source && !err && (
            <span className={`text-[11px] px-2.5 py-1 rounded-full border ${source === "simulated" ? "border-amber-500/50 text-amber-600 bg-amber-500/[0.06]" : "border-[#a8c908]/50 text-[#5f7a05] bg-[#CDF60A]/[0.08]"}`}>
              {source === "simulated" ? "SIMULATED FEED" : `LIVE · ${source.toUpperCase()}`}
            </span>
          )}
        </div>

        {err ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/[0.08] p-5 text-sm text-[#0e1512]/70">
            Price engine unreachable — stats show nothing rather than stale or fake numbers. Try refreshing in a minute.
          </div>
        ) : !markets.length ? (
          <div className="text-[#0e1512]/40 text-sm">Loading live data…</div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
              <Card label="Listed markets" value={String(markets.length)} />
              <Card label="Basket value (1 of each)" value={money(totalRef)} />
              <Card label="Top 24h" market={gainer} cls="text-[#5f7a05]"
                value={gainer ? `${gainer.name.split("|")[1]?.trim() ?? gainer.name} ${gainer.change24h >= 0 ? "+" : ""}${fmt(gainer.change24h, 2)}%` : "—"} />
              <Card label="Worst 24h" market={loser} cls="text-red-600"
                value={loser ? `${loser.name.split("|")[1]?.trim() ?? loser.name} ${fmt(loser.change24h, 2)}%` : "—"} />
            </div>

            <div className="rounded-2xl border border-black/[0.08] bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[680px]">
                  <thead>
                    <tr className="text-[#0e1512]/45 text-[10px] uppercase tracking-wider border-b border-black/[0.08] bg-black/[0.015]">
                      <th className="text-left font-semibold px-4 py-3 w-10">#</th>
                      <th className="text-left font-semibold px-2 py-3">Market</th>
                      <th className="text-right font-semibold px-3">Price</th>
                      <th className="text-right font-semibold px-3">24h</th>
                      <th className="text-right font-semibold px-4">Funding / 1h</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...markets].sort((a, b) => b.price - a.price).map((m, i) => (
                      <tr key={m.key} className="border-t border-black/[0.05] hover:bg-[#CDF60A]/[0.04] transition-colors group">
                        <td className="px-4 py-3 text-[#0e1512]/30 font-mono text-xs tabular-nums">{i + 1}</td>
                        <td className="px-2 py-3">
                          <a href="/trade" className="flex items-center gap-3 group-hover:text-[#5f7a05]">
                            <SkinIcon m={m} className="w-12 h-9" />
                            <span className="flex flex-col leading-tight">
                              <span className="font-medium text-[13px]">{m.name}</span>
                              {m.wear && <span className="text-[9px] font-semibold tracking-wider text-[#0e1512]/40 mt-0.5">{m.wear} · CSL PERP</span>}
                            </span>
                          </a>
                        </td>
                        <td className="px-3 text-right font-mono text-[13px] tabular-nums">{money(m.price)}</td>
                        <td className="px-3 text-right">
                          <span className={`inline-flex items-center justify-end gap-1 font-mono text-xs tabular-nums px-1.5 py-0.5 rounded ${m.change24h >= 0 ? "text-[#5f7a05] bg-[#CDF60A]/[0.10]" : "text-red-600 bg-red-500/[0.08]"}`}>
                            {m.change24h >= 0 ? "▲" : "▼"}{fmt(Math.abs(m.change24h), 2)}%
                          </span>
                        </td>
                        <td className={`px-4 text-right font-mono text-xs tabular-nums ${m.funding >= 0 ? "text-[#5f7a05]/90" : "text-red-600/90"}`}>{m.funding >= 0 ? "+" : ""}{fmt((m.funding || 0) * 100, 4)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-4 text-xs text-[#0e1512]/45">
              Avg funding across markets: {avgFunding >= 0 ? "+" : ""}{fmt(avgFunding * 100, 4)}%/h · refreshes every 5s.
              Volume and open-interest stats arrive with USDG accounts at launch.
            </p>
          </>
        )}
      </main>
    </div>
  )
}

function Card({ label, value, cls = "", market }: { label: string; value: string; cls?: string; market?: M | null }) {
  return (
    <div className="rounded-xl bg-white border border-black/[0.07] p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="text-[10px] uppercase tracking-wider text-[#0e1512]/45 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        {market && <SkinIcon m={market} className="w-9 h-7" />}
        <div className={`font-mono font-semibold text-sm ${cls}`}>{value}</div>
      </div>
    </div>
  )
}
