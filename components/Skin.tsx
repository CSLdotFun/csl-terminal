"use client"

import { useState, useEffect } from "react"
import { ICONS } from "@/app/trade/icons"

// Real skin icon, same resolution order everywhere in the app: live Steam CDN
// icon (from the backend, if it sent one) > our own curated ICONS map (Steam
// CDN too) > whatever local placeholder image is bundled for that market. Any
// load error falls back a step, so a Steam hiccup can never leave an empty box.
export default function Skin({ mk, img, icon, className = "w-11 h-8" }: { mk: string; img: string; icon?: string | null; className?: string }) {
  const [src, setSrc] = useState(icon || ICONS[mk] || `/${img}`)
  useEffect(() => { setSrc(icon || ICONS[mk] || `/${img}`) }, [mk, img, icon])
  return (
    <div className={`${className} rounded bg-black/5 flex items-center justify-center shrink-0 overflow-hidden`}>
      <img src={src} alt="" className="max-w-full max-h-full object-contain" onError={() => { if (src !== `/${img}`) setSrc(`/${img}`) }} />
    </div>
  )
}
