"use client"

import TNav from "@/components/TNav"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { ArrowLeft, TrendingUp, TrendingDown, Zap, X, User, Share2 } from "lucide-react"
import CandleChart, { type Candle } from "./CandleChart"
import { useAccount } from "wagmi"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import { loadAccount, saveAccount, type ClosedTrade } from "@/lib/account"
import Skin from "@/components/Skin"
import { useAuthToken } from "@/hooks/useAuthToken"
import PnLCardModal from "@/components/PnLCardModal"
import type { PnLCardData } from "@/components/PnLCard"

const API = process.env.NEXT_PUBLIC_API_URL || ""

const SEED_MARKETS = [
  { key: "dragon-lore", name: "AWP | Dragon Lore", wear: "FT", image: "cs2-awp-dragon-lore.png", seed: 6900 },
  { key: "howl", name: "M4A4 | Howl", wear: "FT", image: "cs2-m4a4-howl.png", seed: 5450 },
  { key: "karambit-fade", name: "★ Karambit | Fade", wear: "FN", image: "cs2-karambit-fade-knife.jpg", seed: 2680 },
  { key: "butterfly", name: "★ Butterfly Knife | Doppler", wear: "FN", image: "cs2-butterfly-knife.jpg", seed: 1840 },
  { key: "m9-doppler", name: "★ M9 Bayonet | Doppler", wear: "FN", image: "cs2-m9-bayonet-doppler.jpg", seed: 1520 },
  { key: "karambit-tiger", name: "★ Karambit | Tiger Tooth", wear: "FN", image: "cs2-karambit-tiger-tooth.jpg", seed: 1180 },
  { key: "fire-serpent", name: "AK-47 | Fire Serpent", wear: "FT", image: "cs2-ak-47-fire-serpent.jpg", seed: 920 },
  { key: "glock-fade", name: "Glock-18 | Fade", wear: "FN", image: "cs2-glock-fade-pistol.jpg", seed: 880 },
  { key: "deagle-blaze", name: "Desert Eagle | Blaze", wear: "FN", image: "cs2-desert-eagle-blaze.jpg", seed: 560 },
  { key: "lightning", name: "AWP | Lightning Strike", wear: "FN", image: "cs2-awp-lightning-strike.jpg", seed: 410 },
  { key: "flip-doppler", name: "★ Flip Knife | Doppler", wear: "FN", image: "cs2-flip-knife-doppler.jpg", seed: 285 },
  { key: "hyper-beast", name: "M4A1-S | Hyper Beast", wear: "FT", image: "cs2-m4a1s-hyper-beast.png", seed: 125 },
  { key: "asiimov", name: "AWP | Asiimov", wear: "FT", image: "cs2-awp-asiimov-skin.jpg", seed: 92 },
  { key: "kill-confirmed", name: "USP-S | Kill Confirmed", wear: "FT", image: "cs2-usp-s-kill-confirmed.jpg", seed: 44 },
  { key: "vulcan", name: "AK-47 | Vulcan", wear: "FT", image: "cs2-ak-47-vulcan-skin.jpg", seed: 32 },
  { key: "bloodsport", name: "AK-47 | Bloodsport", wear: "FT", image: "cs2-ak-47-bloodsport.jpg", seed: 30 },
  { key: "redline", name: "AK-47 | Redline", wear: "FT", image: "cs2-ak-47-redline-skin.jpg", seed: 26 },
]

const MAINT_MARGIN = 0.005
const TAKER_FEE = 0.0015   // 0.15% — funds the vault against the 10% liquidation burn
const START_BALANCE = 0
const LEV_MARKS = [2, 3, 5, 10, 15, 20]
// Timeframe = candle interval (like exchanges). History is generated back to the
// skin's release date, capped per interval so intraday series stay light.
const TFS = ["5m", "15m", "1H", "4H", "1D", "1W"] as const
type Tf = (typeof TFS)[number]
const TF_CFG: Record<Tf, { sec: number; cap: number }> = {
  "5m": { sec: 300, cap: 800 },
  "15m": { sec: 900, cap: 1000 },
  "1H": { sec: 3600, cap: 1200 },
  "4H": { sec: 14400, cap: 1500 },
  "1D": { sec: 86400, cap: 6000 },
  "1W": { sec: 604800, cap: 800 },
}

type Market = { key: string; name: string; wear?: string; icon?: string | null; image: string; price: number; change24h: number; funding: number }
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
const releaseYear = (key: string) => (RELEASE[key] || "2015").slice(0, 4)

// --- recent-window generator (used only when no real history is available) ---
// A short, gentle random walk that ENDS on the live price. Deliberately covers
// only a recent window (weeks/months), never a fabricated multi-year history.
// Resample the recent tail of real daily closes into finer intraday bars. We take
// the last few days of true prices and lay `cap` bars across them with light,
// deterministic in-between motion, forcing the final bar onto the live price.
// It is anchored to real history (real level, real recent trend) — not a random
// walk detached from anything.

function genRecent(key: string, tfSec: number, count: number, endPrice: number, startTs: number): Candle[] {
  const rng = mulberry32(hashStr(key + ":recent:" + tfSec))
  const vol = Math.min(0.03, 0.01 * Math.sqrt(tfSec / 86400) + 0.0012)
  const out: Candle[] = []
  // build backwards from endPrice so the last candle == live price exactly
  const closes: number[] = new Array(count)
  closes[count - 1] = endPrice
  for (let i = count - 2; i >= 0; i--) {
    const step = 1 + vol * (rng() * 2 - 1)
    closes[i] = Math.max(0.05, closes[i + 1] / step)
  }
  let prev: number | null = null
  for (let i = 0; i < count; i++) {
    const t = startTs + i * tfSec
    const c = r(closes[i])
    const o = prev ?? r(c * (1 - vol * 0.4))
    const hi = r(Math.max(o, c) * (1 + vol * 0.6 * rng()))
    const lo = r(Math.min(o, c) * (1 - vol * 0.6 * rng()))
    out.push({ time: t, open: o, high: hi, low: lo, close: c })
    prev = c
  }
  if (out.length) { const last = out[out.length - 1]; last.close = r(endPrice); last.high = Math.max(last.high, last.close); last.low = Math.min(last.low, last.close) }
  return out
}

// Skin thumbnail — official Steam icon, falls back to local render on error.
/* Icon priority: the real Steam CDN image (served by the API once warmed) →
   whatever we bundle locally. Any load error falls back a step, so a Steam
   hiccup can never leave an empty box. */

// Pre-launch access gate (sha-256 of the access password; removed at public launch)
const GATE_HASH = "e8802414ead697f6edac02462a10db5bfa0878a107d18cd4319879ba962c3325"
async function sha256Hex(t: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

export default function TradeTerminal() {
  const { address: walletAddr, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { getToken, authHeader } = useAuthToken()
  const ready = true
  const authenticated = isConnected
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

  const refreshSeq = useRef(0)
  const refreshAccount = useCallback(async () => {
    if (!API || !authenticated || !walletAddr) return
    const mySeq = ++refreshSeq.current
    try {
      const token = await getToken()
      if (!token) { if (refreshSeq.current === mySeq) setServerMode(false); return }
      const res = await fetch(`${API}/api/account`, { headers: authHeader(token), cache: "no-store" })
      if (!res.ok) { if (refreshSeq.current === mySeq) setServerMode(false); return }
      const a = await res.json()
      // a newer refreshAccount call has started since this one began — its
      // response is guaranteed to be at least as fresh, so discard THIS one
      // rather than let an out-of-order response overwrite newer state
      // (this is exactly what made a just-liquidated position "flicker back")
      if (refreshSeq.current !== mySeq) return
      setServerMode(true)
      setBalance(Number(a.balance) || 0)
      setRealized(Number(a.realized) || 0)
      setVolume(Number(a.volume) || 0)
      setTradeCount(Number(a.trades) || 0)
      const newPositions = a.positions.map((p: any) => ({ ...p, openedAt: Number(p.opened_at) }))
      const newHistory = a.history.map((t: any) => ({ ...t, closedAt: Number(t.closed_at), leverage: t.leverage }))

      // any position that was here last refresh but isn't now, and that WE
      // didn't just manually close ourselves, must have been closed by the
      // backend (liquidation, or a filled stop) — surface it as a toast
      const newIds = new Set(newPositions.map((p: Position) => p.id))
      for (const old of prevPositionsRef.current) {
        if (newIds.has(old.id)) continue
        if (manualCloseRef.current.has(old.id)) { manualCloseRef.current.delete(old.id); continue }
        const t = newHistory.find((h: any) => h.id === old.id)
        if (t) showToast({ key: old.key, name: old.name, image: old.image, reason: t.reason === "liquidation" ? "Liquidated" : "Closed", exit: t.exit, pnl: t.pnl })
      }
      prevPositionsRef.current = newPositions

      setPositions(newPositions)
      setHistory(newHistory)
      setOpenOrders(a.openOrders || [])
      try {
        const dr = await fetch(`${API}/api/deposit`, { headers: authHeader(token), cache: "no-store" })
        if (dr.ok && refreshSeq.current === mySeq) setDepositInfo(await dr.json())
      } catch {}
    } catch { setServerMode(false) }
  }, [authenticated, walletAddr, getToken, authHeader])

  useEffect(() => {
    if (!authenticated) { setBalance(0); setPositions([]); setHistory([]); setRealized(0); setVolume(0); setTradeCount(0); setOpenOrders([]); return }
    refreshAccount()
    const id = setInterval(refreshAccount, 10000)
    return () => clearInterval(id)
  }, [authenticated, refreshAccount])

  const [side, setSide] = useState<Side>("long")
  const [collateralAsset, setCollateralAsset] = useState<"USDG" | "CSL">("USDG")
  const [collateral, setCollateral] = useState("500")
  const [leverage, setLeverage] = useState(10)
  const [orderType, setOrderType] = useState<"market" | "limit">("market")
  const [limitPrice, setLimitPrice] = useState("")
  const [openOrders, setOpenOrders] = useState<any[]>([])
  const [closeConfirmId, setCloseConfirmId] = useState<string | null>(null)
  const [shareCard, setShareCard] = useState<PnLCardData | null>(null)
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null)
  const [bottomTab, setBottomTab] = useState<"positions" | "orders" | "history">("positions")
  const [toasts, setToasts] = useState<{ id: string; key: string; name: string; image: string; reason: string; exit: number; pnl: number }[]>([])
  const prevPositionsRef = useRef<Position[]>([])
  const manualCloseRef = useRef<Set<string>>(new Set())

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
        return { key: m.key, name: m.name, wear: m.wear, image: m.image, price: m.seed, change24h: 0, funding }
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

  // (re)load chart history on market / timeframe change. Sub-day timeframes
  // (15m/1H/4H) use REAL intraday ticks from the backend's 5-min ring buffer
  // (~26h deep) — previously they just re-showed the same daily bucketing as
  // 1D, so switching timeframe did nothing. 1D/1W still use daily Steam
  // history, rebased onto the live mark.
  useEffect(() => {
    let cancelled = false
    const endPrice = priceMap.current.get(selected) ?? SEED_MARKETS.find((m) => m.key === selected)?.seed ?? 100

    if (API) {
      ;(async () => {
        if (chartTf === "5m" || chartTf === "15m" || chartTf === "1H" || chartTf === "4H") {
          try {
            const res = await fetch(`${API}/api/intraday/${selected}?tf=${chartTf}`, { cache: "no-store" })
            if (res.ok) {
              const d = await res.json()
              if (!cancelled && d.candles?.length >= 3) {
                const live = priceMap.current.get(selected) ?? endPrice
                const arr: Candle[] = d.candles.map((c: Candle) => ({ ...c }))
                const last = arr[arr.length - 1]
                last.close = r(live); last.high = Math.max(last.high, last.close); last.low = Math.min(last.low, last.close)
                candlesRef.current = arr
                seriesKey.current = selected + chartTf
                setCandles(arr)
                setLiveCandle(null)
                return
              }
            }
          } catch {}
          if (cancelled) return
          // not enough intraday ticks yet (just deployed / just listed) — fall
          // through to the same recent-window synthesis used below
        }
        try {
          const res = await fetch(`${API}/api/history/${selected}`, { cache: "no-store" })
          if (res.ok) {
            const d = await res.json()
            if (!cancelled && d.real && d.candles?.length) {
              let daily: Candle[] = d.candles
              const live = priceMap.current.get(selected) ?? endPrice
              // "spliced" / "csl" sources are already real dollar values for their
              // own era (genuine pre-cap Steam segment + CSL's own tracked closes)
              // — rebasing would corrupt the genuine old Steam prices, so we only
              // rescale the legacy single-source "steam"/"steamwebapi" case.
              if (d.source !== "spliced" && d.source !== "csl") {
                const tail = daily.slice(-20).map((c) => c.close).filter((n) => n > 0).sort((a, b) => a - b)
                const anchor = tail.length ? tail[Math.floor(tail.length / 2)] : 0
                if (anchor > 0 && live > 0) {
                  const f = live / anchor
                  daily = daily
                    .map((c) => ({ time: c.time, open: r(c.open * f), high: r(c.high * f), low: r(c.low * f), close: r(c.close * f) }))
                    .filter((c) => c.close <= live * 8 && c.close >= live / 8)
                    .map((c) => ({ ...c, high: Math.min(c.high, live * 8), low: Math.max(c.low, live / 8) }))
                }
              }
              // last point == the live mark, exactly
              if (daily.length) {
                const last = daily[daily.length - 1]
                last.close = r(live); last.high = Math.max(last.high, last.close); last.low = Math.min(last.low, last.close)
              }
              // aggregate the daily series to the chosen timeframe's bucket.
              const bkt = chartTf === "1W" ? 604800 : 86400
              const byB = new Map<number, Candle>()
              for (const c of daily) {
                const t = Math.floor(c.time / bkt) * bkt
                const b = byB.get(t)
                if (!b) byB.set(t, { time: t, open: c.open, high: c.high, low: c.low, close: c.close })
                else { b.high = Math.max(b.high, c.high); b.low = Math.min(b.low, c.low); b.close = c.close }
              }
              const arr = [...byB.values()].sort((a, b) => a.time - b.time)
              candlesRef.current = arr
              seriesKey.current = selected + chartTf
              setCandles(arr)
              setLiveCandle(null)
              return
            }
          }
        } catch {}
        if (cancelled) return
        // real history unavailable (skin outgrew Steam, or cold cache) → show a
        // clean RECENT window that walks gently around the live price. Honest:
        // it's the recent period, not a fabricated decade.
        const { sec } = TF_CFG[chartTf]
        const recentBars = chartTf === "1W" ? 52 : chartTf === "1D" ? 120 : 160
        const start = bucket(Math.floor(Date.now() / 1000), sec) - sec * (recentBars - 1)
        const arr = genRecent(selected, sec, recentBars, endPrice, start)
        candlesRef.current = arr
        seriesKey.current = selected + chartTf
        setCandles(arr)
        setLiveCandle(null)
      })()
    }
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
  const limitPx = Math.max(0, Number(limitPrice) || 0)
  const canOpen = orderType === "market"
    ? col > 0 && col + fee <= balance && mark > 0
    : col > 0 && col <= balance && limitPx > 0

  const submitOrder = async () => {
    if (!authenticated) { openConnectModal?.(); return }
    if (!canOpen || !selMarket) return

    if (orderType === "limit") {
      if (!serverMode) { setTradeErr("Limit orders need a connected account"); setTimeout(() => setTradeErr(null), 3000); return }
      try {
        const token = await getToken()
        const res = await fetch(`${API}/api/trade/limit`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader(token) },
          body: JSON.stringify({ key: selMarket.key, side, collateral: col, leverage, limitPrice: limitPx }),
        })
        const d = await res.json()
        if (d.error) { setTradeErr(tradeErrText(d)); setTimeout(() => setTradeErr(null), 3000) }
        else setLimitPrice("")
        await refreshAccount()
      } catch { setTradeErr("Network error"); setTimeout(() => setTradeErr(null), 3000) }
      return
    }

    if (serverMode) {
      try {
        const token = await getToken()
        const res = await fetch(`${API}/api/trade/open`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader(token) },
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
  const showToast = (t: { key: string; name: string; image: string; reason: string; exit: number; pnl: number }) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((ts) => [...ts, { id, ...t }])
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 6000)
  }

  const closePosition = async (id: string) => {
    if (serverMode) {
      const p = positions.find((x) => x.id === id)
      manualCloseRef.current.add(id)
      try {
        const token = await getToken()
        const res = await fetch(`${API}/api/trade/close`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader(token) },
          body: JSON.stringify({ id }),
        })
        const d = await res.json()
        if (d.ok && p) showToast({ key: p.key, name: p.name, image: p.image, reason: "Closed", exit: d.exit, pnl: d.pnl })
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
        showToast({ key: p.key, name: p.name, image: p.image, reason: "Closed", exit: px, pnl: clamped })
      }
      return prev.filter((x) => x.id !== id)
    })
  }

  const countdown = Math.max(0, Math.floor((nextFunding - now) / 1000))
  const dayUp = (selMarket?.change24h ?? 0) >= 0

  if (unlocked !== true) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#faf9f6] text-[#0e1512] px-5">
        {unlocked === false && (
          <div className="w-full max-w-[360px] text-center">
            <img src="/new-csl-logo.png" alt="CSL" className="w-20 h-20 object-contain mx-auto mb-5" />
            <h1 className="text-xl font-bold mb-1.5">Private beta</h1>
            <p className="text-[#0e1512]/45 text-sm mb-6">The terminal is access-gated until public launch.</p>
            <div className={`flex items-center rounded-xl bg-black/5 border px-3 transition-colors ${gateError ? "border-red-500/60" : "border-black/15 focus-within:border-[#CDF60A]/50"}`}>
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
            <button onClick={tryUnlock} className="mt-3 w-full h-11 rounded-xl bg-[#CDF60A] hover:bg-[#d9fa3a] text-[#0e1512] font-bold text-sm transition-colors">
              {gateError ? "Wrong password" : "Enter"}
            </button>
            <a href="/" className="inline-block mt-5 text-xs text-[#0e1512]/35 hover:text-[#0e1512]/60">← Back to csl.fun</a>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#faf9f6] text-[#0e1512]">
      <TNav active="trade" light title="Terminal" />

      {/* close/liquidation toasts */}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map((t) => {
          const up = t.pnl >= 0
          return (
            <div key={t.id} className="pointer-events-auto flex items-center gap-3 bg-white border border-black/10 shadow-lg rounded-xl px-4 py-2.5 animate-in fade-in slide-in-from-top-2">
              {t.image && <Skin mk={t.key} img={t.image} className="w-9 h-7 shrink-0" />}
              <div className="text-sm">
                <span className="font-semibold">{t.name}</span>
                <span className="text-[#0e1512]/40"> — {t.reason === "Liquidated" ? "liquidated" : "closed"}</span>
              </div>
              <div className="text-xs font-mono text-[#0e1512]/50">@ {money(t.exit)}</div>
              <div className={`text-sm font-mono font-semibold ${up ? "text-[#5f7a05]" : "text-red-600"}`}>{up ? "+" : ""}{money(t.pnl)}</div>
            </div>
          )
        })}
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[300px_1fr_324px]">
        {/* markets */}
        <aside className="hidden lg:flex flex-col border-r border-black/10 min-h-0 bg-white">
          <div className="px-3 py-2.5 text-[11px] uppercase tracking-wider text-[#0e1512]/40 border-b border-black/10 shrink-0">Markets</div>
          <div className="flex-1 overflow-y-auto no-scrollbar no-scrollbar">
            {markets.map((m) => (
              <button key={m.key} onClick={() => setSelected(m.key)}
                className={`w-full flex items-center gap-3 px-3 py-3 text-left border-l-2 transition-colors ${selected === m.key ? "bg-[#CDF60A]/10 border-[#CDF60A]" : "border-transparent hover:bg-black/5"}`}>
                <Skin mk={m.key} img={m.image} icon={m.icon} className="w-14 h-10" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium truncate flex items-center gap-1.5">
                    <span className="truncate">{m.name}</span>
                    {m.wear && <span className="shrink-0 text-[9px] font-semibold tracking-wide px-1 py-px rounded bg-black/10 text-[#0e1512]/45">{m.wear}</span>}
                  </div>
                  <div className="font-mono text-sm">{money(m.price)}</div>
                </div>
                <div className={`text-[11px] font-mono ${m.change24h >= 0 ? "text-[#5f7a05]" : "text-red-600"}`}>{m.change24h >= 0 ? "+" : ""}{fmt(m.change24h, 1)}%</div>
              </button>
            ))}
          </div>
        </aside>

        {/* center */}
        <main className="flex flex-col min-h-0">
          <div className="flex-1 min-h-0 flex flex-col border-b border-black/10">
            <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-black/5 flex-wrap">
              {selMarket && <Skin mk={selMarket.key} img={selMarket.image} icon={selMarket.icon} className="w-14 h-10" />}
              <div>
                <div className="font-semibold leading-tight flex items-center gap-2">
                  {selMarket?.name ?? "—"}
                  {selMarket?.wear && (
                    <span className="text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded bg-black/10 text-[#0e1512]/60 border border-black/10">{selMarket.wear}</span>
                  )}
                </div>
                <div className="text-[#0e1512]/40 text-xs">CSL Perp · {wearFull(selMarket?.wear)} · USDG-settled · since {releaseYear(selected)}</div>
              </div>
              <div className="ml-auto flex items-center gap-6">
                <MiniStat label="Funding / 1h" value={`${funding >= 0 ? "+" : ""}${fmt(funding * 100, 4)}%`} cls={funding >= 0 ? "text-[#5f7a05]" : "text-red-600"} />
                <MiniStat label="Next funding" value={hms(countdown)} />
                <div className="text-right">
                  <div className="font-mono text-2xl font-bold leading-none">{money(mark)}</div>
                  <div className={`text-xs font-mono ${dayUp ? "text-[#5f7a05]" : "text-red-600"}`}>{dayUp ? "+" : ""}{fmt(selMarket?.change24h ?? 0, 2)}% 24h</div>
                </div>
              </div>
            </div>
            {/* timeframe selector */}
            <div className="shrink-0 flex items-center gap-1 px-4 py-1.5 border-b border-black/5">
              {TFS.map((t) => (
                <button key={t} onClick={() => setChartTf(t)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded transition-colors ${chartTf === t ? "bg-black/10 text-[#0e1512]" : "text-[#0e1512]/40 hover:text-[#0e1512]/70"}`}>{t}</button>
              ))}
              <span className="ml-2 text-[11px] text-[#0e1512]/25">scroll to zoom · drag to pan</span>
            </div>
            <div className="flex-1 min-h-0"><CandleChart candles={candles} live={liveCandle} mode="line" /></div>
          </div>

          {/* positions — Hyperliquid style */}
          <div className="h-[200px] shrink-0 overflow-y-auto no-scrollbar bg-[#fbfaf7]">
            <div className="flex items-center gap-5 px-4 py-2.5 border-b border-black/10 sticky top-0 bg-[#fbfaf7] z-10">
              <button onClick={() => setBottomTab("positions")} className={`text-[13px] pb-2 -mb-[10px] border-b-2 transition-colors ${bottomTab === "positions" ? "font-semibold text-[#0e1512] border-[#CDF60A]" : "font-medium text-[#0e1512]/40 border-transparent hover:text-[#0e1512]/70"}`}>Positions <span className="text-[#0e1512]/40">{positions.length}</span></button>
              <button onClick={() => setBottomTab("orders")} className={`text-[13px] pb-2 -mb-[10px] border-b-2 transition-colors ${bottomTab === "orders" ? "font-semibold text-[#0e1512] border-[#CDF60A]" : "font-medium text-[#0e1512]/40 border-transparent hover:text-[#0e1512]/70"}`}>Open Orders <span className="text-[#0e1512]/40">{openOrders.length}</span></button>
              <button onClick={() => setBottomTab("history")} className={`text-[13px] pb-2 -mb-[10px] border-b-2 transition-colors ${bottomTab === "history" ? "font-semibold text-[#0e1512] border-[#CDF60A]" : "font-medium text-[#0e1512]/40 border-transparent hover:text-[#0e1512]/70"}`}>Trade History</button>
            </div>
            {bottomTab === "positions" && (positions.length === 0 ? (
              <div className="px-4 py-8 text-center text-[#0e1512]/25 text-sm">No open positions</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#0e1512]/40 text-[11px] uppercase">
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
                      <tr key={p.id} className="border-t border-black/5">
                        <td className="px-4 py-2"><button onClick={() => setSelected(p.key)} className="flex items-center gap-2 hover:opacity-70 transition-opacity text-left"><Skin mk={p.key} img={p.image} className="w-8 h-6" /><span className="text-xs truncate max-w-[130px] underline decoration-black/15 hover:decoration-black/40">{p.name}</span></button></td>
                        <td className="px-2"><span className={`text-xs font-semibold ${p.side === "long" ? "text-[#5f7a05]" : "text-red-600"}`}>{p.side === "long" ? "LONG" : "SHORT"} {p.leverage}x</span></td>
                        <td className="px-2 text-right font-mono text-xs">{money(p.notional)}</td>
                        <td className="px-2 text-right font-mono text-xs">{money(p.entry)}</td>
                        <td className="px-2 text-right font-mono text-xs text-amber-600/80">{money(p.liq)}</td>
                        <td className={`px-2 text-right font-mono text-xs ${up ? "text-[#5f7a05]" : "text-red-600"}`}>{up ? "+" : ""}{money(pnl)} <span className="opacity-70">({up ? "+" : ""}{fmt(roe)}%)</span></td>
                        <td className="px-2 text-right"><div className="flex items-center justify-end gap-1">
                          <button onClick={() => setShareCard({ key: p.key, name: p.name, side: p.side, leverage: p.leverage, entry: p.entry, mark: priceMap.current.get(p.key) ?? p.entry })} className="text-[#0e1512]/40 hover:text-[#0e1512] p-1"><Share2 size={14} /></button>
                          <button onClick={() => setCloseConfirmId(p.id)} className="text-[#0e1512]/40 hover:text-[#0e1512] p-1"><X size={14} /></button>
                        </div></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ))}

            {bottomTab === "orders" && (openOrders.length === 0 ? (
              <div className="px-4 py-8 text-center text-[#0e1512]/25 text-sm">No open orders</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#0e1512]/40 text-[11px] uppercase">
                    <th className="text-left font-medium px-4 py-2">Market</th>
                    <th className="text-left font-medium px-2">Side</th>
                    <th className="text-right font-medium px-2">Size</th>
                    <th className="text-right font-medium px-2">Limit price</th>
                    <th className="px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {openOrders.map((o) => {
                    const mkt = markets.find((m) => m.key === o.key)
                    return (
                      <tr key={o.id} className="border-t border-black/5">
                        <td className="px-4 py-2"><button onClick={() => setSelected(o.key)} className="flex items-center gap-2 hover:opacity-70 transition-opacity text-left">{mkt && <Skin mk={mkt.key} img={mkt.image} className="w-8 h-6" />}<span className="text-xs truncate max-w-[130px] underline decoration-black/15 hover:decoration-black/40">{mkt?.name ?? o.key}</span></button></td>
                        <td className="px-2"><span className={`text-xs font-semibold ${o.side === "long" ? "text-[#5f7a05]" : "text-red-600"}`}>{o.side === "long" ? "LONG" : "SHORT"} {o.leverage}x</span></td>
                        <td className="px-2 text-right font-mono text-xs">{money(Number(o.collateral) * Number(o.leverage))}</td>
                        <td className="px-2 text-right font-mono text-xs">{money(Number(o.limit_price))}</td>
                        <td className="px-2 text-right"><button onClick={() => setCancelConfirmId(o.id)} className="text-[#0e1512]/40 hover:text-[#0e1512] p-1"><X size={14} /></button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ))}

            {bottomTab === "history" && (history.length === 0 ? (
              <div className="px-4 py-8 text-center text-[#0e1512]/25 text-sm">No closed trades yet</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#0e1512]/40 text-[11px] uppercase">
                    <th className="text-left font-medium px-4 py-2">Market</th>
                    <th className="text-left font-medium px-2">Side</th>
                    <th className="text-right font-medium px-2">Entry</th>
                    <th className="text-right font-medium px-2">Exit</th>
                    <th className="text-right font-medium px-2">PnL</th>
                    <th className="text-right font-medium px-4">Closed</th>
                    <th className="px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 30).map((t: any) => (
                    <tr key={t.id} className="border-t border-black/5">
                      <td className="px-4 py-2"><button onClick={() => setSelected(t.key)} className="flex items-center gap-2 hover:opacity-70 transition-opacity text-left">{t.image && <Skin mk={t.key} img={t.image} className="w-8 h-6" />}<span className="text-xs truncate max-w-[130px] underline decoration-black/15 hover:decoration-black/40">{t.name}</span></button></td>
                      <td className="px-2"><span className={`text-xs font-semibold ${t.side === "long" ? "text-[#5f7a05]" : "text-red-600"}`}>{t.side === "long" ? "LONG" : "SHORT"} {t.leverage}x</span></td>
                      <td className="px-2 text-right font-mono text-xs">{money(t.entry)}</td>
                      <td className="px-2 text-right font-mono text-xs">{money(t.exit)}</td>
                      <td className={`px-2 text-right font-mono text-xs ${Number(t.pnl) >= 0 ? "text-[#5f7a05]" : "text-red-600"}`}>{Number(t.pnl) >= 0 ? "+" : ""}{money(t.pnl)}</td>
                      <td className="px-4 text-right text-xs text-[#0e1512]/30">{new Date(t.closedAt).toLocaleString()}</td>
                      <td className="px-2 text-right"><button onClick={() => setShareCard({ key: t.key, name: t.name, side: t.side, leverage: t.leverage, entry: Number(t.entry), mark: Number(t.exit) })} className="text-[#0e1512]/40 hover:text-[#0e1512] p-1"><Share2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
          </div>
        </main>

        {/* order panel */}
        <aside className="border-l border-black/10 overflow-y-auto no-scrollbar bg-white p-3">
          <div className="grid grid-cols-2 gap-2 mb-2 bg-black/5 p-1 rounded-lg">
            <button onClick={() => setCollateralAsset("USDG")} className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md font-semibold text-xs transition-colors ${collateralAsset === "USDG" ? "bg-white shadow-sm text-[#0e1512]" : "text-[#0e1512]/50 hover:text-[#0e1512]/80"}`}>USDG</button>
            <button
              onClick={() => { setTradeErr("$CSL collateral is coming soon"); setTimeout(() => setTradeErr(null), 2500) }}
              title="Coming soon — $CSL collateral will feed the burn"
              className="flex items-center justify-center gap-1.5 py-1.5 rounded-md font-semibold text-xs text-[#0e1512]/30 cursor-not-allowed"
            >$CSL <span className="text-[9px] bg-black/10 text-[#0e1512]/40 px-1.5 py-0.5 rounded-full font-medium normal-case">Soon</span></button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4 bg-black/5 p-1 rounded-lg">
            <button onClick={() => setSide("long")} className={`flex items-center justify-center gap-1.5 py-2 rounded-md font-semibold text-sm transition-colors ${side === "long" ? "bg-[#CDF60A] text-[#0e1512]" : "text-[#0e1512]/60 hover:text-[#0e1512]"}`}><TrendingUp size={16} /> Long</button>
            <button onClick={() => setSide("short")} className={`flex items-center justify-center gap-1.5 py-2 rounded-md font-semibold text-sm transition-colors ${side === "short" ? "bg-red-500 text-white" : "text-[#0e1512]/60 hover:text-[#0e1512]"}`}><TrendingDown size={16} /> Short</button>
          </div>

          <div className="flex gap-4 mb-3 border-b border-black/10">
            <button onClick={() => setOrderType("market")} className={`text-xs font-semibold pb-2 -mb-px border-b-2 transition-colors ${orderType === "market" ? "border-[#0e1512] text-[#0e1512]" : "border-transparent text-[#0e1512]/40 hover:text-[#0e1512]/70"}`}>Market</button>
            <button onClick={() => setOrderType("limit")} className={`text-xs font-semibold pb-2 -mb-px border-b-2 transition-colors ${orderType === "limit" ? "border-[#0e1512] text-[#0e1512]" : "border-transparent text-[#0e1512]/40 hover:text-[#0e1512]/70"}`}>Limit</button>
          </div>

          {authenticated && (
            <div className="flex items-center justify-between text-xs mb-2"><span className="text-[#0e1512]/40">Available</span><span className="font-mono">{money(balance)}</span></div>
          )}

          {orderType === "limit" && (
            <>
              <label className="text-[11px] text-[#0e1512]/40 uppercase tracking-wider">Limit price</label>
              <div className="mt-1 mb-2 flex items-center rounded-lg bg-black/5 border border-black/10 px-3 focus-within:border-black/25">
                <span className="text-[#0e1512]/40 text-sm mr-1">$</span>
                <input type="number" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} placeholder={mark ? fmt(mark) : "0.00"} className="flex-1 bg-transparent py-2.5 outline-none font-mono min-w-0" />
                <button onClick={() => setLimitPrice(fmt(mark))} className="text-[11px] text-[#5f7a05] hover:text-[#5f7a05] font-semibold">MARK</button>
              </div>
              <div className="text-[11px] text-[#0e1512]/35 mb-2">
                Fills when the mark {side === "long" ? "drops to or below" : "rises to or above"} this price. Collateral is reserved until then.
              </div>
            </>
          )}

          <label className="text-[11px] text-[#0e1512]/40 uppercase tracking-wider">Collateral</label>
          <div className="mt-1 mb-2 flex items-center rounded-lg bg-black/5 border border-black/10 px-3 focus-within:border-black/25">
            <input type="number" value={collateral} onChange={(e) => setCollateral(e.target.value)} className="flex-1 bg-transparent py-2.5 outline-none font-mono min-w-0" />
            <button onClick={() => setCollateral(String(Math.floor(balance)))} className="text-[11px] text-[#5f7a05] hover:text-[#5f7a05] font-semibold mr-2">MAX</button>
            <span className="text-[#0e1512]/40 text-sm">USDG</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 mb-4">
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <button key={pct} onClick={() => setCollateral(String(Math.floor(balance * pct)))} className="text-[11px] py-1.5 rounded bg-black/5 hover:bg-black/10 text-[#0e1512]/60">{pct * 100}%</button>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs mb-2"><span className="text-[#0e1512]/40 uppercase tracking-wider">Leverage</span><span className="font-mono font-semibold text-[#5f7a05] flex items-center gap-1"><Zap size={12} />{leverage}x</span></div>
          <input type="range" min={1} max={20} value={leverage} onChange={(e) => setLeverage(Number(e.target.value))} className="w-full accent-[#CDF60A] mb-2" />
          <div className="grid grid-cols-6 gap-1 mb-4">
            {LEV_MARKS.map((v) => (
              <button key={v} onClick={() => setLeverage(v)} className={`text-[11px] py-1 rounded transition-colors ${leverage === v ? "bg-[#CDF60A] text-[#0e1512] font-semibold" : "bg-black/5 hover:bg-black/10 text-[#0e1512]/60"}`}>{v}x</button>
            ))}
          </div>

          <div className="space-y-1.5 text-xs mb-4 rounded-lg bg-black/[0.03] border border-black/5 p-3">
            <Row label="Order value" value={money(notional)} />
            <Row label={orderType === "limit" ? "Limit price" : "Entry price"} value={money(orderType === "limit" ? limitPx : mark)} />
            <Row label="Est. liquidation" value={money(mark > 0 ? liqPrice(orderType === "limit" && limitPx > 0 ? limitPx : mark, side, leverage) : 0)} valueClass="text-amber-600" />
            <Row label="Funding / 1h" value={`${funding >= 0 ? "+" : ""}${fmt(funding * 100, 4)}%`} valueClass={funding >= 0 ? "text-[#5f7a05]" : "text-red-600"} />
            <Row label="Taker fee" value={money(fee)} />
          </div>

          {tradeErr && <div className="mb-2 text-xs text-red-600 text-center">{tradeErr}</div>}
          {authenticated ? (
            <button onClick={submitOrder} disabled={!canOpen}
              className={`w-full h-11 font-bold text-base rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${side === "long" ? "bg-[#CDF60A] hover:bg-[#d9fa3a] text-[#0e1512]" : "bg-red-500 hover:bg-red-400 text-white"}`}>
              {orderType === "limit"
                ? (col > balance ? "Insufficient balance" : limitPx <= 0 ? "Enter a limit price" : `Place ${side === "long" ? "Long" : "Short"} Limit · ${leverage}x`)
                : (col + fee > balance ? "Insufficient balance" : `Open ${side === "long" ? "Long" : "Short"} · ${leverage}x`)}
            </button>
          ) : (
            <button onClick={() => openConnectModal?.()}
              className="w-full h-11 font-bold text-base rounded-lg bg-[#CDF60A] hover:bg-[#d9fa3a] text-[#0e1512] transition-colors">
              Connect wallet to trade
            </button>
          )}
        </aside>
      </div>

      {/* Hyperliquid-style scrolling price ticker */}
      <div className="shrink-0 h-9 border-t border-black/10 bg-[#fbfaf7] overflow-hidden flex items-center">
        <div className="flex items-center gap-8 whitespace-nowrap animate-marquee">
          {[...markets, ...markets].map((m, i) => (
            <button key={m.key + i} onClick={() => setSelected(m.key)} className="flex items-center gap-2 text-xs hover:opacity-80 transition-opacity">
              <span className="text-[#0e1512]/60">{m.name}</span>
              <span className="font-mono text-[#0e1512]">{money(m.price)}</span>
              <span className={`font-mono ${m.change24h >= 0 ? "text-[#5f7a05]" : "text-red-600"}`}>{m.change24h >= 0 ? "+" : ""}{fmt(m.change24h, 2)}%</span>
            </button>
          ))}
        </div>
      </div>

      {/* close-position confirmation — Hyperliquid-style: never close on a single click */}
      {closeConfirmId && (() => {
        const p = positions.find((x) => x.id === closeConfirmId)
        if (!p) { setCloseConfirmId(null); return null }
        const { pnl } = posPnl(p)
        const up = pnl >= 0
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setCloseConfirmId(null)}>
            <div className="w-full max-w-[380px] rounded-2xl border border-black/10 bg-white p-6" onClick={(e) => e.stopPropagation()}>
              <div className="font-semibold text-lg mb-1">Close position?</div>
              <div className="text-xs text-[#0e1512]/40 mb-4">This settles your PnL immediately at the current mark.</div>
              <div className="rounded-lg bg-black/[0.03] border border-black/5 p-3 mb-5 space-y-1.5 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Skin mk={p.key} img={p.image} className="w-9 h-7" />
                  <span className="font-medium text-sm">{p.name}</span>
                  <span className={`text-xs font-semibold ml-auto ${p.side === "long" ? "text-[#5f7a05]" : "text-red-600"}`}>{p.side === "long" ? "LONG" : "SHORT"} {p.leverage}x</span>
                </div>
                <Row label="Size" value={money(p.notional)} />
                <Row label="Entry" value={money(p.entry)} />
                <Row label="PnL" value={`${up ? "+" : ""}${money(pnl)}`} valueClass={up ? "text-[#5f7a05]" : "text-red-600"} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCloseConfirmId(null)} className="flex-1 h-10 rounded-lg bg-black/5 hover:bg-black/10 text-sm font-semibold">Cancel</button>
                <button onClick={() => { closePosition(p.id); setCloseConfirmId(null) }} className="flex-1 h-10 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-semibold">Confirm Close</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* cancel-limit-order confirmation */}
      {cancelConfirmId && (() => {
        const o = openOrders.find((x) => x.id === cancelConfirmId)
        if (!o) { setCancelConfirmId(null); return null }
        const mkt = markets.find((m) => m.key === o.key)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setCancelConfirmId(null)}>
            <div className="w-full max-w-[380px] rounded-2xl border border-black/10 bg-white p-6" onClick={(e) => e.stopPropagation()}>
              <div className="font-semibold text-lg mb-1">Cancel order?</div>
              <div className="text-xs text-[#0e1512]/40 mb-4">Reserved collateral is returned to your balance.</div>
              <div className="rounded-lg bg-black/[0.03] border border-black/5 p-3 mb-5 space-y-1.5 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  {mkt && <Skin mk={mkt.key} img={mkt.image} className="w-9 h-7" />}
                  <span className="font-medium text-sm">{mkt?.name ?? o.key}</span>
                  <span className={`text-xs font-semibold ml-auto ${o.side === "long" ? "text-[#5f7a05]" : "text-red-600"}`}>{o.side === "long" ? "LONG" : "SHORT"} {o.leverage}x</span>
                </div>
                <Row label="Reserved collateral" value={money(Number(o.collateral))} />
                <Row label="Limit price" value={money(Number(o.limit_price))} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCancelConfirmId(null)} className="flex-1 h-10 rounded-lg bg-black/5 hover:bg-black/10 text-sm font-semibold">Keep order</button>
                <button
                  onClick={async () => {
                    try {
                      const token = await getToken()
                      await fetch(`${API}/api/trade/limit/${o.id}`, { method: "DELETE", headers: authHeader(token) })
                      await refreshAccount()
                    } catch {}
                    setCancelConfirmId(null)
                  }}
                  className="flex-1 h-10 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-semibold"
                >Confirm Cancel</button>
              </div>
            </div>
          </div>
        )
      })()}

      {shareCard && <PnLCardModal data={shareCard} onClose={() => setShareCard(null)} />}
    </div>
  )
}

function PCard({ label, value, cls = "" }: { label: string; value: string; cls?: string }) {
  return (
    <div className="rounded-xl bg-black/[0.04] border border-black/5 p-3">
      <div className="text-[10px] uppercase tracking-wider text-[#0e1512]/40 mb-1">{label}</div>
      <div className={`font-mono font-semibold text-sm ${cls}`}>{value}</div>
    </div>
  )
}

function MiniStat({ label, value, cls = "" }: { label: string; value: string; cls?: string }) {
  return <div className="text-right"><div className="text-[#0e1512]/40 text-[10px] uppercase tracking-wider">{label}</div><div className={`font-mono text-sm ${cls}`}>{value}</div></div>
}
function Row({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return <div className="flex items-center justify-between"><span className="text-[#0e1512]/40">{label}</span><span className={`font-mono ${valueClass}`}>{value}</span></div>
}

/* the wear this market's price is pinned to — spelled out under the title */
function wearFull(w?: string): string {
  switch (w) {
    case "FN": return "Factory New"
    case "MW": return "Minimal Wear"
    case "FT": return "Field-Tested"
    case "WW": return "Well-Worn"
    case "BS": return "Battle-Scarred"
    default: return "Field-Tested"
  }
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
    case "bad_address": return "Invalid Robinhood Chain address"
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
