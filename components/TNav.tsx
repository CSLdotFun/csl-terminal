"use client"

import { useState } from "react"
import { ArrowLeft, User, Menu, X } from "lucide-react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount } from "wagmi"
import { useRouter } from "next/navigation"

const LINKS = [
  { key: "trade", label: "Trade", href: "/trade" },
  { key: "portfolio", label: "Portfolio", href: "/portfolio" },
  { key: "stats", label: "Stats", href: "/stats" },
  { key: "vault", label: "Vault", href: "/vault" },
  { key: "staking", label: "Staking", href: "/staking" },
  { key: "leaderboard", label: "Leaderboard", href: "/leaderboard" },
]

/* One header for every terminal page. Pass `light` to render the cream/ink
   variant (used by pages already migrated to the light theme). Default stays
   dark so un-migrated pages are untouched. */
export default function TNav({ active, title, light = false }: { active: string; title: string; light?: boolean }) {
  const { isConnected } = useAccount()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const c = light
    ? {
        header: "border-b border-black/[0.08] bg-[#fbfaf7]",
        back: "text-[#0e1512]/40 hover:text-[#0e1512]",
        title: "text-[#0e1512]",
        activeTab: "bg-[#CDF60A]/10 text-[#5f7a05]",
        tab: "text-[#0e1512]/55 hover:text-[#0e1512] hover:bg-black/[0.04]",
        profile: "bg-black/[0.04] hover:bg-black/[0.07] border border-black/[0.08] text-[#0e1512]",
        menuBg: "bg-[#fbfaf7] border-black/[0.08]",
      }
    : {
        header: "border-b border-white/10 bg-[#070f1a]",
        back: "text-white/50 hover:text-white",
        title: "text-white",
        activeTab: "bg-white/10 text-white",
        tab: "text-white/50 hover:text-white hover:bg-white/5",
        profile: "bg-white/10 hover:bg-white/15 border border-white/10 text-white",
        menuBg: "bg-[#070f1a] border-white/10",
      }

  return (
    <header className={`shrink-0 relative ${c.header}`}>
      <div className="h-16 flex items-center gap-2 sm:gap-4 px-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <button onClick={() => router.back()} className={`${c.back} transition-colors shrink-0`} aria-label="Go back"><ArrowLeft size={18} /></button>
          <a href="https://csl.fun" className="shrink-0"><img src="/new-csl-logo.png" alt="CSL" className="w-12 h-12 sm:w-16 sm:h-16 object-contain" /></a>
          <span className={`font-bold tracking-wide truncate ${c.title}`}>{title}</span>
        </div>

        <nav className="hidden lg:flex items-center justify-center gap-0.5">
          {LINKS.map((l) =>
            l.key === active ? (
              <span key={l.key} className={`text-sm font-semibold px-2.5 py-1.5 rounded-lg ${c.activeTab}`}>{l.label}</span>
            ) : (
              <a key={l.key} href={l.href} className={`text-sm font-medium px-2.5 py-1.5 rounded-lg transition-colors ${c.tab}`}>{l.label}</a>
            )
          )}
          <a
            href="https://docs.csl.fun"
            target="_blank"
            rel="noopener noreferrer"
            className={`text-sm font-medium px-2.5 py-1.5 rounded-lg transition-colors ${c.tab}`}
          >
            Documentation
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-6 text-sm flex-1 justify-end min-w-0">
          {isConnected && (
            <a href="/myprofile" className={`hidden sm:flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-lg transition-colors ${c.profile}`}><User size={14} />My Profile</a>
          )}
          <div className="shrink-0"><ConnectButton showBalance={false} accountStatus="address" chainStatus="icon" /></div>
          <button onClick={() => setMenuOpen((v) => !v)} className={`lg:hidden shrink-0 p-1.5 rounded-lg transition-colors ${c.back}`} aria-label="Menu">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* mobile menu drawer — every nav link, since the row above is hidden below lg */}
      {menuOpen && (
        <div className={`lg:hidden absolute top-16 left-0 right-0 z-50 border-b shadow-lg ${c.menuBg}`}>
          <nav className="flex flex-col p-2">
            {LINKS.map((l) =>
              l.key === active ? (
                <span key={l.key} className={`text-sm font-semibold px-3 py-2.5 rounded-lg ${c.activeTab}`}>{l.label}</span>
              ) : (
                <a key={l.key} href={l.href} onClick={() => setMenuOpen(false)} className={`text-sm font-medium px-3 py-2.5 rounded-lg transition-colors ${c.tab}`}>{l.label}</a>
              )
            )}
            <a href="https://docs.csl.fun" target="_blank" rel="noopener noreferrer" className={`text-sm font-medium px-3 py-2.5 rounded-lg transition-colors ${c.tab}`}>Documentation</a>
            {isConnected && (
              <a href="/myprofile" onClick={() => setMenuOpen(false)} className={`sm:hidden flex items-center gap-1.5 text-sm font-semibold px-3 py-2.5 rounded-lg transition-colors ${c.tab}`}><User size={14} />My Profile</a>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
