import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  getISOWeek,
  isAfter,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { de } from "date-fns/locale";

export type RangeKey = "day" | "week" | "month" | "year";

export const RANGES: ReadonlyArray<{ key: RangeKey; label: string }> = [
  { key: "day", label: "Tag" },
  { key: "week", label: "Woche" },
  { key: "month", label: "Monat" },
  { key: "year", label: "Jahr" },
] as const;

export function isRangeKey(value: string | null | undefined): value is RangeKey {
  return RANGES.some((r) => r.key === value);
}

/** Weeks start on Monday throughout the app. */
const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

export interface Period {
  start: Date;
  end: Date;
  /** yyyy-MM-dd, inclusive — what the entry_date query filters on. */
  startISO: string;
  endISO: string;
  label: string;
}

export const ISO = "yyyy-MM-dd";

export function toISODate(date: Date): string {
  return format(date, ISO);
}

/** Parses a yyyy-MM-dd URL parameter, falling back to today when unusable. */
export function parseAnchor(value: string | null | undefined): Date {
  if (!value) return startOfDay(new Date());
  const parsed = parseISO(value);
  return isValid(parsed) ? startOfDay(parsed) : startOfDay(new Date());
}

export function getPeriod(range: RangeKey, anchor: Date): Period {
  switch (range) {
    case "day": {
      const start = startOfDay(anchor);
      return build(start, endOfDay(anchor), format(start, "d. MMMM yyyy", { locale: de }));
    }
    case "week": {
      const start = startOfWeek(anchor, WEEK_OPTIONS);
      const end = endOfWeek(anchor, WEEK_OPTIONS);
      // "KW 33 · 10.–16. August 2026" — the month is only repeated when it changes.
      const sameMonth = start.getMonth() === end.getMonth();
      const left = sameMonth
        ? format(start, "d.", { locale: de })
        : format(start, "d. MMMM", { locale: de });
      const right = format(end, "d. MMMM yyyy", { locale: de });
      return build(start, end, `KW ${getISOWeek(start)} · ${left}–${right}`);
    }
    case "month": {
      const start = startOfMonth(anchor);
      return build(start, endOfMonth(anchor), format(start, "MMMM yyyy", { locale: de }));
    }
    case "year": {
      const start = startOfYear(anchor);
      return build(start, endOfYear(anchor), format(start, "yyyy", { locale: de }));
    }
  }
}

function build(start: Date, end: Date, label: string): Period {
  return {
    start,
    end,
    startISO: toISODate(start),
    endISO: toISODate(end),
    label,
  };
}

export function shiftAnchor(range: RangeKey, anchor: Date, delta: number): Date {
  switch (range) {
    case "day":
      return addDays(anchor, delta);
    case "week":
      return addWeeks(anchor, delta);
    case "month":
      return addMonths(anchor, delta);
    case "year":
      return addYears(anchor, delta);
  }
}

/** The period directly before the current one — the KPI comparison baseline. */
export function previousPeriod(range: RangeKey, anchor: Date): Period {
  return getPeriod(range, shiftAnchor(range, anchor, -1));
}

/** Forward navigation stops once the period already covers the present. */
export function canGoForward(range: RangeKey, anchor: Date): boolean {
  const next = getPeriod(range, shiftAnchor(range, anchor, 1));
  return !isAfter(next.start, endOfDay(new Date()));
}

export interface Bucket {
  /** yyyy-MM-dd of the bucket start — used to match entries. */
  key: string;
  /** Axis label. */
  label: string;
  /** Inclusive ISO bounds of the bucket. */
  startISO: string;
  endISO: string;
}

/**
 * Time buckets for the chart. "day" has no time axis worth plotting — the day
 * view charts the four platforms instead (see VerlaufsDiagramm).
 */
export function getBuckets(range: RangeKey, period: Period): Bucket[] {
  if (range === "year") {
    return eachMonthOfInterval({ start: period.start, end: period.end }).map((month) => ({
      key: toISODate(month),
      label: format(month, "LLL", { locale: de }),
      startISO: toISODate(startOfMonth(month)),
      endISO: toISODate(endOfMonth(month)),
    }));
  }

  const days = eachDayOfInterval({ start: period.start, end: period.end });
  return days.map((day) => ({
    key: toISODate(day),
    label:
      range === "week"
        ? format(day, "EEEEEE", { locale: de })
        : format(day, "d.", { locale: de }),
    startISO: toISODate(day),
    endISO: toISODate(day),
  }));
}

export function formatDateLabel(iso: string): string {
  const parsed = parseISO(iso);
  return isValid(parsed) ? format(parsed, "dd.MM.yyyy", { locale: de }) : iso;
}

export function todayISO(): string {
  return toISODate(new Date());
}
