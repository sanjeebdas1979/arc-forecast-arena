"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PredictionDirection = "higher" | "lower";
export type PredictionStatus = "pending" | "won" | "lost";
export type PredictionDuration = 60 | 300 | 900;

export type PredictionRecord = {
  id: number;
  roundNumber: number;
  direction: PredictionDirection;
  duration: PredictionDuration | null;
  points: number;
  submittedAt: string;
  status: PredictionStatus;
  result: PredictionDirection | null;
  reward: number;
  startPrice: number | null;
  endPrice: number | null;
  priceDifference: number | null;
};

type DemoPointsContextValue = {
  balance: number;
  predictions: PredictionRecord[];

  spendPoints: (amount: number) => boolean;

  addPrediction: (
    roundNumber: number,
    direction: PredictionDirection,
    points: number,
    duration: PredictionDuration
  ) => void;

  settleRound: (
    roundNumber: number,
    result: PredictionDirection,
    startPrice: number,
    endPrice: number
  ) => void;

  addPoints: (amount: number) => void;
  resetPoints: () => void;
};

type SavedDemoData = {
  balance: number;
  predictions: PredictionRecord[];
};

type DemoPointsProviderProps = {
  children: ReactNode;
};

const STARTING_POINTS = 1000;
const STORAGE_KEY = "arc-forecast-arena-demo-data";

const DemoPointsContext =
  createContext<DemoPointsContextValue | null>(null);

function normalizeDuration(
  duration: unknown
): PredictionDuration | null {
  if (
    duration === 60 ||
    duration === 300 ||
    duration === 900
  ) {
    return duration;
  }

  return null;
}

function normalizePrediction(
  prediction: Partial<PredictionRecord>
): PredictionRecord | null {
  const id = prediction.id;
  const roundNumber = prediction.roundNumber;
  const points = prediction.points;

  if (
    typeof id !== "number" ||
    !Number.isFinite(id) ||
    typeof roundNumber !== "number" ||
    !Number.isFinite(roundNumber) ||
    typeof points !== "number" ||
    !Number.isFinite(points) ||
    (prediction.direction !== "higher" &&
      prediction.direction !== "lower")
  ) {
    return null;
  }

  const validStatus: PredictionStatus =
    prediction.status === "won" ||
    prediction.status === "lost" ||
    prediction.status === "pending"
      ? prediction.status
      : "pending";

  const validResult: PredictionDirection | null =
    prediction.result === "higher" ||
    prediction.result === "lower"
      ? prediction.result
      : null;

  return {
    id,
    roundNumber,
    direction: prediction.direction,
    duration: normalizeDuration(prediction.duration),
    points,

    submittedAt:
      typeof prediction.submittedAt === "string"
        ? prediction.submittedAt
        : "Unknown",

    status: validStatus,
    result: validResult,

    reward:
      typeof prediction.reward === "number" &&
      Number.isFinite(prediction.reward)
        ? prediction.reward
        : 0,

    startPrice:
      typeof prediction.startPrice === "number" &&
      Number.isFinite(prediction.startPrice)
        ? prediction.startPrice
        : null,

    endPrice:
      typeof prediction.endPrice === "number" &&
      Number.isFinite(prediction.endPrice)
        ? prediction.endPrice
        : null,

    priceDifference:
      typeof prediction.priceDifference === "number" &&
      Number.isFinite(prediction.priceDifference)
        ? prediction.priceDifference
        : null,
  };
}

export function DemoPointsProvider({
  children,
}: DemoPointsProviderProps) {
  const [balance, setBalance] =
    useState(STARTING_POINTS);

  const [predictions, setPredictions] = useState<
    PredictionRecord[]
  >([]);

  const [hasLoadedStorage, setHasLoadedStorage] =
    useState(false);

  useEffect(() => {
    try {
      const savedData =
        window.localStorage.getItem(STORAGE_KEY);

      if (savedData) {
        const parsedData =
          JSON.parse(savedData) as SavedDemoData;

        if (
          Number.isFinite(parsedData.balance) &&
          Array.isArray(parsedData.predictions)
        ) {
          const normalizedPredictions =
            parsedData.predictions
              .map((prediction) =>
                normalizePrediction(prediction)
              )
              .filter(
                (
                  prediction
                ): prediction is PredictionRecord =>
                  prediction !== null
              );

          setBalance(parsedData.balance);
          setPredictions(normalizedPredictions);
        }
      }
    } catch (error) {
      console.error(
        "Could not load saved demo data:",
        error
      );
    } finally {
      setHasLoadedStorage(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) {
      return;
    }

    const dataToSave: SavedDemoData = {
      balance,
      predictions,
    };

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(dataToSave)
      );
    } catch (error) {
      console.error(
        "Could not save demo data:",
        error
      );
    }
  }, [balance, predictions, hasLoadedStorage]);

  const spendPoints = useCallback(
    (amount: number): boolean => {
      if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > balance
      ) {
        return false;
      }

      setBalance(
        (currentBalance) =>
          currentBalance - amount
      );

      return true;
    },
    [balance]
  );

  const addPrediction = useCallback(
    (
      roundNumber: number,
      direction: PredictionDirection,
      points: number,
      duration: PredictionDuration
    ): void => {
      const newPrediction: PredictionRecord = {
        id: Date.now(),
        roundNumber,
        direction,
        duration,
        points,

        submittedAt: new Date().toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }
        ),

        status: "pending",
        result: null,
        reward: 0,
        startPrice: null,
        endPrice: null,
        priceDifference: null,
      };

      setPredictions(
        (currentPredictions) => [
          newPrediction,
          ...currentPredictions,
        ]
      );
    },
    []
  );

  const settleRound = useCallback(
  (
    roundNumber: number,
    result: PredictionDirection,
    startPrice: number,
    endPrice: number
  ): void => {
    if (
      !Number.isFinite(startPrice) ||
      !Number.isFinite(endPrice)
    ) {
      return;
    }

    const priceDifference =
      endPrice - startPrice;

    setPredictions(
      (
        currentPredictions
      ): PredictionRecord[] => {
        let totalReward = 0;

        const updatedPredictions: PredictionRecord[] =
          currentPredictions.map(
            (
              prediction
            ): PredictionRecord => {
              if (
                prediction.roundNumber !==
                  roundNumber ||
                prediction.status !== "pending"
              ) {
                return prediction;
              }

              const didWin =
                prediction.direction === result;

              const reward = didWin
                ? prediction.points * 2
                : 0;

              const settledStatus: PredictionStatus =
                didWin ? "won" : "lost";

              totalReward += reward;

              return {
                ...prediction,
                status: settledStatus,
                result,
                reward,
                startPrice,
                endPrice,
                priceDifference,
              };
            }
          );

        if (totalReward > 0) {
          setBalance(
            (currentBalance) =>
              currentBalance + totalReward
          );
        }

        return updatedPredictions;
      }
    );
  },
  []
);

  const addPoints = useCallback(
    (amount: number): void => {
      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return;
      }

      setBalance(
        (currentBalance) =>
          currentBalance + amount
      );
    },
    []
  );

  const resetPoints = useCallback((): void => {
    setBalance(STARTING_POINTS);
    setPredictions([]);

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error(
        "Could not clear saved demo data:",
        error
      );
    }
  }, []);

  const value = useMemo(
    () => ({
      balance,
      predictions,
      spendPoints,
      addPrediction,
      settleRound,
      addPoints,
      resetPoints,
    }),
    [
      balance,
      predictions,
      spendPoints,
      addPrediction,
      settleRound,
      addPoints,
      resetPoints,
    ]
  );

  return (
    <DemoPointsContext.Provider value={value}>
      {children}
    </DemoPointsContext.Provider>
  );
}

export function useDemoPoints(): DemoPointsContextValue {
  const context = useContext(DemoPointsContext);

  if (!context) {
    throw new Error(
      "useDemoPoints must be used inside DemoPointsProvider."
    );
  }

  return context;
}