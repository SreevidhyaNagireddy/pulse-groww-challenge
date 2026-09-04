import { NextRequest, NextResponse } from "next/server";
import { marketService } from "@/services/market/MarketService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    const results = await marketService.search(query);
    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to search stocks", details: error.message },
      { status: 500 }
    );
  }
}
