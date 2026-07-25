"use client"

import { ArrowLeft, User } from "lucide-react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount } from "wagmi"

const LINKS = [
  { key: "trade", label: "Trade", href: "/trade" },
  { key: "portfolio", label: "Portfolio", href: "/portfolio" },
  { key: "stats", label: "Stats", href: "/stats" },
  { key: "vault", label: "Vault", href: "/vault" },
  { key: "leaderboard", label: "Leaderboard", href: "/leaderboard" },
]

/* One header for every terminal page. Pass `light` to render the cream/ink
   variant (used by pages already migrated to the light theme). Default stays
   dark so un-migrated pages are untouched. */
export default function TNav({ active, title, light = false }: { active: string; title: string; light?: boolean }) {
  const { isConnected } = useAccount()

  const c = light
    ? {
        header: "border-b border-black/[0.08] bg-[#fbfaf7]",
        back: "text-[#0e1512]/40 hover:text-[#0e1512]",
        title: "text-[#0e1512]",
        activeTab: "bg-emerald-500/10 text-emerald-700",
        tab: "text-[#0e1512]/55 hover:text-[#0e1512] hover:bg-black/[0.04]",
        profile: "bg-black/[0.04] hover:bg-black/[0.07] border border-black/[0.08] text-[#0e1512]",
      }
    : {
        header: "border-b border-white/10 bg-[#070f1a]",
        back: "text-white/50 hover:text-white",
        title: "text-white",
        activeTab: "bg-white/10 text-white",
        tab: "text-white/50 hover:text-white hover:bg-white/5",
        profile: "bg-white/10 hover:bg-white/15 border border-white/10 text-white",
      }

  return (
    <header className={`shrink-0 ${c.header}`}>
      <div className="h-16 flex items-center gap-4 px-4">
        <div className="flex items-center gap-3 flex-1">
          <a href="/" className={`${c.back} transition-colors`}><ArrowLeft size={18} /></a>
          <img src="/new-csl-logo.png" alt="CSL" className="w-16 h-16 object-contain" />
          <span className={`font-bold tracking-wide ${c.title}`}>{title}</span>
        </div>

        <nav className="hidden lg:flex items-center justify-center gap-0.5">
          {LINKS.map((l) =>
            l.key === active ? (
              <span key={l.key} className={`text-sm font-semibold px-2.5 py-1.5 rounded-lg ${c.activeTab}`}>{l.label}</span>
            ) : (
              <a key={l.key} href={l.href} className={`text-sm font-medium px-2.5 py-1.5 rounded-lg transition-colors ${c.tab}`}>{l.label}</a>
            )
          )}
        </nav>

        <div className="flex items-center gap-6 text-sm flex-1 justify-end">
          {isConnected && (
            <a href="/myprofile" className={`flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-lg transition-colors ${c.profile}`}><User size={14} />My Profile</a>
          )}
          <ConnectButton showBalance={false} accountStatus="address" chainStatus="icon" />
        </div>
      </div>
    </header>
  )
}
