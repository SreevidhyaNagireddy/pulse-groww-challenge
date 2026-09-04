# Pulse — Smart Market Watchlist: Submission Report

**Challenge**: CODE 2026 / Code, by Groww  
**Project**: Pulse — Smart Market Watchlist ("Know what changed.")  
**Author**: Sree Vidhya Nagireddy  
**Repository**: [Groww_project](.)  
**Tech Stack**: Next.js 14 (App Router), TypeScript, Prisma ORM, PostgreSQL 16 (Docker), Tailwind CSS, Recharts

---

## 1. Executive Summary

Traditional financial watchlists present users with an overwhelming wall of fluctuating numbers, shifting the burden onto the user to mentally recall past prices and spot meaningful movements.

**Pulse** transforms the watchlist into an active monitoring and awareness system for Indian equities (NSE). Rather than passively listing quotes, Pulse answers the trader's core question:

> **"What has meaningfully changed since I last checked, and why does it deserve my attention?"**

Through a **Checkpoint Baseline Engine**, a **Deterministic Attention Scoring Engine (0–100)**, and a **Resilient Provider Architecture**, Pulse provides instant clarity on market movements with 100% explainability.

---

## 2. Core Requirements & Delivery Matrix

| Requirement | Implementation in Pulse | Status |
| :--- | :--- | :---: |
| **Create and manage a watchlist** | Add Indian equities (NSE tickers), reorder items (up/down), and delete items with persistent storage. | **Complete** |
| **View latest market information** | Real-time prices, daily change %, day high/low, 52-week extremes, volume metrics, and market status (NSE IST hours). | **Complete** |
| **Return later and see what changed** | **"Since you were away"** feature compares current prices against the user's saved baseline checkpoint. | **Complete** |
| **Frontend and backend** | Unified Next.js 14 full-stack architecture with modular API route handlers, business logic engines, and React UI. | **Complete** |
| **Decide what counts as meaningful change** | Multi-factor rules engine: price moves ($\ge 2\%$, $\ge 4\%$), volume spikes ($\ge 1.5\times$ avg), 52-week extremes, and opening gaps. | **Complete** |
| **Persist state across sessions/devices** | Relational PostgreSQL database with session cookies (`pulse_session_id`) and atomic user/watchlist initialization. | **Complete** |
| **Handle stale, delayed, or conflicting data** | Centrally derived freshness lifecycle (`LIVE`, `RECENT`, `STALE`, `SIMULATED`, `UNAVAILABLE`) with 3.5s timeout and automatic fallback. | **Complete** |
| **Think about scalability & trade-offs** | Decoupled provider layer (`IMarketDataProvider`), 45s TTL cache, append-only history tables, and deterministic rules. | **Complete** |

---

## 3. Product Innovation: How "Meaningful Change" Works

Pulse rejects arbitrary thresholds and opaque machine-learning predictions in favor of an **explainable, deterministic rules engine**:

### The 5 Core Rules
1. **Large Move (+45 pts)**: Stock moved $\ge 4.0\%$ since the user's baseline checkpoint. (Severity: Warning/Critical)
2. **Price Move (+30 pts)**: Stock moved $\ge 2.0\%$ since the baseline checkpoint. (Severity: Info)
3. **Volume Spike (+25 pts)**: Trading volume exceeded $1.5\times$ the 10-day average volume, indicating institutional participation. (Severity: Warning)
4. **52-Week Extreme (+20 pts)**: Price is within $1.5\%$ of its 52-week High or 52-week Low. (Severity: Warning)
5. **Opening Gap (+20 pts)**: Today's open gapped $\ge 1.5\%$ from yesterday's close. (Severity: Info)

### Explainable Attention Score (0–100)
Scores are grouped into 4 intuitive bands:
- **Quiet (0–29)**: Standard market fluctuations.
- **Watch (30–59)**: Notable movement or volume expansion.
- **Notable (60–79)**: Confluence of multiple technical factors.
- **Significant (80–100)**: Major price and volume shock.

Every score displays its explicit mathematical rationale directly in the UI (e.g. `+30 meaningful price move, +25 unusual trading volume`).

---

## 4. Engineering Architecture & Resilience

### 1. Data Provider Decoupling
Pulse implements the `IMarketDataProvider` interface:
```typescript
export interface IMarketDataProvider {
  getQuote(symbol: string): Promise<MarketQuote>;
  getQuotes(symbols: string[]): Promise<Map<string, MarketQuote>>;
  searchSymbols(query: string): Promise<SearchResult[]>;
}
```
- **Primary Provider (`YahooFinanceProvider`)**: Fetches live quotes with a **3.5s timeout wrapper** and strict numeric sanitization.
- **Fallback Provider (`MockFallbackProvider`)**: Automatically activated on network failures, rate limits, or external timeouts. Data is always truthfully marked with `provider: "FALLBACK"` and `freshness: "STALE"`.
- **Simulation Engine (`/api/market/simulate`)**: Allows challenge evaluators to test market movements on demand outside NSE market hours. All simulated data is explicitly tagged `SIMULATED DATA`.

### 2. Market Hours Intelligence
NSE trading hours (09:15 AM to 03:30 PM IST) are monitored dynamically:
- Outside market hours or on weekends, Pulse displays informative status headers (`Market closed — Values reflect 03:30 PM IST close`).

### 3. Database Schema (PostgreSQL via Prisma)
- `User`: Anonymous persistent identity tied to HTTP-only cookie.
- `Watchlist` & `WatchlistItem`: User watchlists with explicit `displayOrder` supporting instant reordering.
- `MarketSnapshot`: Fast-read cache table with 45s TTL to minimize external API roundtrips.
- `MarketSnapshotHistory`: Append-only time-series record for stock charts.
- `Checkpoint`: JSON snapshot of watchlist prices at a specific point in time.
- `MeaningfulEvent`: Deduplicated event log documenting every triggered rule.

---

## 5. Deliberate Engineering Trade-offs

1. **Deterministic Rules vs. AI/ML Models**:
   - *Rationale*: In financial monitoring, trust is paramount. A trader needs to know why an alert triggered. Rules are 100% auditable, reproducible, and have zero latency.
2. **PostgreSQL vs. SQLite/Local Storage**:
   - *Rationale*: Real persistence requires a real database. We rejected `localStorage` because watchlists must support multi-device sessions and server-side change evaluations.
3. **45-Second Cache TTL**:
   - *Rationale*: Aggressive caching hides market changes; no caching overwhelms upstream rate limits. A 45-second TTL provides optimal freshness while respecting network limits.
4. **Session Cookies vs. Complex Auth**:
   - *Rationale*: Zero-friction onboarding was prioritized for evaluation. The schema is designed so OAuth (e.g., NextAuth) can be added seamlessly.

---

## 6. Verification & Quality Assurance

All features were validated across multiple test suites:

- **Unit Tests (`tests/rules.test.ts`)**: Passed 4/4 tests for all rule thresholds and score calculations.
- **Degradation Tests (`tests/fallback.test.ts`)**: Passed 3/3 tests verifying timeout handling and freshness tagging.
- **Integration Tests (`tests/watchlist.test.ts`)**: Passed 7/7 tests verifying session creation, stock addition, duplicate prevention, reordering, checkpoint creation, and baseline change evaluations.
- **TypeScript Typecheck (`npm run typecheck`)**: Passed with 0 errors.
- **Production Build (`npm run build`)**: Successfully compiled all 10 static and dynamic routes.
- **End-to-End HTTP Flow**: All 10 user journey steps executed and verified with 200/201 responses.

---

## 7. Conclusion

Pulse delivers an opinionated, production-grade response to the CODE 2026 challenge. By focusing on **what changed**, **why it matters**, and **truthful data freshness**, Pulse proves that a watchlist can be far smarter than a grid of stock prices.
