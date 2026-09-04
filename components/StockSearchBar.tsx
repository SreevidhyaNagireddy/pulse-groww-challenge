"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Search, Loader2 } from "lucide-react";
import { SearchResult } from "@/services/market/IMarketDataProvider";

interface StockSearchBarProps {
  onAddStock: (symbol: string) => Promise<void>;
  existingSymbols: string[];
}

export function StockSearchBar({ onAddStock, existingSymbols }: StockSearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = async (sym: string) => {
    setAddingSymbol(sym);
    try {
      await onAddStock(sym);
      setQuery("");
      setIsOpen(false);
    } finally {
      setAddingSymbol(null);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder="Search and add Indian stocks (e.g. RELIANCE, WIPRO, TATAMOTORS)..."
          className="w-full bg-paper-card border border-border focus:border-amber focus:ring-1 focus:ring-amber rounded pl-9 pr-8 py-2 text-xs font-sans text-ink placeholder:text-ink-subtle outline-none transition-colors"
        />
        {isSearching && (
          <Loader2 className="w-4 h-4 text-amber animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-paper-card border border-border rounded shadow-lg z-50 max-h-64 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-3 text-xs text-ink-muted text-center font-sans">
              No matching Indian stocks found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="divide-y divide-border">
              {results.map((res) => {
                const isAdded = existingSymbols.includes(res.symbol.toUpperCase());

                return (
                  <div
                    key={res.symbol}
                    className="p-3 hover:bg-paper-muted flex items-center justify-between gap-3 transition-colors"
                  >
                    <div>
                      <span className="font-mono font-bold text-xs text-ink">{res.symbol}</span>
                      <span className="block text-[11px] text-ink-muted truncate max-w-[240px]">
                        {res.name} {res.sector ? `· ${res.sector}` : ""}
                      </span>
                    </div>

                    {isAdded ? (
                      <span className="text-[10px] font-mono text-ink-subtle px-2 py-0.5 rounded bg-paper-muted">
                        Added
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelect(res.symbol)}
                        disabled={addingSymbol === res.symbol}
                        className="inline-flex items-center gap-1 text-xs font-mono font-medium text-amber hover:text-amber-dark bg-amber-surface px-2.5 py-1 rounded border border-amber-light/50 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {addingSymbol === res.symbol ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Plus className="w-3 h-3" />
                        )}
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
