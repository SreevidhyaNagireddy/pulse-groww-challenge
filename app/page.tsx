"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { DemoSimulationBar } from "@/components/DemoSimulationBar";
import { StockSearchBar } from "@/components/StockSearchBar";
import { FirstVisitBanner } from "@/components/FirstVisitBanner";
import { SinceYouWereAway } from "@/components/SinceYouWereAway";
import { WatchlistTable, WatchlistItemData } from "@/components/WatchlistTable";
import { MeaningfulChangeResult } from "@/services/rules/meaningfulChangeEngine";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItemData[]>([]);
  const [firstVisit, setFirstVisit] = useState<boolean>(false);
  const [checkpointTime, setCheckpointTime] = useState<Date | string | undefined>(undefined);
  const [meaningfulEvents, setMeaningfulEvents] = useState<MeaningfulChangeResult[]>([]);
  const [allEvaluations, setAllEvaluations] = useState<MeaningfulChangeResult[]>([]);
  const [marketStatus, setMarketStatus] = useState<{ isOpen: boolean; message: string } | undefined>(undefined);
  const [freshness, setFreshness] = useState<string>("LIVE");
  const [provider, setProvider] = useState<string>("YAHOO");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // Map of symbol -> MeaningfulChangeResult for fast lookups in table
  const evaluationsBySymbol = useMemo(() => {
    const map: Record<string, MeaningfulChangeResult> = {};
    for (const ev of allEvaluations) {
      map[ev.symbol] = ev;
    }
    return map;
  }, [allEvaluations]);

  // Fetch Watchlist and Changes
  const fetchData = async () => {
    try {
      setErrorMsg(null);

      // 1. Fetch Watchlist
      const wlRes = await fetch("/api/watchlist");
      const wlData = await wlRes.json();

      if (!wlRes.ok) throw new Error(wlData.error || "Failed to load watchlist");

      setWatchlistItems(wlData.items || []);
      setMarketStatus(wlData.marketStatus);

      // Determine global freshness and provider from quotes
      if (wlData.items && wlData.items.length > 0) {
        const firstQuote = wlData.items[0].quote;
        if (firstQuote) {
          setFreshness(firstQuote.freshness);
          setProvider(firstQuote.provider);
        }
      }

      // 2. Fetch "Since You Were Away" Changes Evaluation
      const chgRes = await fetch("/api/changes");
      const chgData = await chgRes.json();

      if (chgRes.ok) {
        setFirstVisit(chgData.firstVisit || false);
        setCheckpointTime(chgData.checkpointCreatedAt);
        setMeaningfulEvents(chgData.meaningfulEvents || []);
        setAllEvaluations(chgData.allEvaluations || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred loading data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-clear info message after 4s
  useEffect(() => {
    if (!infoMsg) return;
    const timer = setTimeout(() => setInfoMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [infoMsg]);

  // Establish Baseline Checkpoint Action
  const handleEstablishBaseline = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/checkpoint", { method: "POST" });
      if (!res.ok) throw new Error("Failed to establish baseline");
      setInfoMsg("Baseline checkpoint snapshot established successfully.");
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Add Stock Action
  const handleAddStock = async (symbol: string) => {
    try {
      setErrorMsg(null);
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.details || data.error || "Failed to add stock");
      }
      if (data.alreadyExists) {
        setInfoMsg(`${symbol} is already in your watchlist.`);
      } else {
        setInfoMsg(`Added ${symbol} to your watchlist.`);
      }
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Remove Stock Action
  const handleRemoveStock = async (symbol: string) => {
    try {
      setErrorMsg(null);
      const res = await fetch(`/api/watchlist?symbol=${symbol}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.details || data.error || "Failed to remove stock");
      }
      setInfoMsg(`Removed ${symbol} from watchlist.`);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Move Stock Up
  const handleMoveUp = async (index: number) => {
    if (index <= 0 || index >= watchlistItems.length) return;
    const newItems = [...watchlistItems];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    setWatchlistItems(newItems);

    try {
      await fetch("/api/watchlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedSymbols: newItems.map((i) => i.symbol) }),
      });
    } catch (err: any) {
      console.warn("[REORDER_FAILED]", err);
    }
  };

  // Move Stock Down
  const handleMoveDown = async (index: number) => {
    if (index < 0 || index >= watchlistItems.length - 1) return;
    const newItems = [...watchlistItems];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    setWatchlistItems(newItems);

    try {
      await fetch("/api/watchlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedSymbols: newItems.map((i) => i.symbol) }),
      });
    } catch (err: any) {
      console.warn("[REORDER_FAILED]", err);
    }
  };

  // Simulate Tick Action
  const handleSimulateTick = async (
    symbol?: string,
    priceDelta?: number,
    volumeMult?: number,
    scenario?: string
  ) => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/market/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, priceDeltaPercent: priceDelta, volumeMultiplier: volumeMult, scenario }),
      });
      if (!res.ok) throw new Error("Simulation endpoint disabled or failed");
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col font-sans antialiased">
      {/* Top Navbar */}
      <Navbar
        marketStatus={marketStatus}
        freshness={freshness}
        provider={provider}
        onRefresh={fetchData}
      />

      {/* Greeting Header */}
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <h1 className="font-serif text-2xl font-bold text-ink">{greeting}, trader!</h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Here is your market intelligence summary and watchlist movements.
        </p>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-loss-surface border border-loss-border rounded-lg text-loss flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs underline cursor-pointer shrink-0 ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Info Alert */}
        {infoMsg && (
          <div className="mb-6 p-4 bg-gain-surface border border-gain-border rounded-lg text-gain flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{infoMsg}</span>
            </div>
            <button
              onClick={() => setInfoMsg(null)}
              className="text-xs underline cursor-pointer shrink-0 ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Demo Simulation Toolkit (Gated controls for live testing) */}
        <DemoSimulationBar onSimulateTick={handleSimulateTick} isLoading={isRefreshing} />

        {/* First Visit Banner or "Since You Were Away" */}
        {isLoading ? (
          <div className="p-12 text-center font-mono text-xs text-ink-muted flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber" />
            Loading Pulse Watchlist & Market Feed...
          </div>
        ) : firstVisit ? (
          <FirstVisitBanner onEstablishBaseline={handleEstablishBaseline} isLoading={isRefreshing} />
        ) : (
          <SinceYouWereAway
            events={meaningfulEvents}
            checkpointTime={checkpointTime}
            onResetCheckpoint={handleEstablishBaseline}
          />
        )}

        {/* Watchlist Section Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 mt-8">
          <div>
            <h2 className="font-serif text-xl font-bold text-ink">Your Watchlist</h2>
            <p className="text-xs text-ink-muted">
            {watchlistItems.length} Indian stocks in your watchlist
            </p>
          </div>

          <StockSearchBar
            onAddStock={handleAddStock}
            existingSymbols={watchlistItems.map((i) => i.symbol)}
          />
        </div>

        {/* Compact Watchlist Table */}
        <WatchlistTable
          items={watchlistItems}
          onRemove={handleRemoveStock}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          evaluationsBySymbol={evaluationsBySymbol}
          isLoading={isLoading || isRefreshing}
        />
      </main>

      {/* Footer & Financial Awareness Disclaimer */}
      <footer className="border-t border-border bg-paper-card py-6 mt-16 text-center text-xs text-ink-muted font-sans">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>
            <strong className="font-serif text-ink">Pulse: Know what changed.</strong> Monitoring & Awareness system for Indian markets.
          </p>
          <p className="max-w-2xl mx-auto text-[11px] text-ink-subtle">
            Disclaimer: Pulse is an awareness and monitoring tool designed to highlight market data changes. It does not provide financial advice, stock recommendations, or price predictions.
          </p>
        </div>
      </footer>
    </div>
  );
}
