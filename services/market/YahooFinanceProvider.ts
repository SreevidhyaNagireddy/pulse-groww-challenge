import { IMarketDataProvider, MarketQuote, SearchResult } from "./IMarketDataProvider";
import { SUPPORTED_INDIAN_STOCKS } from "../../lib/constants";

const yahooFinanceWarning = "[yahoo-finance2] v2 is no longer maintained nor supported.";
let yahooFinanceClient: Promise<typeof import("yahoo-finance2").default> | undefined;

function loadYahooFinance() {
  if (!yahooFinanceClient) {
    yahooFinanceClient = (async () => {
      const originalWarn = console.warn;
      console.warn = (...args: unknown[]) => {
        if (typeof args[0] !== "string" || !args[0].startsWith(yahooFinanceWarning)) {
          originalWarn(...args);
        }
      };

      try {
        return (await import("yahoo-finance2")).default;
      } finally {
        console.warn = originalWarn;
      }
    })();
  }

  return yahooFinanceClient;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

export class YahooFinanceProvider implements IMarketDataProvider {
  private getNseSymbol(symbol: string): string {
    const found = SUPPORTED_INDIAN_STOCKS.find(
      (s) => s.symbol.toUpperCase() === symbol.toUpperCase()
    );
    if (found) return found.nseSymbol;
    // If already has .NS suffix, use it; otherwise append .NS
    return symbol.toUpperCase().endsWith(".NS")
      ? symbol.toUpperCase()
      : `${symbol.toUpperCase()}.NS`;
  }

  private cleanSymbol(symbol: string): string {
    return symbol.replace(".NS", "").toUpperCase();
  }

  private async fetchQuote(symbol: string): Promise<MarketQuote> {
    const yahooFinance = await loadYahooFinance();
    const nseSymbol = this.getNseSymbol(symbol);
    const cleanSym = this.cleanSymbol(symbol);
    const result: any = await yahooFinance.quote(nseSymbol);

    if (!result || typeof result.regularMarketPrice !== "number" || !Number.isFinite(result.regularMarketPrice)) {
      throw new Error(`Failed to fetch Yahoo Finance quote for ${symbol}: Invalid price`);
    }

    const price = result.regularMarketPrice;
    const previousClose = Number.isFinite(result.regularMarketPreviousClose) ? result.regularMarketPreviousClose : price;
    const change = Number.isFinite(result.regularMarketChange) ? result.regularMarketChange : (price - previousClose);
    const changePercent = Number.isFinite(result.regularMarketChangePercent)
      ? result.regularMarketChangePercent
      : (previousClose !== 0 ? ((change / previousClose) * 100) : 0);

    const matchedDef = SUPPORTED_INDIAN_STOCKS.find((s) => s.symbol === cleanSym);

    return {
      symbol: cleanSym,
      name: matchedDef?.name || result.shortName || result.longName || cleanSym,
      price,
      change,
      changePercent,
      previousClose,
      open: Number.isFinite(result.regularMarketOpen) ? result.regularMarketOpen : undefined,
      dayHigh: Number.isFinite(result.regularMarketDayHigh) ? result.regularMarketDayHigh : undefined,
      dayLow: Number.isFinite(result.regularMarketDayLow) ? result.regularMarketDayLow : undefined,
      volume: Number.isFinite(result.regularMarketVolume) ? result.regularMarketVolume : undefined,
      avgVolume: Number.isFinite(result.averageDailyVolume10Day)
        ? result.averageDailyVolume10Day
        : Number.isFinite(result.averageDailyVolume3Month)
        ? result.averageDailyVolume3Month
        : undefined,
      high52: Number.isFinite(result.fiftyTwoWeekHigh) ? result.fiftyTwoWeekHigh : undefined,
      low52: Number.isFinite(result.fiftyTwoWeekLow) ? result.fiftyTwoWeekLow : undefined,
      timestamp: new Date(),
      provider: "YAHOO",
      freshness: "LIVE",
    };
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    return withTimeout(this.fetchQuote(symbol), 3500, `Yahoo Finance quote timeout for ${symbol}`);
  }

  async getQuotes(symbols: string[]): Promise<Map<string, MarketQuote>> {
    const map = new Map<string, MarketQuote>();
    // Batch fetch using Promise.allSettled with per-symbol timeout
    const results = await Promise.allSettled(
      symbols.map((sym) => this.getQuote(sym))
    );

    results.forEach((res, index) => {
      if (res.status === "fulfilled") {
        map.set(this.cleanSymbol(symbols[index]), res.value);
      }
    });

    return map;
  }

  async searchSymbols(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) return [];
    const q = query.toLowerCase().trim();

    // First check local Indian stock directory
    const localMatches = SUPPORTED_INDIAN_STOCKS.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q)
    );

    if (localMatches.length > 0) {
      return localMatches.map((s) => ({
        symbol: s.symbol,
        name: s.name,
        nseSymbol: s.nseSymbol,
        sector: s.sector,
      }));
    }

    // Otherwise, search Yahoo Finance API with 3s timeout
    try {
      const searchPromise = (async () => {
        const yahooFinance = await loadYahooFinance();
        const searchRes: any = await yahooFinance.search(query, { newsCount: 0 });
        const quotes = searchRes?.quotes || [];
        return quotes
          .filter((item: any) => item.symbol && (item.symbol.endsWith(".NS") || item.shortname))
          .slice(0, 8)
          .map((item: any) => ({
            symbol: this.cleanSymbol(item.symbol),
            name: item.shortname || item.longname || item.symbol,
            nseSymbol: item.symbol.endsWith(".NS") ? item.symbol : `${item.symbol}.NS`,
            sector: item.sector || "Equities",
          }));
      })();

      return await withTimeout(searchPromise, 3000, "Search timeout");
    } catch {
      return [];
    }
  }
}
