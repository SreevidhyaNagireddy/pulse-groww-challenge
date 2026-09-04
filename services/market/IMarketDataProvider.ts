export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open?: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  avgVolume?: number;
  high52?: number;
  low52?: number;
  timestamp: Date;
  provider: string; // "YAHOO", "FALLBACK", "SIMULATED"
  freshness: "LIVE" | "RECENT" | "STALE" | "UNAVAILABLE" | "SIMULATED";
}

export interface SearchResult {
  symbol: string;
  name: string;
  nseSymbol: string;
  sector?: string;
}

export interface IMarketDataProvider {
  getQuote(symbol: string): Promise<MarketQuote>;
  getQuotes(symbols: string[]): Promise<Map<string, MarketQuote>>;
  searchSymbols(query: string): Promise<SearchResult[]>;
}
