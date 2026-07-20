import { NextResponse } from "next/server";

type CoinGeckoResponse = {
  bitcoin?: {
    usd?: number;
    usd_24h_change?: number;
    last_updated_at?: number;
  };
};

export async function GET() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price" +
        "?ids=bitcoin" +
        "&vs_currencies=usd" +
        "&include_24hr_change=true" +
        "&include_last_updated_at=true",
      {
        headers: {
          accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko returned ${response.status}`);
    }

    const data = (await response.json()) as CoinGeckoResponse;
    const bitcoin = data.bitcoin;

    if (
      !bitcoin ||
      typeof bitcoin.usd !== "number" ||
      typeof bitcoin.usd_24h_change !== "number"
    ) {
      throw new Error("Invalid BTC price response.");
    }

    return NextResponse.json({
      price: bitcoin.usd,
      change24h: bitcoin.usd_24h_change,
      updatedAt:
        typeof bitcoin.last_updated_at === "number"
          ? bitcoin.last_updated_at * 1000
          : Date.now(),
    });
  } catch (error) {
    console.error("BTC price API error:", error);

    return NextResponse.json(
      {
        error: "BTC price is temporarily unavailable.",
      },
      {
        status: 503,
      }
    );
  }
}