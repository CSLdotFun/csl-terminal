"use client"

import { useEffect, useState } from "react"
import { Trophy, TrendingUp, Users, Flame, Layers } from "lucide-react"
import TNav from "@/components/TNav"
import SkinSides from "@/components/SkinSides"

const API = process.env.NEXT_PUBLIC_API_URL || ""
const fmt = (n: number) => (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const money = (n: number) => `$${fmt(n)}`
const shortAddr = (a: string) => a ? `${a.slice(0, 6)}\u2026${a.slice(-4)}` : "\u2014"

type Row = {
  privy_id: string
  volume: number
  trades: number
  realized: number
  avatar_data_url: string | null
  twitter_handle: string | null
  twitter_avatar_url: string | null
}

type PlatformStats = { totalVolume: number; totalTrades: number; activeTraders: number; openInterest: number; openPositions: number }

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [tvl, setTvl] = useState<number | null>(null)

  useEffect(() => {
    if (!API) return
    let stop = false
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/leaderboard`, { cache: "no-store" })
        if (!res.ok || stop) return
        const d = await res.json()
        setRows(d.leaderboard || [])
      } catch {}
      try {
        const res = await fetch(`${API}/api/platform-stats`, { cache: "no-store" })
        if (res.ok && !stop) setStats(await res.json())
      } catch {}
      try {
        const res = await fetch(`${API}/api/vault`, { cache: "no-store" })
        if (res.ok && !stop) setTvl((await res.json()).tvl ?? 0)
      } catch {}
    }
    load()
    const id = setInterval(load, 30000)
    return () => { stop = true; clearInterval(id) }
  }, [])

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#0e1512]">
      <TNav active="leaderboard" light title="Leaderboard" />
      <SkinSides left="/ak47-redline-side.png" right="/ak47-serpent-side.png" size={430} inset={24} leftRotate={-3} rightRotate={3} opacity={0.85} />

      <main className="relative z-10 max-w-[900px] mx-auto px-5 py-14">
        <h1 className="text-3xl font-bold tracking-[-0.02em] mb-2">Top traders</h1>
        <p className="text-[#0e1512]/50 mb-6">Ranked by realized PnL. Resets every season.</p>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-10">
          <StatCard icon={<TrendingUp size={14} />} label="Total volume" value={stats ? money(stats.totalVolume) : "—"} />
          <StatCard icon={<Layers size={14} />} label="Open interest" value={stats ? money(stats.openInterest) : "—"} />
          <StatCard icon={<Flame size={14} />} label="Vault TVL" value={tvl !== null ? money(tvl) : "—"} />
          <StatCard icon={<Users size={14} />} label="Active traders" value={stats ? String(stats.activeTraders) : "—"} />
          <StatCard icon={<Trophy size={14} />} label="Total trades" value={stats ? String(stats.totalTrades) : "—"} />
        </div>

        <div className="rounded-2xl border border-black/10 bg-black/[0.02] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#0e1512]/40 text-[11px] uppercase border-b border-black/10">
                <th className="text-left font-medium px-5 py-3 w-16">#</th>
                <th className="text-left font-medium px-2">Trader</th>
                <th className="text-right font-medium px-2">Volume</th>
                <th className="text-right font-medium px-2">Trades</th>
                <th className="text-right font-medium px-5">Realized PnL</th>
              </tr>
            </thead>
            {rows && rows.length > 0 && (
              <tbody>
                {rows.map((r, i) => {
                  const avatar = r.twitter_avatar_url || r.avatar_data_url
                  const label = r.twitter_handle ? `@${r.twitter_handle}` : shortAddr(r.privy_id)
                  const up = Number(r.realized) >= 0
                  return (
                    <tr key={r.privy_id} className="border-t border-black/5">
                      <td className="px-5 py-3 text-[#0e1512]/40 font-mono">{i + 1}</td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-2.5">
                          {avatar ? (
                            <img src={avatar} alt="" className="w-7 h-7 rounded-full object-cover border border-black/10" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[#CDF60A]/15 border border-[#CDF60A]/30 flex items-center justify-center text-[11px] font-bold text-[#5f7a05]">
                              {label.replace("@", "").slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <span className="font-mono text-xs">{label}</span>
                        </div>
                      </td>
                      <td className="px-2 text-right font-mono">{money(r.volume)}</td>
                      <td className="px-2 text-right font-mono">{r.trades}</td>
                      <td className={`px-5 text-right font-mono font-semibold ${up ? "text-[#5f7a05]" : "text-red-600"}`}>
                        {up ? "+" : ""}{money(r.realized)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            )}
          </table>

          {rows && rows.length === 0 && (
            <div className="px-6 py-16 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#CDF60A]/10 border border-[#CDF60A]/40 flex items-center justify-center">
                <Trophy size={24} className="text-[#5f7a05]" />
              </div>
              <div className="font-semibold mb-1.5">No ranked trades yet</div>
              <p className="text-[#0e1512]/45 text-sm max-w-[420px] mx-auto leading-relaxed">
                The board fills in as real trades close. Every trade counts from day one - no pre-filled names, no bots.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/[0.04] border border-black/5 p-3.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#0e1512]/40 mb-1.5">{icon}{label}</div>
      <div className="font-mono font-semibold">{value}</div>
    </div>
  )
}
