import type { Entry, MetricKey, MetricValues, Platform } from "./types";

/** The six metrics — always these, always in this order (§1). */
export const METRICS: ReadonlyArray<{
  key: MetricKey;
  label: string;
  /** Abbreviated head for the entries table. Must still be readable on its
      own — single letters like "Q" are a riddle, not a label. */
  short: string;
}> = [
  { key: "first_messages", label: "Erstnachrichten", short: "Erstnachr." },
  { key: "conversations", label: "Konversationen", short: "Konvers." },
  { key: "followups", label: "Followup Nachrichten", short: "Followups" },
  { key: "appointments", label: "Termin gelegt", short: "Termine" },
  { key: "qualified", label: "Qualifiziert", short: "Qualif." },
  { key: "unqualified", label: "Unqualifiziert", short: "Unqualif." },
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

export function formatPercent(value: number, digits = 1): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/** Share of `part` in `whole`, or null when there is nothing to divide by. */
export function ratio(part: number, whole: number): number | null {
  return whole === 0 ? null : (part / whole) * 100;
}

export interface FunnelStage {
  key: MetricKey;
  label: string;
  value: number;
  /** Share of the first stage — drives the bar width. */
  shareOfTop: number;
  /** Conversion from the stage before, or null for the first one. */
  fromPrevious: number | null;
}

/**
 * The pipeline a chatter actually works: an opener becomes a conversation,
 * a conversation becomes an appointment, an appointment qualifies.
 * Followups and unqualified are deliberately not stages — they are not
 * steps along the same path.
 */
export function buildFunnel(totals: MetricValues): FunnelStage[] {
  const order: Array<{ key: MetricKey; label: string }> = [
    { key: "first_messages", label: "Erstnachrichten" },
    { key: "conversations", label: "Konversationen" },
    { key: "appointments", label: "Termin gelegt" },
    { key: "qualified", label: "Qualifiziert" },
  ];

  const top = totals[order[0]?.key ?? "first_messages"];

  return order.map((stage, index) => {
    const value = totals[stage.key];
    const previousKey = order[index - 1]?.key;
    return {
      key: stage.key,
      label: stage.label,
      value,
      shareOfTop: top === 0 ? 0 : (value / top) * 100,
      fromPrevious:
        previousKey === undefined ? null : ratio(value, totals[previousKey]),
    };
  });
}

export interface Quote {
  label: string;
  /** Percentage, or null when the base is zero. */
  value: number | null;
  hint: string;
}

/** The three rates that say whether the outreach is actually working. */
export function buildQuoten(totals: MetricValues): Quote[] {
  return [
    {
      label: "Antwortrate",
      value: ratio(totals.conversations, totals.first_messages),
      hint: "Konversationen je Erstnachricht",
    },
    {
      label: "Terminquote",
      value: ratio(totals.appointments, totals.conversations),
      hint: "Termine je Konversation",
    },
    {
      label: "Qualifizierungsquote",
      value: ratio(totals.qualified, totals.qualified + totals.unqualified),
      hint: "Qualifiziert von allen bewerteten",
    },
  ];
}
