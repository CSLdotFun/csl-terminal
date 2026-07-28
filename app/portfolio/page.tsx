"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import TNav from "@/components/TNav"
import SkinSides from "@/components/SkinSides"

const API = process.env.NEXT_PUBLIC_API_URL || ""
const fmt = (n: number, d = 2) => (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })
const money = (n: number) => `$${fmt(n)}`

type Position = { id: string; key: string; name: string; side: string; leverage: number; entry: number; collateral: number; notional: number; units: number; opened_at?: number }
type Trade = { id: string; name: string; side: string; leverage: number; entry: number; exit: number; pnl: number; closed_at: number }
type Account = { balance: number; realized: number; volume: number; trades: number; positions: Position[]; history: Trade[] }

const emptyAccount: Account = { balance: 0, realized: 0, volume: 0, trades: 0, positions: [], history: [] }

export default function Portfolio() {
  const { address: walletAddr, isConnected } = useAccount()
  const [acct, setAcct] = useState<Account | null>(null)
  const [marks, setMarks] = useState<Map<string, number>>(new Map())
  const [funds, setFunds] = useState<Map<string, number>>(new Map())
  const [now, setNow] = useState(Date.now())

  // real account, from the backend — same source as My Profile
  const refresh = useCallback(async () => {
    if (!API || !isConnected || !walletAddr) { setAcct(emptyAccount); return }
    try {
      const res = await fetch(`${API}/api/account`, { headers: { "x-wallet": walletAddr }, cache: "no-store" })
      if (!res.ok) return
      const a = await res.json()
      setAcct({
        balance: Number(a.balance) || 0,
        realized: Number(a.realized) || 0,
        volume: Number(a.volume) || 0,
        trades: Number(a.trades) || 0,
        positions: a.positions || [],
        history: a.history || [],
      })
    } catch {}
  }, [isConnected, walletAddr])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 10000)
    return () => clearInterval(id)
  }, [refresh])

  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(clock)
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
        const list = d.markets || d
        setMarks(new Map(list.map((m: any) => [m.key, m.price])))
        setFunds(new Map(list.map((m: any) => [m.key, m.funding || 0])))
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
      const dir = p.side === "short" ? -1 : 1
      const pricePnl = ((px - p.entry) / p.entry) * dir * p.leverage * Number(p.collateral)
      u += Math.max(-p.collateral, pricePnl)
    }
    return u
  }, [acct, marks])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#faf9f6] text-[#0e1512]">
        <TNav active="portfolio" light title="Portfolio" />
        <div className="max-w-lg mx-auto mt-28 text-center px-4">
          <div className="text-xl font-bold">Connect your wallet to see your portfolio</div>
          <div className="text-sm text-[#0e1512]/40 mt-2">Balance, positions and trade history live here.</div>
          <div className="mt-6 flex justify-center"><ConnectButton /></div>
        </div>
      </div>
    )
  }

  if (!acct) return <div className="min-h-screen bg-[#faf9f6]" />
  const equity = acct.balance + acct.positions.reduce((s, p) => s + Number(p.collateral), 0) + upnl

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#0e1512]">
      <TNav active="portfolio" light title="Portfolio" />
      <SkinSides left="/awp-dragon-lore-portfolio.png" right="/awp-asiimov-portfolio.png" size={300} inset={30} leftRotate={-6} rightRotate={6} opacity={1} />
      <main className="relative z-10 max-w-[1100px] mx-auto px-5 py-10">
        <h1 className="text-3xl font-bold tracking-[-0.02em] mb-8">Your account</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          <Card label="Balance" value={money(acct.balance)} />
          <Card label="Equity" value={money(equity)} />
          <Card label="Unrealized PnL" value={`${upnl >= 0 ? "+" : ""}${money(upnl)}`} cls={upnl > 0 ? "text-[#5f7a05]" : upnl < 0 ? "text-red-600" : ""} />
          <Card label="Realized PnL" value={`${acct.realized >= 0 ? "+" : ""}${money(acct.realized)}`} cls={acct.realized > 0 ? "text-[#5f7a05]" : acct.realized < 0 ? "text-red-600" : ""} />
          <Card label="Volume traded" value={money(acct.volume)} />
          <Card label="Trades" value={String(acct.trades)} />
        </div>

        <h2 className="text-lg font-semibold mb-3">Open positions ({acct.positions.length})</h2>
        <div className="rounded-xl border border-black/10 bg-black/[0.02] overflow-hidden mb-10">
          {acct.positions.length === 0 ? (
            <div className="px-5 py-10 text-center text-[#0e1512]/30 text-sm">No open positions — open one in the <a href="/trade" className="text-[#5f7a05] hover:underline">terminal</a>.</div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-[#0e1512]/40 text-[11px] uppercase border-b border-black/10">
                <th className="text-left font-medium px-4 py-2.5">Market</th><th className="text-left font-medium px-2">Side</th>
                <th className="text-right font-medium px-2">Size</th><th className="text-right font-medium px-2">Entry</th>
                <th className="text-right font-medium px-2">Mark</th><th className="text-right font-medium px-4">uPnL</th>
              </tr></thead>
              <tbody>
                {acct.positions.map((p) => {
                  const px = marks.get(p.key) ?? p.entry
                  const dir = p.side === "short" ? -1 : 1
                  const pnl = Math.max(-p.collateral, ((px - p.entry) / p.entry) * dir * p.leverage * Number(p.collateral))
                  return (
                    <tr key={p.id} className="border-t border-black/5">
                      <td className="px-4 py-2.5 text-xs">{p.name}</td>
                      <td className={`px-2 text-xs font-semibold ${p.side === "short" ? "text-red-600" : "text-[#5f7a05]"}`}>{p.side.toUpperCase()} {p.leverage}x</td>
                      <td className="px-2 text-right font-mono text-xs">{money(p.notional)}</td>
                      <td className="px-2 text-right font-mono text-xs">{money(p.entry)}</td>
                      <td className="px-2 text-right font-mono text-xs">{money(px)}</td>
                      <td className={`px-4 text-right font-mono text-xs ${pnl >= 0 ? "text-[#5f7a05]" : "text-red-600"}`}>{pnl >= 0 ? "+" : ""}{money(pnl)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <h2 className="text-lg font-semibold mb-3">Trade history</h2>
        <div className="rounded-xl border border-black/10 bg-black/[0.02] overflow-hidden">
          {acct.history.length === 0 ? (
            <div className="px-5 py-10 text-center text-[#0e1512]/30 text-sm">No closed trades yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-[#0e1512]/40 text-[11px] uppercase border-b border-black/10">
                <th className="text-left font-medium px-4 py-2.5">Market</th><th className="text-left font-medium px-2">Side</th>
                <th className="text-right font-medium px-2">Entry</th><th className="text-right font-medium px-2">Exit</th>
                <th className="text-right font-medium px-2">PnL</th><th className="text-right font-medium px-4">Closed</th>
              </tr></thead>
              <tbody>
                {acct.history.slice(0, 30).map((t) => (
                  <tr key={t.id} className="border-t border-black/5">
                    <td className="px-4 py-2.5 text-xs">{t.name}</td>
                    <td className={`px-2 text-xs font-semibold ${t.side === "short" ? "text-red-600" : "text-[#5f7a05]"}`}>{t.side.toUpperCase()} {t.leverage}x</td>
                    <td className="px-2 text-right font-mono text-xs">{money(t.entry)}</td>
                    <td className="px-2 text-right font-mono text-xs">{money(t.exit)}</td>
                    <td className={`px-2 text-right font-mono text-xs ${Number(t.pnl) >= 0 ? "text-[#5f7a05]" : "text-red-600"}`}>{Number(t.pnl) >= 0 ? "+" : ""}{money(t.pnl)}</td>
                    <td className="px-4 text-right font-mono text-xs text-[#0e1512]/40">{new Date(Number(t.closed_at)).toLocaleString()}</td>
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
    <div className="rounded-xl bg-black/[0.04] border border-black/5 p-3.5">
      <div className="text-[10px] uppercase tracking-wider text-[#0e1512]/40 mb-1">{label}</div>
      <div className={`font-mono font-semibold ${cls}`}>{value}</div>
    </div>
  )
}
