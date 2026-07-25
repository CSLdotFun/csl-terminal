"use client"

/* Decorative vertical skins that fill the empty gutters on wide screens.
   Purely cosmetic — pointer-events off, hidden below xl so they never crowd
   the content. Each page passes its own left/right skin so the pairing feels
   intentional (e.g. Fire Serpent on portfolio, Dragon Lore on vault). */
export default function SkinSides({ left, right }: { left: string; right: string }) {
  return (
    <div aria-hidden className="pointer-events-none select-none">
      {/* left rail */}
      <div className="hidden xl:block fixed left-0 top-16 bottom-0 w-[240px] 2xl:w-[320px] overflow-hidden z-0">
        <img
          src={left}
          alt=""
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[28deg] w-[500px] max-w-none object-contain opacity-[0.15] drop-shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
        />
        {/* fade so it melts into the page toward the content */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#faf9f6]" />
      </div>

      {/* right rail */}
      <div className="hidden xl:block fixed right-0 top-16 bottom-0 w-[240px] 2xl:w-[320px] overflow-hidden z-0">
        <img
          src={right}
          alt=""
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[28deg] w-[500px] max-w-none object-contain opacity-[0.15] drop-shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#faf9f6]" />
      </div>
    </div>
  )
}
