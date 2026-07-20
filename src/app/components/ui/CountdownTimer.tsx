"use client";

import { useRound } from "../providers/RoundProvider";

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

function formatPrice(price: number | null): string {
  if (price === null) {
    return "—";
  }

  return `$${price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function CountdownTimer() {
  const {
    roundNumber,
    timeLeft,
    status,
    result,
    progress,
    startPrice,
    endPrice,
  } = useRound();

  const priceDifference =
    startPrice !== null && endPrice !== null
      ? endPrice - startPrice
      : null;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-400">
          Round #{roundNumber}
        </p>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            status === "open"
              ? "bg-emerald-500/10 text-emerald-400"
              : status === "resolving"
              ? "bg-yellow-500/10 text-yellow-400"
              : "bg-orange-500/10 text-orange-400"
          }`}
        >
          {status === "open"
            ? "OPEN"
            : status === "resolving"
            ? "RESOLVING"
            : "RESULT"}
        </span>
      </div>

      {status === "open" && (
        <>
          <p className="mt-3 font-mono text-3xl font-bold">
            {formatTime(timeLeft)}
          </p>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-orange-500 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-gray-500">
              Round start price
            </p>

            <p className="mt-1 font-mono text-lg font-semibold text-white">
              {formatPrice(startPrice)}
            </p>
          </div>

          <p className="mt-3 text-sm text-gray-500">
            BTC direction forecast
          </p>
        </>
      )}

      {status === "resolving" && (
        <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
          <p className="font-semibold text-yellow-300">
            Resolving round...
          </p>

          <p className="mt-1 text-sm text-gray-400">
            Comparing the live BTC closing price with the round start
            price.
          </p>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-3">
            <p className="text-xs text-gray-500">
              Start price
            </p>

            <p className="mt-1 font-mono text-base font-semibold text-white">
              {formatPrice(startPrice)}
            </p>
          </div>
        </div>
      )}

      {status === "result" && result && (
        <div
          className={`mt-5 rounded-2xl border p-4 ${
            result === "higher"
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-rose-500/30 bg-rose-500/10"
          }`}
        >
          <p className="text-sm text-gray-400">
            Round result
          </p>

          <p
            className={`mt-2 text-2xl font-bold ${
              result === "higher"
                ? "text-emerald-400"
                : "text-rose-400"
            }`}
          >
            BTC moved {result.toUpperCase()}
          </p>

          <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-black/10 p-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-gray-500">
                Start price
              </span>

              <span className="font-mono text-sm font-semibold text-white">
                {formatPrice(startPrice)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-gray-500">
                End price
              </span>

              <span className="font-mono text-sm font-semibold text-white">
                {formatPrice(endPrice)}
              </span>
            </div>

            <div className="border-t border-white/10 pt-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-gray-500">
                  Price difference
                </span>

                <span
                  className={`font-mono text-sm font-semibold ${
                    priceDifference !== null &&
                    priceDifference >= 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {priceDifference === null
                    ? "—"
                    : `${priceDifference >= 0 ? "+" : "-"}$${Math.abs(
                        priceDifference
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`}
                </span>
              </div>
            </div>
          </div>

          <p className="mt-3 text-sm text-gray-500">
            Next round starts in {timeLeft}s
          </p>
        </div>
      )}
    </div>
  );
}