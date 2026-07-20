import { NextRequest, NextResponse } from "next/server";

const ALLOWED_INTERVALS = new Set([
  "1m",
  "5m",
  "15m",
  "1h",
]);

type BinanceKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string
];

export async function GET(request: NextRequest) {
  try {
    const interval =
      request.nextUrl.searchParams.get("interval") ?? "1m";

    if (!ALLOWED_INTERVALS.has(interval)) {
      return NextResponse.json(
        {
          error: "Unsupported candle interval.",
        },
        {
          status: 400,
        }
      );
    }

    const url = new URL(
      "https://api.binance.com/api/v3/klines"
    );

    url.searchParams.set("symbol", "BTCUSDT");
    url.searchParams.set("interval", interval);
    url.searchParams.set("limit", "120");

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Binance historical data is unavailable.",
        },
        {
          status: 503,
        }
      );
    }

    const result = (await response.json()) as BinanceKline[];

    const candles = result.map((kline) => ({
      time: Math.floor(kline[0] / 1000),
      open: Number(kline[1]),
      high: Number(kline[2]),
      low: Number(kline[3]),
      close: Number(kline[4]),
    }));

    return NextResponse.json({
      interval,
      candles,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to load BTC candle history.",
      },
      {
        status: 500,
      }
    );
  }
}