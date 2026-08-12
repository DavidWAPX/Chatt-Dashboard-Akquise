import type { Entry, MetricKey, MetricValues, Platform } from "./types";

/** The six metrics — always these, always in this order (§1). */
export const METRICS: ReadonlyArray<{
  key: MetricKey;
  label: string;
  /** Abbreviated head for the entries table, where columns are tight. */
  short: string;
}> = [
  { key: "first_messages", label: "Erstnachrichten", short: "Erst" },
  { key: "conversations", label: "Konversationen", short: "Konv" },
  { key: "followups", label: "Followup Nachrichten", short: "Fup" },
  { key: "appointments", label: "Termin gelegt", short: "Term" },
  { key: "qualified", label: "Qualifiziert", short: "Q" },
  { key: "unqualified", label: "Unqualifiziert", short: "U" },
] as const;

export const METRIC_KEYS = METRICS.map((m) => m.key);

export const METRIC_LABEL: Record<MetricKey, string> = METRICS.reduce(
  (acc, m) => ({ ...acc, [m.key]: m.label }),
  {} as Record<MetricKey, string>,
);

export const PLATFORMS: ReadonlyArray<{ key: Platform; label: string }> = [
  { key: "tiktok", label: "TikTok" },
  { key: "instagram", label: "Instagram" },
  { key: "x", label: "X" },
  { key: "facebook", label: "Facebook" },
] as const;

export const PLATFORM_LABEL: Record<Platform, string> = PLATFORMS.reduce(
  (acc, p) => ({ ...acc, [p.key]: p.label }),
  {} as Record<Platform, string>,
);

export function isPlatform(value: string | null | undefined): value is Platform {
  return PLATFORMS.some((p) => p.key === value);
}

export function emptyMetrics(): MetricValues {
  return {
    first_messages: 0,
    conversations: 0,
    followups: 0,
    appointments: 0,
    qualified: 0,
    unqualified: 0,
  };
}

export function sumMetrics(rows: ReadonlyArray<Partial<MetricValues>>): MetricValues {
  const total = emptyMetrics();
  for (const row of rows) {
    for (const key of METRIC_KEYS) {
      total[key] += row[key] ?? 0;
    }
  }
  return total;
}

export function filterByPlatform(
  entries: readonly Entry[],
  platform: Platform | "all",
): Entry[] {
  return platform === "all"
    ? [...entries]
    : entries.filter((e) => e.platform === platform);
}

/**
 * Change against the previous period. Returns null when there is nothing to
 * compare against, so the UI can stay quiet rather than claim "+100 %".
 */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

/** Whole numbers only, grouped the German way: 1.248 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("de-DE").format(value);
}
