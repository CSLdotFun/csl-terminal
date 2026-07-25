"use client"

/* Decorative skins in the empty side gutters on wide screens. Cosmetic only:
   pointer-events off, hidden below xl. Each rail clips its skin and fades all
   four edges so nothing shows a hard cut, and the skin is sized to sit fully
   inside the rail (no overflow past the viewport). */
export default function SkinSides({
  left,
  right,
  opacity = 0.15,
  leftRotate = -28,
  rightRotate = 28,
  size = 520,
  fade = true,
}: {
  left: string
  right: string
  opacity?: number
  leftRotate?: number
  rightRotate?: number
  size?: number
  fade?: boolean
}) {
  // soft feather on all edges so the skin melts into the page (no visible border)
  const featherMask =
    "radial-gradient(ellipse 80% 82% at 50% 50%, #000 55%, transparent 92%)"

  const rail = "hidden xl:block fixed top-16 bottom-0 w-[240px] 2xl:w-[300px] overflow-hidden z-0 pointer-events-none"
  const img = "absolute left-1/2 top-1/2 max-w-none object-contain"

  return (
    <div aria-hidden className="select-none">
      {/* left rail */}
      <div className={`${rail} left-0`}>
        <img
          src={left}
          alt=""
          style={{
            width: size,
            opacity,
            transform: `translate(-50%, -50%) rotate(${leftRotate}deg)`,
            WebkitMaskImage: featherMask,
            maskImage: featherMask,
          }}
          className={img}
        />
        {fade && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#faf9f6]" />}
      </div>

      {/* right rail */}
      <div className={`${rail} right-0`}>
        <img
          src={right}
          alt=""
          style={{
            width: size,
            opacity,
            transform: `translate(-50%, -50%) rotate(${rightRotate}deg)`,
            WebkitMaskImage: featherMask,
            maskImage: featherMask,
          }}
          className={img}
        />
        {fade && <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#faf9f6]" />}
      </div>
    </div>
  )
}
