export interface StockDefinition {
  symbol: string;
  name: string;
  nseSymbol: string;
  sector: string;
}

export const SUPPORTED_INDIAN_STOCKS: StockDefinition[] = [
  { symbol: "RELIANCE", name: "Reliance Industries Ltd", nseSymbol: "RELIANCE.NS", sector: "Energy / Conglomerate" },
  { symbol: "TCS", name: "Tata Consultancy Services", nseSymbol: "TCS.NS", sector: "Information Technology" },
  { symbol: "INFY", name: "Infosys Ltd", nseSymbol: "INFY.NS", sector: "Information Technology" },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", nseSymbol: "HDFCBANK.NS", sector: "Banking & Financials" },
  { symbol: "ICICIBANK", name: "ICICI Bank Ltd", nseSymbol: "ICICIBANK.NS", sector: "Banking & Financials" },
  { symbol: "SBIN", name: "State Bank of India", nseSymbol: "SBIN.NS", sector: "Banking & Financials" },
  { symbol: "ITC", name: "ITC Ltd", nseSymbol: "ITC.NS", sector: "Consumer Goods" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd", nseSymbol: "BHARTIARTL.NS", sector: "Telecommunications" },
  { symbol: "LT", name: "Larsen & Toubro Ltd", nseSymbol: "LT.NS", sector: "Engineering & Infrastructure" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd", nseSymbol: "HINDUNILVR.NS", sector: "Consumer Goods" },
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd", nseSymbol: "TATAMOTORS.NS", sector: "Automotive" },
  { symbol: "WIPRO", name: "Wipro Ltd", nseSymbol: "WIPRO.NS", sector: "Information Technology" },
  { symbol: "AXISBANK", name: "Axis Bank Ltd", nseSymbol: "AXISBANK.NS", sector: "Banking & Financials" },
  { symbol: "ASIANPAINT", name: "Asian Paints Ltd", nseSymbol: "ASIANPAINT.NS", sector: "Consumer Durables" },
  { symbol: "MARUTI", name: "Maruti Suzuki India Ltd", nseSymbol: "MARUTI.NS", sector: "Automotive" },
];

export const INITIAL_WATCHLIST_SYMBOLS = [
  "RELIANCE",
  "TCS",
  "INFY",
  "HDFCBANK",
  "ICICIBANK",
];

// Centralized rule-based thresholds
export const THRESHOLDS = {
  PRICE_MOVE: 0.02,        // 2.0% change
  LARGE_MOVE: 0.04,        // 4.0% change
  VOLUME_SPIKE: 1.5,       // 1.5x recent volume average
  EXTREME_PROXIMITY: 0.015,// Within 1.5% of 52-week High/Low
  GAP_OPEN: 0.015,         // 1.5% gap at open vs prev close
};

// Cache and Freshness limits (in seconds)
export const CACHE_TTL_SECONDS = 45;
export const FRESHNESS_LIMITS = {
  LIVE: 60,                // < 60s
  RECENT: 300,             // 60s - 5m
  STALE: 1800,             // 5m - 30m
};

// NSE Trading Hours: Mon-Fri 09:15 to 15:30 IST (UTC+5:30)
export const NSE_MARKET_HOURS = {
  OPEN_HOUR: 9,
  OPEN_MINUTE: 15,
  CLOSE_HOUR: 15,
  CLOSE_MINUTE: 30,
  TIMEZONE: "Asia/Kolkata",
};
