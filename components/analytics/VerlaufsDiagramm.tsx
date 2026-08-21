"use client";

import { useMemo } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { METRICS, PLATFORMS, PLATFORM_LABEL, formatNumber } from "@/lib/metrics";
import { getBuckets, type Period, type RangeKey } from "@/lib/date-ranges";
import type { Entry, MetricKey } from "@/lib/types";

interface VerlaufsDiagrammProps {
  entries: readonly Entry[];
  range: RangeKey;
  period: Period;
}

const AXIS_COLOR = "var(--border)";
const LABEL_COLOR = "var(--text-2)";

/**
 * Eine feste Farbe je Kennzahl — nicht nach Reihenfolge vergeben, sondern
 * fest zugeordnet, damit dieselbe Zahl im Diagramm, in der Legende und in
 * der Kachel immer dieselbe Farbe trägt. Termine tragen das Grün von
 * "Gewonnen": das ist die Zahl, auf die alles hinausläuft.
 */
export const METRIC_COLOR: Record<MetricKey, string> = {
  first_messages: "var(--gold-bright)",
  replies: "var(--status-inactive)",
  appointments: "var(--status-won)",
};

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-[8px] border border-border-gold bg-modal px-3.5 py-2.5 shadow-[var(--shadow-lg)]">
      <p className="font-display text-[11px] font-medium uppercase tracking-[0.08em] text-gold">
        {label}
      </p>
      <ul className="mt-2 flex flex-col gap-1">
        {payload.map((item) => (
          <li
            key={item.name}
            className="flex items-center justify-between gap-6 text-[13px]"
          >
            <span className="flex items-center gap-2 text-text-2">
              <span
                aria-hidden="true"
                className="h-[9px] w-[9px] shrink-0 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <span className="font-medium tnum text-text-1">
              {formatNumber(Number(item.value ?? 0))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Der Verlauf zeigt immer alle Kennzahlen gleichzeitig. Vorher musste man
 * zwei Auswahlfelder bedienen, um überhaupt etwas zu sehen — jetzt liegt
 * alles offen und der Tooltip nennt beim Drüberfahren jede Zahl beim Namen.
 */
export function VerlaufsDiagramm({ entries, range, period }: VerlaufsDiagrammProps) {
  const data = useMemo(() => {
    // The day view has no meaningful time axis — it compares platforms instead.
    if (range === "day") {
      return PLATFORMS.map(({ key }) => {
        const rows = entries.filter((entry) => entry.platform === key);
        const point: Record<string, string | number> = { label: PLATFORM_LABEL[key] };
        for (const metric of METRICS) {
          point[metric.key] = rows.reduce((sum, row) => sum + row[metric.key], 0);
        }
        return point;
      });
    }

    return getBuckets(range, period).map((bucket) => {
      const rows = entries.filter(
        (entry) =>
          entry.entry_date >= bucket.startISO && entry.entry_date <= bucket.endISO,
      );
      const point: Record<string, string | number> = { label: bucket.label };
      for (const metric of METRICS) {
        point[metric.key] = rows.reduce((sum, row) => sum + row[metric.key], 0);
      }
      return point;
    });
  }, [entries, range, period]);

  /*
   * Die Achse muss so breit sein wie ihre größte Beschriftung. Fest gesetzte
   * 44px reichten nur bis dreistellig — ab 1.000 schnitt die Tausenderstelle
   * links ab, zumal der negative Außenabstand die Achse zusätzlich aus dem
   * Bild schob.
   */
  const achsenbreite = useMemo(() => {
    const groesster = data.reduce((max, punkt) => {
      const werte = METRICS.map((m) => Number(punkt[m.key] ?? 0));
      return Math.max(max, ...werte);
    }, 0);
    // 8px je Zeichen plus Platz für den Strich zur Achse.
    return Math.max(44, formatNumber(groesster).length * 8 + 16);
  }, [data]);

  const axisProps = {
    stroke: AXIS_COLOR,
    tick: { fill: LABEL_COLOR, fontSize: 12 },
    tickLine: false,
    axisLine: { stroke: AXIS_COLOR },
  } as const;

  return (
    <div className="flex flex-col gap-5">
      {/* Legende über dem Diagramm: welche Farbe welche Zahl ist, ohne dass
          man erst mit der Maus hineinfahren muss. */}
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {METRICS.map((metric) => (
          <li key={metric.key} className="flex items-center gap-2 text-[13px] text-text-2">
            <span
              aria-hidden="true"
              className="h-[10px] w-[10px] shrink-0 rounded-[3px]"
              style={{ backgroundColor: METRIC_COLOR[metric.key] }}
            />
            {metric.label}
          </li>
        ))}
      </ul>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
            <defs>
              {METRICS.map((metric) => (
                <linearGradient
                  key={metric.key}
                  id={`fill-${metric.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={METRIC_COLOR[metric.key]}
                    stopOpacity={0.28}
                  />
                  <stop
                    offset="100%"
                    stopColor={METRIC_COLOR[metric.key]}
                    stopOpacity={0}
                  />
                </linearGradient>
              ))}
            </defs>

            {/* Dashed grid recedes behind the data instead of caging it. */}
            <CartesianGrid stroke={AXIS_COLOR} strokeDasharray="2 6" vertical={false} />
            <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" />
            <YAxis
              allowDecimals={false}
              width={achsenbreite}
              /* Dieselbe Schreibweise wie in den Kacheln und der Tabelle:
                 18.000 statt 18000. */
              tickFormatter={(wert: number) => formatNumber(wert)}
              {...axisProps}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={
                range === "day"
                  ? { fill: "var(--gold-dim)", radius: 6 }
                  : { stroke: "var(--gold)", strokeOpacity: 0.35, strokeWidth: 1 }
              }
            />

            {/* The day view compares platforms as bars; every other range is a
                time series, drawn as a filled area so the trend reads first. */}
            {range === "day"
              ? METRICS.map((metric) => (
                  <Bar
                    key={metric.key}
                    dataKey={metric.key}
                    name={metric.label}
                    fill={METRIC_COLOR[metric.key]}
                    radius={[5, 5, 0, 0]}
                    maxBarSize={40}
                    isAnimationActive={false}
                  />
                ))
              : METRICS.map((metric) => (
                  <Area
                    key={metric.key}
                    type="monotone"
                    dataKey={metric.key}
                    name={metric.label}
                    stroke={METRIC_COLOR[metric.key]}
                    strokeWidth={2}
                    fill={`url(#fill-${metric.key})`}
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: "var(--bg)",
                      stroke: METRIC_COLOR[metric.key],
                      strokeWidth: 2,
                    }}
                    isAnimationActive={false}
                  />
                ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
