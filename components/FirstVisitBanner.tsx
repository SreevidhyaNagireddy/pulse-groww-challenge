"use client";

import React from "react";
import { Bookmark, Sparkles } from "lucide-react";

interface FirstVisitBannerProps {
  onEstablishBaseline: () => void;
  isLoading?: boolean;
}

export function FirstVisitBanner({ onEstablishBaseline, isLoading }: FirstVisitBannerProps) {
  return (
    <div className="bg-amber-surface border border-amber-light/60 rounded-lg p-6 mb-8 text-ink">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 text-amber-dark font-mono text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber" />
            First Visit Onboarding
          </div>
          <h2 className="font-serif text-xl font-bold text-ink">
            You&apos;re seeing this watchlist for the first time.
          </h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            Pulse continuously monitors your stocks in the background. We&apos;ll capture this current view as your baseline checkpoint. When you return later, Pulse will automatically analyze what changed and explain why it deserves your attention.
          </p>
        </div>

        <button
          type="button"
          onClick={onEstablishBaseline}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber hover:bg-amber-dark text-paper-card font-medium text-sm rounded shadow-sm transition-colors cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Bookmark className="w-4 h-4" />
          {isLoading ? "Establishing..." : "Establish Baseline Checkpoint"}
        </button>
      </div>
    </div>
  );
}
