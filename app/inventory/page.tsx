"use client"

import { useState } from "react"
import TNav from "@/components/TNav"
import { Search } from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || ""

type Item = { name: string; icon: string | null; type: string; cslKey: string | null }

// accepts SteamID64 or a profile URL like steamcommunity.com/profiles/7656119...
function extractSteamId(input: string): string | null {
  const s = input.trim()
  const m = s.match(/(\d{17})/)
  return m ? m[1] : null
}

export default function Inventory() {
  const [input, setInput] = useState("")
  const [items, setItems] = useState<Item[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const id = extractSteamId(input)
    if (!id) { setError("Enter a SteamID64 or a steamcommunity.com/profiles/… link (17-digit ID)."); return }
    if (!API) { setError("Price engine is offline."); return }
    setLoading(true); setError(null); setItems(null)
    try {
      const res = await fetch(`${API}/api/inventory/${id}`, { cache: "no-store" })
      const d = await res.json()
      if (d.error === "private") setError("This inventory is private. Set it to public in Steam privacy settings and retry.")
      else if (d.error === "rate_limited") setError("Steam is rate-limiting requests right now — try again in a minute.")
      else if (d.error) setError("Couldn't load this inventory. Check the ID and try again.")
      else setItems(d.items || [])
    } catch { setError("Couldn't reach the price engine.") }
    setLoading(false)
  }

  const hedgeable = items?.filter((i) => i.cslKey) ?? []

  return (
    <div className="min-h-screen bg-[#050b14] text-white">
      <TNav active="inventory" title="Inventory" />
      <main className="max-w-[1100px] mx-auto px-5 py-10">
        <h1 className="text-3xl font-bold tracking-[-0.02em] mb-2">Your Steam inventory</h1>
        <p className="text-white/50 mb-8 max-w-[640px] leading-relaxed">
          Load a public CS2 inventory and see which of your skins trade on CSL —
          hedge the value of what you hold by shorting the same market.
        </p>

        <div className="flex gap-2 max-w-[560px] mb-2">
          <div className="flex-1 flex items-center rounded-xl bg-white/5 border border-white/15 px-3 focus-within:border-blue-500/50">
            <Search size={15} className="text-white/30 mr-2 shrink-0" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") load() }}
              placeholder="SteamID64 or steamcommunity.com/profiles/… link"
              className="flex-1 bg-transparent py-3 outline-none text-sm min-w-0"
            />
          </div>
          <button onClick={load} disabled={loading} className="px-6 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-black font-bold text-sm transition-colors">
            {loading ? "Loading…" : "Load"}
          </button>
        </div>
        <p className="text-xs text-white/30 mb-8">Read-only: we never ask for your Steam login. Only public inventories can be read.</p>

        {error && <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4 text-sm text-white/60 mb-8 max-w-[640px]">{error}</div>}

        {items && (
          <>
            {hedgeable.length > 0 && (
              <>
                <h2 className="text-lg font-semibold mb-3">Tradable on CSL ({hedgeable.length})</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
                  {hedgeable.map((i, idx) => (
                    <div key={idx} className="rounded-xl border border-blue-500/25 bg-blue-500/[0.05] p-3 flex flex-col">
                      {i.icon && <img src={i.icon} alt="" className="h-20 object-contain mx-auto mb-2" />}
                      <div className="text-xs font-medium leading-snug mb-2">{i.name}</div>
                      <a href="/trade" className="mt-auto text-center text-xs font-bold py-1.5 rounded-lg bg-red-500/90 hover:bg-red-400 text-black transition-colors">Hedge · Short</a>
                    </div>
                  ))}
                </div>
              </>
            )}
            <h2 className="text-lg font-semibold mb-3">All items ({items.length})</h2>
            {items.length === 0 ? (
              <div className="text-white/30 text-sm">Inventory is empty (or has no marketable CS2 items).</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {items.slice(0, 100).map((i, idx) => (
                  <div key={idx} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    {i.icon && <img src={i.icon} alt="" className="h-16 object-contain mx-auto mb-2" />}
                    <div className="text-[11px] leading-snug text-white/70">{i.name}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
