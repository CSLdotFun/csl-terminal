"use client"

import { useState } from "react"
import { useAccount, useWriteContract, useReadContract, usePublicClient } from "wagmi"
import { parseUnits, formatUnits } from "viem"
import { ERC20_ABI, USDG_ADDRESS, USDG_DECIMALS } from "@/lib/chain"

/* One-click funding on Robinhood Chain: the user enters an amount, their wallet
   (MetaMask / WalletConnect) signs a USDG transfer straight to THEIR deposit
   address, and the backend scanner credits the balance. No copy-paste, no
   wrong-network risk beyond the chain guard. */
export default function WalletDeposit({ address, onDone }: { address: string; onDone?: () => void }) {
  const { address: from, isConnected, chainId } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()
  const [amount, setAmount] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | "info"; text: string; hash?: string } | null>(null)

  const { data: rawBal } = useReadContract({
    address: USDG_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: from ? [from] : undefined,
    query: { enabled: !!from },
  })
  const held = rawBal ? Number(formatUnits(rawBal as bigint, USDG_DECIMALS)) : 0

  const pay = async () => {
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) return setMsg({ kind: "err", text: "Enter an amount" })
    if (!isConnected || !from) return setMsg({ kind: "err", text: "Connect a wallet first." })
    if (chainId !== 4663) return setMsg({ kind: "err", text: "Switch your wallet to Robinhood Chain." })
    if (held < amt) return setMsg({ kind: "err", text: `Wallet holds ${held.toFixed(2)} USDG — not enough for ${amt.toFixed(2)}.` })

    setBusy(true)
    setMsg({ kind: "info", text: "Approve the transfer in your wallet…" })
    try {
      const hash = await writeContractAsync({
        address: USDG_ADDRESS,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [address as `0x${string}`, parseUnits(String(amt), USDG_DECIMALS)],
      })
      setMsg({ kind: "info", text: "Sent — waiting for confirmation…", hash })
      await publicClient?.waitForTransactionReceipt({ hash })
      setMsg({ kind: "ok", text: `${amt.toFixed(2)} USDG on the way. Your balance updates within a minute.`, hash })
      setAmount("")
      onDone?.()
    } catch (e: any) {
      const m = String(e?.shortMessage || e?.message || e)
      setMsg({ kind: "err", text: /reject|denied|cancel/i.test(m) ? "Cancelled in wallet." : m.slice(0, 140) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            placeholder="Amount"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-3 pr-14 py-2.5 text-sm font-mono outline-none focus:border-emerald-400/40"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/35">USDG</span>
        </div>
        <button
          onClick={pay}
          disabled={busy}
          className="shrink-0 text-sm font-semibold px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black transition-colors"
        >
          {busy ? "Confirming…" : "Deposit USDG"}
        </button>
      </div>

      <div className="flex gap-1.5 mt-2">
        {[25, 50, 100, 250].map((v) => (
          <button key={v} onClick={() => setAmount(String(v))}
            className="text-xs px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white/60">${v}</button>
        ))}
      </div>

      {msg && (
        <div className={`text-xs mt-2.5 ${msg.kind === "ok" ? "text-emerald-400" : msg.kind === "err" ? "text-red-400" : "text-white/50"}`}>
          {msg.text}
          {msg.hash && (
            <> <a href={`https://robinhoodchain.blockscout.com/tx/${msg.hash}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">view tx</a></>
          )}
        </div>
      )}
    </div>
  )
}
