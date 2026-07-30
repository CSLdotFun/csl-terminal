"use client"

import { useRef, useState } from "react"
import { toPng } from "html-to-image"
import PnLCard, { PnLCardData } from "./PnLCard"

export default function PnLCardModal({ data, onClose }: { data: PnLCardData; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)

  const download = async () => {
    if (!ref.current) return
    setBusy(true)
    try {
      try { await document.fonts.ready } catch {}
      const url = await toPng(ref.current, { pixelRatio: 2 })
      const a = document.createElement("a")
      a.href = url
      a.download = `csl-${data.key}-${data.side}.png`
      a.click()
    } catch {
      // ignore — user can screenshot manually if export ever fails
    }
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
        <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
          <PnLCard data={data} cardRef={ref} />
        </div>
        <div className="flex gap-2 w-full max-w-[680px]">
          <button onClick={onClose} className="flex-1 h-11 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-semibold">Close</button>
          <button
            onClick={download}
            disabled={busy}
            className="flex-1 h-11 rounded-lg bg-[#CDF60A] hover:bg-[#d9fa3a] disabled:opacity-60 text-[#0e1512] text-sm font-semibold"
          >{busy ? "Saving…" : "Download PNG"}</button>
        </div>
      </div>
    </div>
  )
}
