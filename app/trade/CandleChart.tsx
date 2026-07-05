"use client"

import { useEffect, useRef } from "react"

export type Candle = { time: number; open: number; high: number; low: number; close: number }

// SSR-safe TradingView lightweight-charts candlestick chart.
// - `candles` : full series, re-applied via setData whenever its reference changes
// - `live`    : latest forming candle, applied via series.update on each tick
// Supports mouse-wheel zoom + drag to scroll back through history.
export default function CandleChart({ candles, live }: { candles: Candle[]; live?: Candle | null }) {
  const elRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const seriesRef = useRef<any>(null)
  const roRef = useRef<ResizeObserver | null>(null)
  const dataRef = useRef<Candle[]>(candles)      // always-fresh data for async init
  const didInitData = useRef(false)

  dataRef.current = candles

  useEffect(() => {
    let disposed = false
    ;(async () => {
      const LWC = await import("lightweight-charts")
      if (disposed || !elRef.current) return
      const chart = LWC.createChart(elRef.current, {
        autoSize: true,
        layout: { background: { color: "transparent" }, textColor: "#8b98a9", fontSize: 11, fontFamily: "ui-monospace, monospace" },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.035)" },
          horzLines: { color: "rgba(255,255,255,0.035)" },
        },
        rightPriceScale: { borderColor: "rgba(255,255,255,0.08)", scaleMargins: { top: 0.12, bottom: 0.12 } },
        timeScale: {
          borderColor: "rgba(255,255,255,0.08)",
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 5,
          barSpacing: 9,
          minBarSpacing: 2,
        },
        crosshair: {
          mode: LWC.CrosshairMode.Normal,
          vertLine: { color: "rgba(255,255,255,0.2)", labelBackgroundColor: "#1e293b" },
          horzLine: { color: "rgba(255,255,255,0.2)", labelBackgroundColor: "#1e293b" },
        },
        handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true },
      })
      const series = chart.addCandlestickSeries({
        upColor: "#10b981", downColor: "#ef4444",
        borderUpColor: "#10b981", borderDownColor: "#ef4444",
        wickUpColor: "#10b981", wickDownColor: "#ef4444",
        priceFormat: { type: "price", precision: 2, minMove: 0.01 },
      })
      chartRef.current = chart
      seriesRef.current = series
      if (dataRef.current?.length) {
        series.setData(dataRef.current as any)
        chart.timeScale().scrollToRealTime()
        didInitData.current = true
      }
    })()
    return () => {
      disposed = true
      roRef.current?.disconnect()
      chartRef.current?.remove?.()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  // re-apply full data on market switch / reload
  useEffect(() => {
    if (seriesRef.current && candles?.length) {
      seriesRef.current.setData(candles as any)
      chartRef.current?.timeScale().scrollToRealTime()
      didInitData.current = true
    }
  }, [candles])

  // live forming-candle updates
  useEffect(() => {
    if (seriesRef.current && live && didInitData.current) seriesRef.current.update(live as any)
  }, [live])

  return <div ref={elRef} className="w-full h-full" />
}
