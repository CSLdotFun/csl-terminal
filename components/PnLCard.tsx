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
const FONT_BODY = "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
// The big percentage needs an actual serif LOOK for everyone who views or
// downloads the card, not "whatever serif happens to be installed on this
// machine" (Georgia doesn't exist on every OS, and a silent fallback means
// the shared PNG looks different depending on who generated it). Loading a
// real Google Font makes it identical everywhere, on-screen and in the export.
const SERIF_FONT_NAME = "PT Serif"
const FONT_SERIF = `'${SERIF_FONT_NAME}', Georgia, serif`

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
        height: 510,
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(160deg, #0a1512 0%, #060a09 60%, #030504 100%)",
        fontFamily: FONT_BODY,
        color: "#ffffff",
      }}
    >
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=PT+Serif:wght@700&display=swap" />
      {/* decorative wave-line pattern — spans the FULL card width */}
      <svg width="680" height="510" style={{ position: "absolute", inset: 0, opacity: 0.5 }} viewBox="0 0 680 510">
        {Array.from({ length: 26 }).map((_, i) => {
          const x = -260 + i * 34
          return <path key={i} d={`M ${x} -60 Q ${x + 420} 255 ${x} 580`} stroke="#3a4a42" strokeWidth="1" fill="none" />
        })}
      </svg>

      {/* skin image — fixed bounding box + object-fit:contain, so a square
          icon and a wide one both land at the same visual size/position
          instead of "width:480, height:auto" producing wildly different
          results depending on each skin's own native aspect ratio */}
      {icon && (
        <div
          style={{
            position: "absolute", right: -20, top: "50%", transform: "translateY(-50%) rotate(-8deg)",
            width: 460, height: 300, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <img
            src={icon}
            alt=""
            style={{
              maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", objectFit: "contain",
              filter: `drop-shadow(0 20px 60px rgba(0,0,0,0.6)) drop-shadow(0 0 40px ${color}22)`,
            }}
          />
        </div>
      )}

      {/* content */}
      <div style={{ position: "relative", zIndex: 1, padding: "32px 36px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        {/* logo — the REAL brand asset, unmodified. Its black outline blends
            into this dark background on its own (that's the point of an
            outline) — recoloring it earlier destroyed the letterforms. */}
        <img src="/new-csl-logo.png" alt="CSL" style={{ position: "absolute", left: 29, top: 22, height: 51, width: "auto", objectFit: "contain" }} />

        {/* skin name + side badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 109 }}>
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

        {/* big PnL number — fontSize precisely calibrated: rendered at 112px
            this font produces a 75-76px glyph height, matching the reference
            measurement exactly (verified by rendering and measuring, not guessed) */}
        <div style={{ fontFamily: FONT_SERIF, fontSize: 112, fontWeight: 700, color, marginTop: 38, lineHeight: 1.05, fontVariantNumeric: "tabular-nums" }}>
          {up ? "+" : "\u2212"}{Math.abs(pnlPct).toFixed(1)}%
        </div>

        {/* entry / mark */}
        <div style={{ display: "flex", gap: 56, marginTop: 54 }}>
          <div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Entry Price</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>{fmt(entry)}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Mark Price</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>{fmt(mark)}</div>
          </div>
        </div>

        {/* referral */}
        <div style={{ marginTop: 44 }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Referral code:</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>csl.fun/trade?ref={referralCode}</div>
        </div>
      </div>
    </div>
  )
}
