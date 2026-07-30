"use client"

import { useEffect, useState } from "react"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { formatUnits, parseUnits } from "viem"
import { Flame, TrendingUp, Users, Lock } from "lucide-react"
import TNav from "@/components/TNav"
import { CSL_STAKING_ABI, ERC20_ABI } from "@/abi/cslStaking"

// Set these once both contracts exist. Until then the page renders the same
// final layout in a clearly-labeled preview state — nothing to rewire later.
const STAKING_ADDRESS = process.env.NEXT_PUBLIC_STAKING_CONTRACT as `0x${string}` | undefined
const CSL_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_CSL_TOKEN as `0x${string}` | undefined
const DECIMALS = 18

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 4 })

export default function Staking() {
  const live = Boolean(STAKING_ADDRESS && CSL_TOKEN_ADDRESS)
  const { address, isConnected } = useAccount()
  const [tab, setTab] = useState<"stake" | "unstake">("stake")
  const [amt, setAmt] = useState("")

  const enabled = live && isConnected

  const { data: walletBal, refetch: refetchWalletBal } = useReadContract({
    address: CSL_TOKEN_ADDRESS, abi: ERC20_ABI, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!(enabled && address) },
  })
  const { data: staked, refetch: refetchStaked } = useReadContract({
    address: STAKING_ADDRESS, abi: CSL_STAKING_ABI, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!(enabled && address) },
  })
  const { data: earned, refetch: refetchEarned } = useReadContract({
    address: STAKING_ADDRESS, abi: CSL_STAKING_ABI, functionName: "earned", args: address ? [address] : undefined, query: { enabled: !!(enabled && address) },
  })
  const { data: totalStaked } = useReadContract({
    address: STAKING_ADDRESS, abi: CSL_STAKING_ABI, functionName: "totalSupply", query: { enabled: live },
  })
  const { data: rewardRateRaw } = useReadContract({
    address: STAKING_ADDRESS, abi: CSL_STAKING_ABI, functionName: "rewardRate", query: { enabled: live },
  })
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CSL_TOKEN_ADDRESS, abi: ERC20_ABI, functionName: "allowance", args: address && STAKING_ADDRESS ? [address, STAKING_ADDRESS] : undefined, query: { enabled: !!(enabled && address) },
  })

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: txConfirming, isSuccess: txDone } = useWaitForTransactionReceipt({ hash: txHash })

  useEffect(() => {
    if (txDone) { refetchWalletBal(); refetchStaked(); refetchEarned(); refetchAllowance(); setAmt("") }
  }, [txDone, refetchWalletBal, refetchStaked, refetchEarned, refetchAllowance])

  const amountWei = (() => { try { return parseUnits(amt || "0", DECIMALS) } catch { return BigInt(0) } })()
  const needsApproval = tab === "stake" && enabled && (allowance ?? BigInt(0)) < amountWei && amountWei > BigInt(0)

  const doApprove = () => writeContract({ address: CSL_TOKEN_ADDRESS!, abi: ERC20_ABI, functionName: "approve", args: [STAKING_ADDRESS!, amountWei] })
  const doStake = () => writeContract({ address: STAKING_ADDRESS!, abi: CSL_STAKING_ABI, functionName: "stake", args: [amountWei] })
  const doUnstake = () => writeContract({ address: STAKING_ADDRESS!, abi: CSL_STAKING_ABI, functionName: "withdraw", args: [amountWei] })
  const doClaim = () => writeContract({ address: STAKING_ADDRESS!, abi: CSL_STAKING_ABI, functionName: "getReward" })

  const busy = isPending || txConfirming
  const maxAmt = tab === "stake" ? walletBal : staked

  // rewardRate is USDG-per-second across ALL stakers (contract-wide), not
  // per-token — this is the same "how much drips out" stat Quiver showed,
  // just in USDG instead of ETH since that's what CSL settles everything in.
  const dailyEmission = live && rewardRateRaw !== undefined ? Number(formatUnits(rewardRateRaw * BigInt(86400), DECIMALS)) : null
  const monthlyEmission = dailyEmission !== null ? dailyEmission * 30 : null
  const perTokenDaily = dailyEmission !== null && totalStaked && totalStaked > BigInt(0)
    ? dailyEmission / Number(formatUnits(totalStaked, DECIMALS))
    : null

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#0e1512]">
      <TNav active="staking" light title="Staking" />

      <main className="relative z-10 max-w-[980px] mx-auto px-5 py-14">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h1 className="text-3xl font-bold tracking-[-0.02em]">$CSL Staking</h1>
          {!live && <span className="text-[11px] px-2.5 py-1 rounded-full border border-[#CDF60A]/50 bg-[#CDF60A]/10 text-[#5f7a05] font-semibold">OPENS WITH $CSL</span>}
        </div>
        <p className="text-[#0e1512]/50 mb-10 max-w-[600px] leading-relaxed">
          Stake $CSL, earn a share of protocol revenue in USDG. Higher stake unlocks lower fees
          and higher leverage caps on the terminal.
        </p>

        {/* stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatCard icon={<Flame size={16} />} label="Total staked" value={live && totalStaked !== undefined ? `${fmt(Number(formatUnits(totalStaked, DECIMALS)))} $CSL` : "—"} />
          <StatCard icon={<Users size={16} />} label="Reward pool" value="USDG" />
          <StatCard icon={<TrendingUp size={16} />} label="Reward rate" value={dailyEmission !== null ? `${fmt(dailyEmission)} USDG/day` : "—"} />
          <StatCard icon={<Lock size={16} />} label="Your stake" value={enabled && staked !== undefined ? `${fmt(Number(formatUnits(staked, DECIMALS)))} $CSL` : "—"} />
        </div>
        {dailyEmission !== null && (
          <p className="text-[11px] text-[#0e1512]/35 mb-7 max-w-[640px]">
            {monthlyEmission !== null && <>~{fmt(monthlyEmission)} USDG over 30 days at the current rate. </>}
            {perTokenDaily !== null && <>That's {perTokenDaily.toFixed(6)} USDG/day per $CSL staked. </>}
            Rate resets whenever the pool is topped up — this isn't a fixed APR.
          </p>
        )}

        {/* stake/unstake card */}
        <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-6 mb-10">
          <div className="flex gap-1 mb-5 bg-black/5 p-1 rounded-lg w-fit">
            <button onClick={() => setTab("stake")} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${tab === "stake" ? "bg-[#CDF60A] text-[#0e1512]" : "text-[#0e1512]/50 hover:text-[#0e1512]"}`}>Stake</button>
            <button onClick={() => setTab("unstake")} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${tab === "unstake" ? "bg-[#CDF60A] text-[#0e1512]" : "text-[#0e1512]/50 hover:text-[#0e1512]"}`}>Unstake</button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] uppercase tracking-wider text-[#0e1512]/40">{tab === "stake" ? "Amount to stake" : "Amount to unstake"}</div>
                {enabled && maxAmt !== undefined && <div className="text-[11px] text-[#0e1512]/35">Available: {fmt(Number(formatUnits(maxAmt, DECIMALS)))}</div>}
              </div>
              <div className="flex items-center gap-2 bg-white border border-black/10 rounded-lg px-3 py-3 mb-2">
                <input value={amt} onChange={(e) => setAmt(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0.0" disabled={!enabled}
                  className="flex-1 bg-transparent outline-none font-mono text-lg disabled:cursor-not-allowed placeholder:text-black/20" />
                <span className="text-sm font-semibold text-[#0e1512]/40">$CSL</span>
              </div>
              <div className="flex gap-1.5 mb-5">
                {[25, 50, 75, 100].map((p) => (
                  <button key={p} disabled={!enabled || maxAmt === undefined}
                    onClick={() => maxAmt !== undefined && setAmt(formatUnits((maxAmt * BigInt(p)) / BigInt(100), DECIMALS))}
                    className="flex-1 py-1.5 rounded-md bg-black/5 hover:bg-black/10 text-xs font-semibold text-[#0e1512]/60 disabled:opacity-40 disabled:cursor-not-allowed">
                    {p === 100 ? "MAX" : `${p}%`}
                  </button>
                ))}
              </div>
              {!enabled ? (
                <button disabled className="w-full py-3 rounded-lg bg-black/10 text-[#0e1512]/40 font-semibold cursor-not-allowed">
                  {!live ? "Opens with $CSL" : "Connect wallet"}
                </button>
              ) : needsApproval ? (
                <button onClick={doApprove} disabled={busy || amountWei === BigInt(0)} className="w-full py-3 rounded-lg bg-[#CDF60A] hover:bg-[#d9fa3a] disabled:opacity-50 text-[#0e1512] font-semibold">
                  {busy ? "Approving…" : "Approve $CSL"}
                </button>
              ) : (
                <button onClick={tab === "stake" ? doStake : doUnstake} disabled={busy || amountWei === BigInt(0)} className="w-full py-3 rounded-lg bg-[#CDF60A] hover:bg-[#d9fa3a] disabled:opacity-50 text-[#0e1512] font-semibold">
                  {busy ? "Confirming…" : tab === "stake" ? "Stake" : "Unstake"}
                </button>
              )}
            </div>

            <div className="rounded-xl bg-white border border-black/5 p-4">
              <div className="text-[11px] uppercase tracking-wider text-[#0e1512]/40 mb-3">Your position</div>
              <Row k="Staked" v={enabled && staked !== undefined ? `${fmt(Number(formatUnits(staked, DECIMALS)))} $CSL` : "0 $CSL"} />
              <Row k="Pending rewards" v={enabled && earned !== undefined ? `${fmt(Number(formatUnits(earned, DECIMALS)))} USDG` : "0 USDG"} />
              <button
                onClick={doClaim}
                disabled={!enabled || busy || !earned || earned === BigInt(0)}
                className="w-full mt-3 py-2.5 rounded-lg bg-[#CDF60A]/15 hover:bg-[#CDF60A]/25 text-[#5f7a05] text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed border border-[#CDF60A]/30"
              >
                {busy ? "Confirming…" : "Claim rewards"}
              </button>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-3">How it works</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <Step n="01" t="Stake $CSL" d="Lock $CSL into the staking contract. Unstake any time — no lock-up period." />
          <Step n="02" t="Earn protocol revenue" d="A share of taker fees and liquidation proceeds routes to stakers, paid continuously in USDG." />
          <Step n="03" t="Unlock tiers" d="Higher stake unlocks lower taker fees and higher leverage caps on the terminal, scaled by tier." />
        </div>

        <div className="rounded-xl border border-[#CDF60A]/40 bg-[#CDF60A]/[0.06] p-4 text-sm text-[#0e1512]/60 leading-relaxed">
          {live
            ? "Rates and rewards are read live from the staking contract on Robinhood Chain — nothing here is projected."
            : <>Staking opens once $CSL is deployed. Follow <a href="https://x.com/csldotfun" className="text-[#5f7a05] hover:underline" target="_blank" rel="noopener noreferrer">@csldotfun</a> for the launch.</>}
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
    <div className="flex justify-between items-center py-1.5 text-sm border-b border-black/5 last:border-0">
      <span className="text-[#0e1512]/40">{k}</span>
      <span className="font-mono font-semibold">{v}</span>
    </div>
  )
}
