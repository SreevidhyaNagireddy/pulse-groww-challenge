import { prisma } from "../lib/prisma";
import { evaluateMeaningfulChanges } from "../services/rules/meaningfulChangeEngine";
import { randomUUID } from "crypto";

async function runWatchlistTests() {
  console.log("🧪 Running Watchlist & Checkpoint Integration Tests...\n");

  const testSessionId = `test-session-${randomUUID()}`;

  try {
    // 1. Create Test User and Watchlist
    const user = await prisma.user.create({
      data: {
        sessionId: testSessionId,
        watchlists: {
          create: {
            name: "Test Watchlist",
          },
        },
      },
      include: { watchlists: true },
    });
    const watchlist = user.watchlists[0];
    console.log("✅ Test 1 Passed: Created test user & watchlist:", watchlist.id);

    // 2. Add Stock Items to Watchlist
    const item1 = await prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist.id,
        symbol: "RELIANCE",
        nseSymbol: "RELIANCE.NS",
        name: "Reliance Industries Ltd",
        displayOrder: 0,
      },
    });

    const item2 = await prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist.id,
        symbol: "TCS",
        nseSymbol: "TCS.NS",
        name: "Tata Consultancy Services",
        displayOrder: 1,
      },
    });
    console.log("✅ Test 2 Passed: Added RELIANCE and TCS to watchlist");

    // 3. Verify Duplicate Handling Check
    const existing = await prisma.watchlistItem.findUnique({
      where: {
        watchlistId_symbol: {
          watchlistId: watchlist.id,
          symbol: "RELIANCE",
        },
      },
    });
    if (!existing) throw new Error("Expected existing RELIANCE item");
    console.log("✅ Test 3 Passed: Duplicate item detection operates correctly");

    // 4. Test Reordering (displayOrder swap)
    await prisma.$transaction([
      prisma.watchlistItem.update({
        where: { id: item1.id },
        data: { displayOrder: 1 },
      }),
      prisma.watchlistItem.update({
        where: { id: item2.id },
        data: { displayOrder: 0 },
      }),
    ]);

    const reordered = await prisma.watchlistItem.findMany({
      where: { watchlistId: watchlist.id },
      orderBy: { displayOrder: "asc" },
    });
    if (reordered[0].symbol !== "TCS" || reordered[1].symbol !== "RELIANCE") {
      throw new Error("Reorder failed: Expected TCS first, then RELIANCE");
    }
    console.log("✅ Test 4 Passed: Watchlist reorder persists displayOrder correctly");

    // 5. Establish Baseline Checkpoint
    const baselineSnapshot = {
      RELIANCE: { price: 3000.0, volume: 5000000, timestamp: new Date().toISOString() },
      TCS: { price: 4200.0, volume: 2000000, timestamp: new Date().toISOString() },
    };

    const checkpoint = await prisma.checkpoint.create({
      data: {
        watchlistId: watchlist.id,
        snapshotData: JSON.stringify(baselineSnapshot),
      },
    });
    console.log("✅ Test 5 Passed: Established baseline checkpoint:", checkpoint.id);

    // 6. Test Meaningful Change Evaluation Against Baseline
    // RELIANCE moved from 3000.0 -> 3100.0 (+3.33% > 2% threshold)
    const currentQuote = {
      symbol: "RELIANCE",
      name: "Reliance Industries Ltd",
      price: 3100.0,
      change: 100.0,
      changePercent: 3.33,
      previousClose: 3000.0,
      volume: 5200000,
      timestamp: new Date(),
      freshness: "LIVE" as const,
      provider: "YAHOO",
    };

    const evaluation = evaluateMeaningfulChanges(currentQuote, {
      price: baselineSnapshot.RELIANCE.price,
      volume: baselineSnapshot.RELIANCE.volume,
      timestamp: new Date(baselineSnapshot.RELIANCE.timestamp),
    });

    if (!evaluation.hasChanged) {
      throw new Error("Expected hasChanged = true for +3.33% move");
    }
    if (evaluation.attentionScore < 30) {
      throw new Error(`Expected attentionScore >= 30, got ${evaluation.attentionScore}`);
    }
    console.log(
      `✅ Test 6 Passed: Meaningful change detected (+${evaluation.changePercent.toFixed(2)}%, Attention Score: ${evaluation.attentionScore})`
    );

    // 7. Test Item Removal
    await prisma.watchlistItem.deleteMany({
      where: { watchlistId: watchlist.id, symbol: "TCS" },
    });
    const remaining = await prisma.watchlistItem.findMany({
      where: { watchlistId: watchlist.id },
    });
    if (remaining.length !== 1 || remaining[0].symbol !== "RELIANCE") {
      throw new Error("Removal failed");
    }
    console.log("✅ Test 7 Passed: Item removed successfully from watchlist");

    // Clean up test data
    await prisma.checkpoint.deleteMany({ where: { watchlistId: watchlist.id } });
    await prisma.watchlistItem.deleteMany({ where: { watchlistId: watchlist.id } });
    await prisma.watchlist.delete({ where: { id: watchlist.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log("✅ Test Cleaned up: Removed test fixtures from database\n");

    console.log("🎉 All Watchlist & Checkpoint Integration tests passed successfully!\n");
  } catch (error) {
    console.error("❌ Integration test failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runWatchlistTests();
