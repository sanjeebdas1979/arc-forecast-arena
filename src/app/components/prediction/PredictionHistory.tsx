"use client";

import { useDemoPoints } from "../providers/DemoPointsProvider";

function formatPrice(price: number | null): string {
  if (price === null) {
    return "Not recorded";
  }

  return `$${price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDifference(difference: number | null): string {
  if (difference === null) {
    return "Not recorded";
  }

  const sign = difference >= 0 ? "+" : "-";

  return `${sign}$${Math.abs(difference).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDuration(duration: 60 | 300 | 900 | null): string {
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

export default function PredictionHistory() {
  const { predictions } = useDemoPoints();

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0d121a] p-6">
      <div>
        <p className="text-sm font-semibold text-orange-400">
          Prediction History
        </p>

        <h3 className="mt-2 text-2xl font-bold">
          Your recent forecasts
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Review your submitted predictions and final market results.
        </p>
      </div>

      {predictions.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-6 text-center">
          <p className="text-sm text-gray-500">
            No predictions submitted yet.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {predictions.map((prediction) => {
            const statusStyles =
              prediction.status === "won"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : prediction.status === "lost"
                ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";

            const statusText =
              prediction.status === "won"
                ? "WON"
                : prediction.status === "lost"
                ? "LOST"
                : "PENDING";

            const differenceStyles =
              prediction.priceDifference === null
                ? "text-gray-300"
                : prediction.priceDifference >= 0
                ? "text-emerald-400"
                : "text-rose-400";

            return (
              <div
                key={prediction.id}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs text-gray-500">
                        Round #{prediction.roundNumber}
                      </p>

                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-semibold text-gray-300">
                        {formatDuration(prediction.duration)}
                      </span>
                    </div>

                    <p
                      className={`mt-3 text-lg font-bold ${
                        prediction.direction === "higher"
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {prediction.direction === "higher" ? "↗" : "↘"}{" "}
                      {prediction.direction.toUpperCase()}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Submitted at {prediction.submittedAt}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyles}`}
                  >
                    {statusText}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-black/10 p-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-gray-500">
                      Timeframe
                    </p>

                    <p className="mt-1 font-semibold text-white">
                      {formatDuration(prediction.duration)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Stake
                    </p>

                    <p className="mt-1 font-semibold">
                      {prediction.points.toLocaleString()} points
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Round result
                    </p>

                    <p
                      className={`mt-1 font-semibold ${
                        prediction.result === "higher"
                          ? "text-emerald-400"
                          : prediction.result === "lower"
                          ? "text-rose-400"
                          : "text-gray-300"
                      }`}
                    >
                      {prediction.result
                        ? prediction.result.toUpperCase()
                        : "Waiting"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Reward
                    </p>

                    <p
                      className={`mt-1 font-semibold ${
                        prediction.reward > 0
                          ? "text-emerald-400"
                          : "text-gray-300"
                      }`}
                    >
                      {prediction.reward > 0
                        ? `+${prediction.reward.toLocaleString()}`
                        : "0"}{" "}
                      points
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 rounded-xl border border-white/10 bg-black/10 p-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-500">
                      Start price
                    </p>

                    <p className="mt-1 font-mono text-sm font-semibold text-white">
                      {formatPrice(prediction.startPrice)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      End price
                    </p>

                    <p className="mt-1 font-mono text-sm font-semibold text-white">
                      {formatPrice(prediction.endPrice)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Price difference
                    </p>

                    <p
                      className={`mt-1 font-mono text-sm font-semibold ${differenceStyles}`}
                    >
                      {formatDifference(prediction.priceDifference)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}