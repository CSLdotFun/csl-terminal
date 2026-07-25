"use client"

/* Decorative skins in the empty side gutters on wide screens. Cosmetic only:
   pointer-events off, hidden below xl, sit BEHIND page content (z-0).

   Two modes:
   - full (default): transparent PNG shown WHOLE, anchored to the outer screen
     edge and extending inward. No edge-feather, no overflow clip — the weapon is
     never cut off (barrel tip / stock stay in frame even if it reaches the text).
   - clip: legacy feather-masked look (kept for anything that still wants it). */
export default function SkinSides({
  left,
  right,
  opacity = 0.9,
  leftRotate = -6,
  rightRotate = 6,
  size = 320,
  inset = 30,
  fade = false,
  clip = false,
}: {
  left: string
  right: string
  opacity?: number
  leftRotate?: number
  rightRotate?: number
  size?: number
  inset?: number
  fade?: boolean
  clip?: boolean
}) {
  const featherMask =
    "radial-gradient(ellipse 80% 82% at 50% 50%, #000 55%, transparent 92%)"

  if (clip) {
    const rail =
      "hidden xl:block fixed top-16 bottom-0 w-[240px] 2xl:w-[300px] overflow-hidden z-0 pointer-events-none"
    const img = "absolute left-1/2 top-1/2 max-w-none object-contain"
    return (
      <div aria-hidden className="select-none">
        <div className={`${rail} left-0`}>
          <img src={left} alt="" style={{ width: size, opacity, transform: `translate(-50%, -50%) rotate(${leftRotate}deg)`, WebkitMaskImage: featherMask, maskImage: featherMask }} className={img} />
          {fade && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#faf9f6]" />}
        </div>
        <div className={`${rail} right-0`}>
          <img src={right} alt="" style={{ width: size, opacity, transform: `translate(-50%, -50%) rotate(${rightRotate}deg)`, WebkitMaskImage: featherMask, maskImage: featherMask }} className={img} />
          {fade && <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#faf9f6]" />}
        </div>
      </div>
    )
  }

  // full mode — whole weapon, anchored to the outer edge, nothing cropped
  const rail =
    "hidden xl:block fixed top-16 bottom-0 w-[320px] 2xl:w-[400px] overflow-visible z-0 pointer-events-none"
  const img = "absolute top-1/2 max-w-none object-contain"

  return (
    <div aria-hidden className="select-none">
      {/* left rail — outer (left) edge hugs the screen, extends inward */}
      <div className={`${rail} left-0`}>
        <img
          src={left}
          alt=""
          style={{
            left: inset,
            width: size,
            opacity,
            transform: `translateY(-50%) rotate(${leftRotate}deg)`,
          }}
          className={img}
        />
      </div>

      {/* right rail — outer (right) edge hugs the screen, extends inward */}
      <div className={`${rail} right-0`}>
        <img
          src={right}
          alt=""
          style={{
            right: inset,
            width: size,
            opacity,
            transform: `translateY(-50%) rotate(${rightRotate}deg)`,
          }}
          className={img}
        />
      </div>
    </div>
  )
}
