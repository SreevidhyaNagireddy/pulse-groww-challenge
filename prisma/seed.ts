import { PrismaClient } from "@prisma/client";
import { SUPPORTED_INDIAN_STOCKS, INITIAL_WATCHLIST_SYMBOLS } from "../lib/constants";

const prisma = new PrismaClient();

const INITIAL_BASE_QUOTES: Record<string, { price: number; change: number; changePercent: number; prevClose: number; dayHigh: number; dayLow: number; volume: number; avgVolume: number; high52: number; low52: number }> = {
  RELIANCE: { price: 3026.40, change: 84.90, changePercent: 2.89, prevClose: 2941.50, dayHigh: 3045.00, dayLow: 2935.00, volume: 8500000, avgVolume: 5200000, high52: 3217.90, low52: 2220.30 },
  TCS: { price: 3026.00, change: -76.00, changePercent: -2.45, prevClose: 3102.00, dayHigh: 3110.00, dayLow: 3015.00, volume: 3800000, avgVolume: 2900000, high52: 4585.90, low52: 3000.00 },
  INFY: { price: 1548.00, change: 61.00, changePercent: 4.10, prevClose: 1487.00, dayHigh: 1555.00, dayLow: 1480.00, volume: 18500000, avgVolume: 10200000, high52: 1991.45, low52: 1355.00 },
  HDFCBANK: { price: 1642.50, change: 12.30, changePercent: 0.75, prevClose: 1630.20, dayHigh: 1650.00, dayLow: 1625.00, volume: 12400000, avgVolume: 15000000, high52: 1794.00, low52: 1363.55 },
  ICICIBANK: { price: 1215.80, change: 18.40, changePercent: 1.54, prevClose: 1197.40, dayHigh: 1222.00, dayLow: 1195.00, volume: 9800000, avgVolume: 11200000, high52: 1257.90, low52: 908.00 },
  SBIN: { price: 814.20, change: -4.50, changePercent: -0.55, prevClose: 818.70, dayHigh: 825.00, dayLow: 810.00, volume: 14200000, avgVolume: 16000000, high52: 912.00, low52: 555.00 },
  ITC: { price: 495.60, change: 6.80, changePercent: 1.39, prevClose: 488.80, dayHigh: 498.00, dayLow: 486.00, volume: 8900000, avgVolume: 9500000, high52: 528.50, low52: 399.30 },
  BHARTIARTL: { price: 1520.40, change: 32.10, changePercent: 2.16, prevClose: 1488.30, dayHigh: 1530.00, dayLow: 1485.00, volume: 6700000, avgVolume: 5800000, high52: 1570.00, low52: 840.00 },
  LT: { price: 3620.00, change: -42.00, changePercent: -1.15, prevClose: 3662.00, dayHigh: 3680.00, dayLow: 3610.00, volume: 2100000, avgVolume: 2400000, high52: 3919.90, low52: 2850.00 },
  HINDUNILVR: { price: 2510.50, change: 15.20, changePercent: 0.61, prevClose: 2495.30, dayHigh: 2525.00, dayLow: 2490.00, volume: 1800000, avgVolume: 2100000, high52: 2840.00, low52: 2172.00 },
};

async function main() {
  console.log("🌱 Seeding database...");

  // Seed default User & Watchlist
  const user = await prisma.user.upsert({
    where: { sessionId: "default-demo-session-id" },
    update: {},
    create: {
      sessionId: "default-demo-session-id",
    },
  });

  const watchlist = await prisma.watchlist.upsert({
    where: { id: "default-watchlist-id" },
    update: {},
    create: {
      id: "default-watchlist-id",
      userId: user.id,
      name: "My Indian Stocks",
    },
  });

  // Seed Watchlist Items
  for (let i = 0; i < INITIAL_WATCHLIST_SYMBOLS.length; i++) {
    const sym = INITIAL_WATCHLIST_SYMBOLS[i];
    const def = SUPPORTED_INDIAN_STOCKS.find((s) => s.symbol === sym)!;
    await prisma.watchlistItem.upsert({
      where: {
        watchlistId_symbol: {
          watchlistId: watchlist.id,
          symbol: sym,
        },
      },
      update: { displayOrder: i },
      create: {
        watchlistId: watchlist.id,
        symbol: sym,
        nseSymbol: def.nseSymbol,
        name: def.name,
        displayOrder: i,
      },
    });
  }

  // Seed MarketSnapshots & History
  for (const stockDef of SUPPORTED_INDIAN_STOCKS) {
    const q = INITIAL_BASE_QUOTES[stockDef.symbol] || {
      price: 1500.0,
      change: 15.0,
      changePercent: 1.0,
      prevClose: 1485.0,
      dayHigh: 1520.0,
      dayLow: 1480.0,
      volume: 5000000,
      avgVolume: 5000000,
      high52: 1800.0,
      low52: 1200.0,
    };

    await prisma.marketSnapshot.upsert({
      where: { symbol: stockDef.symbol },
      update: {
        price: q.price,
        change: q.change,
        changePercent: q.changePercent,
        previousClose: q.prevClose,
        dayHigh: q.dayHigh,
        dayLow: q.dayLow,
        volume: q.volume,
        avgVolume: q.avgVolume,
        high52: q.high52,
        low52: q.low52,
        timestamp: new Date(),
        provider: "INITIAL_SEED",
        freshness: "RECENT",
      },
      create: {
        symbol: stockDef.symbol,
        name: stockDef.name,
        price: q.price,
        change: q.change,
        changePercent: q.changePercent,
        previousClose: q.prevClose,
        dayHigh: q.dayHigh,
        dayLow: q.dayLow,
        volume: q.volume,
        avgVolume: q.avgVolume,
        high52: q.high52,
        low52: q.low52,
        timestamp: new Date(),
        provider: "INITIAL_SEED",
        freshness: "RECENT",
      },
    });

    // Also insert initial snapshot history point
    await prisma.marketSnapshotHistory.create({
      data: {
        symbol: stockDef.symbol,
        price: q.price,
        change: q.change,
        changePercent: q.changePercent,
        volume: q.volume,
        timestamp: new Date(),
        provider: "INITIAL_SEED",
      },
    });
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
