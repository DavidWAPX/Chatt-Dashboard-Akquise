"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Segmented } from "@/components/ui/Segmented";
import { StatCard } from "@/components/ui/StatCard";
import { Table, type Column } from "@/components/ui/Table";
import { Chip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { Button, IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { VerlaufsDiagramm } from "./VerlaufsDiagramm";
import { createClient } from "@/lib/supabase/client";
import {
  METRICS,
  PLATFORMS,
  PLATFORM_LABEL,
  filterByPlatform,
  formatNumber,
  isPlatform,
  percentChange,
  sumMetrics,
} from "@/lib/metrics";
import {
  RANGES,
  canGoForward,
  formatDateLabel,
  getPeriod,
  isRangeKey,
  parseAnchor,
  previousPeriod,
  shiftAnchor,
  toISODate,
} from "@/lib/date-ranges";
import type { Entry, MetricKey, Platform } from "@/lib/types";

const PAGE_SIZE = 30;

const PLATFORM_OPTIONS = [
  { key: "all" as const, label: "Alle" },
  ...PLATFORMS.map((p) => ({ key: p.key, label: p.label })),
];

interface AuswertungProps {
  profileId: string;
  /** Shown above the KPIs when an admin is looking at someone else. */
  heading?: string;
}

/**
 * The whole evaluation — filters, KPI tiles, chart and table.
 * Used by /(app)/page and /admin/statistik alike; never copied.
 */
export function Auswertung({ profileId, heading }: AuswertungProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter state lives in the URL so reload and the back button behave.
  const rangeParam = searchParams.get("range");
  const platformParam = searchParams.get("platform");
  const range = isRangeKey(rangeParam) ? rangeParam : "day";
  const platform: Platform | "all" = isPlatform(platformParam) ? platformParam : "all";
  const anchor = parseAnchor(searchParams.get("date"));

  const period = useMemo(() => getPeriod(range, anchor), [range, anchor]);
  const previous = useMemo(() => previousPeriod(range, anchor), [range, anchor]);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleRows, setVisibleRows] = useState(PAGE_SIZE);
  const [metricA, setMetricA] = useState<MetricKey>("first_messages");
  const [metricB, setMetricB] = useState<MetricKey | "none">("conversations");

  const setParam = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        next.set(key, value);
      }
      router.replace(`?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // One query spanning previous + current period, split locally afterwards.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data, error: loadError } = await supabase
        .from("entries")
        .select("*")
        .eq("profile_id", profileId)
        .gte("entry_date", previous.startISO)
        .lte("entry_date", period.endISO)
        .order("entry_date", { ascending: false });

      if (cancelled) return;

      if (loadError) {
        setError("Die Daten konnten nicht geladen werden. Lade die Seite neu.");
        setEntries([]);
      } else {
        setEntries((data ?? []) as Entry[]);
      }
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [profileId, previous.startISO, period.endISO]);

  useEffect(() => {
    setVisibleRows(PAGE_SIZE);
  }, [range, platform, period.startISO]);

  const currentEntries = useMemo(
    () =>
      filterByPlatform(entries, platform).filter(
        (entry) => entry.entry_date >= period.startISO && entry.entry_date <= period.endISO,
      ),
    [entries, platform, period.startISO, period.endISO],
  );

  const previousEntries = useMemo(
    () =>
      filterByPlatform(entries, platform).filter(
        (entry) =>
          entry.entry_date >= previous.startISO && entry.entry_date <= previous.endISO,
      ),
    [entries, platform, previous.startISO, previous.endISO],
  );

  const totals = useMemo(() => sumMetrics(currentEntries), [currentEntries]);
  const previousTotals = useMemo(() => sumMetrics(previousEntries), [previousEntries]);

  const forwardAllowed = canGoForward(range, anchor);

  const columns: ReadonlyArray<Column<Entry>> = [
    {
      key: "date",
      head: "Datum",
      isTitle: true,
      cell: (row) => (
        <span className="font-sans text-[15px] font-semibold tnum text-text-1">
          {formatDateLabel(row.entry_date)}
        </span>
      ),
    },
    {
      key: "platform",
      head: "Plattform",
      cell: (row) => <Chip>{PLATFORM_LABEL[row.platform]}</Chip>,
    },
    ...METRICS.map((metric) => ({
      key: metric.key,
      head: metric.short,
      align: "right" as const,
      cell: (row: Entry) => (
        <span className="text-[14px] text-text-2">{formatNumber(row[metric.key])}</span>
      ),
    })),
  ];

  return (
    <>
      {heading && (
        <h2 className="font-display text-[22px] font-medium uppercase tracking-[0.08em] text-text-1 break-anywhere">
          {heading}
        </h2>
      )}

      <Panel>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-5 tbl:flex-row tbl:items-start tbl:justify-between">
            <div>
              <p className="mb-2 font-display text-[12px] uppercase tracking-[0.10em] text-text-2">
                Zeitraum
              </p>
              <Segmented
                label="Zeitraum"
                value={range}
                onChange={(next) => setParam({ range: next })}
                options={RANGES.map((r) => ({ key: r.key, label: r.label }))}
              />
            </div>

            <div>
              <p className="mb-2 font-display text-[12px] uppercase tracking-[0.10em] text-text-2">
                Plattform
              </p>
              <Segmented
                label="Plattform"
                value={platform}
                onChange={(next) => setParam({ platform: next })}
                options={PLATFORM_OPTIONS}
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <IconButton
              label="Vorherige Periode"
              onClick={() => setParam({ date: toISODate(shiftAnchor(range, anchor, -1)) })}
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </IconButton>

            <p
              aria-live="polite"
              className="min-w-0 text-center font-display text-[15px] tracking-[0.02em] text-text-1"
            >
              {period.label}
            </p>

            <IconButton
              label="Nächste Periode"
              disabled={!forwardAllowed}
              title={
                forwardAllowed
                  ? "Nächste Periode"
                  : "Weiter geht es nicht — das ist die aktuelle Periode."
              }
              onClick={() => setParam({ date: toISODate(shiftAnchor(range, anchor, 1)) })}
            >
              <ChevronRight size={16} aria-hidden="true" />
            </IconButton>
          </div>
        </div>
      </Panel>

      {error && (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {METRICS.map((metric) => (
          <StatCard
            key={metric.key}
            label={metric.label}
            value={totals[metric.key]}
            delta={totals[metric.key] - previousTotals[metric.key]}
            deltaPercent={percentChange(totals[metric.key], previousTotals[metric.key])}
          />
        ))}
      </div>

      <Panel eyebrow={period.label} title="Verlauf">
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:max-w-[560px]">
          <Select
            label="Kennzahl 1"
            value={metricA}
            onChange={(event) => setMetricA(event.target.value as MetricKey)}
            options={METRICS.map((metric) => ({ value: metric.key, label: metric.label }))}
          />
          <Select
            label="Kennzahl 2"
            value={metricB}
            onChange={(event) => setMetricB(event.target.value as MetricKey | "none")}
            options={[
              { value: "none", label: "Keine" },
              ...METRICS.map((metric) => ({ value: metric.key, label: metric.label })),
            ]}
          />
        </div>

        {loading ? (
          <EmptyState>Zahlen werden geladen…</EmptyState>
        ) : currentEntries.length === 0 ? (
          <EmptyState>
            Für diesen Zeitraum gibt es noch keine Zahlen. Trag deinen Tag unter Tageseintrag ein.
          </EmptyState>
        ) : (
          <VerlaufsDiagramm
            entries={currentEntries}
            range={range}
            period={period}
            selected={[metricA, metricB === "none" ? null : metricB]}
          />
        )}
      </Panel>

      <Panel eyebrow={period.label} title="Alle Einträge">
        {loading ? (
          <EmptyState>Zahlen werden geladen…</EmptyState>
        ) : (
          <>
            <Table
              caption={`Einträge im Zeitraum ${period.label}`}
              rows={currentEntries.slice(0, visibleRows)}
              rowKey={(row) => row.id}
              columns={columns}
              empty="Noch keine Einträge. Trag deinen ersten Tag unter Tageseintrag ein."
            />

            {currentEntries.length > visibleRows && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="neutral"
                  onClick={() => setVisibleRows((rows) => rows + PAGE_SIZE)}
                >
                  Mehr laden
                </Button>
              </div>
            )}
          </>
        )}
      </Panel>
    </>
  );
}
