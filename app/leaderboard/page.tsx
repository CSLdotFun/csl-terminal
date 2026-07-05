"use client"

import { Trophy } from "lucide-react"
import TNav from "@/components/TNav"

export default function Leaderboard() {
  return (
    <div className="min-h-screen bg-[#050b14] text-white">
      <TNav active="leaderboard" title="Leaderboard" />

      <main className="max-w-[900px] mx-auto px-5 py-14">
        <h1 className="text-3xl font-bold tracking-[-0.02em] mb-2">Top traders</h1>
        <p className="text-white/50 mb-10">Ranked by realized PnL. Resets every season.</p>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 text-[11px] uppercase border-b border-white/10">
                <th className="text-left font-medium px-5 py-3 w-16">#</th>
                <th className="text-left font-medium px-2">Trader</th>
                <th className="text-right font-medium px-2">Volume</th>
                <th className="text-right font-medium px-2">Trades</th>
                <th className="text-right font-medium px-5">Realized PnL</th>
              </tr>
            </thead>
          </table>
          <div className="px-6 py-16 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-blue-500/10 border border-blue-500/25 flex items-center justify-center">
              <Trophy size={24} className="text-blue-400" />
            </div>
            <div className="font-semibold mb-1.5">Season 1 hasn&apos;t started yet</div>
            <p className="text-white/45 text-sm max-w-[420px] mx-auto leading-relaxed">
              The leaderboard goes live together with USDC deposits at public launch.
              Every trade will count from day one — no pre-filled names, no bots.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
