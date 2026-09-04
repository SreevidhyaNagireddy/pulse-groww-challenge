"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { FreshnessBadge } from "@/components/FreshnessBadge";
import { AttentionBadge } from "@/components/AttentionBadge";
import { StockChart } from "@/components/StockChart";
import { ChangeTimeline } from "@/components/ChangeTimeline";
import { formatINR, formatPercent, formatVolume, formatRelativeTime } from "@/lib/utils";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle } from "lucide-react";

export default function StockDetailPage() {
  const params = useParams();
  const rawSymbol = params.symbol as string;
  const symbol = rawSymbol ? rawSymbol.replace(".NS", "").toUpperCase() : "";

  const [stockData, setStockData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStockDetail = React.useCallback(async () => {
    if (!symbol) return;
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await fetch(`/api/stock/${symbol}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load stock details");
      setStockData(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchStockDetail();
  }, [fetchStockDetail]);

  const q = stockData?.quote;
  const evalRes = stockData?.evaluation;
  const history = stockData?.history || [];
  const events = stockData?.events || [];
  const isUp = (q?.changePercent || 0) >= 0;

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col font-sans antialiased">
      <Navbar marketStatus={stockData?.marketStatus} onRefresh={fetchStockDetail} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-ink-muted hover:text-amber transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Watchlist
        </Link>

        {errorMsg ? (
          <div className="p-8 bg-loss-surface border border-loss-border rounded-lg text-loss font-mono text-xs text-center">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            <p>{errorMsg}</p>
          </div>
        ) : isLoading || !q ? (
          <div className="p-16 text-center font-mono text-xs text-ink-muted flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber" />
            Loading stock details for {symbol}...
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header Card */}
            <div className="bg-paper-card border border-border rounded-lg p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="font-mono text-3xl font-bold text-ink">{symbol}</h1>
                    <FreshnessBadge freshness={q.freshness} provider={q.provider} />
                  </div>
                  <p className="text-sm font-sans text-ink-muted mt-1">{q.name}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-mono text-3xl font-bold text-ink text-right">
                      {formatINR(q.price)}
                    </div>
                    <div
                      className={`font-mono text-sm font-semibold flex items-center justify-end gap-0.5 ${
                        isUp ? "text-gain" : "text-loss"
                      }`}
                    >
                      {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      {formatINR(q.change)} ({formatPercent(q.changePercent)})
                    </div>
                  </div>

                  {evalRes && (
                    <div className="border-l border-border pl-4">
                      <AttentionBadge
                        score={evalRes.attentionScore}
                        category={evalRes.attentionCategory}
                        breakdown={evalRes.attentionBreakdown}
                        reasons={evalRes.reasons}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Baseline Checkpoint Comparison Banner */}
              {stockData?.checkpoint && stockData.checkpoint.baselinePrice !== null && (
                <div className="mt-4 p-3 bg-paper border border-amber/30 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2 text-ink">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber" />
                    <span className="text-ink-muted">Baseline Checkpoint:</span>
                    <span className="font-bold">{formatINR(stockData.checkpoint.baselinePrice)}</span>
                    <span className="text-ink-muted">({formatRelativeTime(stockData.checkpoint.createdAt)})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-ink-muted">Change Since Baseline:</span>
                    <span
                      className={`font-bold ${
                        q.price >= stockData.checkpoint.baselinePrice ? "text-gain" : "text-loss"
                      }`}
                    >
                      {q.price >= stockData.checkpoint.baselinePrice ? "+" : ""}
                      {formatINR(q.price - stockData.checkpoint.baselinePrice)} (
                      {formatPercent(
                        ((q.price - stockData.checkpoint.baselinePrice) /
                          stockData.checkpoint.baselinePrice) *
                          100
                      )}
                      )
                    </span>
                  </div>
                </div>
              )}

              {/* Key Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mt-6 pt-6 border-t border-border font-mono text-xs">
                <div>
                  <span className="text-ink-muted block text-[11px]">Previous Close</span>
                  <span className="font-bold text-ink">{formatINR(q.previousClose)}</span>
                </div>

                <div>
                  <span className="text-ink-muted block text-[11px]">Day High / Low</span>
                  <span className="font-bold text-ink">
                    {q.dayHigh ? formatINR(q.dayHigh) : "—"} / {q.dayLow ? formatINR(q.dayLow) : "—"}
                  </span>
                </div>

                <div>
                  <span className="text-ink-muted block text-[11px]">Volume (Current / Avg)</span>
                  <span className="font-bold text-ink">
                    {formatVolume(q.volume)} / {formatVolume(q.avgVolume)}
                  </span>
                </div>

                <div>
                  <span className="text-ink-muted block text-[11px]">52-Week High / Low</span>
                  <span className="font-bold text-ink">
                    {q.high52 ? formatINR(q.high52) : "—"} / {q.low52 ? formatINR(q.low52) : "—"}
                  </span>
                </div>

                <div>
                  <span className="text-ink-muted block text-[11px]">Last Updated</span>
                  <span className="font-bold text-ink">{formatRelativeTime(q.timestamp)}</span>
                </div>

                <div>
                  <span className="text-ink-muted block text-[11px]">Data Source</span>
                  <span className="font-bold text-ink">{q.provider}</span>
                </div>
              </div>
            </div>

            {/* Grid Layout: Chart (Left) + Change Timeline (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <StockChart data={history} symbol={symbol} isPositive={isUp} />
              </div>

              <div>
                <ChangeTimeline events={events} symbol={symbol} />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-paper-card py-6 mt-16 text-center text-xs text-ink-muted font-sans">
        <p><strong className="font-serif text-ink">Pulse: Know what changed.</strong></p>
      </footer>
    </div>
  );
}
