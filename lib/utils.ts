import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a numeric value into Indian Rupee format (₹).
 */
export function formatINR(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(val);
}

/**
 * Formats percentage change with explicit sign (+ / -).
 */
export function formatPercent(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "0.00%";
  const sign = val > 0 ? "+" : "";
  return `${sign}${val.toFixed(2)}%`;
}

/**
 * Formats large volume numbers (e.g. 1.2M, 500K, 4.5Cr).
 */
export function formatVolume(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "N/A";
  if (val >= 10000000) {
    return `${(val / 10000000).toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `${(val / 100000).toFixed(2)} Lakh`;
  }
  if (val >= 1000) {
    return `${(val / 1000).toFixed(1)} K`;
  }
  return val.toString();
}

/**
 * Human-readable relative time string (e.g., "2 min ago", "45s ago", "2h 14m ago").
 */
export function formatRelativeTime(date: Date | string | number): string {
  const now = new Date();
  const d = new Date(date);
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 10) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  const remainingMin = diffMin % 60;
  if (diffHours < 24) {
    return remainingMin > 0 ? `${diffHours}h ${remainingMin}m ago` : `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
