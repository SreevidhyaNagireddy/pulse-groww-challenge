import { IMarketDataProvider, MarketQuote } from "./IMarketDataProvider";
import { YahooFinanceProvider } from "./YahooFinanceProvider";
import { MockFallbackProvider } from "./MockFallbackProvider";
import { prisma } from "../../lib/prisma";
import { CACHE_TTL_SECONDS, FRESHNESS_LIMITS, NSE_MARKET_HOURS } from "../../lib/constants";

export interface MarketStatus {
  isOpen: boolean;
  message: string;
  nextStateChange?: string;
}

export class MarketService {
  private primaryProvider: IMarketDataProvider;
  private fallbackProvider: IMarketDataProvider;

  constructor() {
    this.primaryProvider = new YahooFinanceProvider();
    this.fallbackProvider = new MockFallbackProvider();
  }

  /**
   * Calculates market freshness state based on snapshot age and provider.
   */
  public calculateFreshness(timestamp: Date, provider: string): MarketQuote["freshness"] {
    if (provider === "SIMULATED") return "SIMULATED";
    if (provider === "FALLBACK") return "STALE"; // fallback data is never "live" — it's a substitute for unavailable real-time data, regardless of how recently it was generated

    const ageSeconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);

    if (ageSeconds < FRESHNESS_LIMITS.LIVE) return "LIVE";
    if (ageSeconds < FRESHNESS_LIMITS.RECENT) return "RECENT";
    if (ageSeconds < FRESHNESS_LIMITS.STALE) return "STALE";
    return "UNAVAILABLE";
  }

  /**
   * Evaluates current Indian NSE Market Open/Closed status.
   */
  public getMarketStatus(): MarketStatus {
    const override = process.env.MARKET_HOURS_MODE;
    if (override === "ALWAYS_OPEN") {
      return { isOpen: true, message: "Market is open (Demo override active)" };
    }
    if (override === "ALWAYS_CLOSED") {
      return { isOpen: false, message: "Market closed — Showing last available prices" };
    }

    // Determine using IST time
    const now = new Date();
    // Format to IST timezone components
    const istString = now.toLocaleString("en-US", { timeZone: NSE_MARKET_HOURS.TIMEZONE });
    const istDate = new Date(istString);

    const dayOfWeek = istDate.getDay(); // 0 = Sun, 6 = Sat
    const hours = istDate.getHours();
    const minutes = istDate.getMinutes();

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const openTimeMinutes = NSE_MARKET_HOURS.OPEN_HOUR * 60 + NSE_MARKET_HOURS.OPEN_MINUTE;
    const closeTimeMinutes = NSE_MARKET_HOURS.CLOSE_HOUR * 60 + NSE_MARKET_HOURS.CLOSE_MINUTE;
    const currentTimeMinutes = hours * 60 + minutes;

    const isTradingHours = currentTimeMinutes >= openTimeMinutes && currentTimeMinutes <= closeTimeMinutes;

    if (isWeekend) {
      return {
        isOpen: false,
        message: "Market closed for the weekend — Values reflect last close",
      };
    }

    if (!isTradingHours) {
      if (currentTimeMinutes < openTimeMinutes) {
        return {
          isOpen: false,
          message: "Pre-market — Opens at 09:15 AM IST",
        };
      }
      return {
        isOpen: false,
        message: "Market closed for today — Values reflect 03:30 PM IST close",
      };
    }

    return {
      isOpen: true,
      message: "Market Open · Live NSE Feed",
    };
  }

  /**
   * Fetches batch quotes with caching (45s TTL) and DB persistence (MarketSnapshot + MarketSnapshotHistory).
   */
  async getQuotesForSymbols(symbols: string[], forceRefresh = false): Promise<Map<string, MarketQuote>> {
    const result = new Map<string, MarketQuote>();
    const symbolsToFetch: string[] = [];

    // Check DB cache first if not force refresh
    if (!forceRefresh) {
      const cachedSnapshots = await prisma.marketSnapshot.findMany({
        where: { symbol: { in: symbols } },
      });

      for (const snap of cachedSnapshots) {
        const ageSec = Math.floor((Date.now() - new Date(snap.timestamp).getTime()) / 1000);
        if (ageSec < CACHE_TTL_SECONDS) {
          result.set(snap.symbol, {
            symbol: snap.symbol,
            name: snap.name,
            price: snap.price,
            change: snap.change,
            changePercent: snap.changePercent,
            previousClose: snap.previousClose,
            open: snap.open || undefined,
            dayHigh: snap.dayHigh || undefined,
            dayLow: snap.dayLow || undefined,
            volume: snap.volume || undefined,
            avgVolume: snap.avgVolume || undefined,
            high52: snap.high52 || undefined,
            low52: snap.low52 || undefined,
            timestamp: snap.timestamp,
            provider: snap.provider,
            freshness: this.calculateFreshness(snap.timestamp, snap.provider),
          });
        } else {
          symbolsToFetch.push(snap.symbol);
        }
      }

      // Add missing symbols
      for (const sym of symbols) {
        if (!result.has(sym) && !symbolsToFetch.includes(sym)) {
          symbolsToFetch.push(sym);
        }
      }
    } else {
      symbolsToFetch.push(...symbols);
    }

    if (symbolsToFetch.length === 0) {
      return result;
    }

    // Try primary Yahoo Finance provider first
    let fetchedQuotes: Map<string, MarketQuote>;
    try {
      fetchedQuotes = await this.primaryProvider.getQuotes(symbolsToFetch);
    } catch {
      // Fallback to offline provider if primary fails
      fetchedQuotes = await this.fallbackProvider.getQuotes(symbolsToFetch);
    }

    // Fill in any missing quotes using fallback provider
    for (const sym of symbolsToFetch) {
      if (!fetchedQuotes.has(sym)) {
        const fallbackQ = await this.fallbackProvider.getQuote(sym);
        fetchedQuotes.set(sym, fallbackQ);
      }
    }

    // Persist to PostgreSQL (Upsert MarketSnapshot & Create MarketSnapshotHistory)
    for (const [sym, q] of Array.from(fetchedQuotes.entries())) {
      // Re-derive freshness centrally — provider values (e.g. hardcoded "LIVE" from Yahoo) are
      // overridden here so every code path (cache hit, fresh fetch, fallback) uses the same logic.
      const canonicalFreshness = this.calculateFreshness(q.timestamp, q.provider);
      const canonicalQuote: MarketQuote = { ...q, freshness: canonicalFreshness };
      result.set(sym, canonicalQuote);

      try {
        await prisma.marketSnapshot.upsert({
          where: { symbol: sym },
          update: {
            name: q.name,
            price: q.price,
            change: q.change,
            changePercent: q.changePercent,
            previousClose: q.previousClose,
            open: q.open,
            dayHigh: q.dayHigh,
            dayLow: q.dayLow,
            volume: q.volume,
            avgVolume: q.avgVolume,
            high52: q.high52,
            low52: q.low52,
            timestamp: q.timestamp,
            provider: q.provider,
            freshness: canonicalFreshness,
          },
          create: {
            symbol: sym,
            name: q.name,
            price: q.price,
            change: q.change,
            changePercent: q.changePercent,
            previousClose: q.previousClose,
            open: q.open,
            dayHigh: q.dayHigh,
            dayLow: q.dayLow,
            volume: q.volume,
            avgVolume: q.avgVolume,
            high52: q.high52,
            low52: q.low52,
            timestamp: q.timestamp,
            provider: q.provider,
            freshness: canonicalFreshness,
          },
        });

        // Append-only history record for price charts
        await prisma.marketSnapshotHistory.create({
          data: {
            symbol: sym,
            price: q.price,
            change: q.change,
            changePercent: q.changePercent,
            volume: q.volume,
            timestamp: q.timestamp,
            provider: q.provider,
          },
        });
      } catch (dbErr) {
        console.warn(`[MARKET_SERVICE_PERSIST_WARN] Failed to persist snapshot for ${sym}:`, dbErr);
      }
    }

    return result;
  }

  /**
   * Search stock symbols across local registry and remote API.
   */
  async search(query: string) {
    try {
      return await this.primaryProvider.searchSymbols(query);
    } catch {
      return await this.fallbackProvider.searchSymbols(query);
    }
  }
}

export const marketService = new MarketService();
