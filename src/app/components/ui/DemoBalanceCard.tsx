"use client";

import { useDemoPoints } from "../providers/DemoPointsProvider";

export default function DemoBalanceCard() {
  const { balance, resetPoints } = useDemoPoints();

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0d121a] p-6">
      <p className="text-sm text-gray-400">Demo balance</p>

      <h2 className="mt-3 text-5xl font-black">
        {balance.toLocaleString()}

        <span className="ml-2 text-lg text-orange-400">
          POINTS
        </span>
      </h2>

      <p className="mt-5 text-gray-500">
        Demo points are non-transferable and cannot be redeemed.
      </p>

      <button
        type="button"
        onClick={resetPoints}
        className="mt-5 rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 transition hover:border-orange-500 hover:text-orange-400"
      >
        Reset Demo Points
      </button>
    </div>
  );
}