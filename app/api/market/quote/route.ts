import { NextRequest, NextResponse } from "next/server";
import { marketService } from "@/services/market/MarketService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbolsParam = searchParams.get("symbols");

    if (!symbolsParam) {
      return NextResponse.json({ error: "Missing required query parameter: symbols" }, { status: 400 });
    }

    const symbols = symbolsParam.split(",").map((s) => s.trim().toUpperCase());
    const quotesMap = await marketService.getQuotesForSymbols(symbols, true);

    const quotesObj: Record<string, any> = {};
    quotesMap.forEach((quote, sym) => {
      quotesObj[sym] = quote;
    });

    return NextResponse.json({
      quotes: quotesObj,
      marketStatus: marketService.getMarketStatus(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch quotes", details: error.message },
      { status: 500 }
    );
  }
}
