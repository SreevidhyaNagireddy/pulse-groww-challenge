import { NextRequest, NextResponse } from "next/server";
import { getOrCreateSession, getOrCreateWatchlist } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { marketService } from "@/services/market/MarketService";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getOrCreateSession();
    const watchlist = await getOrCreateWatchlist(userId);

    const symbols = watchlist.items.map((item) => item.symbol);
    const quotes = await marketService.getQuotesForSymbols(symbols);

    // Build snapshot payload mapping symbol -> price/volume/timestamp
    const snapshotMap: Record<string, { price: number; volume?: number; timestamp: string }> = {};
    quotes.forEach((quote, sym) => {
      snapshotMap[sym] = {
        price: quote.price,
        volume: quote.volume,
        timestamp: quote.timestamp.toISOString(),
      };
    });

    const checkpoint = await prisma.checkpoint.create({
      data: {
        watchlistId: watchlist.id,
        snapshotData: JSON.stringify(snapshotMap),
      },
    });

    return NextResponse.json({
      message: "Baseline checkpoint established",
      checkpointId: checkpoint.id,
      timestamp: checkpoint.createdAt,
      snapshotCount: Object.keys(snapshotMap).length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to establish baseline checkpoint", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = await getOrCreateSession();
    const watchlist = await getOrCreateWatchlist(userId);

    const latestCheckpoint = await prisma.checkpoint.findFirst({
      where: { watchlistId: watchlist.id },
      orderBy: { createdAt: "desc" },
    });

    if (!latestCheckpoint) {
      return NextResponse.json({ checkpoint: null });
    }

    return NextResponse.json({
      checkpoint: {
        id: latestCheckpoint.id,
        createdAt: latestCheckpoint.createdAt,
        snapshotData: JSON.parse(latestCheckpoint.snapshotData),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch checkpoint", details: error.message },
      { status: 500 }
    );
  }
}
