"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Segmented } from "@/components/ui/Segmented";
import { StatCard } from "@/components/ui/StatCard";
import { Table, type Column } from "@/components/ui/Table";
import { PlatformLogo } from "@/components/ui/PlatformLogo";
import { Button, IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { InfoButton } from "@/components/leads/InfoButton";
/*
 * recharts wiegt rund 190 kB und steckt nur in diesem einen Diagramm. Als
 * fester Import lag es im ersten Ladepaket jeder Auswertungsseite — gemessen
 * 303 kB First Load JS. Nachgeladen wird es erst, wenn die Seite steht; der
 * Platzhalter hat dieselbe Höhe, damit nichts springt.
 */
const VerlaufsDiagramm = dynamic(
  () => import("./VerlaufsDiagramm").then((m) => m.VerlaufsDiagramm),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-5" aria-hidden="true">
        <div className="h-[18px] w-[380px] max-w-full rounded-[4px] bg-surface-2" />
        <div className="h-[300px] w-full rounded-[8px] bg-surface-1" />
      </div>
    ),
  },
);
import { createClient } from "@/lib/supabase/client";
import {
  METRICS,
  TEXTFELDER,
  PLATFORMS,
  PLATFORM_LABEL,
  filterByPlatform,
  formatNumber,
  isPlatform,
  sumMetrics,
} from "@/lib/metrics";
import {
  RANGES,
  type RangeKey,
  canGoForward,
  formatDateLabel,
  getBuckets,
  getPeriod,
  isRangeKey,
  parseAnchor,
  shiftAnchor,
  toISODate,
} from "@/lib/date-ranges";
import type { Entry, Platform } from "@/lib/types";

const PAGE_SIZE = 30;

const PLATFORM_OPTIONS = [
  { key: "all" as const, label: "Alle" },
  ...PLATFORMS.map((p) => ({
    key: p.key,
    label: p.label,
    icon: <PlatformLogo platform={p.key} size={14} />,
  })),
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

  // The URL stays the shareable source of truth, but it is not what the
  // controls render from: routing to it first made every click wait on a
  // server round-trip before anything moved. Local state answers instantly,
  // the URL is brought in line afterwards.
  const urlRange = isRangeKey(searchParams.get("range"))
    ? (searchParams.get("range") as RangeKey)
    : "day";
  const urlPlatform: Platform | "all" = isPlatform(searchParams.get("platform"))
    ? (searchParams.get("platform") as Platform)
    : "all";
  const urlDate = searchParams.get("date") ?? "";

  const [range, setRange] = useState<RangeKey>(urlRange);
  const [platform, setPlatform] = useState<Platform | "all">(urlPlatform);
  const [dateISO, setDateISO] = useState(urlDate);

  // Follow the URL when it changes from outside — back button, a shared link.
  useEffect(() => setRange(urlRange), [urlRange]);
  useEffect(() => setPlatform(urlPlatform), [urlPlatform]);
  useEffect(() => setDateISO(urlDate), [urlDate]);

  const anchor = useMemo(() => parseAnchor(dateISO || null), [dateISO]);
  const period = useMemo(() => getPeriod(range, anchor), [range, anchor]);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleRows, setVisibleRows] = useState(PAGE_SIZE);
  /** Der Workreport, dessen Freitexte gerade offen liegen. */
  const [offen, setOffen] = useState<Entry | null>(null);

  /** Writes the filter into the URL without holding up the render. */
  const syncUrl = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        next.set(key, value);
      }
      // startTransition keeps the navigation off the interaction's critical
      // path, so the control repaints on the same frame as the click.
      startTransition(() => {
        router.replace(`?${next.toString()}`, { scroll: false });
      });
    },
    [router, searchParams],
  );

  /*
   * Nur noch der gewählte Zeitraum wird geladen. Vorher spannte die Abfrage
   * zusätzlich die Vorperiode auf, um Veränderungen auszurechnen — die
   * Vergleichsanzeige ist raus, also holt die Seite auch nur noch die Hälfte.
   */
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
        .gte("entry_date", period.startISO)
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
  }, [profileId, period.startISO, period.endISO]);

  useEffect(() => {
    setVisibleRows(PAGE_SIZE);
  }, [range, platform, period.startISO]);

  const currentEntries = useMemo(
    () => filterByPlatform(entries, platform),
    [entries, platform],
  );

  const totals = useMemo(() => sumMetrics(currentEntries), [currentEntries]);
  const forwardAllowed = canGoForward(range, anchor);

  /**
   * One value per bucket per metric — the shape behind each KPI tile.
   * The day view has no time axis, so the tiles carry no sparkline there.
   */
  const seriesByMetric = useMemo(() => {
    if (range === "day") return null;

    const buckets = getBuckets(range, period);
    return METRICS.reduce(
      (acc, metric) => ({
        ...acc,
        [metric.key]: buckets.map((bucket) =>
          currentEntries
            .filter(
              (entry) =>
                entry.entry_date >= bucket.startISO &&
                entry.entry_date <= bucket.endISO,
            )
            .reduce((sum, entry) => sum + entry[metric.key], 0),
        ),
      }),
      {} as Record<string, number[]>,
    );
  }, [range, period, currentEntries]);

  const columns: ReadonlyArray<Column<Entry>> = [
    {
      key: "date",
      head: "Datum",
      isTitle: true,
      width: "22%",
      cell: (row) => (
        <span className="font-sans text-[14px] font-medium tnum text-text-1">
          {formatDateLabel(row.entry_date)}
        </span>
      ),
    },
    {
      key: "platform",
      head: "Plattform",
      width: "20%",
      cell: (row) => (
        <span className="inline-flex items-center gap-2 whitespace-nowrap text-[13px] text-text-1">
          <PlatformLogo platform={row.platform} size={15} />
          {PLATFORM_LABEL[row.platform]}
        </span>
      ),
    },
    ...METRICS.map((metric) => ({
      key: metric.key,
      head: metric.short,
      align: "right" as const,
      width: "14%",
      cell: (row: Entry) => (
        <span className="text-[14px] tnum text-text-1" title={metric.label}>
          {formatNumber(row[metric.key])}
        </span>
      ),
    })),
    {
      key: "texte",
      head: "Notizen",
      width: "12%",
      cell: (row) => (
        <InfoButton
          text={TEXTFELDER.map((feld) => row[feld.key] ?? "").join("")}
          label="Notizen zu diesem Workreport"
          icon={FileText}
          onOpen={() => setOffen(row)}
        />
      ),
    },
  ];

  const leer = !loading && currentEntries.length === 0;

  return (
    <>
      {heading && (
        <h2 className="font-display text-[19px] font-medium uppercase tracking-[0.05em] text-text-1 break-anywhere">
          {heading}
        </h2>
      )}

      {/* Filterleiste: ein Kasten statt drei lose Zeilen, damit klar ist,
          dass Zeitraum, Blättern und Plattform zusammengehören. */}
      <div className="flex flex-col gap-5 rounded-[12px] border border-panel-border bg-surface-1 p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="shrink-0 text-[13px] text-text-3">Zeitraum</span>
            <Segmented
              label="Zeitraum"
              value={range}
              onChange={(next) => {
                setRange(next);
                syncUrl({ range: next });
              }}
              options={RANGES.map((r) => ({ key: r.key, label: r.label }))}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="shrink-0 text-[13px] text-text-3">Plattform</span>
            <Segmented
              label="Plattform"
              value={platform}
              onChange={(next) => {
                setPlatform(next);
                syncUrl({ platform: next });
              }}
              options={PLATFORM_OPTIONS}
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 border-t border-border-soft pt-5">
          <IconButton
            label="Vorheriger Zeitraum"
            onClick={() => {
              const next = toISODate(shiftAnchor(range, anchor, -1));
              setDateISO(next);
              syncUrl({ date: next });
            }}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </IconButton>

          <p
            aria-live="polite"
            className="min-w-0 text-center font-display text-[16px] font-medium uppercase tracking-[0.04em] text-text-1"
          >
            {period.label}
          </p>

          <IconButton
            label="Nächster Zeitraum"
            disabled={!forwardAllowed}
            title={
              forwardAllowed
                ? "Nächster Zeitraum"
                : "Weiter geht es nicht — das ist der aktuelle Zeitraum."
            }
            onClick={() => {
              const next = toISODate(shiftAnchor(range, anchor, 1));
              setDateISO(next);
              syncUrl({ date: next });
            }}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      )}

      <Panel bare eyebrow={period.label} title="Verlauf">
        {loading ? (
          <EmptyState>Zahlen werden geladen…</EmptyState>
        ) : leer ? (
          <EmptyState>
            Für diesen Zeitraum gibt es noch keine Zahlen. Trag deinen Tag unter
            Workreport ein.
          </EmptyState>
        ) : (
          <VerlaufsDiagramm entries={currentEntries} range={range} period={period} />
        )}
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {METRICS.map((metric) => (
          <StatCard
            key={metric.key}
            label={metric.label}
            value={totals[metric.key]}
            series={seriesByMetric?.[metric.key]}
          />
        ))}
      </div>

      <Panel bare eyebrow={period.label} title="Alle Workreports">
        {loading ? (
          <EmptyState>Zahlen werden geladen…</EmptyState>
        ) : (
          <>
            <Table
              framed
              caption={`Workreports im Zeitraum ${period.label}`}
              rows={currentEntries.slice(0, visibleRows)}
              rowKey={(row) => row.id}
              columns={columns}
              empty="Noch keine Workreports. Trag deinen ersten Tag unter Workreport ein."
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

      <Modal
        open={offen !== null}
        title={offen ? formatDateLabel(offen.entry_date) : ""}
        onClose={() => setOffen(null)}
      >
        <div className="flex flex-col gap-5">
          {offen &&
            TEXTFELDER.map((feld) => (
              <div key={feld.key}>
                <p className="font-display text-[11px] font-medium uppercase tracking-[0.08em] text-gold">
                  {feld.kurz}
                </p>
                <p className="mt-1.5 whitespace-pre-line text-[14px] leading-[1.7] text-text-2 break-anywhere">
                  {offen[feld.key]?.trim() ? offen[feld.key] : "—"}
                </p>
              </div>
            ))}
        </div>
      </Modal>
    </>
  );
}
