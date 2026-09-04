import { marketService } from "../services/market/MarketService";

async function testQuotes() {
  console.log("Testing getQuotesForSymbols for HDFCBANK, RELIANCE, TCS, INFY...");
  try {
    const quotes = await marketService.getQuotesForSymbols(["HDFCBANK", "RELIANCE", "TCS", "INFY"], true);
    console.log("Fetched quotes count:", quotes.size);
    for (const [sym, q] of quotes.entries()) {
      console.log(`Symbol: ${sym}, Price: ${q.price}, Provider: ${q.provider}, Freshness: ${q.freshness}`);
    }
  } catch (err: any) {
    console.error("getQuotesForSymbols failed:", err);
  }
}

testQuotes();
