"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Copy, Check, Camera, TrendingUp, TrendingDown, Flame, Snowflake } from "lucide-react"
import TNav from "@/components/TNav"
import WalletDeposit from "@/components/WalletDeposit"
import PnLChart, { PnlPoint } from "@/components/PnLChart"
import Skin from "@/components/Skin"

const API = process.env.NEXT_PUBLIC_API_URL || ""

type Position = { id: string; key: string; name: string; image: string; side: string; leverage: number; entry: number; collateral: number }
type Trade = { id: string; key: string; name: string; image: string; side: string; leverage: number; entry: number; exit: number; pnl: number; reason: string; closedAt: number }

export default function MyProfile() {
  const { address: walletAddr, isConnected } = useAccount()
  const ready = true
  const authenticated = isConnected

  const [balance, setBalance] = useState(0)
  const [realized, setRealized] = useState(0)
  const [volume, setVolume] = useState(0)
  const [trades, setTrades] = useState(0)
  const [positions, setPositions] = useState<Position[]>([])
  const [history, setHistory] = useState<Trade[]>([])
  const [depositInfo, setDepositInfo] = useState<{ enabled: boolean; address?: string; maxPerUser?: number } | null>(null)
  const [deposits, setDeposits] = useState<{ id: string; amount: number; address: string; sig: string; credited_at: string }[]>([])
  const [withdrawals, setWithdrawals] = useState<{ id: string; amount: number; address: string; status: string; sig: string | null; created_at: string }[]>([])
  const [marks, setMarks] = useState<Map<string, number>>(new Map())
  const [copied, setCopied] = useState(false)
  const [wAmt, setWAmt] = useState("")
  const [wAddr, setWAddr] = useState("")
  const [wMsg, setWMsg] = useState<string | null>(null)
  const [wConfirm, setWConfirm] = useState(false)
  const [wBusy, setWBusy] = useState(false)
  const [wToast, setWToast] = useState<{ status: string; amount: string; address: string; sig?: string } | null>(null)

  // avatar: custom (stored locally) wins, else the Twitter picture, else a monogram
  const [avatar, setAvatar] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  useEffect(() => { try { setAvatar(localStorage.getItem("csl_avatar")) } catch {} }, [])
  const shownAvatar = avatar

  const pickAvatar = () => fileRef.current?.click()
  const onAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const img = new Image()
    img.onload = () => {
      const size = 256
      const c = document.createElement("canvas")
      c.width = size; c.height = size
      const ctx = c.getContext("2d")!
      const s = Math.min(img.width, img.height)
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size)
      const url = c.toDataURL("image/jpeg", 0.85)
      try { localStorage.setItem("csl_avatar", url) } catch {}
      setAvatar(url)
    }
    img.src = URL.createObjectURL(f)
  }
  const resetAvatar = () => { try { localStorage.removeItem("csl_avatar") } catch {}; setAvatar(null) }

  const refresh = useCallback(async () => {
    if (!API || !authenticated || !walletAddr) return
    try {
      const res = await fetch(`${API}/api/account`, { headers: { "x-wallet": walletAddr }, cache: "no-store" })
      if (!res.ok) return
      const a = await res.json()
      setBalance(Number(a.balance) || 0)
      setRealized(Number(a.realized) || 0)
      setVolume(Number(a.volume) || 0)
      setTrades(Number(a.trades) || 0)
      setPositions(a.positions || [])
      setHistory((a.history || []).map((t: any) => ({ ...t, closedAt: Number(t.closed_at) })))
      try {
        const dr = await fetch(`${API}/api/deposit`, { headers: { "x-wallet": walletAddr }, cache: "no-store" })
        if (dr.ok) setDepositInfo(await dr.json())
      } catch {}
      try {
        const [depRes, wRes] = await Promise.all([
          fetch(`${API}/api/deposits`, { headers: { "x-wallet": walletAddr }, cache: "no-store" }),
          fetch(`${API}/api/withdrawals`, { headers: { "x-wallet": walletAddr }, cache: "no-store" }),
        ])
        if (depRes.ok) setDeposits((await depRes.json()).deposits || [])
        if (wRes.ok) setWithdrawals((await wRes.json()).withdrawals || [])
      } catch {}
    } catch {}
  }, [authenticated, walletAddr])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 10000)
    return () => clearInterval(id)
  }, [refresh])

  // live marks for unrealized PnL
  useEffect(() => {
    if (!API) return
    let stop = false
    const load = async () => {
      try {
        const r = await fetch(`${API}/api/markets`, { cache: "no-store" })
        if (!r.ok || stop) return
        const d = await r.json()
        setMarks(new Map((d.markets || d).map((m: any) => [m.key, Number(m.price)])))
      } catch {}
    }
    load()
    const id = setInterval(load, 10000)
    return () => { stop = true; clearInterval(id) }
  }, [])

  const unrealized = useMemo(() => positions.reduce((acc, p) => {
    const mk = marks.get(p.key)
    if (!mk || !p.entry) return acc
    const dir = p.side === "short" ? -1 : 1
    return acc + ((mk - p.entry) / p.entry) * dir * p.leverage * Number(p.collateral)
  }, 0), [positions, marks])

  const wins = history.filter((t) => Number(t.pnl) > 0).length
  const winRate = history.length ? Math.round((wins / history.length) * 100) : null

  // cumulative realized PnL curve, oldest -> newest, for the chart
  const pnlPoints: PnlPoint[] = useMemo(() => {
    const asc = [...history].sort((a, b) => a.closedAt - b.closedAt)
    let running = 0
    return asc.map((t) => { running += Number(t.pnl) || 0; return { t: t.closedAt, pnl: running } })
  }, [history])

  // extra "moments" — best/worst trade, avg leverage, current streak
  const bestTrade = useMemo(() => history.length ? history.reduce((a, b) => (Number(b.pnl) > Number(a.pnl) ? b : a)) : null, [history])
  const worstTrade = useMemo(() => history.length ? history.reduce((a, b) => (Number(b.pnl) < Number(a.pnl) ? b : a)) : null, [history])
  const avgLeverage = useMemo(() => history.length ? history.reduce((s, t) => s + Number(t.leverage || 0), 0) / history.length : 0, [history])
  const streak = useMemo(() => {
    const desc = [...history].sort((a, b) => b.closedAt - a.closedAt)
    if (!desc.length) return { n: 0, win: true }
    const win = Number(desc[0].pnl) >= 0
    let n = 0
    for (const t of desc) { if ((Number(t.pnl) >= 0) === win) n++; else break }
    return { n, win }
  }, [history])

  const wallet = walletAddr
  const label = wallet ? wallet.slice(0, 6) + "…" + wallet.slice(-4) : "Account"
  const via = "Wallet"

  if (!ready) return <div className="min-h-screen bg-[#faf9f6]" />

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#0e1512]">
      <TNav active="" title="My Profile" light />

      {!authenticated ? (
        <div className="max-w-lg mx-auto mt-28 text-center px-4">
          <div className="text-xl font-bold">Connect your wallet to see your profile</div>
          <div className="text-sm text-[#0e1512]/40 mt-2">Balance, positions, history and deposits live here.</div>
          <div className="mt-6 flex justify-center"><ConnectButton /></div>
        </div>
      ) : (
        <div className="w-full">
          {/* identity — full width, hairline divider instead of a boxed card */}
          <div className="flex items-center gap-5 px-4 md:px-8 py-6 border-b border-black/10">
            <div className="relative group shrink-0">
              {shownAvatar ? (
                <img src={shownAvatar} alt="" className="w-16 h-16 rounded-full object-cover border border-black/15" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#CDF60A]/15 border border-[#CDF60A]/30 flex items-center justify-center text-xl font-bold text-[#5f7a05]">
                  {label.replace("@", "").slice(0, 1).toUpperCase()}
                </div>
              )}
              <button onClick={pickAvatar} title="Change avatar"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-black/10 hover:bg-black/20 border border-black/15 flex items-center justify-center">
                <Camera size={12} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarFile} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-lg font-bold truncate">{label}</div>
              <div className="text-xs text-[#0e1512]/40 mt-0.5">Signed in with {via}</div>
              {wallet && <div className="text-xs font-mono text-[#0e1512]/35 mt-0.5 truncate">{wallet}</div>}
              {avatar && <button onClick={resetAvatar} className="text-[11px] text-[#0e1512]/30 hover:text-[#0e1512]/60 mt-1">Reset avatar</button>}
            </div>
            <div className="text-right shrink-0">
              <div className="text-[11px] uppercase tracking-wider text-[#0e1512]/35">Account Value</div>
              <div className="text-2xl font-bold font-mono">${fmt(balance + unrealized)}</div>
            </div>
          </div>

          {/* PnL chart — full bleed, no card, no border box */}
          <div className="px-4 md:px-8 py-6 border-b border-black/10">
            <PnLChart points={pnlPoints} unrealized={unrealized} />
          </div>

          {/* stat strip — hairline separators between cells, no boxes */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 border-b border-black/10">
            <Stat label="Realized PnL" value={`${realized >= 0 ? "+" : ""}$${fmt(realized)}`} tone={realized >= 0 ? "up" : "down"} />
            <Stat label="Unrealized PnL" value={`${unrealized >= 0 ? "+" : ""}$${fmt(unrealized)}`} tone={unrealized >= 0 ? "up" : "down"} />
            <Stat label="Volume Traded" value={`$${fmt(volume)}`} />
            <Stat label="Trades" value={String(trades)} />
            <Stat label="Win Rate" value={winRate === null ? "—" : `${winRate}%`} tone={winRate !== null && winRate >= 50 ? "up" : undefined} />
            <Stat label="Avg Leverage" value={history.length ? `${avgLeverage.toFixed(1)}x` : "—"} />
            <Stat
              label={streak.n > 0 ? (streak.win ? "Win Streak" : "Loss Streak") : "Streak"}
              value={streak.n > 0 ? String(streak.n) : "—"}
              tone={streak.n > 0 ? (streak.win ? "up" : "down") : undefined}
              icon={streak.n > 0 ? (streak.win ? <Flame size={12} className="text-[#5f7a05]" /> : <Snowflake size={12} className="text-red-600" />) : undefined}
            />
            <Stat label="Open Positions" value={String(positions.length)} />
          </div>

          {/* best / worst trade — the kind of thing that makes a profile feel alive */}
          {(bestTrade || worstTrade) && (
            <div className="grid md:grid-cols-2 border-b border-black/10">
              {bestTrade && (
                <div className="px-4 md:px-8 py-5 flex items-center gap-3 md:border-r border-black/10">
                  <div className="text-[11px] uppercase tracking-wider text-[#0e1512]/35 w-24 shrink-0">Best Trade</div>
                  {bestTrade.image && <Skin mk={bestTrade.key} img={bestTrade.image} className="w-9 h-7" />}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{bestTrade.name}</div>
                    <div className="text-xs text-[#0e1512]/40">{bestTrade.side === "short" ? "Short" : "Long"} · {bestTrade.leverage}x</div>
                  </div>
                  <div className="font-mono font-semibold text-[#5f7a05]">+${fmt(Number(bestTrade.pnl))}</div>
                </div>
              )}
              {worstTrade && (
                <div className="px-4 md:px-8 py-5 flex items-center gap-3">
                  <div className="text-[11px] uppercase tracking-wider text-[#0e1512]/35 w-24 shrink-0">Worst Trade</div>
                  {worstTrade.image && <Skin mk={worstTrade.key} img={worstTrade.image} className="w-9 h-7" />}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{worstTrade.name}</div>
                    <div className="text-xs text-[#0e1512]/40">{worstTrade.side === "short" ? "Short" : "Long"} · {worstTrade.leverage}x</div>
                  </div>
                  <div className="font-mono font-semibold text-red-600">${fmt(Number(worstTrade.pnl))}</div>
                </div>
              )}
            </div>
          )}

          <div className="grid md:grid-cols-2 border-b border-black/10">
            {/* deposit */}
            <div className="px-4 md:px-8 py-6 bg-[#CDF60A]/[0.04] md:border-r border-black/10">
              <div className="text-[11px] uppercase tracking-wider text-[#5f7a05]/70">Deposit USDG (Robinhood Chain)</div>
              {depositInfo?.enabled && depositInfo.address ? (
                <>
                  {/* one click: the wallet signs a USDG transfer straight to this
                      account's deposit address, and the scanner credits it */}
                  <div className="mt-3">
                    <WalletDeposit address={depositInfo.address} onDone={refresh} />
                  </div>

                  <details className="mt-3 group">
                    <summary className="text-[11px] text-[#0e1512]/40 hover:text-[#0e1512]/70 cursor-pointer list-none select-none">
                      Or send USDG manually ▾
                    </summary>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="font-mono text-xs break-all flex-1 text-[#0e1512]/70">{depositInfo.address}</div>
                      <button onClick={() => { navigator.clipboard.writeText(depositInfo.address!); setCopied(true); setTimeout(() => setCopied(false), 1200) }}
                        className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-black/10 hover:bg-black/15 border border-black/10 flex items-center gap-1.5">
                        {copied ? <Check size={12} /> : <Copy size={12} />}{copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="text-[11px] text-[#0e1512]/35 mt-2">This address belongs to your account and never changes.</div>
                  </details>

                  <div className="text-[11px] text-[#0e1512]/35 mt-3">USDG on Robinhood Chain only. Max ${depositInfo.maxPerUser} per account in beta. Credits within ~1 min.</div>
                </>
              ) : (
                <div className="text-sm text-[#0e1512]/40 mt-2">USDG deposits open at public launch. Until then your balance stays at $0.</div>
              )}
            </div>

            {/* withdraw */}
            <div className="px-4 md:px-8 py-6">
              <div className="text-[11px] uppercase tracking-wider text-[#0e1512]/35">Withdraw USDG</div>
              <input value={wAmt} onChange={(e) => setWAmt(e.target.value)} inputMode="decimal" placeholder="Amount"
                className="mt-2 w-full bg-black/5 border border-black/10 rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-black/25" />
              <input value={wAddr} onChange={(e) => setWAddr(e.target.value)} placeholder="Robinhood Chain address (0x…)"
                className="mt-2 w-full bg-black/5 border border-black/10 rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-black/25" />
              <button
                onClick={() => { if (Number(wAmt) > 0 && wAddr.trim()) setWConfirm(true) }}
                disabled={!(Number(wAmt) > 0 && wAddr.trim())}
                className="mt-3 w-full text-sm font-semibold px-4 py-2.5 rounded-lg bg-black/10 hover:bg-black/15 disabled:opacity-40 disabled:cursor-not-allowed border border-black/10 transition-colors"
              >Withdraw</button>
              {wMsg && <div className="text-xs text-[#0e1512]/50 mt-2">{wMsg}</div>}
            </div>
          </div>

          {/* deposit / withdrawal history — merged, newest first */}
          <div className="border-b border-black/10">
            <div className="px-4 md:px-8 py-3.5 text-[11px] uppercase tracking-wider text-[#0e1512]/35 border-b border-black/10">Deposits &amp; Withdrawals</div>
            {(() => {
              const rows = [
                ...deposits.map((d) => ({ kind: "deposit" as const, id: d.id, amount: d.amount, address: d.address, status: "credited", sig: d.sig, at: Number(d.credited_at) })),
                ...withdrawals.map((w) => ({ kind: "withdraw" as const, id: w.id, amount: w.amount, address: w.address, status: w.status, sig: w.sig, at: Number(w.created_at) })),
              ].sort((a, b) => b.at - a.at)
              if (!rows.length) return <div className="px-4 md:px-8 py-10 text-center text-[#0e1512]/30 text-sm">No deposits or withdrawals yet.</div>
              return (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[#0e1512]/40 text-[11px] uppercase">
                      <th className="text-left font-medium px-4 md:px-8 py-2">Type</th>
                      <th className="text-right font-medium px-2">Amount</th>
                      <th className="text-left font-medium px-2">Address</th>
                      <th className="text-left font-medium px-2">Status</th>
                      <th className="text-right font-medium px-4 md:px-8">Date &amp; time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 30).map((r) => (
                      <tr key={r.kind + r.id} className="border-t border-black/5">
                        <td className="px-4 md:px-8 py-3">
                          <span className={`text-xs font-semibold ${r.kind === "deposit" ? "text-[#5f7a05]" : "text-[#0e1512]/70"}`}>
                            {r.kind === "deposit" ? "↓ Deposit" : "↑ Withdraw"}
                          </span>
                        </td>
                        <td className="px-2 text-right font-mono text-xs">${fmt(r.amount)}</td>
                        <td className="px-2 font-mono text-xs text-[#0e1512]/50">{r.address.slice(0, 6)}…{r.address.slice(-4)}</td>
                        <td className="px-2">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                            r.status === "credited" || r.status === "sent" ? "bg-[#CDF60A]/20 text-[#5f7a05]" :
                            r.status === "pending" || r.status === "processing" ? "bg-amber-500/15 text-amber-700" :
                            "bg-black/5 text-[#0e1512]/40"
                          }`}>{r.status}</span>
                        </td>
                        <td className="px-4 md:px-8 py-3 text-right text-xs text-[#0e1512]/30">
                          {r.sig ? (
                            <a href={`https://robinhoodchain.blockscout.com/tx/${r.sig}`} target="_blank" rel="noopener noreferrer" className="text-[#5f7a05] hover:underline mr-2">tx</a>
                          ) : null}
                          {new Date(r.at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            })()}
          </div>

          {/* history — full width table, no card wrapper */}
          <div className="pb-10">
            <div className="px-4 md:px-8 py-3.5 text-[11px] uppercase tracking-wider text-[#0e1512]/35 border-b border-black/10">Trade History</div>
            {history.length === 0 ? (
              <div className="px-4 md:px-8 py-10 text-center text-[#0e1512]/30 text-sm">No closed trades yet — open one in the <a href="/trade" className="text-[#5f7a05] hover:underline">terminal</a>.</div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {history.slice(0, 20).map((t) => (
                    <tr key={t.id} className="border-b border-black/5 last:border-0">
                      <td className="px-4 md:px-8 py-3">
                        <div className="flex items-center gap-2.5">
                          {t.image && <Skin mk={t.key} img={t.image} className="w-9 h-7" />}
                          <span className="font-medium">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${t.side === "short" ? "text-red-600" : "text-[#5f7a05]"}`}>
                          {t.side === "short" ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                          {t.side === "short" ? "Short" : "Long"} · {t.leverage}x
                        </span>
                      </td>
                      <td className="px-3 py-3 font-mono text-[#0e1512]/50 text-xs">${fmt(t.entry)} → ${fmt(t.exit)}</td>
                      <td className={`px-3 py-3 font-mono font-semibold ${Number(t.pnl) >= 0 ? "text-[#5f7a05]" : "text-red-600"}`}>
                        {Number(t.pnl) >= 0 ? "+" : ""}${fmt(t.pnl)}
                      </td>
                      <td className="px-4 md:px-8 py-3 text-right text-xs text-[#0e1512]/30">{new Date(t.closedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* withdraw confirmation — never submit on a single click */}
      {wConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => !wBusy && setWConfirm(false)}>
          <div className="w-full max-w-[380px] rounded-2xl border border-black/10 bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="font-semibold text-lg mb-1">Withdraw USDG?</div>
            <div className="text-xs text-[#0e1512]/40 mb-4">Double-check the address — this cannot be reversed once sent.</div>
            <div className="rounded-lg bg-black/[0.03] border border-black/5 p-3 mb-5 space-y-2 text-sm">
              <Row2 label="Amount" value={`$${fmt(Number(wAmt))}`} />
              <div>
                <div className="text-[#0e1512]/40 text-xs mb-1">To address</div>
                <div className="font-mono text-xs break-all">{wAddr.trim()}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button disabled={wBusy} onClick={() => setWConfirm(false)} className="flex-1 h-10 rounded-lg bg-black/5 hover:bg-black/10 disabled:opacity-40 text-sm font-semibold">Cancel</button>
              <button
                disabled={wBusy}
                onClick={async () => {
                  setWBusy(true); setWMsg(null)
                  try {
                    const res = await fetch(`${API}/api/withdraw`, {
                      method: "POST", headers: { "Content-Type": "application/json", "x-wallet": walletAddr || "" },
                      body: JSON.stringify({ amount: Number(wAmt), address: wAddr.trim() }),
                    })
                    const d = await res.json()
                    if (res.ok) {
                      setWToast({ status: d.status === "sent" ? "sent" : "pending", amount: wAmt, address: wAddr.trim(), sig: d.sig })
                      setWAmt(""); setWAddr(""); refresh()
                    } else {
                      setWMsg(wErr(d))
                    }
                  } catch { setWMsg("Request failed") }
                  setWBusy(false); setWConfirm(false)
                }}
                className="flex-1 h-10 rounded-lg bg-[#CDF60A] hover:bg-[#d9fa3a] disabled:opacity-60 text-[#0e1512] text-sm font-semibold"
              >{wBusy ? "Confirming…" : "Confirm Withdraw"}</button>
            </div>
          </div>
        </div>
      )}

      {/* withdraw result toast */}
      {wToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 bg-white border border-black/10 shadow-lg rounded-xl px-4 py-2.5">
            <div className="text-sm">
              <span className="font-semibold text-[#5f7a05]">{wToast.status === "sent" ? "Withdrawal sent ✓" : "Withdrawal requested"}</span>
              <span className="text-[#0e1512]/40"> — ${fmt(Number(wToast.amount))} to {wToast.address.slice(0, 6)}…{wToast.address.slice(-4)}</span>
            </div>
            {wToast.sig && (
              <a href={`https://robinhoodchain.blockscout.com/tx/${wToast.sig}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[#5f7a05] hover:underline shrink-0">View tx</a>
            )}
            <button onClick={() => setWToast(null)} className="text-[#0e1512]/30 hover:text-[#0e1512]/60 shrink-0 ml-1">✕</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row2({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><span className="text-[#0e1512]/40">{label}</span><span className="font-mono font-semibold">{value}</span></div>
}

function Stat({ label, value, tone, icon }: { label: string; value: string; tone?: "up" | "down"; icon?: React.ReactNode }) {
  return (
    <div className="px-4 md:px-6 py-4 border-r border-b md:border-b-0 border-black/10 [&:nth-child(2n)]:border-r-0 md:[&:nth-child(2n)]:border-r lg:[&:nth-child(8n)]:border-r-0">
      <div className="text-[10px] uppercase tracking-wider text-[#0e1512]/35 flex items-center gap-1">{icon}{label}</div>
      <div className={`text-lg font-bold font-mono mt-1 ${tone === "up" ? "text-[#5f7a05]" : tone === "down" ? "text-red-600" : ""}`}>{value}</div>
    </div>
  )
}

function fmt(n: number) {
  return (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function wErr(d: any): string {
  switch (d?.error) {
    case "min_withdraw": return `Minimum withdrawal: $${d.min}`
    case "bad_address": return "Invalid address"
    case "insufficient_balance": return "Insufficient balance"
    case "rate_limited": return "Too many withdrawals — try later"
    default: return "Request failed"
  }
}
