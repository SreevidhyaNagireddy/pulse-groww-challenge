import { MockFallbackProvider } from "../services/market/MockFallbackProvider";
import { MarketService } from "../services/market/MarketService";

async function runFallbackTests() {
  console.log("🧪 Running Fallback Provider & Error Degradation Tests...\n");

  const fallback = new MockFallbackProvider();

  // Test 1: Fetch stock quote from fallback provider
  const quote = await fallback.getQuote("RELIANCE");
  console.assert(quote.provider === "FALLBACK", "Test 1 Failed: Provider should be FALLBACK");
  console.assert(quote.freshness === "STALE", "Test 1 Failed: Freshness should be STALE for fallback data");
  console.assert(quote.price > 0, "Test 1 Failed: Price should be positive number");
  console.log(`✅ Test 1 Passed: Fallback quote returned for RELIANCE (₹${quote.price}) tagged provider: "${quote.provider}", freshness: "${quote.freshness}"`);

  // Test 2: Calculate freshness for simulated and stale timestamps
  const marketService = new MarketService();

  const simFreshness = marketService.calculateFreshness(new Date(), "SIMULATED");
  console.assert(simFreshness === "SIMULATED", "Test 2 Failed: SIMULATED provider should have SIMULATED freshness");
  console.log("✅ Test 2 Passed: Simulated provider correctly tags freshness as SIMULATED");

  const oldDate = new Date(Date.now() - 1000 * 60 * 10); // 10 minutes ago
  const staleFreshness = marketService.calculateFreshness(oldDate, "YAHOO");
  console.assert(staleFreshness === "STALE", "Test 3 Failed: 10m old data should be STALE");
  console.log("✅ Test 3 Passed: 10-minute old market data correctly marked as STALE");

  console.log("\n🎉 All Fallback Provider tests passed!");
}

runFallbackTests();
