# Pulse — Demo & Presentation Script (3–5 Minutes)

> **Challenge**: Groww CODE 2026 — Smart Market Watchlist  
> **Presenter**: Sree Vidhya Nagireddy  
> **Application**: Pulse ("Know what changed.")

---

## Slide / Opening (0:00 – 0:45)
**Visual**: Browser open to `http://localhost:3000` showing the Pulse dashboard.

**Speaker**:
> "Hello everyone! Today, I’m presenting **Pulse** — a smart market watchlist for Indian equities, built for the Groww CODE 2026 challenge.
>
> Most market watchlists today are passive grids of numbers. When you open them, you have to mentally calculate: *What was this price when I looked two hours ago? Did something unusual happen?*
>
> Pulse flips this paradigm around with our tagline: **'Know what changed.'**
> Pulse automatically notices what has meaningfully moved since you last checked and tells you exactly *why* it deserves your attention."

---

## Step 1: Market Status & First Visit (0:45 – 1:30)
**Visual**: Point to the Top Navbar, Market Status badge, and the First Visit Banner.

**Speaker**:
> "Looking at the top navbar, you’ll see our real-time NSE market status indicator. Pulse is time-zone aware, tracking Indian Standard Time (09:15 AM to 03:30 PM IST). Right now, it accurately tells us whether the market is open or closed, displaying the last closing prices.
>
> Notice the **First Visit Banner**: Pulse detects that we are on a fresh session. It invites us to establish a **Baseline Checkpoint** — a snapshot of all our tracked stocks at this point in time.
> Let’s click **'Establish Baseline Checkpoint'**."
*(Click the button and observe the confirmation notice.)*

---

## Step 2: Adding & Managing Stocks (1:30 – 2:15)
**Visual**: Use the Stock Search Bar to search and add stocks, then demonstrate reordering.

**Speaker**:
> "Now let's manage our watchlist. Our search bar supports real Indian equities on the NSE.
> Let's search for `INFY` (Infosys Ltd) and click **'Add to Watchlist'**.
>
> Notice that the stock is instantly added to our PostgreSQL database, and our server warms the quote cache in the background with a 3.5s timeout wrapper so the UI never stalls.
> If we try to add `INFY` again, Pulse gracefully notifies us that the stock is already in our watchlist without throwing errors or breaking state.
>
> We also have instant reordering controls: clicking the **Up** or **Down** arrows immediately reorders our watchlist and persists our custom display order in the database."

---

## Step 3: "Since You Were Away" & Attention Scoring (2:15 – 3:30)
**Visual**: Use the Demo Simulation Bar to simulate a +3.5% move on a stock.

**Speaker**:
> "Now comes the core feature: **What happens when you return later?**
> To demonstrate this outside active trading hours, we’ve built an explicit **Demo Simulation Toolkit** gated behind an environment variable.
>
> Let's select `INFY`, choose a `+3.5%` price surge with `2x volume`, and click **'Simulate Move'**.
>
> Look at what just appeared: the **'Since You Were Away'** section!
> Instead of leaving us to calculate what happened, Pulse highlights:
> 1. **INFY moved +3.50%** since our checkpoint was established.
> 2. It assigned an **Attention Score of 55 (Watch)**.
> 3. And crucially, it gives us the transparent breakdown:
>    * `+30 meaningful price move (crossed 2.0% threshold)`
>    * `+25 unusual trading volume (2.0x average volume)`
>
> Nothing is a black box. There are no fake AI predictions — just deterministic, explainable financial rules."

---

## Step 4: Deep Dive Stock Detail Page (3:30 – 4:15)
**Visual**: Click on `INFY` to navigate to `/stock/INFY`.

**Speaker**:
> "If we want to investigate further, we click on `INFY` to open the stock detail page.
>
> Notice the **Baseline Checkpoint Banner**: it compares our current price directly to our baseline snapshot price from earlier, calculating the exact rupee and percentage difference.
>
> We also have:
> - Interactive price chart driven by our append-only time-series history table.
> - Key technical metrics: Previous Close, Day High/Low, Volume vs 10-day Average, and 52-Week High/Low.
> - Meaningful Event Timeline documenting past triggers.
> - And our Data Freshness badge, which honestly discloses whether the quote is `LIVE`, `RECENT`, `STALE`, or `SIMULATED`."

---

## Step 5: Engineering Architecture & Closing (4:15 – 5:00)
**Visual**: Return to main dashboard.

**Speaker**:
> "Behind the scenes, Pulse is powered by:
> - **Next.js 14 App Router & TypeScript** for full-stack performance.
> - **PostgreSQL via Prisma** running in Docker for relational persistence.
> - **Decoupled Data Provider Layer (`IMarketDataProvider`)** that automatically degrades to an offline fallback if upstream feeds time out or fail.
> - **Full automated test suite** covering rules, fallback degradation, and PostgreSQL integration tests.
>
> That is **Pulse**: smart, explainable, and built for real Indian market investors.
> Thank you!"
