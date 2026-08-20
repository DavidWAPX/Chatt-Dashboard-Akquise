import type { Entry, MetricKey, MetricValues, Platform } from "./types";

/** The three metrics a chatter reports — always these, always in this order. */
export const METRICS: ReadonlyArray<{
  key: MetricKey;
  label: string;
  /** Abbreviated head for the entries table. Must still be readable on its
      own — single letters like "Q" are a riddle, not a label. */
  short: string;
  /** One plain sentence under the input, so nobody has to guess what counts. */
  hint: string;
}> = [
  {
    key: "first_messages",
    label: "Erstnachrichten",
    short: "Erstnachr.",
    hint: "Wie viele Leute hast du heute zum ersten Mal angeschrieben?",
  },
  {
    key: "followups",
    label: "Followup Nachrichten",
    short: "Followups",
    hint: "Wie oft hast du heute nachgefasst, wo schon Kontakt bestand?",
  },
  {
    key: "appointments",
    label: "Termin gelegt",
    short: "Termine",
    hint: "Wie viele Termine sind heute daraus entstanden?",
  },
] as const;

export const METRIC_KEYS = METRICS.map((m) => m.key);

export const METRIC_LABEL: Record<MetricKey, string> = METRICS.reduce(
  (acc, m) => ({ ...acc, [m.key]: m.label }),
  {} as Record<MetricKey, string>,
);

/** The platforms the app offers. X was dropped from the product. */
export const PLATFORMS: ReadonlyArray<{ key: Platform; label: string }> = [
  { key: "tiktok", label: "TikTok" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
] as const;

/* Includes X so that rows saved before it was removed still show a name
   instead of "undefined". */
export const PLATFORM_LABEL: Record<Platform, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X",
};

export function isPlatform(value: string | null | undefined): value is Platform {
  return PLATFORMS.some((p) => p.key === value);
}

export function emptyMetrics(): MetricValues {
  return { first_messages: 0, followups: 0, appointments: 0 };
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

/** Whole numbers only, grouped the German way: 1.248 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("de-DE").format(value);
}
