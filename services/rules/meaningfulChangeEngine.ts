import { MarketQuote } from "../market/IMarketDataProvider";
import { THRESHOLDS } from "../../lib/constants";
import { formatINR, formatPercent } from "../../lib/utils";

export interface MeaningfulChangeResult {
  symbol: string;
  name: string;
  hasChanged: boolean;
  priceThen: number;
  priceNow: number;
  changePercent: number; // change since baseline checkpoint
  todayChangePercent: number; // regular daily change
  volumeThen?: number;
  volumeNow?: number;
  reasons: Array<{
    ruleKey: "PRICE_MOVE" | "LARGE_MOVE" | "VOLUME_SPIKE" | "HIGH_LOW_EXTREME" | "GAP_OPEN";
    severity: "INFO" | "WARNING" | "CRITICAL";
    title: string;
    description: string;
    impactScore: number;
  }>;
  attentionScore: number;
  attentionCategory: "Quiet" | "Watch" | "Notable" | "Significant";
  attentionBreakdown: string;
  timestamp: Date;
  freshness: MarketQuote["freshness"];
  provider: string;
}

export function evaluateMeaningfulChanges(
  currentQuote: MarketQuote,
  baselineQuote?: { price: number; volume?: number; timestamp: Date }
): MeaningfulChangeResult {
  const priceNow = currentQuote.price;
  const priceThen = baselineQuote ? baselineQuote.price : currentQuote.previousClose;
  const moveSinceBaseline = priceThen > 0 ? ((priceNow - priceThen) / priceThen) * 100 : 0;
  const absMoveSinceBaseline = Math.abs(moveSinceBaseline);

  const reasons: MeaningfulChangeResult["reasons"] = [];

  // Rule A: Large Move (≥ 4%)
  if (absMoveSinceBaseline >= THRESHOLDS.LARGE_MOVE * 100) {
    const isUp = moveSinceBaseline > 0;
    reasons.push({
      ruleKey: "LARGE_MOVE",
      severity: "CRITICAL",
      title: isUp ? "Large upside move" : "Large downside move",
      description: `Price ${isUp ? "surged" : "dropped"} ${formatPercent(moveSinceBaseline)} from ${formatINR(priceThen)} to ${formatINR(priceNow)}.`,
      impactScore: 45,
    });
  }
  // Rule B: Meaningful Move (≥ 2%)
  else if (absMoveSinceBaseline >= THRESHOLDS.PRICE_MOVE * 100) {
    const isUp = moveSinceBaseline > 0;
    reasons.push({
      ruleKey: "PRICE_MOVE",
      severity: isUp ? "INFO" : "WARNING",
      title: isUp ? "Meaningful price move" : "Downside price move",
      description: `Price moved ${formatPercent(moveSinceBaseline)} (exceeding your 2.0% attention threshold).`,
      impactScore: 30,
    });
  }

  // Rule C: Volume Spike (≥ 1.5x average or baseline)
  const currentVol = currentQuote.volume || 0;
  const avgVol = currentQuote.avgVolume || (baselineQuote?.volume || 0);
  if (currentVol > 0 && avgVol > 0) {
    const volMultiple = currentVol / avgVol;
    if (volMultiple >= THRESHOLDS.VOLUME_SPIKE) {
      reasons.push({
        ruleKey: "VOLUME_SPIKE",
        severity: "WARNING",
        title: "Unusual trading volume",
        description: `Current volume is ${volMultiple.toFixed(1)}× its recent average.`,
        impactScore: 25,
      });
    }
  }

  // Rule D: 52-Week Extreme Proximity (Within 1.5% of 52-week High/Low)
  if (currentQuote.high52 && currentQuote.high52 > 0) {
    const distToHigh = Math.abs((currentQuote.high52 - priceNow) / currentQuote.high52);
    if (distToHigh <= THRESHOLDS.EXTREME_PROXIMITY) {
      reasons.push({
        ruleKey: "HIGH_LOW_EXTREME",
        severity: "INFO",
        title: "Near 52-week high",
        description: `Price ${formatINR(priceNow)} is within 1.5% of 52-week high (${formatINR(currentQuote.high52)}).`,
        impactScore: 20,
      });
    }
  }
  if (currentQuote.low52 && currentQuote.low52 > 0) {
    const distToLow = Math.abs((priceNow - currentQuote.low52) / currentQuote.low52);
    if (distToLow <= THRESHOLDS.EXTREME_PROXIMITY) {
      reasons.push({
        ruleKey: "HIGH_LOW_EXTREME",
        severity: "WARNING",
        title: "Near 52-week low",
        description: `Price ${formatINR(priceNow)} is within 1.5% of 52-week low (${formatINR(currentQuote.low52)}).`,
        impactScore: 20,
      });
    }
  }

  // Rule E: Opening Gap (≥ 1.5% vs previous close)
  if (currentQuote.open && currentQuote.previousClose > 0) {
    const gapPercent = ((currentQuote.open - currentQuote.previousClose) / currentQuote.previousClose) * 100;
    if (Math.abs(gapPercent) >= THRESHOLDS.GAP_OPEN * 100) {
      reasons.push({
        ruleKey: "GAP_OPEN",
        severity: "INFO",
        title: "Significant opening gap",
        description: `Opened ${formatPercent(gapPercent)} relative to previous close.`,
        impactScore: 20,
      });
    }
  }

  // Calculate Deterministic Attention Score (0-100)
  let rawScore = reasons.reduce((sum, r) => sum + r.impactScore, 0);

  // Additional recency/baseline factor if price moved even slightly
  if (reasons.length === 0 && absMoveSinceBaseline > 1.0) {
    rawScore += 15;
  }

  const attentionScore = Math.min(100, Math.max(0, rawScore));

  let attentionCategory: MeaningfulChangeResult["attentionCategory"] = "Quiet";
  if (attentionScore >= 80) attentionCategory = "Significant";
  else if (attentionScore >= 60) attentionCategory = "Notable";
  else if (attentionScore >= 30) attentionCategory = "Watch";

  // Build Human-Readable Breakdown String
  const breakdownParts = reasons.map((r) => `+${r.impactScore} ${r.title.toLowerCase()}`);
  const attentionBreakdown =
    breakdownParts.length > 0
      ? breakdownParts.join(", ")
      : attentionScore > 0
      ? "Minor price fluctuation"
      : "No significant move detected";

  return {
    symbol: currentQuote.symbol,
    name: currentQuote.name,
    hasChanged: reasons.length > 0,
    priceThen,
    priceNow,
    changePercent: moveSinceBaseline,
    todayChangePercent: currentQuote.changePercent,
    volumeThen: baselineQuote?.volume,
    volumeNow: currentQuote.volume,
    reasons,
    attentionScore,
    attentionCategory,
    attentionBreakdown,
    timestamp: currentQuote.timestamp,
    freshness: currentQuote.freshness,
    provider: currentQuote.provider,
  };
}
