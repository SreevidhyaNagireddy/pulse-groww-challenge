"use client";

import React from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { AttentionBadge } from "./AttentionBadge";
import { formatINR, formatPercent, formatRelativeTime } from "@/lib/utils";
import { evaluateMeaningfulChanges, MeaningfulChangeResult } from "@/services/rules/meaningfulChangeEngine";

export interface WatchlistItemData {
  id: string;
  symbol: string;
  nseSymbol: string;
  name: string;
  displayOrder: number;
  quote?: {
    price: number;
    change: number;
    changePercent: number;
    previousClose: number;
    timestamp: Date | string;
    freshness: string;
    provider: string;
    volume?: number;
    avgVolume?: number;
    high52?: number;
    low52?: number;
  } | null;
}

interface WatchlistTableProps {
  items: WatchlistItemData[];
  onRemove: (symbol: string) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  evaluationsBySymbol?: Record<string, MeaningfulChangeResult>;
  isLoading?: boolean;
}

export function WatchlistTable({
  items,
  onRemove,
  onMoveUp,
  onMoveDown,
  evaluationsBySymbol,
  isLoading,
}: WatchlistTableProps) {
  if (items.length === 0) {
    return (
      <div className="bg-paper-card border border-border rounded-lg p-12 text-center">
        <p className="font-serif text-lg text-ink font-semibold mb-1">Your watchlist is empty.</p>
        <p className="text-xs text-ink-muted">Use the search bar above to add Indian stocks like RELIANCE, TCS, or INFY.</p>
      </div>
    );
  }

  return (
    <div className="bg-paper-card border border-border rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-paper-muted border-b border-border font-mono text-xs font-semibold text-ink-muted uppercase tracking-wider">
              <th className="py-3 px-4">Stock</th>
              <th className="py-3 px-4 text-right">Current Price</th>
              <th className="py-3 px-4 text-right">Today %</th>
              <th className="py-3 px-4 text-center">Attention</th>
              <th className="py-3 px-4 text-right">Last Updated</th>
              <th className="py-3 px-4 text-center">Reorder & Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border text-sm">
            {items.map((item, index) => {
              const q = item.quote;
              const isUp = (q?.changePercent || 0) >= 0;

              // Use pre-computed checkpoint evaluation if available, otherwise evaluate on quote
              const evalRes =
                evaluationsBySymbol?.[item.symbol] ||
                (q
                  ? evaluateMeaningfulChanges(q as any)
                  : {
                      attentionScore: 0,
                      attentionCategory: "Quiet" as const,
                      attentionBreakdown: "No recent activity",
                      reasons: [],
                    });

              return (
                <tr
                  key={item.id}
                  className="hover:bg-paper-muted/50 transition-colors group"
                >
                  {/* Stock Symbol & Name */}
                  <td className="py-3.5 px-4">
                    <Link href={`/stock/${item.symbol}`} className="block">
                      <span className="font-mono font-bold text-ink group-hover:text-amber transition-colors">
                        {item.symbol}
                      </span>
                      <span className="block text-xs text-ink-muted truncate max-w-[200px]">
                        {item.name}
                      </span>
                    </Link>
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-ink">
                    {q ? formatINR(q.price) : "—"}
                  </td>

                  {/* Today % */}
                  <td className="py-3.5 px-4 text-right font-mono font-semibold">
                    {q ? (
                      <span
                        className={`inline-flex items-center gap-0.5 ${
                          isUp ? "text-gain" : "text-loss"
                        }`}
                      >
                        {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {formatPercent(q.changePercent)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* Attention Badge */}
                  <td className="py-3.5 px-4 text-center">
                    <AttentionBadge
                      score={evalRes.attentionScore}
                      category={evalRes.attentionCategory}
                      breakdown={evalRes.attentionBreakdown}
                      reasons={evalRes.reasons}
                    />
                  </td>

                  {/* Last Updated */}
                  <td className="py-3.5 px-4 text-right font-mono text-xs text-ink-muted">
                    {q?.timestamp ? formatRelativeTime(q.timestamp) : "Just now"}
                  </td>

                  {/* Reorder & Delete Actions */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center gap-1">
                      {onMoveUp && (
                        <button
                          type="button"
                          onClick={() => onMoveUp(index)}
                          disabled={index === 0 || isLoading}
                          className="p-1 rounded text-ink-subtle hover:text-ink disabled:opacity-20 disabled:hover:text-ink-subtle transition-colors cursor-pointer disabled:cursor-not-allowed"
                          title="Move stock up"
                          aria-label={`Move ${item.symbol} up`}
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {onMoveDown && (
                        <button
                          type="button"
                          onClick={() => onMoveDown(index)}
                          disabled={index === items.length - 1 || isLoading}
                          className="p-1 rounded text-ink-subtle hover:text-ink disabled:opacity-20 disabled:hover:text-ink-subtle transition-colors cursor-pointer disabled:cursor-not-allowed"
                          title="Move stock down"
                          aria-label={`Move ${item.symbol} down`}
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onRemove(item.symbol)}
                        disabled={isLoading}
                        className="text-ink-subtle hover:text-loss transition-colors p-1 rounded hover:bg-loss-surface cursor-pointer ml-1"
                        title={`Remove ${item.symbol} from watchlist`}
                        aria-label={`Remove ${item.symbol}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
