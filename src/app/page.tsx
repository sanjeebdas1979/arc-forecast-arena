import ActivePredictionCard from "./components/prediction/ActivePredictionCard";
import CommunityLeaderboard from "./components/leaderboard/CommunityLeaderboard";
import Leaderboard from "./components/leaderboard/Leaderboard";
import BtcPriceCard from "./components/chart/BtcPriceCard";
import BtcPriceChart from "./components/chart/BtcPriceChart";
import PredictionHistory from "./components/prediction/PredictionHistory";
import PredictionPanel from "./components/prediction/PredictionPanel";
import CountdownTimer from "./components/ui/CountdownTimer";
import DemoBalanceCard from "./components/ui/DemoBalanceCard";
import ConnectWallet from "./components/wallet/ConnectWallet";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#080c12] text-white">
      <header className="border-b border-white/10 bg-[#0b1017]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
              Built on Arc Testnet
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Arc Forecast Arena
            </h1>
          </div>

          <ConnectWallet />
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-[2fr_0.75fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-[#0d121a] p-8">
            <p className="font-semibold text-orange-400">
              Live Forecast Round
            </p>

            <h2 className="mt-4 text-5xl font-black leading-tight md:text-6xl">
              Predict whether BTC moves higher or lower.
            </h2>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-gray-400">
              Use free demo points to test your market intuition. No deposits,
              withdrawals, cash prizes, or real-money betting.
            </p>

            <div className="mt-10 inline-block rounded-full border border-orange-500 px-6 py-3 text-orange-400">
              Testnet Simulation • No Cash Value
            </div>
          </div>

          <BtcPriceChart />

<PredictionPanel />

<ActivePredictionCard />

<Leaderboard />



<CommunityLeaderboard />

<PredictionHistory />
        </div>

        <aside className="space-y-6">
          <BtcPriceCard />

          <DemoBalanceCard />

          <div className="rounded-3xl border border-white/10 bg-[#0d121a] p-6">
            <CountdownTimer />
          </div>
        </aside>
      </section>
    </main>
  );
}