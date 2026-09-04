"use client";

import React, { useState } from "react";
import { Activity, Zap, RefreshCw } from "lucide-react";

interface DemoSimulationBarProps {
  onSimulateTick: (symbol?: string, priceDelta?: number, volumeMult?: number, scenario?: string) => Promise<void>;
  isLoading?: boolean;
}

export function DemoSimulationBar({ onSimulateTick, isLoading }: DemoSimulationBarProps) {
  const [activeBtn, setActiveBtn] = useState<string | null>(null);

  const handleSimulate = async (key: string, symbol?: string, priceDelta?: number, volumeMult?: number, scenario?: string) => {
    setActiveBtn(key);
    try {
      await onSimulateTick(symbol, priceDelta, volumeMult, scenario);
    } finally {
      setActiveBtn(null);
    }
  };

  return (
    <div className="bg-paper-muted border border-border rounded-lg p-4 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded bg-amber-surface border border-amber-light/50 text-amber-dark shrink-0">
            <Activity className="w-4 h-4 text-amber" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-ink uppercase tracking-wider">
                Demo Evaluation Controls
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-surface text-amber-dark border border-amber-light/50">
                SIMULATED DATA TOOLKIT
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Simulate market shifts to test &quot;Since you were away&quot; threshold detection live. All generated ticks are tagged as <code className="font-mono font-semibold text-ink">SIMULATED DATA</code>.
            </p>
          </div>
        </div>

        {/* Right: Simulation Trigger Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleSimulate("REL", "RELIANCE", 2.9, 1.2)}
            disabled={isLoading || !!activeBtn}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono font-semibold text-gain bg-gain-surface border border-gain-border rounded hover:bg-gain/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-3 h-3" />
            RELIANCE +2.9%
          </button>

          <button
            type="button"
            onClick={() => handleSimulate("INFY", "INFY", 4.1, 1.9)}
            disabled={isLoading || !!activeBtn}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono font-semibold text-amber-dark bg-amber-surface border border-amber-light/60 rounded hover:bg-amber/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-3 h-3 text-amber" />
            INFY +4.1% (1.9× Vol)
          </button>

          <button
            type="button"
            onClick={() => handleSimulate("TCS", "TCS", -2.45, 1.1)}
            disabled={isLoading || !!activeBtn}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono font-semibold text-loss bg-loss-surface border border-loss-border rounded hover:bg-loss/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-3 h-3" />
            TCS -2.45%
          </button>

          <button
            type="button"
            onClick={() => handleSimulate("ALL", undefined, undefined, undefined, "BREAKOUT")}
            disabled={isLoading || !!activeBtn}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono font-bold text-teal bg-teal-surface border border-teal-light/60 rounded hover:bg-teal/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${activeBtn === "ALL" ? "animate-spin" : ""}`} />
            Simulate Market Shift
          </button>
        </div>
      </div>
    </div>
  );
}
