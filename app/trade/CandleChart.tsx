"use client"

import { useEffect, useRef } from "react"

export type Candle = { time: number; open: number; high: number; low: number; close: number }

export type PositionLine = { price: number; color: string; title: string }

// SSR-safe TradingView lightweight-charts chart.
// - `candles` : full series, re-applied via setData whenever its reference changes
// - `live`    : latest forming candle, applied via series.update on each tick
// - `mode`    : "candles" for intraday tick data (real OHLC), "line" for daily/
//               weekly history that only has one price per bucket (drawing
//               those as candlesticks produces the flat sticks / dots you saw)
// - `positionLines` : horizontal dashed lines for an open position on this
//               market (entry + liquidation), the way Hyperliquid and most
//               perp exchanges mark where you're actually positioned.
export default function CandleChart({ candles, live, mode = "candles", positionLines }: { candles: Candle[]; live?: Candle | null; mode?: "candles" | "line"; positionLines?: PositionLine[] }) {
  const elRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const seriesRef = useRef<any>(null)
  const modeRef = useRef<"candles" | "line">(mode)
  const dataRef = useRef<Candle[]>(candles)
  const didInitData = useRef(false)
  const priceLinesRef = useRef<any[]>([])

  const applyPositionLines = (series: any, lines: PositionLine[] | undefined) => {
    for (const l of priceLinesRef.current) { try { series.removePriceLine(l) } catch {} }
    priceLinesRef.current = []
    if (!series || !lines) return
    for (const l of lines) {
      if (!Number.isFinite(l.price) || l.price <= 0) continue
      try {
        priceLinesRef.current.push(series.createPriceLine({
          price: l.price,
          color: l.color,
          lineWidth: 1,
          lineStyle: 2, // dashed
          axisLabelVisible: true,
          title: l.title,
        }))
      } catch {}
    }
  }

  dataRef.current = candles
  modeRef.current = mode
  const positionLinesRef2 = useRef<PositionLine[] | undefined>(positionLines)
  positionLinesRef2.current = positionLines

  const applyData = (series: any, arr: Candle[], m: "candles" | "line") => {
    if (m === "line") {
      // area needs {time, value}; use close as the single daily price
      series.setData(arr.map((c) => ({ time: c.time, value: c.close })) as any)
    } else {
      series.setData(arr as any)
    }
  }

  const makeSeries = (chart: any, m: "candles" | "line") => {
    if (m === "line") {
      return chart.addAreaSeries({
        lineColor: "#8fb400",
        topColor: "rgba(205,246,10,0.28)",
        bottomColor: "rgba(205,246,10,0.02)",
        lineWidth: 2,
        priceLineVisible: true,
        priceFormat: { type: "price", precision: 2, minMove: 0.01 },
      })
    }
    return chart.addCandlestickSeries({
      upColor: "#8fb400", downColor: "#ef4444",
      borderUpColor: "#8fb400", borderDownColor: "#ef4444",
      wickUpColor: "#8fb400", wickDownColor: "#ef4444",
      priceFormat: { type: "price", precision: 2, minMove: 0.01 },
    })
  }

  useEffect(() => {
    let disposed = false
    ;(async () => {
      const LWC = await import("lightweight-charts")
      if (disposed || !elRef.current) return
      const chart = LWC.createChart(elRef.current, {
        autoSize: true,
        layout: { background: { color: "transparent" }, textColor: "#5b6470", fontSize: 11, fontFamily: "ui-monospace, monospace" },
        grid: {
          vertLines: { color: "rgba(0,0,0,0.05)" },
          horzLines: { color: "rgba(0,0,0,0.05)" },
        },
        rightPriceScale: { borderColor: "rgba(0,0,0,0.10)", scaleMargins: { top: 0.06, bottom: 0.04 } },
        timeScale: {
          borderColor: "rgba(0,0,0,0.10)",
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 1,
          barSpacing: 6,
          minBarSpacing: 0.5,
          // was fixLeftEdge/fixRightEdge: true — that PINNED the visible range
          // to whatever was initially loaded, so panning left to see earlier
          // history was physically blocked even when the data existed.
          fixLeftEdge: false,
          fixRightEdge: false,
        },
        crosshair: {
          mode: LWC.CrosshairMode.Normal,
          vertLine: { color: "rgba(0,0,0,0.25)", labelBackgroundColor: "#0e1512" },
          horzLine: { color: "rgba(0,0,0,0.25)", labelBackgroundColor: "#0e1512" },
        },
        handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true },
      })
      const series = makeSeries(chart, modeRef.current)
      ;(series as any).__mode = modeRef.current
      chartRef.current = chart
      seriesRef.current = series
      applyPositionLines(series, positionLinesRef2.current)
      if (dataRef.current?.length) {
        applyData(series, dataRef.current, modeRef.current)
        fitView(chart, dataRef.current.length)
        didInitData.current = true
      }
    })()
    return () => {
      disposed = true
      chartRef.current?.remove?.()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  // re-apply full data on market / timeframe switch, rebuilding the series if
  // the chart type changed (candles <-> line)
  useEffect(() => {
    const ch = chartRef.current
    if (!ch || !candles?.length) return
    // series type must match the current mode; if not, swap it out
    if ((seriesRef.current as any)?.__mode !== mode) {
      try { if (seriesRef.current) ch.removeSeries(seriesRef.current) } catch {}
      const s = makeSeries(ch, mode)
      ;(s as any).__mode = mode
      seriesRef.current = s
      applyPositionLines(s, positionLinesRef2.current)
    }
    applyData(seriesRef.current, candles, mode)
    fitView(ch, candles.length)
    didInitData.current = true
  }, [candles, mode])

  // entry/liquidation lines for whatever position is open on this market —
  // reapply whenever they change (position opened/closed, market switched)
  useEffect(() => {
    if (!seriesRef.current) return
    applyPositionLines(seriesRef.current, positionLines)
  }, [positionLines])

  // live forming-candle updates (only meaningful for candle mode)
  useEffect(() => {
    if (!seriesRef.current || !live || !didInitData.current) return
    if (modeRef.current === "line") seriesRef.current.update({ time: live.time, value: live.close } as any)
    else seriesRef.current.update(live as any)
  }, [live])

  return <div ref={elRef} className="w-full h-full" />
}

function fitView(chart: any, n: number) {
  chart.priceScale("right").applyOptions({ autoScale: true })
  // Previously always called fitContent(), which squeezes however many bars
  // exist into the same screen width — a 5-bar 1D chart and a 100-bar 15m
  // chart ended up looking the same width, just with wildly different bar
  // spacing. Show a consistent recent WINDOW instead: the last ~60 bars at a
  // readable width. Shorter datasets still fit fully (nothing to scroll to
  // yet); longer ones show a real recent slice, and panning left reaches
  // the rest — exactly what fixLeftEdge/fixRightEdge:false was for.
  const WINDOW = 60
  if (n <= WINDOW) {
    chart.timeScale().fitContent()
  } else {
    chart.timeScale().setVisibleLogicalRange({ from: n - WINDOW, to: n - 1 })
  }
}
