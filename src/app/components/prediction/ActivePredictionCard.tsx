"use client";

import { useMemo } from "react";

import { useBtcPrice } from "../providers/BtcPriceProvider";
import { useDemoPoints } from "../providers/DemoPointsProvider";
import {
  useRound,
  type PredictionDuration,
} from "../providers/RoundProvider";

function formatPrice(price: number | null): string {
  if (price === null || !Number.isFinite(price)) {
    return "Waiting...";
  }

  return `$${price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDifference(difference: number | null): string {
  if (difference === null || !Number.isFinite(difference)) {
    return "Waiting...";
  }

  const sign = difference >= 0 ? "+" : "-";

  return `${sign}$${Math.abs(difference).toLocaleString(
    undefined,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatDuration(
  duration: PredictionDuration | null
): string {
  if (duration === 60) {
    return "1 Minute";
  }

  if (duration === 300) {
    return "5 Minutes";
  }

  if (duration === 900) {
    return "15 Minutes";
  }

  return "Not recorded";
}

function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);

  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes
    .toString()
    .padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

export default function ActivePredictionCard() {
  const { predictions } = useDemoPoints();
  const { data } = useBtcPrice();

  const {
    roundNumber,
    timeLeft,
    status,
    result,
    startPrice,
    endPrice,
  } = useRound();

  const currentPrediction = useMemo(
    () =>
      predictions.find(
        (prediction) =>
          prediction.roundNumber === roundNumber
      ) ?? null,
    [predictions, roundNumber]
  );

  if (!currentPrediction) {
    return (
      <section className="rounded-3xl border border-white/10 bg-[#0d121a] p-6 sm:p-8">
        <p className="text-sm font-semibold text-orange-400">
          Live Position
        </p>

        <h2 className="mt-2 text-2xl font-bold text-white">
          No active prediction
        </h2>

        <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
          <p className="text-sm text-gray-400">
            Submit a Higher or Lower prediction to track your
            live position here.
          </p>
        </div>
      </section>
    );
  }

  const livePrice =
    data && Number.isFinite(data.price)
      ? data.price
      : null;

  const entryPrice =
    currentPrediction.startPrice ?? startPrice;

  const finalPrice =
    currentPrediction.endPrice ?? endPrice;

  const displayPrice =
    currentPrediction.status === "pending"
      ? livePrice
      : finalPrice;

  const priceDifference =
    entryPrice !== null && displayPrice !== null
      ? displayPrice - entryPrice
      : null;

  const isDirectionCurrentlyCorrect =
    priceDifference === null
      ? null
      : currentPrediction.direction === "higher"
      ? priceDifference > 0
      : priceDifference < 0;

  const isSettled =
    currentPrediction.status !== "pending";

  const statusText =
    currentPrediction.status === "won"
      ? "WON"
      : currentPrediction.status === "lost"
      ? "LOST"
      : status === "resolving"
      ? "RESOLVING"
      : "LIVE";

  const statusStyles =
    currentPrediction.status === "won"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
      : currentPrediction.status === "lost"
      ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
      : status === "resolving"
      ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
      : "border-blue-500/30 bg-blue-500/10 text-blue-400";

  const movementStyles =
    priceDifference === null
      ? "text-gray-300"
      : priceDifference >= 0
      ? "text-emerald-400"
      : "text-rose-400";

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0d121a] p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-orange-400">
            {isSettled
              ? "Prediction Settled"
              : "Your Active Prediction"}
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            Round #{currentPrediction.roundNumber}
          </h2>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyles}`}
        >
          {statusText}
        </span>
      </div>

      <div
        className={`mt-6 rounded-2xl border p-6 ${
          currentPrediction.direction === "higher"
            ? "border-emerald-500/30 bg-emerald-500/10"
            : "border-rose-500/30 bg-rose-500/10"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="text-4xl">
            {currentPrediction.direction === "higher"
              ? "📈"
              : "📉"}
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400">
              Your prediction
            </p>

            <p
              className={`mt-1 text-2xl font-bold ${
                currentPrediction.direction === "higher"
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {currentPrediction.direction.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-gray-500">
            Timeframe
          </p>

          <p className="mt-2 font-semibold text-white">
            {formatDuration(currentPrediction.duration)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-gray-500">
            Stake
          </p>

          <p className="mt-2 font-semibold text-white">
            {currentPrediction.points.toLocaleString()} points
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-gray-500">
            Entry Price
          </p>

          <p className="mt-2 font-mono text-sm font-semibold text-white">
            {formatPrice(entryPrice)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-gray-500">
            {isSettled ? "Final Price" : "Live Price"}
          </p>

          <p className="mt-2 font-mono text-sm font-semibold text-white">
            {formatPrice(displayPrice)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
          <p className="text-xs text-gray-500">
            Price Movement
          </p>

          <p
            className={`mt-2 font-mono text-xl font-bold ${movementStyles}`}
          >
            {formatDifference(priceDifference)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
          <p className="text-xs text-gray-500">
            Position Status
          </p>

          <p
            className={`mt-2 text-xl font-bold ${
              isSettled
                ? currentPrediction.status === "won"
                  ? "text-emerald-400"
                  : "text-rose-400"
                : isDirectionCurrentlyCorrect === null
                ? "text-gray-300"
                : isDirectionCurrentlyCorrect
                ? "text-emerald-400"
                : "text-rose-400"
            }`}
          >
            {isSettled
              ? currentPrediction.status === "won"
                ? "Winning Result"
                : "Losing Result"
              : isDirectionCurrentlyCorrect === null
              ? "Waiting for movement"
              : isDirectionCurrentlyCorrect
              ? "Currently Winning"
              : "Currently Losing"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
          <p className="text-xs text-gray-500">
            {isSettled ? "Reward" : "Time Remaining"}
          </p>

          <p
            className={`mt-2 text-xl font-bold ${
              isSettled &&
              currentPrediction.reward > 0
                ? "text-emerald-400"
                : "text-white"
            }`}
          >
            {isSettled
              ? currentPrediction.reward > 0
                ? `+${currentPrediction.reward.toLocaleString()} points`
                : "0 points"
              : formatTime(timeLeft)}
          </p>
        </div>
      </div>

      {!isSettled && (
        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs leading-5 text-gray-500">
            Live position status can change until the round
            closes. Final rewards are calculated only after the
            ending BTC price is confirmed.
          </p>
        </div>
      )}

      {isSettled && result && (
        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-sm text-gray-300">
            Final market result:{" "}
            <span
              className={`font-bold ${
                result === "higher"
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {result.toUpperCase()}
            </span>
          </p>
        </div>
      )}
    </section>
  );
}