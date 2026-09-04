import { evaluateMeaningfulChanges } from "../services/rules/meaningfulChangeEngine";
import { MarketQuote } from "../services/market/IMarketDataProvider";

function runTests() {
  console.log("🧪 Running Rules Engine & Attention Score Unit Tests...\n");

  const baseQuote: MarketQuote = {
    symbol: "RELIANCE",
    name: "Reliance Industries Ltd",
    price: 3026.40,
    change: 84.90,
    changePercent: 2.89,
    previousClose: 2941.50,
    open: 2950.00,
    dayHigh: 3045.00,
    dayLow: 2935.00,
    volume: 8500000,
    avgVolume: 5200000,
    high52: 3050.00,
    low52: 2220.30,
    timestamp: new Date(),
    provider: "YAHOO",
    freshness: "LIVE",
  };

  // Test 1: Price move > 2%
  const res1 = evaluateMeaningfulChanges(baseQuote, { price: 2941.50, volume: 5200000, timestamp: new Date() });
  console.assert(res1.hasChanged === true, "Test 1 Failed: Should detect change");
  console.assert(res1.reasons.some(r => r.ruleKey === "PRICE_MOVE"), "Test 1 Failed: Should identify PRICE_MOVE");
  console.log("✅ Test 1 Passed: PRICE_MOVE threshold detected (>2.0%)");

  // Test 2: Volume spike > 1.5x
  console.assert(res1.reasons.some(r => r.ruleKey === "VOLUME_SPIKE"), "Test 2 Failed: Should identify VOLUME_SPIKE");
  console.log("✅ Test 2 Passed: VOLUME_SPIKE threshold detected (8.5M vs 5.2M avg)");

  // Test 3: 52-week High Proximity
  console.assert(res1.reasons.some(r => r.ruleKey === "HIGH_LOW_EXTREME"), "Test 3 Failed: Should identify HIGH_LOW_EXTREME");
  console.log("✅ Test 3 Passed: 52-week High proximity detected (₹3026.40 vs ₹3050.00)");

  // Test 4: Attention score calculation & breakdown
  console.assert(res1.attentionScore >= 60, "Test 4 Failed: Attention score should be >= 60");
  console.log(`✅ Test 4 Passed: Attention Score = ${res1.attentionScore} (${res1.attentionCategory}) - ${res1.attentionBreakdown}`);

  console.log("\n🎉 All Rules Engine unit tests passed!");
}

runTests();
