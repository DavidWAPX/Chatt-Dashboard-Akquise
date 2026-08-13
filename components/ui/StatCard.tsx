import { ArrowDown, ArrowUp } from "lucide-react";
import { formatNumber } from "@/lib/metrics";
import { Sparkline } from "@/components/analytics/Sparkline";
import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  value: number;
  /** Absolute change against the previous period. */
  delta: number;
  /** Percentage change, or null when the previous period was empty. */
  deltaPercent: number | null;
  /** One value per bucket of the current period — drives the sparkline. */
  series?: readonly number[];
  className?: string;
}

/** KPI tile — §6.9, extended with a trend shape. */
export function StatCard({
  label,
  value,
  delta,
  deltaPercent,
  series,
  className,
}: StatCardProps) {
  const rising = delta > 0;
  const flat = delta === 0;

  // The sign is always in the text, so the message never rests on colour alone.
  const sign = rising ? "+" : delta < 0 ? "−" : "±";
  const magnitude = formatNumber(Math.abs(delta));
  const percentPart =
    deltaPercent === null
      ? ""
      : ` (${sign}${new Intl.NumberFormat("de-DE", {
          maximumFractionDigits: 0,
        }).format(Math.abs(deltaPercent))} %)`;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[12px] border border-panel-border bg-surface-1 p-6",
        "transition-colors duration-[var(--dur)] ease-[var(--ease-ref)] hover:border-border-gold",
        className,
      )}
    >
      {/* Soft corner light — gives the tile depth without adding an element
          the eye has to read. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-gold opacity-[0.05] blur-2xl transition-opacity duration-[var(--dur)] ease-[var(--ease-ref)] group-hover:opacity-[0.10]"
      />

      <div className="relative">
        <p className="font-display text-[11px] font-medium uppercase tracking-[0.08em] text-text-2">
          {label}
        </p>

        <div className="mt-3 flex items-end justify-between gap-4">
          <p className="font-display text-[26px] font-medium leading-none tnum text-text-1">
            {formatNumber(value)}
          </p>
          {series && series.length > 1 && (
            <Sparkline values={series} className="mb-1 h-[34px] w-[96px] shrink-0" />
          )}
        </div>

        <p
          className={cn(
            "mt-3 flex items-center gap-1.5 text-[12px] tnum",
            rising ? "text-gold" : "text-text-3",
          )}
        >
          {!flat &&
            (rising ? (
              <ArrowUp size={14} aria-hidden="true" />
            ) : (
              <ArrowDown size={14} aria-hidden="true" />
            ))}
          <span>
            {sign}
            {magnitude}
            {percentPart} zur Vorperiode
          </span>
        </p>
      </div>
    </div>
  );
}
