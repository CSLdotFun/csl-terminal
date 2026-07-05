"use client"

import { ArrowLeft } from "lucide-react"

const LINKS = [
  { key: "trade", label: "Trade", href: "/trade" },
  { key: "portfolio", label: "Portfolio", href: "/portfolio" },
  { key: "stats", label: "Stats", href: "/stats" },
  { key: "vault", label: "Vault", href: "/vault" },
  { key: "inventory", label: "Inventory", href: "/inventory" },
  { key: "leaderboard", label: "Leaderboard", href: "/leaderboard" },
]

export default function TNav({ active, title }: { active: string; title: string }) {
  return (
    <header className="border-b border-white/10 bg-[#070f1a]">
      <div className="h-16 flex items-center gap-3 px-4">
        <a href="/" className="text-white/50 hover:text-white transition-colors"><ArrowLeft size={18} /></a>
        <img src="/new-csl-logo.png" alt="CSL" className="w-16 h-16 object-contain" />
        <span className="font-bold tracking-wide">{title}</span>
        <nav className="hidden md:flex items-center gap-1 ml-auto">
          {LINKS.map((l) =>
            l.key === active ? (
              <span key={l.key} className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-white/10 text-white">{l.label}</span>
            ) : (
              <a key={l.key} href={l.href} className="text-sm font-medium px-3 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors">{l.label}</a>
            )
          )}
        </nav>
      </div>
    </header>
  )
}
