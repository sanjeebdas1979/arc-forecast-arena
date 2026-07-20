"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type BtcTimeframe = "1m" | "5m" | "15m" | "1h";

export type BtcCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type BtcPriceData = {
  price: number;
  change24h: number;
  updatedAt: number;
};

type BtcPriceContextValue = {
  data: BtcPriceData | null;
  candles: BtcCandle[];
  timeframe: BtcTimeframe;
  setTimeframe: (timeframe: BtcTimeframe) => void;
  isLoading: boolean;
  error: string;
  isConnected: boolean;
  refreshPrice: () => void;
};

type BinanceStreamMessage = {
  stream?: string;
  data?: {
    E?: number;
    c?: string;
    o?: string;
    k?: {
      t: number;
      o: string;
      h: string;
      l: string;
      c: string;
    };
  };
};

type HistoryResponse = {
  interval: BtcTimeframe;
  candles: BtcCandle[];
};

const BtcPriceContext =
  createContext<BtcPriceContextValue | null>(null);

const MAX_CANDLES = 120;
const RECONNECT_DELAY = 3000;

export function BtcPriceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [data, setData] = useState<BtcPriceData | null>(null);
  const [candles, setCandles] = useState<BtcCandle[]>([]);
  const [timeframe, setTimeframe] =
    useState<BtcTimeframe>("1m");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(
          `/api/btc-klines?interval=${timeframe}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Historical BTC data request failed.");
        }

        const result =
          (await response.json()) as HistoryResponse;

        if (!cancelled) {
          setCandles(result.candles.slice(-MAX_CANDLES));
        }
      } catch {
        if (!cancelled) {
          setError("BTC candle history is temporarily unavailable.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [timeframe]);

  useEffect(() => {
    let shouldReconnect = true;

    const connect = () => {
      setError("");

      const streamUrl =
        `wss://stream.binance.com:9443/stream?streams=` +
        `btcusdt@kline_${timeframe}/btcusdt@miniTicker`;

      const socket = new WebSocket(streamUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        setError("");
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(
            event.data
          ) as BinanceStreamMessage;

          if (
            message.stream ===
              `btcusdt@kline_${timeframe}` &&
            message.data?.k
          ) {
            const kline = message.data.k;

            const candle: BtcCandle = {
              time: Math.floor(kline.t / 1000),
              open: Number(kline.o),
              high: Number(kline.h),
              low: Number(kline.l),
              close: Number(kline.c),
            };

            if (
              Object.values(candle).some(
                (value) => !Number.isFinite(value)
              )
            ) {
              return;
            }

            setCandles((currentCandles) => {
              const lastCandle =
                currentCandles[currentCandles.length - 1];

              if (lastCandle?.time === candle.time) {
                return [
                  ...currentCandles.slice(0, -1),
                  candle,
                ];
              }

              return [...currentCandles, candle].slice(
                -MAX_CANDLES
              );
            });

            setData((currentData) => ({
              price: candle.close,
              change24h: currentData?.change24h ?? 0,
              updatedAt: message.data?.E ?? Date.now(),
            }));
          }

          if (
            message.stream === "btcusdt@miniTicker" &&
            message.data?.c &&
            message.data?.o
          ) {
            const closePrice = Number(message.data.c);
            const openPrice = Number(message.data.o);

            if (
              !Number.isFinite(closePrice) ||
              !Number.isFinite(openPrice) ||
              openPrice === 0
            ) {
              return;
            }

            const change24h =
              ((closePrice - openPrice) / openPrice) * 100;

            setData({
              price: closePrice,
              change24h,
              updatedAt: message.data?.E ?? Date.now(),
            });
          }
        } catch {
          setError("BTC live data could not be processed.");
        }
      };

      socket.onerror = () => {
        setError("BTC live connection is temporarily unavailable.");
      };

      socket.onclose = () => {
        setIsConnected(false);

        if (shouldReconnect) {
          reconnectTimerRef.current = setTimeout(
            connect,
            RECONNECT_DELAY
          );
        }
      };
    };

    connect();

    return () => {
      shouldReconnect = false;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [timeframe]);

  const refreshPrice = () => {
    socketRef.current?.close();
  };

  const value = useMemo(
    () => ({
      data,
      candles,
      timeframe,
      setTimeframe,
      isLoading,
      error,
      isConnected,
      refreshPrice,
    }),
    [
      data,
      candles,
      timeframe,
      isLoading,
      error,
      isConnected,
    ]
  );

  return (
    <BtcPriceContext.Provider value={value}>
      {children}
    </BtcPriceContext.Provider>
  );
}

export function useBtcPrice(): BtcPriceContextValue {
  const context = useContext(BtcPriceContext);

  if (!context) {
    throw new Error(
      "useBtcPrice must be used inside BtcPriceProvider."
    );
  }

  return context;
}