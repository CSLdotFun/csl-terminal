"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { ArrowLeft, TrendingUp, TrendingDown, Zap, X, User } from "lucide-react"
import CandleChart, { type Candle } from "./CandleChart"
import { usePrivy } from "@privy-io/react-auth"
import { ICONS } from "./icons"
import { loadAccount, saveAccount, type ClosedTrade } from "@/lib/account"

const API = process.env.NEXT_PUBLIC_API_URL || ""

const SEED_MARKETS = [
  { key: "dragon-lore", name: "AWP | Dragon Lore", image: "cs2-awp-dragon-lore.png", seed: 12250 },
  { key: "howl", name: "M4A4 | Howl", image: "cs2-m4a4-howl.png", seed: 5450 },
  { key: "karambit-fade", name: "★ Karambit | Fade", image: "cs2-karambit-fade-knife.jpg", seed: 2680 },
  { key: "butterfly", name: "★ Butterfly Knife", image: "cs2-butterfly-knife.jpg", seed: 1840 },
  { key: "m9-doppler", name: "★ M9 Bayonet | Doppler", image: "cs2-m9-bayonet-doppler.jpg", seed: 1520 },
  { key: "karambit-tiger", name: "★ Karambit | Tiger Tooth", image: "cs2-karambit-tiger-tooth.jpg", seed: 1180 },
  { key: "fire-serpent", name: "AK-47 | Fire Serpent", image: "cs2-ak-47-fire-serpent.jpg", seed: 920 },
  { key: "glock-fade", name: "Glock-18 | Fade", image: "cs2-glock-fade-pistol.jpg", seed: 880 },
  { key: "deagle-blaze", name: "Desert Eagle | Blaze", image: "cs2-desert-eagle-blaze.jpg", seed: 560 },
  { key: "lightning", name: "AWP | Lightning Strike", image: "cs2-awp-lightning-strike.jpg", seed: 410 },
  { key: "vulcan", name: "AK-47 | Vulcan", image: "cs2-ak-47-vulcan-skin.jpg", seed: 305 },
  { key: "flip-doppler", name: "★ Flip Knife | Doppler", image: "cs2-flip-knife-doppler.jpg", seed: 285 },
  { key: "hyper-beast", name: "M4A1-S | Hyper Beast", image: "cs2-m4a1s-hyper-beast.png", seed: 125 },
  { key: "asiimov", name: "AWP | Asiimov", image: "cs2-awp-asiimov-skin.jpg", seed: 92 },
  { key: "bloodsport", name: "AK-47 | Bloodsport", image: "cs2-ak-47-bloodsport.jpg", seed: 78 },
  { key: "kill-confirmed", name: "USP-S | Kill Confirmed", image: "cs2-usp-s-kill-confirmed.jpg", seed: 44 },
  { key: "redline", name: "AK-47 | Redline", image: "cs2-ak-47-redline-skin.jpg", seed: 26 },
]

const MAINT_MARGIN = 0.005
const TAKER_FEE = 0.0006
const START_BALANCE = 0
const LEV_MARKS = [2, 3, 5, 10, 15, 20]
// Timeframe = candle interval (like exchanges). History is generated back to the
// skin's release date, capped per interval so intraday series stay light.
const TFS = ["15m", "1H", "4H", "1D", "1W"] as const
type Tf = (typeof TFS)[number]
const TF_CFG: Record<Tf, { sec: number; cap: number }> = {
  "15m": { sec: 900, cap: 1000 },
  "1H": { sec: 3600, cap: 1200 },
  "4H": { sec: 14400, cap: 1500 },
  "1D": { sec: 86400, cap: 6000 },
  "1W": { sec: 604800, cap: 800 },
}

type Market = { key: string; name: string; image: string; price: number; change24h: number; funding: number }
type Side = "long" | "short"
type Position = {
  id: string; key: string; name: string; image: string; side: Side
  entry: number; collateral: number; leverage: number; notional: number; units: number; liq: number; openedAt: number
}

const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })
const money = (n: number) => `$${fmt(n)}`
const bucket = (tsSec: number, tf: number) => Math.floor(tsSec / tf) * tf
const liqPrice = (entry: number, side: Side, lev: number) => {
  const m = 1 / lev - MAINT_MARGIN
  return side === "long" ? entry * (1 - m) : entry * (1 + m)
}
const r = (n: number) => Math.round(n * 100) / 100

// deterministic PRNG so history is stable across renders
function hashStr(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0 }
function mulberry32(a: number) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
// Real skin release dates (collection/case introduction)
const RELEASE: Record<string, string> = {
  "dragon-lore": "2014-07-01",    // Cobblestone Collection (Operation Breakout)
  "howl": "2014-05-01",           // Huntsman Collection (contraband since Jun 2014)
  "karambit-fade": "2013-08-14",  // Arms Deal update
  "butterfly": "2017-03-15",      // Butterfly Doppler — Spectrum Case
  "m9-doppler": "2015-01-08",     // Chroma Case
  "karambit-tiger": "2015-01-08", // Chroma Case
  "fire-serpent": "2013-09-19",   // Operation Bravo Collection
  "glock-fade": "2013-08-14",     // Assault Collection (Arms Deal)
  "deagle-blaze": "2013-08-14",   // Dust Collection (Arms Deal)
  "lightning": "2013-08-14",      // Arms Deal (CS:GO Weapon Case)
  "vulcan": "2014-02-20",         // Operation Phoenix Case
  "flip-doppler": "2015-01-08",   // Chroma Case
  "hyper-beast": "2015-05-26",    // Falchion Case
  "asiimov": "2014-02-20",        // Operation Phoenix Case
  "bloodsport": "2017-05-23",     // Operation Hydra Case
  "kill-confirmed": "2015-09-17", // Shadow Case
  "redline": "2013-12-18",        // Winter Offensive Case
}
const releaseTs = (key: string) => Math.floor(new Date(RELEASE[key] || "2015-01-01").getTime() / 1000)
const releaseYear = (key: string) => (RELEASE[key] || "2015").slice(0, 4)

// --- realistic market-shape trend for synthetic history --------------------
// Normalized CS2 skin-market curve (fraction of today's price at points in time),
// anchored to real history: flat 2013-2016, slow climb, 2021 repricing, 2023 spike,
// 2024 cooldown, 2025 rally, back to today's level.
const SHAPE: [number, number][] = [
  [dateTs("2013-07-01"), 0.030], [dateTs("2014-06-01"), 0.035], [dateTs("2015-06-01"), 0.045],
  [dateTs("2016-06-01"), 0.060], [dateTs("2017-06-01"), 0.100], [dateTs("2018-06-01"), 0.115],
  [dateTs("2019-06-01"), 0.130], [dateTs("2020-06-01"), 0.155], [dateTs("2021-01-01"), 0.280],
  [dateTs("2021-07-01"), 0.550], [dateTs("2022-01-01"), 0.620], [dateTs("2022-07-01"), 0.600],
  [dateTs("2023-01-01"), 0.800], [dateTs("2023-05-01"), 1.150], [dateTs("2023-10-01"), 0.850],
  [dateTs("2024-04-01"), 0.780], [dateTs("2024-10-01"), 0.920], [dateTs("2025-04-01"), 1.050],
  [dateTs("2025-08-01"), 1.220], [dateTs("2025-12-01"), 1.050],
]
function dateTs(d: string) { return Math.floor(new Date(d).getTime() / 1000) }
function shapeAt(t: number): number {
  const now = Math.floor(Date.now() / 1000)
  const pts = [...SHAPE, [now, 1.0] as [number, number]]
  if (t <= pts[0][0]) return pts[0][1]
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const [t0, v0] = pts[i - 1], [t1, v1] = pts[i]
      return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0)
    }
  }
  return 1.0
}
// cheaper skins appreciated less over the years -> damp the curve
function growthExp(seed: number) { return seed >= 2000 ? 1.0 : seed >= 300 ? 0.8 : seed >= 80 ? 0.65 : 0.5 }

// deterministic OHLC series following the market shape, ending at `endPrice`
function genSeries(key: string, tfSec: number, count: number, endPrice: number, startTs?: number): Candle[] {
  const rng = mulberry32(hashStr(key + ":" + tfSec))
  const seed = SEED_MARKETS.find((m) => m.key === key)?.seed ?? endPrice
  const k = growthExp(seed)
  const now = Math.floor(Date.now() / 1000)
  const startB = startTs != null ? bucket(startTs, tfSec) : bucket(now, tfSec) - tfSec * (count - 1)
  const vol = Math.min(0.045, 0.014 * Math.sqrt(tfSec / 86400) + 0.0015)
  const out: Candle[] = []
  let noise = 1 // multiplicative noise around the trend, mean-reverting
  let prev: number | null = null
  for (let i = 0; i < count; i++) {
    const t = startB + i * tfSec
    const trend = endPrice * Math.pow(shapeAt(t), k)
    noise = Math.max(0.7, Math.min(1.35, noise * (1 + vol * (rng() * 2 - 1)) + (1 - noise) * 0.03))
    const c = r(Math.max(0.05, trend * noise))
    const o = prev ?? r(c * (1 - vol * 0.4))
    const hi = r(Math.max(o, c) * (1 + vol * 0.5 * rng()))
    const lo = r(Math.min(o, c) * (1 - vol * 0.5 * rng()))
    out.push({ time: t, open: o, high: hi, low: lo, close: c })
    prev = c
  }
  // pin the last close to the live price exactly
  if (out.length) { const last = out[out.length - 1]; last.close = r(endPrice); last.high = Math.max(last.high, last.close); last.low = Math.min(last.low, last.close) }
  return out
}

// Skin thumbnail — official Steam icon, falls back to local render on error.
function Skin({ mk, img, className = "w-11 h-8" }: { mk: string; img: string; className?: string }) {
  const [src, setSrc] = useState(ICONS[mk] || `/${img}`)
  useEffect(() => { setSrc(ICONS[mk] || `/${img}`) }, [mk, img])
  return (
    <div className={`${className} rounded bg-white/5 flex items-center justify-center shrink-0 overflow-hidden`}>
      <img src={src} alt="" className="max-w-full max-h-full object-contain" onError={() => { if (src !== `/${img}`) setSrc(`/${img}`) }} />
    </div>
  )
}

// Pre-launch access gate (sha-256 of the access password; removed at public launch)
const GATE_HASH = "e8802414ead697f6edac02462a10db5bfa0878a107d18cd4319879ba962c3325"
async function sha256Hex(t: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

export default function TradeTerminal() {
  const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy()
  const [unlocked, setUnlocked] = useState<boolean | null>(null) // null = checking
  const [gateInput, setGateInput] = useState("")
  const [gateError, setGateError] = useState(false)
  useEffect(() => {
    try { setUnlocked(localStorage.getItem("csl_gate") === GATE_HASH) } catch { setUnlocked(false) }
  }, [])
  const tryUnlock = async () => {
    const h = await sha256Hex(gateInput)
    if (h === GATE_HASH) {
      try { localStorage.setItem("csl_gate", GATE_HASH) } catch {}
      setUnlocked(true)
    } else { setGateError(true); setTimeout(() => setGateError(false), 1200) }
  }
  const [markets, setMarkets] = useState<Market[]>([])
  const [selected, setSelected] = useState("dragon-lore")
  const [live, setLive] = useState(false)
  const [nextFunding, setNextFunding] = useState(() => nextHour())
  const [now, setNow] = useState(Date.now())

  const [balance, setBalance] = useState(START_BALANCE)
  const [positions, setPositions] = useState<Position[]>([])

  const [showProfile, setShowProfile] = useState(false)
  const [realized, setRealized] = useState(0)
  const [volume, setVolume] = useState(0)
  const [tradeCount, setTradeCount] = useState(0)
  const [history, setHistory] = useState<ClosedTrade[]>([])
  const [serverMode, setServerMode] = useState(false)
  const [depositInfo, setDepositInfo] = useState<{ enabled: boolean; address?: string; maxPerUser?: number } | null>(null)
  const [wAmt, setWAmt] = useState("")
  const [wAddr, setWAddr] = useState("")
  const [wMsg, setWMsg] = useState<string | null>(null)
  const [tradeErr, setTradeErr] = useState<string | null>(null)

  const refreshAccount = useCallback(async () => {
    if (!API || !authenticated) return
    try {
      const token = await getAccessToken()
      const res = await fetch(`${API}/api/account`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      if (!res.ok) { setServerMode(false); return }
      const a = await res.json()
      setServerMode(true)
      setBalance(Number(a.balance) || 0)
      setRealized(Number(a.realized) || 0)
      setVolume(Number(a.volume) || 0)
      setTradeCount(Number(a.trades) || 0)
      setPositions(a.positions.map((p: any) => ({ ...p, openedAt: Number(p.opened_at) })))
      setHistory(a.history.map((t: any) => ({ ...t, closedAt: Number(t.closed_at), leverage: t.leverage })))
      try {
        const dr = await fetch(`${API}/api/deposit`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
        if (dr.ok) setDepositInfo(await dr.json())
      } catch {}
    } catch { setServerMode(false) }
  }, [authenticated, getAccessToken])

  useEffect(() => {
    if (!authenticated) { setBalance(0); setPositions([]); setHistory([]); setRealized(0); setVolume(0); setTradeCount(0); return }
    refreshAccount()
    const id = setInterval(refreshAccount, 10000)
    return () => clearInterval(id)
  }, [authenticated, refreshAccount])

  const [side, setSide] = useState<Side>("long")
  const [collateral, setCollateral] = useState("500")
  const [leverage, setLeverage] = useState(10)

  const [chartTf, setChartTf] = useState<Tf>("1D")
  const [candles, setCandles] = useState<Candle[]>([])
  const [liveCandle, setLiveCandle] = useState<Candle | null>(null)

  const priceMap = useRef<Map<string, number>>(new Map())
  const fundMap = useRef<Map<string, number>>(new Map())
  const candlesRef = useRef<Candle[]>([])
  const seriesKey = useRef<string>("")

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])

  const applyUpdates = useCallback((ups: { key: string; price: number }[]) => {
    setMarkets((prev) => {
      const byKey = new Map(prev.map((m) => [m.key, { ...m }]))
      for (const u of ups) { const m = byKey.get(u.key); if (m) { m.price = u.price; priceMap.current.set(u.key, u.price) } }
      return [...byKey.values()]
    })
  }, [])

  useEffect(() => {
    let es: EventSource | null = null
    let mockTimer: ReturnType<typeof setInterval> | null = null
    let cancelled = false

    const startMock = () => {
      const init: Market[] = SEED_MARKETS.map((m) => {
        const funding = (Math.random() * 2 - 1) * 0.0002
        fundMap.current.set(m.key, funding); priceMap.current.set(m.key, m.seed)
        return { key: m.key, name: m.name, image: m.image, price: m.seed, change24h: 0, funding }
      })
      setMarkets(init); setLive(false); setNextFunding(nextHour())
      mockTimer = setInterval(() => {
        const ups = SEED_MARKETS.map((m) => {
          const prev = priceMap.current.get(m.key) ?? m.seed
          const drift = (m.seed - prev) * 0.02
          const shock = prev * 0.004 * (Math.random() * 2 - 1)
          return { key: m.key, price: Math.max(m.seed * 0.5, r(prev + drift + shock)) }
        })
        applyUpdates(ups)
      }, 1200)
    }

    const boot = async () => {
      if (!API) return startMock()
      try {
        const res = await fetch(`${API}/api/markets`, { cache: "no-store" })
        if (!res.ok) throw new Error()
        const data = await res.json()
        if (cancelled) return
        if (data.nextFunding) setNextFunding(data.nextFunding * 1000)
        const ms: Market[] = data.markets
        ms.forEach((m) => { priceMap.current.set(m.key, m.price); fundMap.current.set(m.key, m.funding || 0) })
        setMarkets(ms)
        es = new EventSource(`${API}/api/stream`)
        es.onmessage = (ev) => {
          const msg = JSON.parse(ev.data)
          if (msg.nextFunding) setNextFunding(msg.nextFunding * 1000)
          if (msg.type === "prices") applyUpdates(msg.updates)
          if (msg.type === "snapshot") { msg.markets.forEach((m: any) => fundMap.current.set(m.key, m.funding || 0)); applyUpdates(msg.markets.map((m: any) => ({ key: m.key, price: m.price }))) }
        }
        es.onopen = () => setLive(true)
        es.onerror = () => { es?.close(); if (!cancelled) startMock() }
      } catch { if (!cancelled) startMock() }
    }
    boot()
    return () => { cancelled = true; es?.close(); if (mockTimer) clearInterval(mockTimer) }
  }, [applyUpdates])

  const selMarket = markets.find((m) => m.key === selected)
  const mark = selMarket?.price ?? 0
  const funding = selMarket?.funding ?? 0
  const tfSec = TF_CFG[chartTf].sec

  // (re)generate chart history on market or timeframe change — deterministic, ends at current price
  useEffect(() => {
    let cancelled = false
    const endPrice = priceMap.current.get(selected) ?? SEED_MARKETS.find((m) => m.key === selected)?.seed ?? 100
    // daily/weekly: try REAL history from backend first (real last ~365d when key is set)
    if ((chartTf === "1D" || chartTf === "1W") && API) {
      ;(async () => {
        try {
          const res = await fetch(`${API}/api/history/${selected}`, { cache: "no-store" })
          if (res.ok) {
            const d = await res.json()
            if (!cancelled && d.real && d.candles?.length) {
              let arr: Candle[] = d.candles
              if (chartTf === "1W") {
                // aggregate real daily candles into weekly
                const byW = new Map<number, Candle>()
                for (const c of arr) {
                  const t = Math.floor(c.time / 604800) * 604800
                  const w = byW.get(t)
                  if (!w) byW.set(t, { time: t, open: c.open, high: c.high, low: c.low, close: c.close })
                  else { w.high = Math.max(w.high, c.high); w.low = Math.min(w.low, c.low); w.close = c.close }
                }
                arr = [...byW.values()].sort((a, b) => a.time - b.time)
              }
              candlesRef.current = arr
              seriesKey.current = selected + chartTf
              setCandles(arr)
              setLiveCandle(null)
              return
            }
          }
        } catch {}
      })()
    }
    const { sec, cap } = TF_CFG[chartTf]
    const sinceRelease = Math.floor((Date.now() / 1000 - releaseTs(selected)) / sec) + 1
    const count = Math.max(20, Math.min(cap, sinceRelease))
    const start = count >= sinceRelease ? releaseTs(selected) : undefined
    const arr: Candle[] = genSeries(selected, sec, count, endPrice, start)
    candlesRef.current = arr
    seriesKey.current = selected + chartTf
    setCandles(arr)
    setLiveCandle(null)
    return () => { cancelled = true }
  }, [selected, chartTf]) // eslint-disable-line react-hooks/exhaustive-deps

  // fold live price into the last candle for the active timeframe
  useEffect(() => {
    if (seriesKey.current !== selected + chartTf || !selMarket) return
    const price = selMarket.price
    const t = bucket(Date.now() / 1000, tfSec)
    const arr = candlesRef.current
    const last = arr[arr.length - 1]
    let c: Candle
    if (last && last.time === t) { last.high = r(Math.max(last.high, price)); last.low = r(Math.min(last.low, price)); last.close = r(price); c = last }
    else { c = { time: t, open: r(price), high: r(price), low: r(price), close: r(price) }; arr.push(c); if (arr.length > 400) arr.shift() }
    setLiveCandle({ ...c })
  }, [selMarket?.price]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (positions.length === 0) return
    const survivors = positions.filter((p) => {
      const px = priceMap.current.get(p.key) ?? p.entry
      const hit = p.side === "long" ? px <= p.liq : px >= p.liq
      return !hit
    })
    if (survivors.length !== positions.length) setPositions(survivors)
  }, [markets]) // eslint-disable-line react-hooks/exhaustive-deps

  const posPnl = useCallback((p: Position) => {
    const px = priceMap.current.get(p.key) ?? p.entry
    const pricePnl = p.units * (px - p.entry) * (p.side === "long" ? 1 : -1)
    const rate = fundMap.current.get(p.key) ?? 0
    const hours = (now - p.openedAt) / 3_600_000
    const fundingCost = p.notional * rate * hours * (p.side === "long" ? 1 : -1)
    return { pnl: pricePnl - fundingCost }
  }, [now])

  const col = Math.max(0, Number(collateral) || 0)
  const notional = col * leverage
  const units = mark > 0 ? notional / mark : 0
  const estLiq = mark > 0 ? liqPrice(mark, side, leverage) : 0
  const fee = notional * TAKER_FEE
  const canOpen = col > 0 && col + fee <= balance && mark > 0

  const openPosition = async () => {
    if (!authenticated) { login(); return }
    if (!canOpen || !selMarket) return
    if (serverMode) {
      try {
        const token = await getAccessToken()
        const res = await fetch(`${API}/api/trade/open`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ key: selMarket.key, side, collateral: col, leverage }),
        })
        const d = await res.json()
        if (d.error) { setTradeErr(tradeErrText(d)); setTimeout(() => setTradeErr(null), 3000) }
        await refreshAccount()
      } catch { setTradeErr("Network error"); setTimeout(() => setTradeErr(null), 3000) }
      return
    }
    // local paper fallback (server accounts offline)
    const pos: Position = {
      id: Math.random().toString(36).slice(2), key: selMarket.key, name: selMarket.name, image: selMarket.image, side,
      entry: mark, collateral: col, leverage, notional, units, liq: estLiq, openedAt: Date.now(),
    }
    setBalance((b) => b - col - fee); setPositions((p) => [pos, ...p])
    setVolume((v) => v + notional); setTradeCount((c) => c + 1)
  }
  const closePosition = async (id: string) => {
    if (serverMode) {
      try {
        const token = await getAccessToken()
        await fetch(`${API}/api/trade/close`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id }),
        })
        await refreshAccount()
      } catch {}
      return
    }
    setPositions((prev) => {
      const p = prev.find((x) => x.id === id)
      if (p) {
        const { pnl } = posPnl(p)
        const clamped = Math.max(-p.collateral, pnl)
        const px = priceMap.current.get(p.key) ?? p.entry
        setBalance((b) => b + Math.max(0, p.collateral + pnl))
        setRealized((r) => r + clamped)
        setHistory((h) => [{ id: p.id, key: p.key, name: p.name, image: p.image, side: p.side, leverage: p.leverage, entry: p.entry, exit: px, pnl: clamped, closedAt: Date.now() }, ...h].slice(0, 100))
      }
      return prev.filter((x) => x.id !== id)
    })
  }

  const countdown = Math.max(0, Math.floor((nextFunding - now) / 1000))
  const dayUp = (selMarket?.change24h ?? 0) >= 0

  if (unlocked !== true) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#050b14] text-white px-5">
        {unlocked === false && (
          <div className="w-full max-w-[360px] text-center">
            <img src="/new-csl-logo.png" alt="CSL" className="w-20 h-20 object-contain mx-auto mb-5" />
            <h1 className="text-xl font-bold mb-1.5">Private beta</h1>
            <p className="text-white/45 text-sm mb-6">The terminal is access-gated until public launch.</p>
            <div className={`flex items-center rounded-xl bg-white/5 border px-3 transition-colors ${gateError ? "border-red-500/60" : "border-white/15 focus-within:border-blue-500/50"}`}>
              <input
                type="password"
                value={gateInput}
                onChange={(e) => setGateInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") tryUnlock() }}
                placeholder="Access password"
                className="flex-1 bg-transparent py-3 outline-none text-sm"
                autoFocus
              />
            </div>
            <button onClick={tryUnlock} className="mt-3 w-full h-11 rounded-xl bg-blue-500 hover:bg-blue-400 text-black font-bold text-sm transition-colors">
              {gateError ? "Wrong password" : "Enter"}
            </button>
            <a href="/" className="inline-block mt-5 text-xs text-white/35 hover:text-white/60">← Back to csl.fun</a>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#050b14] text-white">
      <header className="shrink-0 border-b border-white/10 bg-[#070f1a]">
        <div className="h-16 flex items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <a href="/" className="text-white/50 hover:text-white transition-colors"><ArrowLeft size={18} /></a>
            <img src="/new-csl-logo.png" alt="CSL" className="w-16 h-16 object-contain" />
            <span className="font-bold tracking-wide">Terminal</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <nav className="hidden lg:flex items-center gap-0.5">
              <span className="text-sm font-semibold px-2.5 py-1.5 rounded-lg bg-white/10 text-white">Trade</span>
              <a href="/portfolio" className="text-sm font-medium px-2.5 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors">Portfolio</a>
              <a href="/stats" className="text-sm font-medium px-2.5 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors">Stats</a>
              <a href="/vault" className="text-sm font-medium px-2.5 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors">Vault</a>
              <a href="/inventory" className="text-sm font-medium px-2.5 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors">Inventory</a>
              <a href="/leaderboard" className="text-sm font-medium px-2.5 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors">Leaderboard</a>
            </nav>
            {ready && (authenticated ? (
              <div className="flex items-center gap-2">
                <button onClick={() => setShowProfile(true)} className="flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-colors"><User size={14} />My Profile</button>
                <button onClick={logout} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60">Log out</button>
              </div>
            ) : (
              <button onClick={login} className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-black transition-colors">Sign in</button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[300px_1fr_324px]">
        {/* markets */}
        <aside className="hidden lg:flex flex-col border-r border-white/10 min-h-0 bg-[#060d18]">
          <div className="px-3 py-2.5 text-[11px] uppercase tracking-wider text-white/40 border-b border-white/10 shrink-0">Markets</div>
          <div className="flex-1 overflow-y-auto">
            {markets.map((m) => (
              <button key={m.key} onClick={() => setSelected(m.key)}
                className={`w-full flex items-center gap-3 px-3 py-3 text-left border-l-2 transition-colors ${selected === m.key ? "bg-blue-500/10 border-blue-500" : "border-transparent hover:bg-white/5"}`}>
                <Skin mk={m.key} img={m.image} className="w-14 h-10" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium truncate">{m.name}</div>
                  <div className="font-mono text-sm">{money(m.price)}</div>
                </div>
                <div className={`text-[11px] font-mono ${m.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>{m.change24h >= 0 ? "+" : ""}{fmt(m.change24h, 1)}%</div>
              </button>
            ))}
          </div>
        </aside>

        {/* center */}
        <main className="flex flex-col min-h-0">
          <div className="flex-1 min-h-0 flex flex-col border-b border-white/10">
            <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/5 flex-wrap">
              {selMarket && <Skin mk={selMarket.key} img={selMarket.image} className="w-14 h-10" />}
              <div>
                <div className="font-semibold leading-tight">{selMarket?.name ?? "—"}</div>
                <div className="text-white/40 text-xs">CSL Perp · USDC-settled · since {releaseYear(selected)}</div>
              </div>
              <div className="ml-auto flex items-center gap-6">
                <MiniStat label="Funding / 1h" value={`${funding >= 0 ? "+" : ""}${fmt(funding * 100, 4)}%`} cls={funding >= 0 ? "text-emerald-400" : "text-red-400"} />
                <MiniStat label="Next funding" value={hms(countdown)} />
                <div className="text-right">
                  <div className="font-mono text-2xl font-bold leading-none">{money(mark)}</div>
                  <div className={`text-xs font-mono ${dayUp ? "text-emerald-400" : "text-red-400"}`}>{dayUp ? "+" : ""}{fmt(selMarket?.change24h ?? 0, 2)}% 24h</div>
                </div>
              </div>
            </div>
            {/* timeframe selector */}
            <div className="shrink-0 flex items-center gap-1 px-4 py-1.5 border-b border-white/5">
              {TFS.map((t) => (
                <button key={t} onClick={() => setChartTf(t)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded transition-colors ${chartTf === t ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}>{t}</button>
              ))}
              <span className="ml-2 text-[11px] text-white/25">scroll to zoom · drag to pan</span>
            </div>
            <div className="flex-1 min-h-0"><CandleChart candles={candles} live={liveCandle} /></div>
          </div>

          {/* positions */}
          <div className="h-[190px] shrink-0 overflow-y-auto bg-[#060d18]">
            <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-white/40 border-b border-white/10 sticky top-0 bg-[#060d18]">Positions ({positions.length})</div>
            {positions.length === 0 ? (
              <div className="px-4 py-8 text-center text-white/25 text-sm">No open positions</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/40 text-[11px] uppercase">
                    <th className="text-left font-medium px-4 py-2">Market</th>
                    <th className="text-left font-medium px-2">Side</th>
                    <th className="text-right font-medium px-2">Size</th>
                    <th className="text-right font-medium px-2">Entry</th>
                    <th className="text-right font-medium px-2">Liq.</th>
                    <th className="text-right font-medium px-2">PnL (ROE)</th>
                    <th className="px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => {
                    const { pnl } = posPnl(p); const roe = (pnl / p.collateral) * 100; const up = pnl >= 0
                    return (
                      <tr key={p.id} className="border-t border-white/5">
                        <td className="px-4 py-2"><div className="flex items-center gap-2"><Skin mk={p.key} img={p.image} className="w-8 h-6" /><span className="text-xs truncate max-w-[130px]">{p.name}</span></div></td>
                        <td className="px-2"><span className={`text-xs font-semibold ${p.side === "long" ? "text-emerald-400" : "text-red-400"}`}>{p.side === "long" ? "LONG" : "SHORT"} {p.leverage}x</span></td>
                        <td className="px-2 text-right font-mono text-xs">{money(p.notional)}</td>
                        <td className="px-2 text-right font-mono text-xs">{money(p.entry)}</td>
                        <td className="px-2 text-right font-mono text-xs text-amber-400/80">{money(p.liq)}</td>
                        <td className={`px-2 text-right font-mono text-xs ${up ? "text-emerald-400" : "text-red-400"}`}>{up ? "+" : ""}{money(pnl)} <span className="opacity-70">({up ? "+" : ""}{fmt(roe)}%)</span></td>
                        <td className="px-2 text-right"><button onClick={() => closePosition(p.id)} className="text-white/40 hover:text-white p-1"><X size={14} /></button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </main>

        {/* order panel */}
        <aside className="border-l border-white/10 overflow-y-auto bg-[#060d18] p-3">
          <div className="grid grid-cols-2 gap-2 mb-4 bg-white/5 p-1 rounded-lg">
            <button onClick={() => setSide("long")} className={`flex items-center justify-center gap-1.5 py-2 rounded-md font-semibold text-sm transition-colors ${side === "long" ? "bg-emerald-500 text-black" : "text-white/60 hover:text-white"}`}><TrendingUp size={16} /> Long</button>
            <button onClick={() => setSide("short")} className={`flex items-center justify-center gap-1.5 py-2 rounded-md font-semibold text-sm transition-colors ${side === "short" ? "bg-red-500 text-black" : "text-white/60 hover:text-white"}`}><TrendingDown size={16} /> Short</button>
          </div>

          {authenticated && (
            <div className="flex items-center justify-between text-xs mb-2"><span className="text-white/40">Available</span><span className="font-mono">{money(balance)}</span></div>
          )}

          <label className="text-[11px] text-white/40 uppercase tracking-wider">Collateral</label>
          <div className="mt-1 mb-2 flex items-center rounded-lg bg-white/5 border border-white/10 px-3 focus-within:border-white/25">
            <input type="number" value={collateral} onChange={(e) => setCollateral(e.target.value)} className="flex-1 bg-transparent py-2.5 outline-none font-mono min-w-0" />
            <button onClick={() => setCollateral(String(Math.floor(balance)))} className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold mr-2">MAX</button>
            <span className="text-white/40 text-sm">USDC</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 mb-4">
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <button key={pct} onClick={() => setCollateral(String(Math.floor(balance * pct)))} className="text-[11px] py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/60">{pct * 100}%</button>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs mb-2"><span className="text-white/40 uppercase tracking-wider">Leverage</span><span className="font-mono font-semibold text-blue-400 flex items-center gap-1"><Zap size={12} />{leverage}x</span></div>
          <input type="range" min={1} max={20} value={leverage} onChange={(e) => setLeverage(Number(e.target.value))} className="w-full accent-blue-500 mb-2" />
          <div className="grid grid-cols-6 gap-1 mb-4">
            {LEV_MARKS.map((v) => (
              <button key={v} onClick={() => setLeverage(v)} className={`text-[11px] py-1 rounded transition-colors ${leverage === v ? "bg-blue-500 text-black font-semibold" : "bg-white/5 hover:bg-white/10 text-white/60"}`}>{v}x</button>
            ))}
          </div>

          <div className="space-y-1.5 text-xs mb-4 rounded-lg bg-white/[0.03] border border-white/5 p-3">
            <Row label="Order value" value={money(notional)} />
            <Row label="Entry price" value={money(mark)} />
            <Row label="Est. liquidation" value={money(estLiq)} valueClass="text-amber-400" />
            <Row label="Funding / 1h" value={`${funding >= 0 ? "+" : ""}${fmt(funding * 100, 4)}%`} valueClass={funding >= 0 ? "text-emerald-400" : "text-red-400"} />
            <Row label="Taker fee" value={money(fee)} />
          </div>

          {tradeErr && <div className="mb-2 text-xs text-red-400 text-center">{tradeErr}</div>}
          {authenticated ? (
            <button onClick={openPosition} disabled={!canOpen}
              className={`w-full h-11 font-bold text-base rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${side === "long" ? "bg-emerald-500 hover:bg-emerald-400 text-black" : "bg-red-500 hover:bg-red-400 text-black"}`}>
              {col + fee > balance ? "Insufficient balance" : `Open ${side === "long" ? "Long" : "Short"} · ${leverage}x`}
            </button>
          ) : (
            <button onClick={login}
              className="w-full h-11 font-bold text-base rounded-lg bg-blue-500 hover:bg-blue-400 text-black transition-colors">
              Sign in to trade
            </button>
          )}
        </aside>
      </div>

      {/* profile modal */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowProfile(false)}>
          <div className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-[#0a121e] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center"><User size={20} className="text-blue-400" /></div>
                <div>
                  <div className="font-semibold">{userLabel(user)}</div>
                  <div className="text-xs text-white/40">{user?.twitter ? "Twitter" : user?.google ? "Google" : user?.wallet ? "Phantom" : "Account"}</div>
                </div>
              </div>
              <button onClick={() => setShowProfile(false)} className="text-white/40 hover:text-white p-1"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <PCard label="Balance" value={money(balance)} />
              <PCard label="Realized PnL" value={`${realized >= 0 ? "+" : ""}${money(realized)}`} cls={realized > 0 ? "text-emerald-400" : realized < 0 ? "text-red-400" : ""} />
              <PCard label="Volume traded" value={money(volume)} />
              <PCard label="Trades" value={String(tradeCount)} />
              <PCard label="Open positions" value={String(positions.length)} />
              <PCard label="Unrealized PnL" value={(() => { let u = 0; for (const p of positions) { const { pnl } = posPnl(p); u += Math.max(-p.collateral, pnl) } return `${u >= 0 ? "+" : ""}${money(u)}` })()} />
            </div>

            {depositInfo?.enabled && depositInfo.address ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-3.5">
                  <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5">Deposit USDC (Solana)</div>
                  <div className="flex items-center gap-2">
                    <code className="text-[11px] font-mono break-all text-white/80 flex-1">{depositInfo.address}</code>
                    <button onClick={() => navigator.clipboard.writeText(depositInfo.address!)} className="text-[11px] px-2.5 py-1 rounded bg-white/10 hover:bg-white/15 shrink-0">Copy</button>
                  </div>
                  <div className="text-[11px] text-white/35 mt-1.5">USDC only, Solana network. Max ${depositInfo.maxPerUser} per account in beta. Credits within ~1 min.</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                  <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Withdraw USDC</div>
                  <input value={wAmt} onChange={(e) => setWAmt(e.target.value)} placeholder="Amount" type="number" className="w-full mb-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-white/25" />
                  <input value={wAddr} onChange={(e) => setWAddr(e.target.value)} placeholder="Solana address" className="w-full mb-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-white/25" />
                  <button
                    onClick={async () => {
                      try {
                        const token = await getAccessToken()
                        const r = await postWithdraw(API, token!, wAmt, wAddr)
                        setWMsg(r.ok ? (r.status === "sent" ? "Sent on-chain ✓" : "Requested — processing") : withdrawErrText(r))
                        if (r.ok) { setWAmt(""); setWAddr(""); refreshAccount() }
                      } catch { setWMsg("Network error") }
                      setTimeout(() => setWMsg(null), 4000)
                    }}
                    className="w-full h-9 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-semibold"
                  >Withdraw</button>
                  {wMsg && <div className="text-[11px] text-white/60 mt-2 text-center">{wMsg}</div>}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-blue-500/25 bg-blue-500/[0.07] p-3.5 text-[13px] text-white/60 leading-relaxed">
                USDC deposits &amp; withdrawals open at public launch. Until then your balance stays at $0.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PCard({ label, value, cls = "" }: { label: string; value: string; cls?: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3">
      <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{label}</div>
      <div className={`font-mono font-semibold text-sm ${cls}`}>{value}</div>
    </div>
  )
}

function MiniStat({ label, value, cls = "" }: { label: string; value: string; cls?: string }) {
  return <div className="text-right"><div className="text-white/40 text-[10px] uppercase tracking-wider">{label}</div><div className={`font-mono text-sm ${cls}`}>{value}</div></div>
}
function Row({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return <div className="flex items-center justify-between"><span className="text-white/40">{label}</span><span className={`font-mono ${valueClass}`}>{value}</span></div>
}
async function postWithdraw(api: string, token: string, amount: string, address: string) {
  const res = await fetch(`${api}/api/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ amount, address }),
  })
  return res.json()
}

function tradeErrText(d: any): string {
  switch (d.error) {
    case "insufficient_balance": return "Insufficient balance"
    case "collateral_cap": return `Max collateral per position: $${d.max}`
    case "bad_leverage": return `Max leverage in beta: ${d.max}x`
    case "positions_cap": return `Max ${d.max} open positions`
    case "market_oi_cap": return "Market open-interest cap reached"
    case "no_price": return "Price unavailable, try again"
    default: return "Order rejected"
  }
}

function withdrawErrText(d: any): string {
  switch (d.error) {
    case "min_withdraw": return `Minimum withdrawal: $${d.min}`
    case "bad_address": return "Invalid Solana address"
    case "insufficient_balance": return "Insufficient balance"
    default: return "Request failed"
  }
}

function userLabel(user: any): string {
  if (!user) return "Account"
  if (user.twitter?.username) return "@" + user.twitter.username
  if (user.google?.email) return user.google.email
  const w = user.wallet?.address
  if (w) return w.slice(0, 4) + "…" + w.slice(-4)
  return "Account"
}
function hms(sec: number) { const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60; return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` }
function nextHour() { const d = new Date(); d.setMinutes(0, 0, 0); return d.getTime() + 3600_000 }
