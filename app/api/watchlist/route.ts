import { NextRequest, NextResponse } from "next/server";
import { getOrCreateSession, getOrCreateWatchlist } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SUPPORTED_INDIAN_STOCKS } from "@/lib/constants";
import { marketService } from "@/services/market/MarketService";

export async function GET() {
  try {
    const { userId } = await getOrCreateSession();
    const watchlist = await getOrCreateWatchlist(userId);

    const symbols = watchlist.items.map((item) => item.symbol);
    const quotes = await marketService.getQuotesForSymbols(symbols);

    const itemsWithQuotes = watchlist.items.map((item) => {
      const quote = quotes.get(item.symbol);
      return {
        id: item.id,
        symbol: item.symbol,
        nseSymbol: item.nseSymbol,
        name: item.name,
        displayOrder: item.displayOrder,
        quote: quote || null,
      };
    });

    return NextResponse.json({
      watchlistId: watchlist.id,
      name: watchlist.name,
      items: itemsWithQuotes,
      marketStatus: marketService.getMarketStatus(),
    });
  } catch (error: any) {
    console.error("[API_WATCHLIST_GET_ERROR]", error);
    return NextResponse.json(
      {
        error: "Failed to fetch watchlist",
        details: process.env.NODE_ENV === "development" ? error?.message || String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getOrCreateSession();
    const watchlist = await getOrCreateWatchlist(userId);
    const body = await req.json();

    const { symbol } = body;
    if (!symbol || typeof symbol !== "string" || !symbol.trim()) {
      return NextResponse.json({ error: "Stock symbol is required" }, { status: 400 });
    }

    const cleanSymbol = symbol.replace(".NS", "").toUpperCase().trim();

    // Check if already in watchlist
    const existing = await prisma.watchlistItem.findUnique({
      where: {
        watchlistId_symbol: {
          watchlistId: watchlist.id,
          symbol: cleanSymbol,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Stock is already in watchlist", item: existing, alreadyExists: true },
        { status: 200 }
      );
    }

    // Resolve stock definition or search online
    let stockDef = SUPPORTED_INDIAN_STOCKS.find((s) => s.symbol === cleanSymbol);
    let name = stockDef?.name || cleanSymbol;
    let nseSymbol = stockDef?.nseSymbol || `${cleanSymbol}.NS`;

    if (!stockDef) {
      try {
        const searchResults = await marketService.search(cleanSymbol);
        if (searchResults.length > 0) {
          name = searchResults[0].name;
          nseSymbol = searchResults[0].nseSymbol;
        }
      } catch (searchErr) {
        console.warn("[API_WATCHLIST_SEARCH_WARN]", searchErr);
      }
    }

    const itemCount = await prisma.watchlistItem.count({
      where: { watchlistId: watchlist.id },
    });

    const newItem = await prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist.id,
        symbol: cleanSymbol,
        nseSymbol,
        name,
        displayOrder: itemCount,
      },
    });

    // Safely warm quote cache in background without failing stock addition if network times out
    try {
      await marketService.getQuotesForSymbols([cleanSymbol], true);
    } catch (warmError) {
      console.warn("[API_WATCHLIST_WARM_CACHE_NON_FATAL]", warmError);
    }

    return NextResponse.json(
      { message: "Stock added to watchlist", item: newItem },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API_WATCHLIST_POST_ERROR]", error);
    return NextResponse.json(
      {
        error: "Failed to add stock to watchlist",
        details: process.env.NODE_ENV === "development" ? error?.message || String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await getOrCreateSession();
    const watchlist = await getOrCreateWatchlist(userId);
    const body = await req.json();

    if (Array.isArray(body.orderedSymbols)) {
      const updates = body.orderedSymbols.map((sym: string, index: number) =>
        prisma.watchlistItem.updateMany({
          where: {
            watchlistId: watchlist.id,
            symbol: sym.replace(".NS", "").toUpperCase().trim(),
          },
          data: { displayOrder: index },
        })
      );
      await prisma.$transaction(updates);
      return NextResponse.json({ message: "Watchlist order updated successfully" });
    }

    if (Array.isArray(body.items)) {
      const updates = body.items.map((item: { symbol: string; displayOrder: number }) =>
        prisma.watchlistItem.updateMany({
          where: {
            watchlistId: watchlist.id,
            symbol: item.symbol.replace(".NS", "").toUpperCase().trim(),
          },
          data: { displayOrder: item.displayOrder },
        })
      );
      await prisma.$transaction(updates);
      return NextResponse.json({ message: "Watchlist order updated successfully" });
    }

    return NextResponse.json(
      { error: "Invalid reorder payload. Expected 'orderedSymbols' array or 'items' array." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API_WATCHLIST_PUT_ERROR]", error);
    return NextResponse.json(
      {
        error: "Failed to update watchlist order",
        details: process.env.NODE_ENV === "development" ? error?.message || String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await getOrCreateSession();
    const watchlist = await getOrCreateWatchlist(userId);
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol");

    if (!symbol) {
      return NextResponse.json({ error: "Stock symbol query param is required" }, { status: 400 });
    }

    const cleanSymbol = symbol.replace(".NS", "").toUpperCase().trim();

    await prisma.watchlistItem.deleteMany({
      where: {
        watchlistId: watchlist.id,
        symbol: cleanSymbol,
      },
    });

    return NextResponse.json({ message: `Removed ${cleanSymbol} from watchlist` });
  } catch (error: any) {
    console.error("[API_WATCHLIST_DELETE_ERROR]", error);
    return NextResponse.json(
      {
        error: "Failed to remove stock from watchlist",
        details: process.env.NODE_ENV === "development" ? error?.message || String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
