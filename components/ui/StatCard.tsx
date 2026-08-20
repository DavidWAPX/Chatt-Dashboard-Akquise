import { formatNumber } from "@/lib/metrics";
import { Sparkline } from "@/components/analytics/Sparkline";
import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  value: number;
  /** One value per bucket of the current period — drives the sparkline. */
  series?: readonly number[];
  /** Plain sentence under the number saying what it counts. */
  hint?: string;
  className?: string;
}

/**
 * KPI tile — §6.9. Shows what the period actually holds and nothing else:
 * the comparison against the previous period was removed because it asked
 * the reader to hold two numbers in their head to understand one.
 */
export function StatCard({ label, value, series, hint, className }: StatCardProps) {
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
          <p className="font-display text-[30px] font-medium leading-none tnum text-text-1">
            {formatNumber(value)}
          </p>
          {series && series.length > 1 && (
            <Sparkline values={series} className="mb-1 h-[34px] w-[96px] shrink-0" />
          )}
        </div>

        {hint && <p className="mt-3 text-[12.5px] leading-[1.45] text-text-3">{hint}</p>}
      </div>
    </div>
  );
}
