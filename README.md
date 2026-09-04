# Pulse — Know What Changed.
# Pulse — Know What Changed.

> **Smart Market Watchlist for Indian Equities**

> Built for the **Groww CODE 2026 Challenge** by **Sree Vidhya Nagireddy**.

---

## Product Pitch

Pulse is a smart market watchlist for Indian equities that answers a simple question: “What meaningfully changed since I last checked, and why should I care?” Users create a baseline checkpoint, return later, and instantly see stocks that crossed transparent thresholds for price movement, volume spikes, 52-week extremes, or opening gaps. Each stock receives an explainable 0–100 attention score with plain-language reasons instead of opaque predictions. I designed Pulse around deterministic rules, real-time market data, PostgreSQL persistence, and a resilient provider layer with automatic fallback handling. This keeps the experience fast, reliable, transparent, and useful without providing financial advice or predictions.

---

## 1. What Pulse Does

> **Smart Market Watchlist for Indian Equities**  
> Built for the **Groww CODE 2026 Challenge** by **Sree Vidhya Nagireddy**.

---

## 1. What Pulse Does

Pulse is a smart market watchlist for Indian equities (NSE). Rather than asking you to scan a wall of green and red numbers every time you open the app, Pulse answers a fundamental question:

> **"What has meaningfully changed since I last checked, and why does it deserve my attention?"**

1. **Add Stocks**: Track any Indian equity (e.g. `RELIANCE`, `TCS`, `INFY`, `HDFCBANK`, `TATAMOTORS`, `WIPRO`).
2. **Establish a Baseline**: Set a checkpoint snapshot representing your baseline view.
3. **Return Later**: Pulse evaluates current market data against your baseline checkpoint and flags moves that crossed explicit rules.
4. **Explainable Attention Score**: Every stock is scored from 0 to 100 with plain-language reasons (e.g. `+30 meaningful price move, +25 unusual trading volume`).

Pulse is an awareness and monitoring tool. It is deterministic and explainable — it does not make financial predictions or provide investment advice.

---

## 2. What Counts as "Meaningful Change"

Rather than per-stock guesses or opaque black-box models, Pulse evaluates market data against transparent, deterministic rules:

| Rule | Condition | Score Impact | Severity |
| :--- | :--- | :---: | :---: |
| **Large Move** | Price changed $\ge 4.0\%$ since baseline | **+45** | Critical / Warning |
| **Price Move** | Price changed $\ge 2.0\%$ since baseline | **+30** | Info |
| **Volume Spike** | Current volume $\ge 1.5\times$ 10-day average volume | **+25** | Warning |
| **52-Week Extreme** | Current price within $1.5\%$ of 52-week High or Low | **+20** | Warning |
| **Opening Gap** | Today's open gapped $\ge 1.5\%$ from previous close | **+20** | Info |

### Attention Score Categories (0–100)
- **Quiet (0–29)**: Normal market noise; no significant action needed.
- **Watch (30–59)**: Moderate movement or volume expansion.
- **Notable (60–79)**: Multi-factor trigger (e.g., price surge combined with volume spike).
- **Significant (80–100)**: Major market event requiring immediate attention.

Every score is accompanied by a plain-language breakdown (e.g. `"+45 large downside move, +25 unusual trading volume"`).

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Next.js 14 Frontend UI                       │
│  (React 18, Tailwind CSS, Recharts, Lucide Icons)           │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
┌──────────────────────────────▼──────────────────────────────┐
│                    Next.js API Route Handlers                │
│  • /api/watchlist         (GET, POST, PUT, DELETE)           │
│  • /api/changes           (Evaluates vs Checkpoint)         │
│  • /api/checkpoint        (POST creates baseline snapshot)   │
│  • /api/stock/[symbol]    (GET detail, chart history, eval)  │
│  • /api/market/simulate   (Gated live simulation endpoint)   │
└──────────────┬──────────────────────────────┬────────────────┘
               │                              │
┌──────────────▼─────────────┐ ┌──────────────▼───────────────┐
│     Rules & Logic Engine    │ │   Market Data Provider Layer │
│  • meaningfulChangeEngine  │ │   (IMarketDataProvider)      │
│  • attentionScoreEngine    │ │   ├─ YahooFinanceProvider    │
│                            │ │   └─ MockFallbackProvider    │
└──────────────┬─────────────┘ └──────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────────────────────▼───────────────┐
│                   Prisma ORM & PostgreSQL                    │
│  • User & Session          • Checkpoint Snapshot             │
│  • Watchlist & Items       • MeaningfulEvent Timeline        │
│  • MarketSnapshot Cache    • MarketSnapshotHistory           │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Engineering Decisions & Resilience

### Real Data vs. Demo Mode
- **Primary Data Provider**: Server-side Yahoo Finance (`yahoo-finance2`) mapped to NSE tickers (`RELIANCE.NS`).
- **Resilience & Timeout Handling**: Every provider call is wrapped in a 3.5s timeout with numeric sanitization to prevent hanging requests.
- **Fallback Provider**: If Yahoo Finance fails or times out, Pulse automatically degrades to `MockFallbackProvider` and tags quotes as `freshness: "STALE"` and `provider: "FALLBACK"`.
- **Gated Simulation**: The `/api/market/simulate` endpoint is gated behind `ENABLE_DEMO_SIMULATION=true`. Any generated data is explicitly tagged `provider: "SIMULATED"` and displayed with a `SIMULATED DATA` badge in the UI.

### Data Freshness Lifecycle
Every quote in Pulse carries an explicit freshness state:
- **`LIVE`**: Data is under 60 seconds old from real market feeds.
- **`RECENT`**: Data is 1 to 5 minutes old.
- **`STALE`**: Data is over 5 minutes old or sourced from fallback.
- **`SIMULATED`**: Generated by the simulation engine for evaluation.
- **`UNAVAILABLE`**: Missing or corrupted data.

### Market Hours Intelligence
Pulse monitors Indian Standard Time (IST):
- **Trading Hours**: 09:15 AM to 03:30 PM IST, Monday through Friday.
- **Pre-Market / Post-Market / Weekend**: Automatically displays clear status banners informing users that values reflect the 03:30 PM IST close.

---

## 5. Getting Started Locally

### Prerequisites
- Node.js 18+ (tested on Node v20/v22)
- Docker Desktop (for PostgreSQL)

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd Groww_project
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
DATABASE_URL="postgresql://pulse_user:pulse_password@localhost:5433/pulse_db?schema=public"
ENABLE_DEMO_SIMULATION=true
MARKET_HOURS_MODE=AUTO
MARKET_CACHE_TTL_SECONDS=45
```

### 3. Start PostgreSQL Database
```bash
docker-compose up -d
```

### 4. Push Database Schema & Seed Data
```bash
npm run db:push
npm run db:seed
```

### 5. Run the Application
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 6. Testing & Quality Assurance

Pulse includes automated test suites covering rules, degradation, and integration:

```bash
# Run all unit and integration test suites
npm test

# Run TypeScript typecheck
npm run typecheck

# Run production build
npm run build
```

### Test Coverage Highlights:
- `tests/rules.test.ts`: Validates deterministic thresholds (`PRICE_MOVE`, `VOLUME_SPIKE`, `52_WEEK_EXTREME`) and attention score calculations.
- `tests/fallback.test.ts`: Verifies graceful degradation when primary providers fail and ensures fallback data is never marked as `LIVE`.
- `tests/watchlist.test.ts`: Tests PostgreSQL session management, stock CRUD, duplicate handling, reordering, checkpoint baselining, and baseline change evaluation.

---

## 7. Trade-offs & Scalability

1. **Relational Database (PostgreSQL) vs. In-Memory**:
   - *Decision*: We chose real PostgreSQL over SQLite or Redis to ensure reliable multi-table relationships (`User` $\to$ `Watchlist` $\to$ `WatchlistItem`, `Checkpoint`, `MarketSnapshotHistory`) matching production financial standards.
2. **Deterministic Rules vs. Machine Learning**:
   - *Decision*: Financial monitoring demands transparency. Traders must know *exactly* why a stock was flagged. Rule-based scores with component breakdowns provide 100% auditability.
3. **Session Cookies vs. OAuth**:
   - *Decision*: Anonymous HTTP-only persistent session cookies provide instant access with zero onboarding friction while maintaining full cross-request persistence. Real OAuth (e.g. NextAuth) can be layered on top of the existing `User` model without schema migration.
4. **Short-Lived Caching (45s)**:
   - *Decision*: Freshness and accuracy take precedence over aggressive caching. A 45-second cache avoids hammering external endpoints while ensuring rapid propagation of market changes.

---

## 8. License
Built for the Groww CODE 2026 Challenge.