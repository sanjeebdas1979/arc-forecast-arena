"use client";

import { useState } from "react";

import { useDemoPoints } from "../providers/DemoPointsProvider";
import { useVerification } from "../providers/VerificationProvider";
import {
  useRound,
  type PredictionDuration,
} from "../providers/RoundProvider";

type Direction = "higher" | "lower";

function formatDuration(
  duration: PredictionDuration
): string {
  if (duration === 60) {
    return "1 Minute";
  }

  if (duration === 300) {
    return "5 Minutes";
  }

  return "15 Minutes";
}

export default function PredictionPanel() {
  const {
    balance,
    spendPoints,
    addPrediction,
  } = useDemoPoints();

  const { isVerified } = useVerification();

  const {
    roundNumber,
    isPredictionOpen,
    roundDuration,
    setPredictionDuration,
    canChangeDuration,
  } = useRound();

  const [direction, setDirection] =
    useState<Direction | null>(null);

  const [stake, setStake] = useState(100);

  const [message, setMessage] = useState("");

  const [submittedDirection, setSubmittedDirection] =
    useState<Direction | null>(null);

  const [submittedStake, setSubmittedStake] =
    useState(0);

  const [submittedDuration, setSubmittedDuration] =
    useState<PredictionDuration | null>(null);

  const canUsePredictionPanel =
    isVerified && isPredictionOpen;

  const canUseTimeframe =
    isVerified && canChangeDuration;

  const durationOptions: PredictionDuration[] = [
    60,
    300,
    900,
  ];

  function selectDuration(
    duration: PredictionDuration
  ): void {
    if (!isVerified) {
      setMessage(
        "Complete Arc Testnet verification first."
      );
      return;
    }

    if (!canChangeDuration) {
      setMessage(
        "Timeframe is locked for the current prediction."
      );
      return;
    }

    setPredictionDuration(duration);
    setMessage("");
  }

  function selectDirection(
    selectedDirection: Direction
  ): void {
    if (!isVerified) {
      setMessage(
        "Complete Arc Testnet verification first."
      );
      return;
    }

    if (!isPredictionOpen) {
      setMessage("Round is already closed.");
      return;
    }

    setDirection(selectedDirection);
    setMessage("");
  }

  function submitPrediction(): void {
    setMessage("");

    if (!isVerified) {
      setMessage(
        "Complete Arc Testnet verification before predicting."
      );
      return;
    }

    if (!isPredictionOpen) {
      setMessage("Round is already closed.");
      return;
    }

    if (!direction) {
      setMessage(
        "Please choose Higher or Lower."
      );
      return;
    }

    if (!Number.isFinite(stake) || stake < 10) {
      setMessage(
        "Minimum prediction is 10 points."
      );
      return;
    }

    if (stake > balance) {
      setMessage(
        "Not enough demo points."
      );
      return;
    }

    const success = spendPoints(stake);

    if (!success) {
      setMessage("Prediction failed.");
      return;
    }

    addPrediction(
      roundNumber,
      direction,
      stake,
      roundDuration
    );

    setSubmittedDirection(direction);
    setSubmittedStake(stake);
    setSubmittedDuration(roundDuration);

    setMessage(
      "Prediction submitted successfully."
    );
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d121a] p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-orange-500/5 blur-3xl" />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-400">
              Make Your Prediction
            </p>

            <h2 className="mt-2 text-3xl font-black text-white">
              Round #{roundNumber}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Choose a timeframe and predict the next BTC move.
            </p>
          </div>

          <span
            className={`rounded-full border px-4 py-2 text-xs font-bold tracking-wide ${
              isVerified
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-orange-500/30 bg-orange-500/10 text-orange-400"
            }`}
          >
            {isVerified
              ? "✓ VERIFIED ONCHAIN"
              : "🔒 ACCESS LOCKED"}
          </span>
        </div>

        {!isVerified && (
          <div className="mt-6 rounded-2xl border border-orange-500/30 bg-orange-500/[0.08] p-5 text-center">
            <p className="font-bold text-orange-400">
              Prediction Access Locked
            </p>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-300">
              Connect your wallet and complete one small Arc
              Testnet transaction to unlock predictions.
            </p>
          </div>
        )}

        <div className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">
                Prediction Timeframe
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Select how long the forecast round should run.
              </p>
            </div>

            {!canUseTimeframe && isVerified && (
              <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
                LOCKED
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {durationOptions.map((duration) => {
              const isSelected =
                roundDuration === duration;

              return (
                <button
                  key={duration}
                  type="button"
                  onClick={() =>
                    selectDuration(duration)
                  }
                  disabled={!canUseTimeframe}
                  className={`rounded-2xl border px-4 py-4 text-sm font-bold transition duration-300 ${
                    isSelected
                      ? "border-orange-500 bg-orange-500/15 text-orange-400 shadow-[0_0_25px_rgba(249,115,22,0.18)]"
                      : "border-white/10 bg-white/[0.02] text-gray-400 hover:-translate-y-0.5 hover:border-orange-500/50 hover:bg-orange-500/[0.06] hover:text-white"
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  <span className="block text-lg">
                    {duration === 60
                      ? "1m"
                      : duration === 300
                      ? "5m"
                      : "15m"}
                  </span>

                  <span className="mt-1 block text-[10px] font-medium uppercase tracking-wider opacity-70">
                    {duration === 60
                      ? "Quick"
                      : duration === 300
                      ? "Standard"
                      : "Extended"}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Predict where BTC will be after{" "}
            {formatDuration(roundDuration).toLowerCase()}.
          </p>
        </div>

        <div className="mt-8">
          <div>
            <p className="text-sm font-semibold text-white">
              Choose Direction
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Will BTC close above or below the round entry
              price?
            </p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                selectDirection("higher")
              }
              disabled={!canUsePredictionPanel}
              className={`group relative min-h-[180px] overflow-hidden rounded-3xl border px-6 py-8 transition duration-300 ${
                direction === "higher"
                  ? "border-emerald-400 bg-emerald-500/15 ring-2 ring-emerald-400/80 shadow-[0_0_40px_rgba(16,185,129,0.25)]"
                  : "border-white/10 bg-white/[0.02] hover:-translate-y-1 hover:scale-[1.01] hover:border-emerald-500/60 hover:bg-emerald-500/[0.07]"
              } disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:scale-100`}
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-500/[0.04] to-transparent" />

              <div className="relative flex flex-col items-center">
                <svg
                  className="h-16 w-16 text-emerald-400 transition duration-300 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 19L19 5M19 5H9M19 5V15"
                  />
                </svg>

                <p className="mt-4 text-2xl font-black tracking-wide text-emerald-400">
                  HIGHER
                </p>

                <p className="mt-2 text-sm text-gray-400">
                  BTC closes above entry price
                </p>

                {direction === "higher" && (
                  <span className="mt-4 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                    SELECTED
                  </span>
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                selectDirection("lower")
              }
              disabled={!canUsePredictionPanel}
              className={`group relative min-h-[180px] overflow-hidden rounded-3xl border px-6 py-8 transition duration-300 ${
                direction === "lower"
                  ? "border-rose-400 bg-rose-500/15 ring-2 ring-rose-400/80 shadow-[0_0_40px_rgba(244,63,94,0.25)]"
                  : "border-white/10 bg-white/[0.02] hover:-translate-y-1 hover:scale-[1.01] hover:border-rose-500/60 hover:bg-rose-500/[0.07]"
              } disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:scale-100`}
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-rose-500/[0.04] to-transparent" />

              <div className="relative flex flex-col items-center">
                <svg
                  className="h-16 w-16 text-rose-400 transition duration-300 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 5L5 19M5 19H15M5 19V9"
                  />
                </svg>

                <p className="mt-4 text-2xl font-black tracking-wide text-rose-400">
                  LOWER
                </p>

                <p className="mt-2 text-sm text-gray-400">
                  BTC closes below entry price
                </p>

                {direction === "lower" && (
                  <span className="mt-4 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-400">
                    SELECTED
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/10 p-5">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="prediction-stake"
              className="text-sm font-semibold text-white"
            >
              Demo Points
            </label>

            <p className="text-xs text-gray-500">
              Available:{" "}
              <span className="font-semibold text-gray-300">
                {balance.toLocaleString()}
              </span>
            </p>
          </div>

          <div className="mt-3 flex items-center rounded-2xl border border-white/10 bg-[#111827] px-4 transition focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10">
            <input
              id="prediction-stake"
              type="number"
              min={10}
              value={stake}
              disabled={!canUsePredictionPanel}
              onChange={(event) =>
                setStake(Number(event.target.value))
              }
              className="w-full bg-transparent py-4 text-lg font-bold text-white outline-none disabled:cursor-not-allowed disabled:opacity-40"
            />

            <span className="text-sm font-semibold text-orange-400">
              POINTS
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {[100, 250, 500, 1000].map((amount) => (
              <button
                key={amount}
                type="button"
                disabled={
                  !canUsePredictionPanel ||
                  amount > balance
                }
                onClick={() => setStake(amount)}
                className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs font-semibold text-gray-400 transition hover:border-orange-500/40 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {amount.toLocaleString()}
              </button>
            ))}

            <button
              type="button"
              disabled={
                !canUsePredictionPanel ||
                balance < 10
              }
              onClick={() => setStake(balance)}
              className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs font-semibold text-gray-400 transition hover:border-orange-500/40 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-30"
            >
              MAX
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={submitPrediction}
          disabled={
            !isVerified ||
            balance < 10 ||
            !isPredictionOpen
          }
          className="mt-8 w-full rounded-2xl border border-orange-400/40 bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-5 text-base font-black tracking-wide text-white shadow-[0_12px_35px_rgba(249,115,22,0.20)] transition duration-300 hover:-translate-y-0.5 hover:from-orange-500 hover:to-orange-400 hover:shadow-[0_16px_45px_rgba(249,115,22,0.30)] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-none disabled:bg-white/5 disabled:text-gray-500 disabled:shadow-none disabled:hover:translate-y-0"
        >
          {!isVerified
            ? "VERIFY ONCHAIN TO PREDICT"
            : isPredictionOpen
            ? direction
              ? `SUBMIT ${direction.toUpperCase()} PREDICTION`
              : "SELECT HIGHER OR LOWER"
            : "ROUND CLOSED"}
        </button>

        {message && (
          <div
            className={`mt-6 rounded-2xl border p-5 ${
              message ===
              "Prediction submitted successfully."
                ? "border-emerald-500/30 bg-emerald-500/[0.08]"
                : "border-orange-500/30 bg-orange-500/[0.08]"
            }`}
          >
            <p
              className={`font-semibold ${
                message ===
                "Prediction submitted successfully."
                  ? "text-emerald-400"
                  : "text-orange-400"
              }`}
            >
              {message}
            </p>

            {submittedDirection &&
              submittedDuration !== null &&
              message ===
                "Prediction submitted successfully." && (
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                    <p className="text-xs text-gray-500">
                      Direction
                    </p>

                    <p
                      className={`mt-1 font-bold ${
                        submittedDirection === "higher"
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {submittedDirection.toUpperCase()}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                    <p className="text-xs text-gray-500">
                      Stake
                    </p>

                    <p className="mt-1 font-bold text-white">
                      {submittedStake.toLocaleString()} points
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                    <p className="text-xs text-gray-500">
                      Timeframe
                    </p>

                    <p className="mt-1 font-bold text-white">
                      {formatDuration(
                        submittedDuration
                      )}
                    </p>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </section>
  );
}