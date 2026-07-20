"use client";

import { useBtcPrice } from "../providers/BtcPriceProvider";

export default function BtcPriceCard() {
  const { data, isLoading, error, refreshPrice } = useBtcPrice();

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/60">Live Market Price</p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            BTC/USD
          </h2>
        </div>

        <button
          type="button"
          onClick={refreshPrice}
          className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/70 transition hover:bg-white/10"
        >
          Refresh
        </button>
      </div>

      <div className="mt-6">
        {isLoading && !data ? (
          <p className="text-sm text-white/60">
            Loading live BTC price...
          </p>
        ) : error && !data ? (
          <p className="text-sm text-red-300">{error}</p>
        ) : data ? (
          <>
            <p className="text-4xl font-bold tracking-tight text-white">
              ${data.price.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>

            <p className="mt-3 text-sm text-white/60">
              24h change:{" "}
              <span
                className={
                  data.change24h >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }
              >
                {data.change24h >= 0 ? "+" : ""}
                {data.change24h.toFixed(2)}%
              </span>
            </p>

            <p className="mt-2 text-xs text-white/40">
              Updated{" "}
              {new Date(data.updatedAt).toLocaleTimeString()}
            </p>
          </>
        ) : null}
      </div>

      {error && data ? (
        <p className="mt-4 text-xs text-amber-300">
          {error} Showing the latest available price.
        </p>
      ) : null}
    </section>
  );
}