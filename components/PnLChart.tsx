"use client"

import { useMemo, useState } from "react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"

export type PnlPoint = { t: number; pnl: number } // t = ms epoch, pnl = cumulative realized PnL up to and including this point

type Range = "7D" | "30D" | "ALL"

function fmt(n: number) {
  const s = Math.abs(n) >= 1000 ? n.toFixed(0) : n.toFixed(2)
  return (n >= 0 ? "+" : "") + "$" + Number(s).toLocaleString()
}

export default function PnLChart({ points, unrealized = 0 }: { points: PnlPoint[]; unrealized?: number }) {
  const [range, setRange] = useState<Range>("ALL")

  const filtered = useMemo(() => {
    if (!points.length) return []
    const now = Date.now()
    const cutoff = range === "7D" ? now - 7 * 86400000 : range === "30D" ? now - 30 * 86400000 : 0
    // carry the last cumulative value from before the cutoff as the starting
    // baseline, so the chart shows the PnL DELTA within the window, not the
    // whole all-time total collapsed into the first visible point
    const before = points.filter((p) => p.t < cutoff)
    const baseline = before.length ? before[before.length - 1].pnl : 0
    const inWindow = points.filter((p) => p.t >= cutoff)
    const rebased = inWindow.map((p) => ({ t: p.t, pnl: p.pnl - baseline }))
    return rebased.length ? rebased : [{ t: cutoff || now, pnl: 0 }]
  }, [points, range])

  const withLive = useMemo(() => {
    if (!filtered.length) {
      // no closed trades yet: a flat $0 line so the chart isn't empty —
      // it'll start moving on its own the moment a real trade closes
      const spanMs = range === "7D" ? 7 * 86400000 : range === "30D" ? 30 * 86400000 : 14 * 86400000
      const now = Date.now()
      return [{ t: now - spanMs, pnl: unrealized }, { t: now, pnl: unrealized }]
    }
    const last = filtered[filtered.length - 1]
    return [...filtered, { t: Date.now(), pnl: last.pnl + unrealized }]
  }, [filtered, unrealized, range])

  const current = withLive.length ? withLive[withLive.length - 1].pnl : 0
  const positive = current >= 0
  const color = positive ? "#5f7a05" : "#dc2626"
  const gradId = positive ? "pnlUp" : "pnlDown"

  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[#0e1512]/35">PnL · {range === "ALL" ? "All Time" : range}</div>
          <div className={`text-3xl font-bold font-mono mt-1 ${positive ? "text-[#5f7a05]" : "text-red-600"}`}>{fmt(current)}</div>
        </div>
        <div className="flex gap-1">
          {(["7D", "30D", "ALL"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded transition-colors ${
                range === r ? "bg-black/10 text-[#0e1512]" : "text-[#0e1512]/40 hover:text-[#0e1512]/70"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[260px] w-full -mx-1">
        {withLive.length < 2 ? (
          <div className="h-full flex items-center justify-center text-sm text-[#0e1512]/30">
            No closed trades in this window yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={withLive} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="t"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(t) => new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                tick={{ fontSize: 11, fill: "rgba(14,21,18,0.35)" }}
                axisLine={{ stroke: "rgba(0,0,0,0.10)" }}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                tickFormatter={(v) => (v >= 0 ? "+" : "") + "$" + Math.round(v).toLocaleString()}
                tick={{ fontSize: 11, fill: "rgba(14,21,18,0.35)" }}
                axisLine={false}
                tickLine={false}
                width={64}
              />
              <ReferenceLine y={0} stroke="rgba(0,0,0,0.15)" />
              <Tooltip
                formatter={(v: number) => [fmt(v), "PnL"]}
                labelFormatter={(t) => new Date(t).toLocaleString()}
                contentStyle={{ background: "#fff", border: "1px solid rgba(0,0,0,0.10)", borderRadius: 8, fontSize: 12 }}
              />
              <Area type="monotone" dataKey="pnl" stroke={color} strokeWidth={2} fill={`url(#${gradId})`} dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
