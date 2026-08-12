"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
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
    <div className="rounded-[10px] border border-border-default bg-surface-2 px-3 py-2">
      <p className="font-display text-[12px] uppercase tracking-[0.10em] text-text-2">
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
  } as const;

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        {range === "day" ? (
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={AXIS_COLOR} vertical={false} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis allowDecimals={false} {...axisProps} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--gold-dim)" }} />
            {metricKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                name={label(key)}
                fill={LINE_COLORS[index]}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={AXIS_COLOR} vertical={false} />
            <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} {...axisProps} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: AXIS_COLOR }} />
            {metricKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={label(key)}
                stroke={LINE_COLORS[index]}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
