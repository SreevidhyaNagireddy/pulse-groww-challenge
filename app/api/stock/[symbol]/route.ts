import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateSession, getOrCreateWatchlist } from "@/lib/session";
import { marketService } from "@/services/market/MarketService";
import { evaluateMeaningfulChanges } from "@/services/rules/meaningfulChangeEngine";

export async function GET(
  req: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol.replace(".NS", "").toUpperCase();
    const { userId } = await getOrCreateSession();
    const watchlist = await getOrCreateWatchlist(userId);

    // Fetch quote via MarketService
    const quotesMap = await marketService.getQuotesForSymbols([symbol]);
    const quote = quotesMap.get(symbol);

    if (!quote) {
      return NextResponse.json({ error: `Stock symbol ${symbol} not found` }, { status: 404 });
    }

    // Retrieve user's latest checkpoint for comparison
    const latestCheckpoint = await prisma.checkpoint.findFirst({
      where: { watchlistId: watchlist.id },
      orderBy: { createdAt: "desc" },
    });

    let baselinePayload: { price: number; volume?: number; timestamp: Date } | undefined;
    if (latestCheckpoint) {
      try {
        const baselineMap = JSON.parse(latestCheckpoint.snapshotData || "{}");
        const baseline = baselineMap[symbol];
        if (baseline) {
          baselinePayload = {
            price: baseline.price,
            volume: baseline.volume,
            timestamp: new Date(baseline.timestamp),
          };
        }
      } catch (err) {
        console.warn("[STOCK_API_BASELINE_PARSE_WARN]", err);
      }
    }

    // Fetch price history from append-only MarketSnapshotHistory
    const history = await prisma.marketSnapshotHistory.findMany({
      where: { symbol },
      orderBy: { timestamp: "asc" },
      take: 60,
    });

    // Fetch meaningful events scoped to the current checkpoint window.
    // Without a time boundary, stale events from previous simulation runs
    // would surface prices (priceThen / priceNow) that no longer correspond
    // to the current snapshot, creating confusing inconsistencies in the UI.
    // Using the same lower-bound as /api/changes guarantees that every event
    // displayed is evaluated relative to the same baseline the user set.
    const events = await prisma.meaningfulEvent.findMany({
      where: {
        symbol,
        ...(latestCheckpoint
          ? { timestamp: { gte: latestCheckpoint.createdAt } }
          : {}),
      },
      orderBy: { timestamp: "desc" },
      take: 20,
    });

    // Evaluate attention score and reasons against baseline (or daily previousClose if no baseline)
    const evaluation = evaluateMeaningfulChanges(quote, baselinePayload);

    return NextResponse.json({
      symbol,
      quote,
      checkpoint: latestCheckpoint
        ? {
            id: latestCheckpoint.id,
            createdAt: latestCheckpoint.createdAt,
            baselinePrice: baselinePayload?.price ?? null,
          }
        : null,
      evaluation,
      history: history.map((h) => ({
        timestamp: h.timestamp,
        price: h.price,
        changePercent: h.changePercent,
        volume: h.volume,
        provider: h.provider,
      })),
      events,
      marketStatus: marketService.getMarketStatus(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch stock details", details: error.message },
      { status: 500 }
    );
  }
}
