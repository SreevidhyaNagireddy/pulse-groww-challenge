"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { formatINR, formatRelativeTime } from "@/lib/utils";

interface ChartPoint {
  timestamp: Date | string;
  price: number;
  provider?: string;
}

interface StockChartProps {
  data: ChartPoint[];
  symbol: string;
  isPositive?: boolean;
}

export function StockChart({ data, symbol, isPositive = true }: StockChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 bg-paper-card border border-border rounded-lg flex items-center justify-center text-xs font-mono text-ink-muted">
        No price history recorded yet for {symbol}.
      </div>
    );
  }

  const formattedData = data.map((d) => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    price: d.price,
    fullDate: new Date(d.timestamp).toLocaleString(),
  }));

  const strokeColor = isPositive ? "#1E7A4C" : "#B4232C";
  const fillColor = isPositive ? "#1E7A4C" : "#B4232C";

  return (
    <div className="bg-paper-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4 font-mono text-xs text-ink-muted border-b border-border pb-2">
        <span className="font-semibold text-ink">Price History · MarketSnapshotHistory</span>
        <span>{data.length} Data Points</span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={fillColor} stopOpacity={0.2} />
                <stop offset="95%" stopColor={fillColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="time"
              stroke="#8A8E99"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#E5E3DD" }}
            />
            <YAxis
              domain={["auto", "auto"]}
              stroke="#8A8E99"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#E5E3DD" }}
              tickFormatter={(val) => `₹${val}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload;
                  return (
                    <div className="bg-paper-card border border-border p-2 rounded shadow-md font-mono text-xs">
                      <div className="text-ink-muted text-[10px]">{p.fullDate}</div>
                      <div className="font-bold text-ink text-sm mt-0.5">{formatINR(p.price)}</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={strokeColor}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#gradient-${symbol})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
