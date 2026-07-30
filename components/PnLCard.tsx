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
// The rest of the site loads Geist Sans via next/font (see app/layout.tsx),
// exposed as --font-geist-sans. The card previously asked for "Inter", which
// was never actually loaded anywhere in this project — the browser silently
// fell back to whatever generic system font was installed, which is why the
// text never looked right and varied machine to machine.
const FONT = "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"

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
        fontFamily: FONT,
        color: "#ffffff",
      }}
    >
      {/* decorative wave-line pattern, radiating from the top-right */}
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

      {/* skin image */}
      {icon && (
        <img
          src={icon}
          alt=""
          style={{
            position: "absolute",
            right: -40,
            top: "50%",
            transform: "translateY(-50%) rotate(-8deg)",
            width: 480,
            height: "auto",
            objectFit: "contain",
            filter: `drop-shadow(0 20px 60px rgba(0,0,0,0.6)) drop-shadow(0 0 40px ${color}22)`,
          }}
        />
      )}

      {/* content */}
      <div style={{ position: "relative", zIndex: 1, padding: "32px 36px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        {/* logo — crisp bold text with a hard dark stroke (the recolored PNG asset
            lost its outline when black->white, turning it into an unreadable
            blob). A repeated small-offset text-shadow fakes an outline reliably
            across browsers and inside html-to-image's export. */}
        <div style={{ position: "absolute", left: 29, top: 22, display: "flex", alignItems: "center", gap: 3, fontSize: 34, fontWeight: 900, letterSpacing: "-0.02em" }}>
          <span style={{ color: "#ffffff", textShadow: "-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000" }}>CS</span>
          <span style={{ color: "#35F26B", textShadow: "-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000" }}>&#8593;</span>
        </div>

        {/* skin name + side badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 96 }}>
          <span style={{ fontSize: 20, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>{name}</span>
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

        {/* big PnL number — bolder weight, bigger, matches the reference's heavy numerals */}
        <div style={{ fontSize: 76, fontWeight: 800, color, marginTop: 6, lineHeight: 1.05, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>
          {up ? "+" : ""}{pnlPct.toFixed(1)}%
        </div>

        {/* entry / mark */}
        <div style={{ display: "flex", gap: 56, marginTop: 28 }}>
          <div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Entry Price</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>{fmt(entry)}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Mark Price</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>{fmt(mark)}</div>
          </div>
        </div>

        {/* referral, pinned to the bottom */}
        <div style={{ marginTop: "auto" }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Referral code:</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>csl.fun/trade?ref={referralCode}</div>
        </div>
      </div>
    </div>
  )
}
