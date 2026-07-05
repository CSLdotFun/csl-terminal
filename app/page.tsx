"use client"

import { Button } from "@/components/ui/button"
import { FileText, ArrowRight } from "lucide-react"

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.68.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  )
}

function C4Icon({ className = "" }: { className?: string }) {
  return (
    <svg className={`size-8 ${className}`} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="6" width="16" height="13" rx="2" />
      <rect x="7.5" y="9" width="9" height="4" rx="1" />
      <path d="M8.5 16.5h1.6M12.2 16.5h1.6M15.9 16.5h1.1" />
      <path d="M8 6V4.4M12 6V3.6M16 6V4.4" />
    </svg>
  )
}

function SmokeIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`size-8 ${className}`} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="8.5" width="8" height="12" rx="2.2" />
      <path d="M9.5 8.5V7a1.6 1.6 0 0 1 1.6-1.6h1.8A1.6 1.6 0 0 1 14.5 7v1.5" />
      <circle cx="17.6" cy="5.6" r="1.7" />
      <path d="M15.9 5.9 14.5 6.6" />
      <path d="M9 3.2c.9-.7 2-.4 2.4.3M12.7 2.4c1.1-.5 2.2.1 2.3 1" />
    </svg>
  )
}

export default function HomePage() {
  const skinImages = [
    "/karambit-fade-pink.png",
    "/awp-dragon-lore-flame.png",
    "/butterfly-knife-blue.png",
    "/awp-blue-gold.png",
    "/karambit-red-white.png",
    "/bayonet-green.png",
    "/agent-business-suit.png",
    "/agent-sunglasses-floral.png",
    "/m4a4-white.png",
    "/awp-light-colored.png",
    "/butterfly-knife-red.png",
    "/ak47-leopard-print.png",
    "/butterfly-knife-blue-dark.png",
    "/sport-gloves-purple.png",
    "/agent-fbi-tactical.png",
    "/m4a4-flame-red.png",
    "/bayonet-blue-geometric.png",
  ]

  return (
    <div className="min-h-screen bg-[#050b14] text-white overflow-x-hidden">
      {/* Full-screen Hero */}
      <section className="relative h-screen min-h-[620px] w-full overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-[#050b14]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_42%,rgba(37,99,235,0.20),transparent_65%)]" />
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 75%)",
          }}
        />

        {/* Weapons image filling the screen */}
        <img
          src="/cs2-weapons-collection.png"
          alt="CS2 Skins"
          className="pointer-events-none select-none absolute left-1/2 top-[5.5rem] w-[min(1320px,96vw)] max-w-none -translate-x-1/2 drop-shadow-[0_30px_80px_rgba(37,99,235,0.4)]"
          style={{
            maskImage: "radial-gradient(ellipse 62% 64% at 50% 46%, black 52%, transparent 76%)",
            WebkitMaskImage: "radial-gradient(ellipse 62% 64% at 50% 46%, black 52%, transparent 76%)",
          }}
        />

        {/* Scrims for legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050b14]/80 via-transparent to-[#050b14]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050b14] to-transparent" />

        {/* Foreground content */}
        <div className="relative z-10 flex h-full flex-col">
          {/* Nav */}
          <nav className="flex items-center justify-between max-w-[1200px] w-full mx-auto px-5 py-5">
            <img src="/new-csl-logo.png" alt="CSL Logo" className="w-[92px] h-[86px]" />
            <div className="hidden md:flex items-center gap-6">
              <a
                href="https://docs.csl.fun/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/90 hover:text-blue-400 transition-colors"
              >
                <FileText size={16} />
                <span className="font-medium">Docs</span>
              </a>
              <a
                href="https://x.com/csldotfun"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/90 hover:text-blue-400 transition-colors"
              >
                <XIcon />
                <span className="font-medium">X</span>
              </a>
              <a
                href="https://github.com/CSLdotFun"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/90 hover:text-blue-400 transition-colors"
              >
                <GitHubIcon />
                <span className="font-medium">GitHub</span>
              </a>
            </div>
          </nav>

          {/* Centered text */}
          <div className="relative flex-1 flex flex-col items-center justify-center text-center px-5 -mt-6">
            <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-[520px] bg-[radial-gradient(ellipse_64%_100%_at_50%_50%,rgba(2,6,12,0.97),rgba(2,6,12,0.75)_55%,rgba(2,6,12,0.3)_75%,transparent_88%)]" />
            <div className="relative w-full flex flex-col items-center text-center">
            <div className="flex items-center justify-center gap-4 mb-7">
              <span className="h-px w-10 bg-white/25" />
              <p className="text-[12px] text-white/80 tracking-[0.32em] uppercase font-medium">Introducing CSL</p>
              <span className="h-px w-10 bg-white/25" />
            </div>

            <h1 className="mx-auto text-[42px] sm:text-6xl lg:text-[72px] font-bold leading-[1.06] tracking-[-0.035em] max-w-[1080px] text-white [text-shadow:0_2px_30px_rgba(0,0,0,0.9),0_1px_6px_rgba(0,0,0,0.8)]">
              <span className="whitespace-nowrap max-lg:whitespace-normal">The first perpetual exchange</span>
              <br />
              <span className="whitespace-nowrap max-sm:whitespace-normal">for CS:2 skins. <span className="text-blue-400">On Solana.</span></span>
            </h1>

            <p className="mx-auto mt-7 text-white/90 max-w-[620px] text-lg sm:text-xl leading-relaxed text-center [text-shadow:0_1px_14px_rgba(0,0,0,0.9)]">
              Long Dragon Lore. Short Howl. Up to 20x leverage on the most iconic items
              in Counter-Strike — no inventory, no trade locks. Settled in USDC.
            </p>
            </div>
          </div>

          {/* Bottom buttons */}
          <div className="relative z-10 flex items-center justify-center gap-4 pb-24 px-5">
            <a href="/trade">
              <Button className="group h-16 px-10 text-lg bg-white text-black hover:bg-white/90 font-bold rounded-2xl shadow-[0_10px_40px_rgba(255,255,255,0.18)] transition-transform hover:-translate-y-0.5">
                <C4Icon className="mr-2.5" />
                Start
                <ArrowRight className="size-5 ml-2 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </a>
            <a href="https://docs.csl.fun/" target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                className="h-16 px-10 text-lg border-white/20 bg-white/[0.06] hover:bg-white/[0.12] hover:border-white/35 text-white font-bold rounded-2xl backdrop-blur-md transition-transform hover:-translate-y-0.5"
              >
                <SmokeIcon className="mr-2.5" />
                Docs
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Skin carousel strip */}
      <section className="w-full px-3 -mt-2">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 overflow-hidden">
          <div className="flex animate-scroll gap-5">
            {[...skinImages, ...skinImages].map((src, index) => (
              <img
                key={index}
                src={src || "/placeholder.svg"}
                alt={`CS2 Skin ${index + 1}`}
                className="w-[144px] h-[108px] rounded-lg flex-shrink-0 object-cover"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Skin perps explainer */}
      <section className="max-w-[1200px] mx-auto px-5 pt-16 pb-4">
        <div className="text-center max-w-[720px] mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.02em]">Perpetual futures on CS:2 skins</h2>
          <p className="mt-4 text-white/60 leading-relaxed">
            Every CSL market is a perp that tracks the real market price of one skin.
            You never buy the item — you trade its price, both directions, with leverage.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-blue-400 font-mono text-sm mb-2">01</div>
            <h3 className="font-semibold text-lg mb-2">Pick a skin, pick a side</h3>
            <p className="text-white/55 text-sm leading-relaxed">17 curated markets — Dragon Lore, Howl, Karambit Fade and more. Go long if you think the price rises, short if it falls.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-blue-400 font-mono text-sm mb-2">02</div>
            <h3 className="font-semibold text-lg mb-2">Add leverage</h3>
            <p className="text-white/55 text-sm leading-relaxed">Size positions from 1x to 20x with isolated margin. Entry, fees and exact liquidation price are shown before you open.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-blue-400 font-mono text-sm mb-2">03</div>
            <h3 className="font-semibold text-lg mb-2">Settle in USDC</h3>
            <p className="text-white/55 text-sm leading-relaxed">PnL is settled in USDC on Solana. No Steam inventory, no trade locks, no waiting for a buyer — pure price exposure.</p>
          </div>
        </div>
      </section>

      {/* Token — Soon */}
      <section className="max-w-[1100px] mx-auto px-5 py-16">
        <div className="flex flex-col items-center text-center gap-3">
          <span className="text-[11px] font-semibold tracking-[0.28em] uppercase text-blue-400/90 border border-blue-400/30 rounded-full px-4 py-1.5">Token launch — Soon</span>
          <p className="text-white/50 max-w-[440px] text-sm leading-relaxed">
            $CSL launches alongside the public release. The contract address will be announced
            here and on <a href="https://x.com/csldotfun" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-blue-400 underline underline-offset-2">@csldotfun</a> — trust no other source.
          </p>
        </div>
      </section>

      {/* What is CSL */}
      <section id="about" className="max-w-[1100px] mx-auto px-5 py-16 scroll-mt-8">
        <h2 className="text-4xl font-bold mb-12">What is CSL?</h2>
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          <div className="flex-1 space-y-6 text-white/90 leading-relaxed">
            <p className="text-white font-medium">For years, CS:2 skins have been treated like digital gold:</p>
            <ul className="space-y-2 text-white/70 ml-6">
              <li className="list-disc">$1B+ traded yearly</li>
              <li className="list-disc">Stable collector demand</li>
              <li className="list-disc">Proven store of value in gaming culture</li>
            </ul>
            <p className="text-white/70">
              But trading has been clunky — stuck on marketplaces with no leverage. Until now…
            </p>
            <p className="text-white font-medium">With CSL, we built a perp exchange for skins:</p>
            <ul className="space-y-2 text-white/70 ml-6">
              <li className="list-disc">Long/short your favorite skins</li>
              <li className="list-disc">Trade with leverage (up to 100x)</li>
              <li className="list-disc">All collateral + settlement on Solana</li>
              <li className="list-disc">PnL settled in $USDC (no skins need to move)</li>
            </ul>
            <p className="text-white font-medium">
              We're building a massive bridge between gaming and defi and are very excited to launch our token alongside
              product publicly
            </p>
          </div>
          <div className="flex-1">
            <img src="/csl-trading-character.png" alt="CSL Trading Dashboard" className="w-full h-auto rounded-lg" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-[1200px] mx-auto px-5 py-16">
        <h2 className="text-4xl font-bold text-center mb-16">Experience a new way to trade skins</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-b from-orange-500 to-yellow-500 rounded-xl p-6 text-center space-y-4 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="w-32 h-32 bg-white/20 rounded-full absolute top-12 right-8" />
            </div>
            <div className="relative z-10">
              <img src="/solana-logo.png" alt="Solana" className="w-24 h-24 mx-auto mb-4 object-contain" />
              <h3 className="text-xl font-bold text-white drop-shadow-sm">POWERED BY SOLANA</h3>
              <p className="text-white/90 text-sm drop-shadow-sm">
                Long or short CS skins powered by Solana, a low fee and incredibly fast blockchain solution.
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-b from-pink-500 to-purple-600 rounded-xl p-6 text-center space-y-4 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="w-40 h-40 bg-white/20 rounded-full absolute top-8 right-4" />
            </div>
            <div className="relative z-10">
              <img src="/easy-profits-weapons.png" alt="Easy Profits" className="w-32 h-24 mx-auto mb-4 object-contain" />
              <h3 className="text-xl font-bold text-white drop-shadow-sm">EASY PROFITS</h3>
              <p className="text-white/90 text-sm drop-shadow-sm">
                Hedge your CS skin exposure or profit from insights on the market.
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-b from-blue-500 to-cyan-400 rounded-xl p-6 text-center space-y-4 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="w-36 h-48 bg-white/20 rounded-full absolute top-4 right-2" />
            </div>
            <div className="relative z-10">
              <img src="/new-csl-logo.png" alt="CSL Token" className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white drop-shadow-sm">THE TOKEN</h3>
              <p className="text-white/90 text-sm drop-shadow-sm">
                Stake $CSL in the future to benefit from trading volume and receive fee discounts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-[1100px] mx-auto px-5 py-8 border-t border-white/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <img src="/new-csl-logo.png" alt="CSL Logo" className="w-[92px] h-[86px]" />
          <div className="flex items-center gap-6">
            <a
              href="https://docs.csl.fun/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors"
            >
              <FileText size={16} />
              <span className="font-medium">Docs</span>
            </a>
            <a
              href="https://x.com/csldotfun"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors"
            >
              <XIcon />
              <span className="font-medium">X</span>
            </a>
            <a
              href="https://github.com/CSLdotFun"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors"
            >
              <GitHubIcon />
              <span className="font-medium">GitHub</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
