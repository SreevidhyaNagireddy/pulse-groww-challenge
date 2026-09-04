"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Clock, ShieldCheck } from "lucide-react";
import { FreshnessBadge } from "./FreshnessBadge";

interface NavbarProps {
  marketStatus?: { isOpen: boolean; message: string };
  lastUpdated?: Date | string;
  freshness?: string;
  provider?: string;
  onRefresh?: () => void;
}

export function Navbar({ marketStatus, lastUpdated, freshness = "LIVE", provider = "YAHOO", onRefresh }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-paper sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Wordmark */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-baseline gap-2 group">
              <span className="font-serif text-2xl font-bold tracking-tight text-ink group-hover:text-amber transition-colors">
                Pulse
              </span>
              <span className="text-xs font-sans text-ink-muted hidden sm:inline-block border-l border-border pl-2">
                Know what changed.
              </span>
            </Link>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <Link
                href="/"
                className={`px-3 py-1.5 rounded transition-colors ${
                  pathname === "/" ? "bg-paper-muted text-ink font-semibold" : "text-ink-muted hover:text-ink"
                }`}
              >
                Watchlist
              </Link>
            </nav>
          </div>

          {/* Right Controls: Freshness, Market Hours, Refresh & Session */}
          <div className="flex items-center gap-3">
            <FreshnessBadge freshness={freshness} provider={provider} />

            {/* Market Hours Indicator */}
            {marketStatus && (
              <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-ink-muted bg-paper-muted px-2.5 py-1 rounded border border-border">
                <span
                  className={`w-2 h-2 rounded-full ${
                    marketStatus.isOpen ? "bg-gain" : "bg-amber"
                  }`}
                />
                <span className="truncate max-w-[200px]">{marketStatus.message}</span>
              </div>
            )}

            {/* Refresh Button */}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-ink border border-border rounded bg-paper-card hover:bg-paper-muted transition-colors cursor-pointer"
                title="Refresh market data feed"
              >
                <Clock className="w-3 h-3 text-ink-muted" />
                Refresh
              </button>
            )}

            {/* Session Indicator */}
            <div className="hidden sm:flex items-center gap-1 text-xs font-mono text-ink-muted bg-paper-card border border-border px-2 py-1 rounded">
              <ShieldCheck className="w-3.5 h-3.5 text-teal" />
              <span>Session</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
