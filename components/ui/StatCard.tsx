import { ArrowDown, ArrowUp } from "lucide-react";
import { formatNumber } from "@/lib/metrics";
import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  value: number;
  /** Absolute change against the previous period. */
  delta: number;
  /** Percentage change, or null when the previous period was empty. */
  deltaPercent: number | null;
  className?: string;
}

/** KPI tile — §6.9. */
export function StatCard({
  label,
  value,
  delta,
  deltaPercent,
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
        "rounded-[16px] border border-panel-border bg-surface-1 p-6",
        className,
      )}
    >
      <p className="font-display text-[12px] font-normal uppercase tracking-[0.10em] text-text-2">
        {label}
      </p>
      <p className="mt-3 font-display text-[34px] font-medium leading-none tnum text-text-1">
        {formatNumber(value)}
      </p>
      <p
        className={cn(
          "mt-3 flex items-center gap-1.5 text-[13px] tnum",
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
  );
}
