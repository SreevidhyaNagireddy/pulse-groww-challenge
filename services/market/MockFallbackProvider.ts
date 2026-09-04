import { IMarketDataProvider, MarketQuote, SearchResult } from "./IMarketDataProvider";
import { SUPPORTED_INDIAN_STOCKS } from "../../lib/constants";

export class MockFallbackProvider implements IMarketDataProvider {
  private fallbackData: Map<string, MarketQuote> = new Map([
    ["RELIANCE", { symbol: "RELIANCE", name: "Reliance Industries Ltd", price: 3026.40, change: 84.90, changePercent: 2.89, previousClose: 2941.50, dayHigh: 3045.00, dayLow: 2935.00, volume: 8500000, avgVolume: 5200000, high52: 3217.90, low52: 2220.30, timestamp: new Date(), provider: "FALLBACK", freshness: "STALE" }],
    ["TCS", { symbol: "TCS", name: "Tata Consultancy Services", price: 3026.00, change: -76.00, changePercent: -2.45, previousClose: 3102.00, dayHigh: 3110.00, dayLow: 3015.00, volume: 3800000, avgVolume: 2900000, high52: 4585.90, low52: 3000.00, timestamp: new Date(), provider: "FALLBACK", freshness: "STALE" }],
    ["INFY", { symbol: "INFY", name: "Infosys Ltd", price: 1548.00, change: 61.00, changePercent: 4.10, previousClose: 1487.00, dayHigh: 1555.00, dayLow: 1480.00, volume: 18500000, avgVolume: 10200000, high52: 1991.45, low52: 1355.00, timestamp: new Date(), provider: "FALLBACK", freshness: "STALE" }],
    ["HDFCBANK", { symbol: "HDFCBANK", name: "HDFC Bank Ltd", price: 1642.50, change: 12.30, changePercent: 0.75, previousClose: 1630.20, dayHigh: 1650.00, dayLow: 1625.00, volume: 12400000, avgVolume: 15000000, high52: 1794.00, low52: 1363.55, timestamp: new Date(), provider: "FALLBACK", freshness: "STALE" }],
    ["ICICIBANK", { symbol: "ICICIBANK", name: "ICICI Bank Ltd", price: 1215.80, change: 18.40, changePercent: 1.54, previousClose: 1197.40, dayHigh: 1222.00, dayLow: 1195.00, volume: 9800000, avgVolume: 11200000, high52: 1257.90, low52: 908.00, timestamp: new Date(), provider: "FALLBACK", freshness: "STALE" }],
    ["SBIN", { symbol: "SBIN", name: "State Bank of India", price: 814.20, change: -4.50, changePercent: -0.55, previousClose: 818.70, dayHigh: 825.00, dayLow: 810.00, volume: 14200000, avgVolume: 16000000, high52: 912.00, low52: 555.00, timestamp: new Date(), provider: "FALLBACK", freshness: "STALE" }],
    ["ITC", { symbol: "ITC", name: "ITC Ltd", price: 495.60, change: 6.80, changePercent: 1.39, previousClose: 488.80, dayHigh: 498.00, dayLow: 486.00, volume: 8900000, avgVolume: 9500000, high52: 528.50, low52: 399.30, timestamp: new Date(), provider: "FALLBACK", freshness: "STALE" }],
    ["BHARTIARTL", { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd", price: 1520.40, change: 32.10, changePercent: 2.16, previousClose: 1488.30, dayHigh: 1530.00, dayLow: 1485.00, volume: 6700000, avgVolume: 5800000, high52: 1570.00, low52: 840.00, timestamp: new Date(), provider: "FALLBACK", freshness: "STALE" }],
    ["LT", { symbol: "LT", name: "Larsen & Toubro Ltd", price: 3620.00, change: -42.00, changePercent: -1.15, previousClose: 3662.00, dayHigh: 3680.00, dayLow: 3610.00, volume: 2100000, avgVolume: 2400000, high52: 3919.90, low52: 2850.00, timestamp: new Date(), provider: "FALLBACK", freshness: "STALE" }],
    ["HINDUNILVR", { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd", price: 2510.50, change: 15.20, changePercent: 0.61, previousClose: 2495.30, dayHigh: 2525.00, dayLow: 2490.00, volume: 1800000, avgVolume: 2100000, high52: 2840.00, low52: 2172.00, timestamp: new Date(), provider: "FALLBACK", freshness: "STALE" }],
  ]);

  async getQuote(symbol: string): Promise<MarketQuote> {
    const sym = symbol.replace(".NS", "").toUpperCase();
    const existing = this.fallbackData.get(sym);
    if (existing) {
      return {
        ...existing,
        timestamp: new Date(),
        provider: "FALLBACK",
        freshness: "STALE",
      };
    }

    const def = SUPPORTED_INDIAN_STOCKS.find((s) => s.symbol === sym);
    return {
      symbol: sym,
      name: def?.name || sym,
      price: 1000.0,
      change: 0.0,
      changePercent: 0.0,
      previousClose: 1000.0,
      timestamp: new Date(),
      provider: "FALLBACK",
      freshness: "STALE",
    };
  }

  async getQuotes(symbols: string[]): Promise<Map<string, MarketQuote>> {
    const map = new Map<string, MarketQuote>();
    for (const sym of symbols) {
      const q = await this.getQuote(sym);
      map.set(q.symbol, q);
    }
    return map;
  }

  async searchSymbols(query: string): Promise<SearchResult[]> {
    if (!query) return [];
    const q = query.toLowerCase();
    return SUPPORTED_INDIAN_STOCKS.filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    ).map((s) => ({
      symbol: s.symbol,
      name: s.name,
      nseSymbol: s.nseSymbol,
      sector: s.sector,
    }));
  }
}
