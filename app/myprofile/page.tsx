"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Copy, Check, Camera, TrendingUp, TrendingDown } from "lucide-react"
import TNav from "@/components/TNav"
import WalletDeposit from "@/components/WalletDeposit"

const API = process.env.NEXT_PUBLIC_API_URL || ""

type Position = { id: string; key: string; name: string; image: string; side: string; leverage: number; entry: number; collateral: number }
type Trade = { id: string; name: string; image: string; side: string; leverage: number; entry: number; exit: number; pnl: number; reason: string; closedAt: number }

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
  const [marks, setMarks] = useState<Map<string, number>>(new Map())
  const [copied, setCopied] = useState(false)
  const [wAmt, setWAmt] = useState("")
  const [wAddr, setWAddr] = useState("")
  const [wMsg, setWMsg] = useState<string | null>(null)

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
  const wallet = walletAddr
  const label = wallet ? wallet.slice(0, 6) + "…" + wallet.slice(-4) : "Account"
  const via = "Wallet"

  if (!ready) return <div className="min-h-screen bg-[#faf9f6]" />

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#0e1512]">
      <TNav active="" title="My Profile" light />

      {!authenticated ? (
        <div className="max-w-lg mx-auto mt-28 text-center">
          <div className="text-xl font-bold">Connect your wallet to see your profile</div>
          <div className="text-sm text-[#0e1512]/40 mt-2">Balance, positions, history and deposits live here.</div>
          <div className="mt-6 flex justify-center"><ConnectButton /></div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          {/* identity */}
          <div className="flex items-center gap-5 rounded-2xl border border-black/10 bg-[#fbfaf7] p-6">
            <div className="relative group">
              {shownAvatar ? (
                <img src={shownAvatar} alt="" className="w-20 h-20 rounded-full object-cover border border-black/15" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#CDF60A]/15 border border-[#CDF60A]/30 flex items-center justify-center text-2xl font-bold text-[#5f7a05]">
                  {label.replace("@", "").slice(0, 1).toUpperCase()}
                </div>
              )}
              <button onClick={pickAvatar} title="Change avatar"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-black/10 hover:bg-white/20 border border-black/15 flex items-center justify-center backdrop-blur">
                <Camera size={13} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarFile} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xl font-bold truncate">{label}</div>
              <div className="text-xs text-[#0e1512]/40 mt-0.5">Signed in with {via}</div>
              {wallet && (
                <div className="text-xs font-mono text-[#0e1512]/35 mt-1 truncate">{wallet}</div>
              )}
              {avatar && (
                <button onClick={resetAvatar} className="text-[11px] text-[#0e1512]/30 hover:text-[#0e1512]/60 mt-1">Reset avatar</button>
              )}
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-[#0e1512]/35">Balance</div>
              <div className="text-2xl font-bold font-mono">${fmt(balance)}</div>
            </div>
          </div>

          {/* stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Stat label="Realized PnL" value={`${realized >= 0 ? "+" : ""}$${fmt(realized)}`} tone={realized >= 0 ? "up" : "down"} />
            <Stat label="Unrealized PnL" value={`${unrealized >= 0 ? "+" : ""}$${fmt(unrealized)}`} tone={unrealized >= 0 ? "up" : "down"} />
            <Stat label="Volume Traded" value={`$${fmt(volume)}`} />
            <Stat label="Trades" value={String(trades)} />
            <Stat label="Open Positions" value={String(positions.length)} />
            <Stat label="Win Rate" value={winRate === null ? "—" : `${winRate}%`} tone={winRate !== null && winRate >= 50 ? "up" : undefined} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* deposit */}
            <div className="rounded-2xl border border-[#CDF60A]/20 bg-[#CDF60A]/[0.04] p-5">
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
            <div className="rounded-2xl border border-black/10 bg-[#fbfaf7] p-5">
              <div className="text-[11px] uppercase tracking-wider text-[#0e1512]/35">Withdraw USDG</div>
              <input value={wAmt} onChange={(e) => setWAmt(e.target.value)} inputMode="decimal" placeholder="Amount"
                className="mt-2 w-full bg-black/5 border border-black/10 rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-black/25" />
              <input value={wAddr} onChange={(e) => setWAddr(e.target.value)} placeholder="Robinhood Chain address (0x…)"
                className="mt-2 w-full bg-black/5 border border-black/10 rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-black/25" />
              <button onClick={async () => {
                setWMsg(null)
                try {
                  const res = await fetch(`${API}/api/withdraw`, {
                    method: "POST", headers: { "Content-Type": "application/json", "x-wallet": walletAddr || "" },
                    body: JSON.stringify({ amount: Number(wAmt), address: wAddr.trim() }),
                  })
                  const d = await res.json()
                  setWMsg(res.ok ? (d.status === "sent" ? "Sent on-chain ✓" : "Requested — processing") : wErr(d))
                  if (res.ok) { setWAmt(""); refresh() }
                } catch { setWMsg("Request failed") }
              }} className="mt-3 w-full text-sm font-semibold px-4 py-2.5 rounded-lg bg-black/10 hover:bg-black/15 border border-black/10 transition-colors">Withdraw</button>
              {wMsg && <div className="text-xs text-[#0e1512]/50 mt-2">{wMsg}</div>}
            </div>
          </div>

          {/* history */}
          <div className="rounded-2xl border border-black/10 bg-[#fbfaf7] overflow-hidden">
            <div className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-[#0e1512]/35 border-b border-black/10">Trade History</div>
            {history.length === 0 ? (
              <div className="px-5 py-10 text-center text-[#0e1512]/30 text-sm">No closed trades yet — open one in the <a href="/trade" className="text-[#5f7a05] hover:underline">terminal</a>.</div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {history.slice(0, 12).map((t) => (
                    <tr key={t.id} className="border-b border-black/5 last:border-0">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          {t.image && <img src={t.image} alt="" className="w-9 h-7 object-contain" />}
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
                      <td className="px-5 py-3 text-right text-xs text-[#0e1512]/30">{new Date(t.closedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="rounded-xl border border-black/10 bg-[#fbfaf7] px-4 py-3.5">
      <div className="text-[10px] uppercase tracking-wider text-[#0e1512]/35">{label}</div>
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

