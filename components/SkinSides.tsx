"use client"

/* Decorative vertical skins that fill the empty gutters on wide screens.
   Purely cosmetic — pointer-events off, hidden below xl so they never crowd
   the content. Each page passes its own left/right skin. Rotation and opacity
   are tunable per page so bright, angled hero skins (portfolio) and faint
   background skins (other pages) can share the same component. */
export default function SkinSides({
  left,
  right,
  opacity = 0.15,
  leftRotate = -28,
  rightRotate = 28,
  fade = true,
}: {
  left: string
  right: string
  opacity?: number
  leftRotate?: number
  rightRotate?: number
  fade?: boolean
}) {
  return (
    <div aria-hidden className="pointer-events-none select-none">
      {/* left rail */}
      <div className="hidden xl:block fixed left-0 top-16 bottom-0 w-[260px] 2xl:w-[340px] overflow-hidden z-0">
        <img
          src={left}
          alt=""
          style={{ opacity, transform: `translate(-50%, -50%) rotate(${leftRotate}deg)` }}
          className="absolute left-1/2 top-1/2 w-[520px] max-w-none object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
        />
        {fade && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#faf9f6]" />}
      </div>

      {/* right rail */}
      <div className="hidden xl:block fixed right-0 top-16 bottom-0 w-[260px] 2xl:w-[340px] overflow-hidden z-0">
        <img
          src={right}
          alt=""
          style={{ opacity, transform: `translate(-50%, -50%) rotate(${rightRotate}deg)` }}
          className="absolute left-1/2 top-1/2 w-[520px] max-w-none object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
        />
        {fade && <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#faf9f6]" />}
      </div>
    </div>
  )
}
