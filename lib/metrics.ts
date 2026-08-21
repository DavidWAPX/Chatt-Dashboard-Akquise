import type { Entry, MetricKey, MetricValues, Platform, TextKey } from "./types";

/** The three metrics a chatter reports — always these, always in this order. */
export const METRICS: ReadonlyArray<{
  key: MetricKey;
  label: string;
  /** Abbreviated head for the entries table. Must still be readable on its
      own — single letters like "Q" are a riddle, not a label. */
  short: string;
}> = [
  { key: "first_messages", label: "Erstnachrichten", short: "Erstnachr." },
  { key: "replies", label: "Antwort erhalten", short: "Antworten" },
  { key: "appointments", label: "Termin gelegt", short: "Termine" },
] as const;

/**
 * Die Freitextfelder eines Workreports. Sie erklären die Zahlen daneben —
 * welcher Opener lief, wonach gesucht wurde, was sonst auffiel.
 */
export const TEXTFELDER: ReadonlyArray<{
  key: TextKey;
  label: string;
  /** Kurzform für enge Stellen wie den Dialog im Verlauf. */
  kurz: string;
  platzhalter: string;
}> = [
  {
    key: "used_opener",
    label: "Welche Erstnachricht hast du verwendet?",
    kurz: "Erstnachricht",
    platzhalter: "Variante A, B oder der Wortlaut",
  },
  {
    key: "search_terms",
    label: "Verwendete Suchbegriffe",
    kurz: "Suchbegriffe",
    platzhalter: "Wonach hast du gesucht?",
  },
  {
    key: "notes",
    label: "Besonderheiten",
    kurz: "Besonderheiten",
    platzhalter: "Was ist dir heute aufgefallen?",
  },
] as const;

export function emptyTexts(): Record<TextKey, string> {
  return { used_opener: "", search_terms: "", notes: "" };
}

/* Nur hier gebraucht — sumMetrics und emptyMetrics arbeiten damit. */
const METRIC_KEYS = METRICS.map((m) => m.key);

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

function emptyMetrics(): MetricValues {
  return { first_messages: 0, replies: 0, appointments: 0 };
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
