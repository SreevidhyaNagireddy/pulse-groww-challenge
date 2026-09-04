export function getAttentionColorClass(score: number): {
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
} {
  if (score >= 80) {
    return {
      badgeBg: "bg-loss-surface",
      badgeText: "text-loss",
      badgeBorder: "border-loss-border",
    };
  }
  if (score >= 60) {
    return {
      badgeBg: "bg-amber-surface",
      badgeText: "text-amber-dark",
      badgeBorder: "border-amber-light",
    };
  }
  if (score >= 30) {
    return {
      badgeBg: "bg-teal-surface",
      badgeText: "text-teal",
      badgeBorder: "border-teal-light",
    };
  }
  return {
    badgeBg: "bg-paper-muted",
    badgeText: "text-ink-muted",
    badgeBorder: "border-border",
  };
}
