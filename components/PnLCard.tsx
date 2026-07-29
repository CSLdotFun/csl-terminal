"use client"

import { ICONS } from "@/app/trade/icons"

export interface PnLCardData {
  key: string          // market key, resolves the real Steam icon via ICONS
  name: string          // "M4A4 | Howl"
  side: "long" | "short"
  leverage: number
  entry: number
  mark: number
  referralCode?: string  // defaults to 'csl'
}

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function PnLCard({ data, cardRef }: { data: PnLCardData; cardRef?: React.Ref<HTMLDivElement> }) {
  const { key, name, side, leverage, entry, mark, referralCode = "csl" } = data
  const dir = side === "short" ? -1 : 1
  const pnlPct = ((mark - entry) / entry) * dir * 100
  const up = pnlPct >= 0
  const color = up ? "#35F26B" : "#FF5C5C"
  const icon = ICONS[key]

  return (
    <div
      ref={cardRef}
      style={{
        width: 680,
        height: 540,
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(160deg, #0a1512 0%, #060a09 60%, #030504 100%)",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#ffffff",
      }}
    >
      {/* decorative wave-line pattern, radiating from the top-right — more visible, matching reference */}
      <svg width="680" height="540" style={{ position: "absolute", inset: 0, opacity: 0.55 }} viewBox="0 0 680 540">
        {Array.from({ length: 16 }).map((_, i) => (
          <path
            key={i}
            d={`M ${300 + i * 30} -60 Q ${700 + i * 12} ${170 + i * 10} ${300 + i * 30} 600`}
            stroke="#3a4a42"
            strokeWidth="1"
            fill="none"
          />
        ))}
      </svg>

      {/* skin image — large, steep diagonal tilt, bleeding off the top-right edge (matches reference) */}
      {icon && (
        <img
          src={icon}
          alt=""
          style={{
            position: "absolute",
            right: -70,
            top: "38%",
            transform: "translateY(-50%) rotate(-15deg)",
            width: 600,
            height: "auto",
            objectFit: "contain",
            filter: `drop-shadow(0 24px 70px rgba(0,0,0,0.65)) drop-shadow(0 0 50px ${color}22)`,
          }}
        />
      )}

      {/* content */}
      <div style={{ position: "relative", zIndex: 1, padding: "32px 36px", height: "100%", display: "flex", flexDirection: "column" }}>
        {/* logo — real brand mark (recolored white+green for this dark card), not a text substitute */}
        <img src="/csl-logo-white.png" alt="CSL" style={{ height: 34, width: "auto", objectFit: "contain" }} />

        {/* skin name + side badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 40 }}>
          <span style={{ fontSize: 20, color: "rgba(255,255,255,0.85)" }}>{name}</span>
          <span
            style={{
              fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", padding: "4px 10px", borderRadius: 6,
              background: side === "short" ? "rgba(255,92,92,0.15)" : "rgba(53,242,107,0.15)",
              color: side === "short" ? "#FF5C5C" : "#35F26B",
              border: `1px solid ${side === "short" ? "rgba(255,92,92,0.35)" : "rgba(53,242,107,0.35)"}`,
            }}
          >
            {side.toUpperCase()} {leverage}X
          </span>
        </div>

        {/* big PnL number */}
        <div style={{ fontSize: 68, fontWeight: 700, color, marginTop: 8, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
          {up ? "+" : ""}{pnlPct.toFixed(1)}%
        </div>

        {/* entry / mark */}
        <div style={{ display: "flex", gap: 56, marginTop: 28 }}>
          <div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Entry Price</div>
            <div style={{ fontSize: 18, marginTop: 2 }}>{fmt(entry)}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Mark Price</div>
            <div style={{ fontSize: 18, marginTop: 2 }}>{fmt(mark)}</div>
          </div>
        </div>

        {/* referral, pinned to the bottom */}
        <div style={{ marginTop: "auto" }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Referral code:</div>
          <div style={{ fontSize: 16, marginTop: 2 }}>csl.fun/trade?ref={referralCode}</div>
        </div>
      </div>
    </div>
  )
}
