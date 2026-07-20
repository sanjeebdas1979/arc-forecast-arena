"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useDemoPoints } from "./DemoPointsProvider";
import { useBtcPrice } from "./BtcPriceProvider";

export type RoundDirection = "higher" | "lower";
export type RoundStatus = "open" | "resolving" | "result";
export type PredictionDuration = 60 | 300 | 900;

type RoundContextValue = {
  roundNumber: number;
  timeLeft: number;
  status: RoundStatus;
  result: RoundDirection | null;
  progress: number;
  isPredictionOpen: boolean;
  startPrice: number | null;
  endPrice: number | null;

  roundDuration: PredictionDuration;
  setPredictionDuration: (
    duration: PredictionDuration
  ) => void;
  canChangeDuration: boolean;
};

type RoundProviderProps = {
  children: ReactNode;
};

const DEFAULT_ROUND_DURATION: PredictionDuration = 60;
const RESOLVING_DURATION = 2;
const RESULT_DURATION = 5;

const RoundContext = createContext<RoundContextValue | null>(
  null
);

export function RoundProvider({
  children,
}: RoundProviderProps) {
  const { settleRound, predictions } = useDemoPoints();
  const { data, isConnected } = useBtcPrice();

  const [roundNumber, setRoundNumber] = useState(1);

  const [roundDuration, setRoundDuration] =
    useState<PredictionDuration>(
      DEFAULT_ROUND_DURATION
    );

  const [timeLeft, setTimeLeft] = useState<number>(
  DEFAULT_ROUND_DURATION
);
    
  

  const [status, setStatus] =
    useState<RoundStatus>("open");

  const [result, setResult] =
    useState<RoundDirection | null>(null);

  const [startPrice, setStartPrice] =
    useState<number | null>(null);

  const [endPrice, setEndPrice] =
    useState<number | null>(null);

  const latestPriceRef = useRef<number | null>(null);
  const startPriceRef = useRef<number | null>(null);
  const settledRoundRef = useRef<number | null>(null);

  const hasCurrentRoundPrediction = predictions.some(
    (prediction) =>
      prediction.roundNumber === roundNumber &&
      prediction.status === "pending"
  );

  const canChangeDuration =
    status === "open" && !hasCurrentRoundPrediction;

  // Binance-এর সর্বশেষ live price ref-এ রাখে।
  useEffect(() => {
    if (data && Number.isFinite(data.price)) {
      latestPriceRef.current = data.price;
    }
  }, [data]);

  // নতুন round-এর live starting price capture করে।
  useEffect(() => {
    if (
      status !== "open" ||
      startPriceRef.current !== null ||
      latestPriceRef.current === null ||
      !isConnected
    ) {
      return;
    }

    const openingPrice = latestPriceRef.current;

    startPriceRef.current = openingPrice;
    setStartPrice(openingPrice);
  }, [status, roundNumber, data, isConnected]);

  // Prediction timeframe পরিবর্তন করে।
  const setPredictionDuration = useCallback(
    (duration: PredictionDuration): void => {
      if (
        status !== "open" ||
        hasCurrentRoundPrediction ||
        ![60, 300, 900].includes(duration)
      ) {
        return;
      }

      setRoundDuration(duration);
      setTimeLeft(duration);

      // নতুন duration select করলে start price আবার
      // বর্তমান live BTC price থেকে শুরু হবে।
      const currentPrice = latestPriceRef.current;

      startPriceRef.current = currentPrice;
      setStartPrice(currentPrice);

      setEndPrice(null);
      setResult(null);
      settledRoundRef.current = null;
    },
    [status, hasCurrentRoundPrediction]
  );

  // প্রতি সেকেন্ডে countdown কমায়।
  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((currentTime) =>
        currentTime > 0 ? currentTime - 1 : 0
      );
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  // Timer zero হলে round-এর পরবর্তী phase চালায়।
  useEffect(() => {
    if (timeLeft !== 0) {
      return;
    }

    if (status === "open") {
      setStatus("resolving");
      setTimeLeft(RESOLVING_DURATION);
      return;
    }

    if (status === "resolving") {
      if (settledRoundRef.current === roundNumber) {
        return;
      }

      const openingPrice = startPriceRef.current;
      const closingPrice = latestPriceRef.current;

      // Live price available না হলে অপেক্ষা করবে।
      if (
        openingPrice === null ||
        closingPrice === null ||
        !isConnected
      ) {
        setTimeLeft(1);
        return;
      }

      // Price একই থাকলে movement হওয়া পর্যন্ত অপেক্ষা করবে।
      if (closingPrice === openingPrice) {
        setTimeLeft(1);
        return;
      }

      const marketResult: RoundDirection =
        closingPrice > openingPrice
          ? "higher"
          : "lower";

      settledRoundRef.current = roundNumber;

      setEndPrice(closingPrice);
      setResult(marketResult);

      settleRound(
        roundNumber,
        marketResult,
        openingPrice,
        closingPrice
      );

      setStatus("result");
      setTimeLeft(RESULT_DURATION);
      return;
    }

    // Result phase শেষ হলে নতুন round শুরু করে।
    startPriceRef.current = null;
    settledRoundRef.current = null;

    setRoundNumber(
      (currentRound) => currentRound + 1
    );

    setStartPrice(null);
    setEndPrice(null);
    setResult(null);
    setStatus("open");
    setTimeLeft(roundDuration);
  }, [
    timeLeft,
    status,
    roundNumber,
    roundDuration,
    settleRound,
    isConnected,
  ]);

  const progress =
    status === "open"
      ? (timeLeft / roundDuration) * 100
      : 0;

  const value = useMemo(
    () => ({
      roundNumber,
      timeLeft,
      status,
      result,
      progress,
      isPredictionOpen:
        status === "open" &&
        startPrice !== null &&
        isConnected,
      startPrice,
      endPrice,
      roundDuration,
      setPredictionDuration,
      canChangeDuration,
    }),
    [
      roundNumber,
      timeLeft,
      status,
      result,
      progress,
      startPrice,
      endPrice,
      isConnected,
      roundDuration,
      setPredictionDuration,
      canChangeDuration,
    ]
  );

  return (
    <RoundContext.Provider value={value}>
      {children}
    </RoundContext.Provider>
  );
}

export function useRound(): RoundContextValue {
  const context = useContext(RoundContext);

  if (!context) {
    throw new Error(
      "useRound must be used inside RoundProvider."
    );
  }

  return context;
}