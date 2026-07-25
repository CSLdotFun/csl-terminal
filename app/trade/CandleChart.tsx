"use client"

import { useEffect, useRef } from "react"

export type Candle = { time: number; open: number; high: number; low: number; close: number }

// SSR-safe TradingView lightweight-charts chart.
// - `candles` : full series, re-applied via setData whenever its reference changes
// - `live`    : latest forming candle, applied via series.update on each tick
// - `mode`    : "candles" for intraday tick data (real OHLC), "line" for daily/
//               weekly history that only has one price per bucket (drawing
//               those as candlesticks produces the flat sticks / dots you saw)
export default function CandleChart({ candles, live, mode = "candles" }: { candles: Candle[]; live?: Candle | null; mode?: "candles" | "line" }) {
  const elRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const seriesRef = useRef<any>(null)
  const modeRef = useRef<"candles" | "line">(mode)
  const dataRef = useRef<Candle[]>(candles)
  const didInitData = useRef(false)

  dataRef.current = candles
  modeRef.current = mode

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
          fixLeftEdge: true,
          fixRightEdge: true,
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
    }
    applyData(seriesRef.current, candles, mode)
    fitView(ch, candles.length)
    didInitData.current = true
  }, [candles, mode])

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
  // Always stretch the full series edge-to-edge so the chart fills the whole
  // width — no empty gap on the left, no big pad on the right. fixLeftEdge /
  // fixRightEdge (set on the timeScale) keep it pinned when the user pans.
  chart.timeScale().fitContent()
}
