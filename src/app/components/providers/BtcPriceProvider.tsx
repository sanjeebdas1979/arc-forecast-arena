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

function mergeCandle(
  currentCandles: BtcCandle[],
  incomingCandle: BtcCandle
): BtcCandle[] {
  const existingIndex = currentCandles.findIndex(
    (candle) => candle.time === incomingCandle.time
  );

  if (existingIndex >= 0) {
    const updatedCandles = [...currentCandles];

    updatedCandles[existingIndex] = incomingCandle;

    return updatedCandles
      .sort((first, second) => first.time - second.time)
      .slice(-MAX_CANDLES);
  }

  return [...currentCandles, incomingCandle]
    .sort((first, second) => first.time - second.time)
    .slice(-MAX_CANDLES);
}

export function BtcPriceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [data, setData] = useState<BtcPriceData | null>(
    null
  );

  const [candles, setCandles] = useState<BtcCandle[]>(
    []
  );

  const [timeframe, setTimeframe] =
    useState<BtcTimeframe>("1m");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] =
    useState(false);

  const socketRef = useRef<WebSocket | null>(null);

  const reconnectTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const requestIdRef = useRef(0);
  const historyReadyRef = useRef(false);
  const pendingLiveCandleRef =
    useRef<BtcCandle | null>(null);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;

    requestIdRef.current = requestId;
    historyReadyRef.current = false;
    pendingLiveCandleRef.current = null;

    setCandles([]);
    setIsLoading(true);
    setError("");

    const controller = new AbortController();

    async function loadHistory(): Promise<void> {
      try {
        const response = await fetch(
          `/api/btc-klines?interval=${timeframe}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            "Historical BTC data request failed."
          );
        }

        const result =
          (await response.json()) as HistoryResponse;

        if (
          requestIdRef.current !== requestId ||
          result.interval !== timeframe
        ) {
          return;
        }

        let historicalCandles =
          result.candles.slice(-MAX_CANDLES);

        const pendingLiveCandle =
          pendingLiveCandleRef.current;

        if (pendingLiveCandle) {
          historicalCandles = mergeCandle(
            historicalCandles,
            pendingLiveCandle
          );
        }

        setCandles(historicalCandles);
        historyReadyRef.current = true;
      } catch (historyError) {
        if (
          controller.signal.aborted ||
          requestIdRef.current !== requestId
        ) {
          return;
        }

        console.error(
          "Could not load BTC candle history:",
          historyError
        );

        setError(
          "BTC candle history is temporarily unavailable."
        );

        const pendingLiveCandle =
          pendingLiveCandleRef.current;

        if (pendingLiveCandle) {
          setCandles([pendingLiveCandle]);
        }

        historyReadyRef.current = true;
      } finally {
        if (
          requestIdRef.current === requestId &&
          !controller.signal.aborted
        ) {
          setIsLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      controller.abort();
    };
  }, [timeframe]);

  useEffect(() => {
    let shouldReconnect = true;

    function connect(): void {
      if (!shouldReconnect) {
        return;
      }

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }

      const streamUrl =
        `wss://stream.binance.com:9443/stream?streams=` +
        `btcusdt@kline_${timeframe}/btcusdt@miniTicker`;

      const socket = new WebSocket(streamUrl);

      socketRef.current = socket;

      socket.onopen = () => {
        if (!shouldReconnect) {
          return;
        }

        setIsConnected(true);
      };

      socket.onmessage = (event) => {
        if (!shouldReconnect) {
          return;
        }

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

            const liveCandle: BtcCandle = {
              time: Math.floor(kline.t / 1000),
              open: Number(kline.o),
              high: Number(kline.h),
              low: Number(kline.l),
              close: Number(kline.c),
            };

            const isValidCandle = Object.values(
              liveCandle
            ).every((value) =>
              Number.isFinite(value)
            );

            if (!isValidCandle) {
              return;
            }

            if (!historyReadyRef.current) {
              pendingLiveCandleRef.current =
                liveCandle;
            } else {
              setCandles((currentCandles) =>
                mergeCandle(
                  currentCandles,
                  liveCandle
                )
              );
            }

            setData((currentData) => ({
              price: liveCandle.close,
              change24h:
                currentData?.change24h ?? 0,
              updatedAt:
                message.data?.E ?? Date.now(),
            }));
          }

          if (
            message.stream ===
              "btcusdt@miniTicker" &&
            message.data?.c &&
            message.data?.o
          ) {
            const closePrice = Number(
              message.data.c
            );

            const openPrice = Number(
              message.data.o
            );

            if (
              !Number.isFinite(closePrice) ||
              !Number.isFinite(openPrice) ||
              openPrice === 0
            ) {
              return;
            }

            const change24h =
              ((closePrice - openPrice) /
                openPrice) *
              100;

            setData({
              price: closePrice,
              change24h,
              updatedAt:
                message.data?.E ?? Date.now(),
            });
          }
        } catch (messageError) {
          console.error(
            "Could not process BTC live data:",
            messageError
          );

          setError(
            "BTC live data could not be processed."
          );
        }
      };

      socket.onerror = () => {
        if (!shouldReconnect) {
          return;
        }

        setError(
          "BTC live connection is temporarily unavailable."
        );
      };

      socket.onclose = () => {
        setIsConnected(false);

        if (!shouldReconnect) {
          return;
        }

        reconnectTimerRef.current = setTimeout(
          connect,
          RECONNECT_DELAY
        );
      };
    }

    connect();

    return () => {
      shouldReconnect = false;

      if (reconnectTimerRef.current) {
        clearTimeout(
          reconnectTimerRef.current
        );

        reconnectTimerRef.current = null;
      }

      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
        socketRef.current = null;
      }

      setIsConnected(false);
    };
  }, [timeframe]);

  function refreshPrice(): void {
    if (socketRef.current) {
      socketRef.current.close();
    }
  }

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