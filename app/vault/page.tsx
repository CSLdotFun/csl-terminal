"use client"

import { useCallback, useEffect, useState } from "react"
import { useAccount } from "wagmi"
import TNav from "@/components/TNav"
import SkinSides from "@/components/SkinSides"
import { useAuthToken } from "@/hooks/useAuthToken"

const API = process.env.NEXT_PUBLIC_API_URL || ""
const money = (n: number) => `$${(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function Vault() {
  const { isConnected } = useAccount()
  const { getToken, authHeader } = useAuthToken()
  const [stats, setStats] = useState<{ open: boolean; tvl: number; depositors: number; nav: number } | null>(null)
  const [position, setPosition] = useState<{ netContributed: number; claimable: number } | null>(null)
  const [amt, setAmt] = useState("")
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    if (!API) return
    try {
      const r = await fetch(`${API}/api/vault`, { cache: "no-store" })
      if (r.ok) setStats(await r.json())
    } catch {}
    if (isConnected) {
      try {
        const token = await getToken()
        if (!token) return
        const r = await fetch(`${API}/api/vault/position`, { headers: authHeader(token), cache: "no-store" })
        if (r.ok) setPosition(await r.json())
      } catch {}
    }
  }, [isConnected, getToken, authHeader])

  useEffect(() => { refresh(); const id = setInterval(refresh, 15000); return () => clearInterval(id) }, [refresh])

  const deposit = async () => {
    const amount = Number(amt)
    if (!amount || amount <= 0) return
    setBusy(true); setMsg(null)
    try {
      const token = await getToken()
      const res = await fetch(`${API}/api/vault/deposit`, {
        method: "POST", headers: { "Content-Type": "application/json", ...authHeader(token) },
        body: JSON.stringify({ amount }),
      })
      const d = await res.json()
      setMsg(d.ok ? "Deposited ✓" : (d.error === "insufficient_balance" ? "Insufficient balance" : d.error === "vault_closed" ? "Vault is closed" : "Failed"))
      if (d.ok) { setAmt(""); refresh() }
    } catch { setMsg("Network error") }
    setBusy(false)
  }

  const withdraw = async () => {
    const amount = Number(amt)
    if (!amount || amount <= 0) return
    setBusy(true); setMsg(null)
    try {
      const token = await getToken()
      const res = await fetch(`${API}/api/vault/withdraw`, {
        method: "POST", headers: { "Content-Type": "application/json", ...authHeader(token) },
        body: JSON.stringify({ amount }),
      })
      const d = await res.json()
      setMsg(d.ok ? "Withdrawn ✓" : d.error === "exceeds_claim" ? `Max claimable: ${money(d.claimable)}` : "Failed")
      if (d.ok) { setAmt(""); refresh() }
    } catch { setMsg("Network error") }
    setBusy(false)
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#0e1512]">
      <TNav active="vault" light title="Vault" />
      <SkinSides left="/karambit-fade-side.png" right="/butterfly-blue-side.png" size={300} inset={30} leftRotate={-6} rightRotate={6} opacity={0.9} />
      <main className="relative z-10 max-w-[900px] mx-auto px-5 py-10">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h1 className="text-3xl font-bold tracking-[-0.02em]">CSL Liquidity Vault</h1>
          {stats?.open && <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#CDF60A]/20 text-[#5f7a05] font-semibold">LIVE</span>}
        </div>
        <p className="text-[#0e1512]/50 mb-10 max-w-[640px] leading-relaxed">
          Deposit USDG, be the house. The vault takes the other side of trader positions
          and earns protocol fees — losses and gains are shared pro-rata by depositors.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          <Card label="TVL" value={stats ? money(stats.tvl) : "$0.00"} />
          <Card label="Depositors" value={stats ? String(stats.depositors) : "0"} />
          <Card label="Vault NAV" value={stats ? money(stats.nav) : "$0.00"} />
          <Card label="Your claimable" value={position ? money(position.claimable) : "$0.00"} />
        </div>

        {isConnected ? (
          <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-5 mb-10">
            <div className="text-[11px] uppercase tracking-wider text-[#0e1512]/40 mb-3">Deposit or withdraw</div>
            {position && (
              <div className="text-xs text-[#0e1512]/50 mb-3">
                Net contributed <span className="font-mono text-[#0e1512]">{money(position.netContributed)}</span> · Claimable now <span className="font-mono text-[#5f7a05] font-semibold">{money(position.claimable)}</span>
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              <input value={amt} onChange={(e) => setAmt(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" placeholder="Amount (USDG)"
                className="flex-1 min-w-[160px] bg-white border border-black/10 rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-black/25" />
              <button onClick={deposit} disabled={busy} className="px-5 py-2.5 rounded-lg bg-[#CDF60A] hover:bg-[#d9fa3a] disabled:opacity-50 text-[#0e1512] text-sm font-semibold">Deposit</button>
              <button onClick={withdraw} disabled={busy} className="px-5 py-2.5 rounded-lg bg-black/10 hover:bg-black/15 disabled:opacity-50 text-sm font-semibold">Withdraw</button>
            </div>
            {msg && <div className="text-xs text-[#0e1512]/50 mt-2">{msg}</div>}
          </div>
        ) : (
          <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-5 mb-10 text-sm text-[#0e1512]/50">
            Connect your wallet to deposit into the vault.
          </div>
        )}

        <h2 className="text-lg font-semibold mb-3">How it works</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <Step n="01" t="Deposit USDG" d="Funds enter the shared vault on Robinhood Chain. Withdraw your pro-rata claim any time." />
          <Step n="02" t="Vault trades against traders" d="Every long or short on CSL is matched against vault liquidity, within per-market open-interest caps." />
          <Step n="03" t="Earn fees" d="Taker fees (0.15% of notional) and net trader losses accrue to the vault; net trader wins are paid from it." />
        </div>

        <h2 className="text-lg font-semibold mb-3">Protocol parameters</h2>
        <div className="rounded-xl border border-black/10 bg-black/[0.02] overflow-hidden mb-10">
          <table className="w-full text-sm">
            <tbody>
              <Row k="Taker fee" v="0.15% of notional" />
              <Row k="Maintenance margin" v="0.5%" />
              <Row k="Max leverage" v="20x, isolated" />
              <Row k="Funding" v="hourly, drifts within ±0.08%/h" />
              <Row k="Settlement" v="USDG on Robinhood Chain" />
              <Row k="Markets" v="17 curated skin perps" />
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-[#CDF60A]/40 bg-[#CDF60A]/[0.06] p-4 text-sm text-[#0e1512]/60 leading-relaxed">
          There is no fixed APR here — returns come from real trading activity (fees plus
          net trader losses, minus net trader wins), shared pro-rata by whoever's deposited
          when it happens. TVL and NAV above are live, not projected.
        </div>
      </main>
    </div>
  )
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/[0.04] border border-black/5 p-3.5">
      <div className="text-[10px] uppercase tracking-wider text-[#0e1512]/40 mb-1">{label}</div>
      <div className="font-mono font-semibold">{value}</div>
    </div>
  )
}
function Step({ n, t, d }: { n: string; t: string; d: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-5">
      <div className="text-[#5f7a05] font-mono text-sm mb-2">{n}</div>
      <h3 className="font-semibold mb-1.5">{t}</h3>
      <p className="text-[#0e1512]/50 text-sm leading-relaxed">{d}</p>
    </div>
  )
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr className="border-t border-black/5 first:border-0">
      <td className="px-4 py-2.5 text-[#0e1512]/45 text-xs uppercase tracking-wider">{k}</td>
      <td className="px-4 py-2.5 text-right font-mono text-sm">{v}</td>
    </tr>
  )
}
