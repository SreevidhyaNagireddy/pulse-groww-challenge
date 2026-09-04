import React from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FreshnessBadgeProps {
  freshness: "LIVE" | "RECENT" | "STALE" | "UNAVAILABLE" | "SIMULATED" | string;
  provider?: string;
  className?: string;
}

export function FreshnessBadge({ freshness, provider, className }: FreshnessBadgeProps) {
  if (freshness === "SIMULATED" || provider === "SIMULATED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-amber-surface text-amber-dark border border-amber-light/50",
          className
        )}
        title="Simulated market data generated for demo evaluation"
      >
        <Activity className="w-3 h-3 text-amber font-bold animate-pulse" />
        SIMULATED DATA
      </span>
    );
  }

  if (freshness === "LIVE") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-gain-surface text-gain border border-gain-border",
          className
        )}
      >
        <span className="w-2 h-2 rounded-full bg-gain animate-ping" />
        LIVE
      </span>
    );
  }

  if (freshness === "RECENT") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-teal-surface text-teal border border-teal-light/50",
          className
        )}
      >
        <CheckCircle2 className="w-3 h-3 text-teal" />
        RECENT (&lt;5m)
      </span>
    );
  }

  if (freshness === "STALE") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-paper-muted text-ink-muted border border-border",
          className
        )}
        title="Market data delayed or cached from last successful feed"
      >
        <Clock className="w-3 h-3 text-amber" />
        STALE / DELAYED
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-loss-surface text-loss border border-loss-border",
        className
      )}
    >
      <AlertTriangle className="w-3 h-3 text-loss" />
      UNAVAILABLE
    </span>
  );
}
