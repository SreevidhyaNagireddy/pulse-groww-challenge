import { NextRequest, NextResponse } from "next/server";
import { getOrCreateSession, getOrCreateWatchlist } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { marketService } from "@/services/market/MarketService";
import { evaluateMeaningfulChanges, MeaningfulChangeResult } from "@/services/rules/meaningfulChangeEngine";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await getOrCreateSession();
    const watchlist = await getOrCreateWatchlist(userId);

    const symbols = watchlist.items.map((item) => item.symbol);
    const quotes = await marketService.getQuotesForSymbols(symbols);

    // Retrieve latest baseline checkpoint for this watchlist
    const latestCheckpoint = await prisma.checkpoint.findFirst({
      where: { watchlistId: watchlist.id },
      orderBy: { createdAt: "desc" },
    });

    if (!latestCheckpoint) {
      return NextResponse.json({
        firstVisit: true,
        message: "You're seeing this watchlist for the first time. Establish a baseline snapshot to track changes on your next visit.",
        symbols,
        itemsCount: watchlist.items.length,
      });
    }

    const baselineMap: Record<string, { price: number; volume?: number; timestamp: string }> =
      JSON.parse(latestCheckpoint.snapshotData || "{}");

    const evaluations: MeaningfulChangeResult[] = [];
    const meaningfulEventsList: MeaningfulChangeResult[] = [];

    for (const [sym, quote] of Array.from(quotes.entries())) {
      const baseline = baselineMap[sym];
      const baselinePayload = baseline
        ? { price: baseline.price, volume: baseline.volume, timestamp: new Date(baseline.timestamp) }
        : undefined;

      const evalResult = evaluateMeaningfulChanges(quote, baselinePayload);
      evaluations.push(evalResult);

      if (evalResult.hasChanged) {
        meaningfulEventsList.push(evalResult);

        // Store event in MeaningfulEvent history table — deduplicated per checkpoint.
        // Only insert if no event with the same symbol + eventType + priceThen already
        // exists since this checkpoint was established. This prevents duplicate rows
        // when /api/changes is called multiple times without a new checkpoint being set
        // (e.g. repeated fetchData() calls after a simulation tick).
        for (const reason of evalResult.reasons) {
          const existingEvent = await prisma.meaningfulEvent.findFirst({
            where: {
              symbol: sym,
              eventType: reason.ruleKey,
              priceThen: evalResult.priceThen,
              timestamp: { gte: latestCheckpoint.createdAt },
            },
          });

          if (!existingEvent) {
            await prisma.meaningfulEvent.create({
              data: {
                symbol: sym,
                eventType: reason.ruleKey,
                severity: reason.severity,
                title: reason.title,
                description: reason.description,
                priceThen: evalResult.priceThen,
                priceNow: evalResult.priceNow,
                changePercent: evalResult.changePercent,
                scoreImpact: reason.impactScore,
                timestamp: new Date(),
              },
            });
          }
        }
      }
    }

    // Sort meaningful events by attention score descending
    meaningfulEventsList.sort((a, b) => b.attentionScore - a.attentionScore);

    return NextResponse.json({
      firstVisit: false,
      checkpointId: latestCheckpoint.id,
      checkpointCreatedAt: latestCheckpoint.createdAt,
      totalChangesCount: meaningfulEventsList.length,
      meaningfulEvents: meaningfulEventsList,
      allEvaluations: evaluations,
      marketStatus: marketService.getMarketStatus(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to evaluate changes", details: error.message },
      { status: 500 }
    );
  }
}
