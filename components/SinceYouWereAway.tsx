"use client";

import React from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, ChevronRight, Clock, Flame, Info } from "lucide-react";
import { MeaningfulChangeResult } from "@/services/rules/meaningfulChangeEngine";
import { AttentionBadge } from "./AttentionBadge";
import { formatINR, formatPercent, formatRelativeTime } from "@/lib/utils";

interface SinceYouWereAwayProps {
  events: MeaningfulChangeResult[];
  checkpointTime?: Date | string;
  onResetCheckpoint?: () => void;
}

export function SinceYouWereAway({ events, checkpointTime, onResetCheckpoint }: SinceYouWereAwayProps) {
  if (events.length === 0) {
    return (
      <div className="bg-paper-card border border-border rounded-lg p-6 mb-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gain-surface border border-gain-border flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-gain" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-ink">
              Since your last visit {checkpointTime ? `· ${formatRelativeTime(checkpointTime)}` : ""}
            </h3>
            <p className="text-xs text-ink-muted">
              No stock crossed your attention thresholds (2.0% price move or 1.5× volume spike). Everything is quiet.
            </p>
          </div>
        </div>

        {onResetCheckpoint && (
          <button
            type="button"
            onClick={onResetCheckpoint}
            className="text-xs font-mono text-amber hover:text-amber-dark underline cursor-pointer shrink-0"
          >
            Update Baseline Checkpoint
          </button>
        )}
      </div>
    );
  }

  return (
    <section className="mb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-amber uppercase tracking-wider">
            <Flame className="w-4 h-4 text-amber" />
            Attention Summary
          </div>
          <h2 className="font-serif text-2xl font-bold text-ink flex items-center gap-2">
            Since your last visit
            {checkpointTime && (
              <span className="text-xs font-mono font-normal text-ink-muted">
                · {formatRelativeTime(checkpointTime)}
              </span>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-amber-surface text-amber-dark rounded border border-amber-light/50">
            {events.length} {events.length === 1 ? "thing" : "things"} changed
          </span>
          {onResetCheckpoint && (
            <button
              type="button"
              onClick={onResetCheckpoint}
              className="text-xs font-mono text-ink-muted hover:text-ink border border-border px-2.5 py-1 rounded bg-paper-card hover:bg-paper-muted transition-colors cursor-pointer"
            >
              Set New Baseline
            </button>
          )}
        </div>
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 gap-3">
        {events.map((event) => {
          const isUp = event.changePercent >= 0;

          return (
            <div
              key={event.symbol}
              className="bg-paper-card border border-border hover:border-border-dark rounded-lg p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Stock info & price delta */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded flex items-center justify-center font-mono font-bold text-sm shrink-0 border ${
                      isUp
                        ? "bg-gain-surface text-gain border-gain-border"
                        : "bg-loss-surface text-loss border-loss-border"
                    }`}
                  >
                    {isUp ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/stock/${event.symbol}`}
                        className="font-mono font-bold text-base text-ink hover:text-amber transition-colors"
                      >
                        {event.symbol}
                      </Link>
                      <span className="text-xs text-ink-muted truncate max-w-[180px]">{event.name}</span>
                    </div>

                    {/* Price Then -> Now in Monospace */}
                    <div className="font-mono text-xs text-ink mt-0.5 flex items-center gap-2">
                      <span className="text-ink-muted">{formatINR(event.priceThen)}</span>
                      <span className="text-ink-subtle">→</span>
                      <span className="font-bold text-ink">{formatINR(event.priceNow)}</span>
                      <span
                        className={`font-semibold ml-1 ${
                          isUp ? "text-gain" : "text-loss"
                        }`}
                      >
                        {formatPercent(event.changePercent)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle: Reasoning List */}
                <div className="flex-1 max-w-xl space-y-1">
                  {event.reasons.map((r, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs text-ink">
                      <span className="font-mono font-semibold text-amber shrink-0">•</span>
                      <div>
                        <span className="font-medium text-ink">{r.title}: </span>
                        <span className="text-ink-muted">{r.description}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right: Attention Badge & Link */}
                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border">
                  <AttentionBadge
                    score={event.attentionScore}
                    category={event.attentionCategory}
                    breakdown={event.attentionBreakdown}
                    reasons={event.reasons}
                  />

                  <Link
                    href={`/stock/${event.symbol}`}
                    className="inline-flex items-center gap-1 text-xs font-mono font-medium text-ink-muted hover:text-amber transition-colors"
                  >
                    Details
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
