"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";

import {
  useBtcPrice,
  type BtcTimeframe,
} from "../providers/BtcPriceProvider";

export default function BtcPriceChart() {
  const {
  candles,
  data,
  isLoading,
  error,
  isConnected,
  timeframe,
  setTimeframe,
} = useBtcPrice();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const candleSeriesRef =
    useRef<ISeriesApi<"Candlestick"> | null>(null);

   const initializedDataRef = useRef(false);
    const activeTimeframeRef =
  useRef<BtcTimeframe | null>(null);

  // Create the TradingView chart once.
  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 360,

      layout: {
        background: {
          type: ColorType.Solid,
          color: "#11151b",
        },
        textColor: "#94a3b8",
      },

      grid: {
        vertLines: {
          color: "rgba(148, 163, 184, 0.08)",
        },
        horzLines: {
          color: "rgba(148, 163, 184, 0.08)",
        },
      },

      crosshair: {
        mode: CrosshairMode.Normal,
      },

      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.20)",
        scaleMargins: {
          top: 0.12,
          bottom: 0.12,
        },
      },

      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.20)",
        timeVisible: true,
        secondsVisible: true,
        rightOffset: 4,
        barSpacing: 12,
      },

      handleScroll: true,
      handleScale: true,
    });

    const candleSeries = chart.addSeries(
      CandlestickSeries,
      {
        upColor: "#22c55e",
        downColor: "#ef4444",

        borderUpColor: "#22c55e",
        borderDownColor: "#ef4444",

        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",

        priceFormat: {
          type: "price",
          precision: 2,
          minMove: 0.01,
        },

        priceLineVisible: true,
        lastValueVisible: true,
      }
    );

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    const resizeObserver = new ResizeObserver((entries) => {
      const firstEntry = entries[0];

      if (!firstEntry) {
        return;
      }

      chart.applyOptions({
        width: firstEntry.contentRect.width,
      });
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();

      chartRef.current = null;
      candleSeriesRef.current = null;
      initializedDataRef.current = false;
      activeTimeframeRef.current = null;
    };
  }, []);

  // Load historical candles and safely apply live updates.
useEffect(() => {
  const series = candleSeriesRef.current;

  if (!series || candles.length === 0) {
    return;
  }

  const chartData: CandlestickData<UTCTimestamp>[] =
    candles.map((candle) => ({
      time: candle.time as UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

  const timeframeChanged =
    activeTimeframeRef.current !== timeframe;

  if (
    timeframeChanged ||
    !initializedDataRef.current
  ) {
    series.setData(chartData);

    activeTimeframeRef.current = timeframe;
    initializedDataRef.current = true;

    chartRef.current?.timeScale().fitContent();
    return;
  }

  const latestCandle = chartData.at(-1);

  if (!latestCandle) {
    return;
  }

  try {
    series.update(latestCandle);
    chartRef.current?.timeScale().scrollToRealTime();
  } catch {
    // Historical data may finish loading after a timeframe switch.
    // Resetting the complete series keeps candle times ordered.
    series.setData(chartData);
    chartRef.current?.timeScale().fitContent();
  }
}, [candles, timeframe]);
    
      
      
    

    
  

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/60">
            Live BTC Movement
          </p>

          <h2 className="mt-1 text-xl font-semibold text-white">
            BTC Candlestick Chart
          </h2>
        </div>

        <div className="flex items-center gap-2">

  {(["1m", "5m", "15m", "1h"] as BtcTimeframe[]).map(
    (tf) => (
      <button
        key={tf}
        onClick={() => setTimeframe(tf)}
        className={`rounded-lg px-3 py-1 text-xs transition ${
          timeframe === tf
            ? "bg-orange-500 text-white"
            : "bg-white/5 text-white/60 hover:bg-white/10"
        }`}
      >
        {tf}
      </button>
    )
  )}

  <div className="ml-2 flex items-center gap-2">

    <span
      className={`h-2 w-2 rounded-full ${
        isConnected
          ? "bg-emerald-400"
          : "bg-amber-400"
      }`}
    />

    <span className="text-xs text-white/60">
      Live
    </span>

  </div>

</div>
          
            
              
                
              
            
          

          
          
          
      
      </div>

      <div className="relative mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#11151b]">
        <div
          ref={containerRef}
          className="h-[360px] w-full"
        />

        {isLoading && candles.length === 0 ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#11151b]/80">
            <p className="text-sm text-white/60">
              Connecting to live BTC market data...
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-white/50">
          Binance BTC/USDT • 1-second candles
        </p>

        {data ? (
          <p className="text-xs text-white/60">
            Live price:{" "}
            <span className="font-medium text-white">
              $
              {data.price.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="mt-3 text-xs text-amber-300">
          {error}
        </p>
      ) : null}
    </section>
  );
}