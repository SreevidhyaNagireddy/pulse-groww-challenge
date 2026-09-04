import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  // Gate check: Must have ENABLE_DEMO_SIMULATION=true in environment
  if (process.env.ENABLE_DEMO_SIMULATION !== "true") {
    return NextResponse.json(
      { error: "Demo simulation is disabled on this server environment." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { symbol, priceDeltaPercent, volumeMultiplier, scenario } = body;

    let targetSymbols: string[] = [];
    if (symbol) {
      targetSymbols = [symbol.replace(".NS", "").toUpperCase()];
    } else if (scenario === "BREAKOUT") {
      targetSymbols = ["RELIANCE", "INFY", "TCS"];
    } else {
      targetSymbols = ["RELIANCE"];
    }

    const updatedSimulations: any[] = [];

    for (const sym of targetSymbols) {
      const existing = await prisma.marketSnapshot.findUnique({
        where: { symbol: sym },
      });

      const basePrice = existing?.price || 1500.0;
      const basePrevClose = existing?.previousClose || basePrice * 0.98;
      const baseVol = existing?.volume || 5000000;
      const baseAvgVol = existing?.avgVolume || 4000000;

      // Apply price delta and volume multiplier
      const pctShift = priceDeltaPercent !== undefined ? priceDeltaPercent : (sym === "INFY" ? 4.8 : sym === "TCS" ? -3.2 : 2.9);
      const volMult = volumeMultiplier !== undefined ? volumeMultiplier : (sym === "INFY" ? 1.9 : 1.2);

      const newPrice = Math.round((basePrice * (1 + pctShift / 100)) * 100) / 100;
      const newChange = Math.round((newPrice - basePrevClose) * 100) / 100;
      const newChangePercent = Math.round(((newPrice - basePrevClose) / basePrevClose) * 100 * 100) / 100;
      const newVol = Math.round(baseVol * volMult);

      // Save as SIMULATED snapshot
      const updatedSnap = await prisma.marketSnapshot.upsert({
        where: { symbol: sym },
        update: {
          price: newPrice,
          change: newChange,
          changePercent: newChangePercent,
          volume: newVol,
          avgVolume: baseAvgVol,
          timestamp: new Date(),
          provider: "SIMULATED",
          freshness: "SIMULATED",
        },
        create: {
          symbol: sym,
          name: existing?.name || sym,
          price: newPrice,
          change: newChange,
          changePercent: newChangePercent,
          previousClose: basePrevClose,
          volume: newVol,
          avgVolume: baseAvgVol,
          timestamp: new Date(),
          provider: "SIMULATED",
          freshness: "SIMULATED",
        },
      });

      // Insert append-only history record tagged SIMULATED
      await prisma.marketSnapshotHistory.create({
        data: {
          symbol: sym,
          price: newPrice,
          change: newChange,
          changePercent: newChangePercent,
          volume: newVol,
          timestamp: new Date(),
          provider: "SIMULATED",
        },
      });

      updatedSimulations.push(updatedSnap);
    }

    return NextResponse.json({
      message: "Market simulation tick generated successfully",
      provider: "SIMULATED",
      freshness: "SIMULATED",
      simulatedSnapshots: updatedSimulations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to run market simulation tick", details: error.message },
      { status: 500 }
    );
  }
}
