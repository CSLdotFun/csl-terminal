"use client"

import { useEffect, useMemo, useState } from "react"
import TNav from "@/components/TNav"
import { loadAccount, type Account } from "@/lib/account"

const API = process.env.NEXT_PUBLIC_API_URL || ""
const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })
const money = (n: number) => `$${fmt(n)}`

export default function Portfolio() {
  const [acct, setAcct] = useState<Account | null>(null)
  const [marks, setMarks] = useState<Map<string, number>>(new Map())
  const [funds, setFunds] = useState<Map<string, number>>(new Map())
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    setAcct(loadAccount())
    const onFocus = () => setAcct(loadAccount())
    window.addEventListener("focus", onFocus)
    const clock = setInterval(() => setNow(Date.now()), 1000)
    return () => { window.removeEventListener("focus", onFocus); clearInterval(clock) }
  }, [])

  // live marks for uPnL
  useEffect(() => {
    if (!API) return
    let stop = false
    const pull = async () => {
      try {
        const res = await fetch(`${API}/api/markets`, { cache: "no-store" })
        if (!res.ok) return
        const d = await res.json()
        if (stop) return
        setMarks(new Map(d.markets.map((m: any) => [m.key, m.price])))
        setFunds(new Map(d.markets.map((m: any) => [m.key, m.funding || 0])))
      } catch {}
    }
    pull()
    const id = setInterval(pull, 5000)
    return () => { stop = true; clearInterval(id) }
  }, [])

  const upnl = useMemo(() => {
    if (!acct) return 0
    let u = 0
    for (const p of acct.positions) {
      const px = marks.get(p.key) ?? p.entry
      const pricePnl = p.units * (px - p.entry) * (p.side === "long" ? 1 : -1)
      const rate = funds.get(p.key) ?? 0
      const hours = (now - p.openedAt) / 3_600_000
      u += Math.max(-p.collateral, pricePnl - p.notional * rate * hours * (p.side === "long" ? 1 : -1))
    }
    return u
  }, [acct, marks, funds, now])

  if (!acct) return <div className="min-h-screen bg-[#050b14]" />
  const equity = acct.balance + acct.positions.reduce((s, p) => s + p.collateral, 0) + upnl

  return (
    <div className="min-h-screen bg-[#050b14] text-white">
      <TNav active="portfolio" title="Portfolio" />
      <main className="max-w-[1100px] mx-auto px-5 py-10">
        <h1 className="text-3xl font-bold tracking-[-0.02em] mb-8">Your account</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          <Card label="Balance" value={money(acct.balance)} />
          <Card label="Equity" value={money(equity)} />
          <Card label="Unrealized PnL" value={`${upnl >= 0 ? "+" : ""}${money(upnl)}`} cls={upnl > 0 ? "text-emerald-400" : upnl < 0 ? "text-red-400" : ""} />
          <Card label="Realized PnL" value={`${acct.realized >= 0 ? "+" : ""}${money(acct.realized)}`} cls={acct.realized > 0 ? "text-emerald-400" : acct.realized < 0 ? "text-red-400" : ""} />
          <Card label="Volume traded" value={money(acct.volume)} />
          <Card label="Trades" value={String(acct.trades)} />
        </div>

        <div className="rounded-xl border border-blue-500/25 bg-blue-500/[0.06] p-4 text-sm text-white/60 leading-relaxed mb-10">
          USDC deposits &amp; withdrawals open at public launch — balances stay at $0 until then.
          Positions and history below reflect your real actions in the terminal.
        </div>

        <h2 className="text-lg font-semibold mb-3">Open positions ({acct.positions.length})</h2>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden mb-10">
          {acct.positions.length === 0 ? (
            <div className="px-5 py-10 text-center text-white/30 text-sm">No open positions — open one in the <a href="/trade" className="text-blue-400 hover:underline">terminal</a>.</div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-white/40 text-[11px] uppercase border-b border-white/10">
                <th className="text-left font-medium px-4 py-2.5">Market</th><th className="text-left font-medium px-2">Side</th>
                <th className="text-right font-medium px-2">Size</th><th className="text-right font-medium px-2">Entry</th>
                <th className="text-right font-medium px-2">Mark</th><th className="text-right font-medium px-4">uPnL</th>
              </tr></thead>
              <tbody>
                {acct.positions.map((p) => {
                  const px = marks.get(p.key) ?? p.entry
                  const pnl = Math.max(-p.collateral, p.units * (px - p.entry) * (p.side === "long" ? 1 : -1))
                  return (
                    <tr key={p.id} className="border-t border-white/5">
                      <td className="px-4 py-2.5 text-xs">{p.name}</td>
                      <td className={`px-2 text-xs font-semibold ${p.side === "long" ? "text-emerald-400" : "text-red-400"}`}>{p.side.toUpperCase()} {p.leverage}x</td>
                      <td className="px-2 text-right font-mono text-xs">{money(p.notional)}</td>
                      <td className="px-2 text-right font-mono text-xs">{money(p.entry)}</td>
                      <td className="px-2 text-right font-mono text-xs">{money(px)}</td>
                      <td className={`px-4 text-right font-mono text-xs ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{pnl >= 0 ? "+" : ""}{money(pnl)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <h2 className="text-lg font-semibold mb-3">Trade history</h2>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
          {acct.history.length === 0 ? (
            <div className="px-5 py-10 text-center text-white/30 text-sm">No closed trades yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-white/40 text-[11px] uppercase border-b border-white/10">
                <th className="text-left font-medium px-4 py-2.5">Market</th><th className="text-left font-medium px-2">Side</th>
                <th className="text-right font-medium px-2">Entry</th><th className="text-right font-medium px-2">Exit</th>
                <th className="text-right font-medium px-2">PnL</th><th className="text-right font-medium px-4">Closed</th>
              </tr></thead>
              <tbody>
                {acct.history.slice(0, 30).map((t) => (
                  <tr key={t.id} className="border-t border-white/5">
                    <td className="px-4 py-2.5 text-xs">{t.name}</td>
                    <td className={`px-2 text-xs font-semibold ${t.side === "long" ? "text-emerald-400" : "text-red-400"}`}>{t.side.toUpperCase()} {t.leverage}x</td>
                    <td className="px-2 text-right font-mono text-xs">{money(t.entry)}</td>
                    <td className="px-2 text-right font-mono text-xs">{money(t.exit)}</td>
                    <td className={`px-2 text-right font-mono text-xs ${t.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{t.pnl >= 0 ? "+" : ""}{money(t.pnl)}</td>
                    <td className="px-4 text-right font-mono text-xs text-white/40">{new Date(t.closedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}

function Card({ label, value, cls = "" }: { label: string; value: string; cls?: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3.5">
      <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{label}</div>
      <div className={`font-mono font-semibold ${cls}`}>{value}</div>
    </div>
  )
}
