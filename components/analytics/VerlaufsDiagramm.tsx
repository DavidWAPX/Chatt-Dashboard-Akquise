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
import { METRICS, PLATFORM_LABEL, formatNumber } from "@/lib/metrics";
import { getBuckets, type Period, type RangeKey } from "@/lib/date-ranges";
import type { Entry, MetricKey, Platform } from "@/lib/types";

interface VerlaufsDiagrammProps {
  entries: readonly Entry[];
  range: RangeKey;
  period: Period;
  /** At most two metrics are ever drawn at once — §7.2. */
  selected: [MetricKey, MetricKey | null];
}

const AXIS_COLOR = "var(--border)";
const LABEL_COLOR = "var(--text-2)";
const LINE_COLORS = ["var(--gold)", "var(--text-2)"] as const;

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
    <div className="rounded-[8px] border border-border-default bg-surface-2 px-3 py-2">
      <p className="font-display text-[12px] uppercase tracking-[0.05em] text-text-2">
        {label}
      </p>
      {payload.map((item) => (
        <p key={item.name} className="mt-1 text-[13px] tnum text-text-1">
          <span style={{ color: item.color }}>■</span> {item.name}:{" "}
          {formatNumber(Number(item.value ?? 0))}
        </p>
      ))}
    </div>
  );
}

export function VerlaufsDiagramm({
  entries,
  range,
  period,
  selected,
}: VerlaufsDiagrammProps) {
  const metricKeys = selected.filter((key): key is MetricKey => key !== null);

  const data = useMemo(() => {
    // The day view has no meaningful time axis — it compares platforms instead.
    if (range === "day") {
      return (Object.keys(PLATFORM_LABEL) as Platform[]).map((platform) => {
        const rows = entries.filter((entry) => entry.platform === platform);
        const point: Record<string, string | number> = {
          label: PLATFORM_LABEL[platform],
        };
        for (const key of metricKeys) {
          point[key] = rows.reduce((sum, row) => sum + row[key], 0);
        }
        return point;
      });
    }

    return getBuckets(range, period).map((bucket) => {
      const rows = entries.filter(
        (entry) => entry.entry_date >= bucket.startISO && entry.entry_date <= bucket.endISO,
      );
      const point: Record<string, string | number> = { label: bucket.label };
      for (const key of metricKeys) {
        point[key] = rows.reduce((sum, row) => sum + row[key], 0);
      }
      return point;
    });
  }, [entries, range, period, metricKeys]);

  const label = (key: MetricKey) =>
    METRICS.find((metric) => metric.key === key)?.label ?? key;

  const axisProps = {
    stroke: AXIS_COLOR,
    tick: { fill: LABEL_COLOR, fontSize: 12 },
    tickLine: false,
    axisLine: { stroke: AXIS_COLOR },
  } as const;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: -12 }}>
          <defs>
            {metricKeys.map((key, index) => (
              <linearGradient
                key={key}
                id={`fill-${key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={LINE_COLORS[index]}
                  stopOpacity={index === 0 ? 0.34 : 0.16}
                />
                <stop offset="100%" stopColor={LINE_COLORS[index]} stopOpacity={0} />
              </linearGradient>
            ))}
            <linearGradient id="bar-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--gold-bright)" />
              <stop offset="100%" stopColor="var(--gold)" stopOpacity={0.45} />
            </linearGradient>
            <linearGradient id="bar-muted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--text-2)" stopOpacity={0.7} />
              <stop offset="100%" stopColor="var(--text-2)" stopOpacity={0.2} />
            </linearGradient>
          </defs>

          {/* Dashed grid recedes behind the data instead of caging it. */}
          <CartesianGrid stroke={AXIS_COLOR} strokeDasharray="2 6" vertical={false} />
          <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} width={44} {...axisProps} />
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
            ? metricKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  name={label(key)}
                  fill={index === 0 ? "url(#bar-gold)" : "url(#bar-muted)"}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={72}
                  isAnimationActive={false}
                />
              ))
            : metricKeys.map((key, index) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={label(key)}
                  stroke={LINE_COLORS[index]}
                  strokeWidth={2}
                  fill={`url(#fill-${key})`}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "var(--bg)",
                    stroke: LINE_COLORS[index],
                    strokeWidth: 2,
                  }}
                  isAnimationActive={false}
                />
              ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
