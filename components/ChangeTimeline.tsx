"use client";

import React from "react";
import { Activity, AlertTriangle, ArrowUpRight, Clock, Info } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface MeaningfulEventRecord {
  id: string;
  symbol: string;
  eventType: string;
  severity: string;
  title: string;
  description: string;
  priceThen: number;
  priceNow: number;
  changePercent: number;
  scoreImpact: number;
  timestamp: Date | string;
}

interface ChangeTimelineProps {
  events: MeaningfulEventRecord[];
  symbol: string;
}

export function ChangeTimeline({ events, symbol }: ChangeTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="bg-paper-card border border-border rounded-lg p-6 text-center text-xs font-mono text-ink-muted">
        No past meaningful events logged for {symbol} yet.
      </div>
    );
  }

  return (
    <div className="bg-paper-card border border-border rounded-lg p-5">
      <h3 className="font-serif text-lg font-bold text-ink mb-4 pb-2 border-b border-border flex items-center gap-2">
        <Activity className="w-4 h-4 text-amber" />
        What&apos;s changed · Timeline
      </h3>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
        {events.map((evt) => {
          const isWarning = evt.severity === "WARNING" || evt.severity === "CRITICAL";

          return (
            <div key={evt.id} className="relative">
              {/* Dot */}
              <div
                className={`absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full border ${
                  isWarning
                    ? "bg-amber border-amber-dark"
                    : "bg-teal border-teal-dark"
                }`}
              />

              <div className="flex items-baseline justify-between gap-2">
                <span className="font-sans font-bold text-sm text-ink">{evt.title}</span>
                <span className="font-mono text-[11px] text-ink-muted shrink-0">
                  {formatRelativeTime(evt.timestamp)}
                </span>
              </div>

              <p className="text-xs font-sans text-ink-muted mt-1">{evt.description}</p>

              <div className="mt-2 flex items-center gap-2 font-mono text-[11px]">
                <span className="px-2 py-0.5 rounded bg-paper-muted text-ink border border-border">
                  Score Impact: +{evt.scoreImpact}
                </span>
                <span className="text-ink-subtle">
                  Event: {evt.eventType}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
