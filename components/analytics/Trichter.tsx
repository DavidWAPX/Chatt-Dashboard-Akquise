import { ArrowDown } from "lucide-react";
import { buildFunnel, formatNumber, formatPercent } from "@/lib/metrics";
import type { MetricValues } from "@/lib/types";

/**
 * The outreach pipeline as a funnel — §7.2 extension.
 * Bar width encodes the share of the first stage, so the drop-off is visible
 * at a glance; the exact rate is written out between the stages, because a
 * shape alone is not a number.
 */
export function Trichter({ totals }: { totals: MetricValues }) {
  const stages = buildFunnel(totals);
  const empty = stages.every((stage) => stage.value === 0);

  if (empty) {
    return (
      <p className="px-4 py-12 text-center text-[14px] italic text-text-3">
        Noch keine Zahlen für diesen Zeitraum — der Trichter füllt sich mit dem ersten
        Tageseintrag.
      </p>
    );
  }

  return (
    <ol className="flex flex-col">
      {stages.map((stage, index) => (
        <li key={stage.key}>
          {/* Conversion badge between two stages */}
          {stage.fromPrevious !== null && (
            <div className="flex items-center gap-2 py-2 pl-1">
              <ArrowDown size={13} aria-hidden="true" className="text-text-3" />
              <span className="text-[12px] tnum text-text-3">
                {formatPercent(stage.fromPrevious)} % weiter
              </span>
            </div>
          )}

          <div className="relative overflow-hidden rounded-[8px] border border-border-soft bg-surface-1">
            {/* The gold body: width carries the meaning, opacity the depth. */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold/70 to-gold/25"
              style={{
                width: `${Math.max(stage.shareOfTop, 1.5)}%`,
                opacity: 1 - index * 0.14,
              }}
              aria-hidden="true"
            />
            <div className="relative flex items-center justify-between gap-4 px-4 py-3.5">
              <span className="font-display text-[12px] font-medium uppercase tracking-[0.07em] text-text-1">
                {stage.label}
              </span>
              <span className="flex shrink-0 items-baseline gap-2">
                <span className="font-display text-[17px] font-medium tnum text-text-1">
                  {formatNumber(stage.value)}
                </span>
                <span className="w-[52px] text-right text-[12px] tnum text-text-2">
                  {formatPercent(stage.shareOfTop, 0)} %
                </span>
              </span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
