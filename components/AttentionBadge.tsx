"use client";

import React, { useState } from "react";
import { getAttentionColorClass } from "@/services/rules/attentionScoreEngine";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface AttentionBadgeProps {
  score: number;
  category: string;
  breakdown?: string;
  reasons?: Array<{ title: string; description: string; impactScore: number }>;
}

export function AttentionBadge({ score, category, breakdown, reasons }: AttentionBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const styles = getAttentionColorClass(score);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium border transition-colors cursor-pointer",
          styles.badgeBg,
          styles.badgeText,
          styles.badgeBorder
        )}
      >
        <span className="font-semibold">{category}</span>
        <span className="opacity-80">·</span>
        <span className="font-bold">{score}</span>
        <Info className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {showTooltip && (
        <div className="absolute right-0 bottom-full mb-2 w-72 p-3 bg-paper-card border border-border rounded shadow-lg z-50 text-left font-sans text-xs">
          <div className="flex items-center justify-between border-b border-border pb-2 mb-2 font-mono">
            <span className="font-semibold text-ink">Attention Score {score}/100</span>
            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold border", styles.badgeBg, styles.badgeText, styles.badgeBorder)}>
              {category}
            </span>
          </div>

          {reasons && reasons.length > 0 ? (
            <div className="space-y-1.5">
              <div className="text-[11px] font-medium text-ink-muted mb-1">Score Breakdown:</div>
              {reasons.map((r, i) => (
                <div key={i} className="flex items-start justify-between gap-2 text-ink">
                  <span>• {r.title}</span>
                  <span className="font-mono font-bold text-amber">+{r.impactScore}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-ink-muted text-[11px]">
              {breakdown || "Score calculated deterministically based on price move, volume, and 52-week proximity."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
