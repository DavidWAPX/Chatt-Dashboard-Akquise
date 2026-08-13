import { buildQuoten, formatPercent } from "@/lib/metrics";
import type { MetricValues } from "@/lib/types";

const SIZE = 132;
const STROKE = 9;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The three rates that decide whether the outreach works, as rings.
 * The number stays the primary reading — the ring is the supporting shape,
 * never the only carrier of the value.
 */
export function QuotenRinge({ totals }: { totals: MetricValues }) {
  const quoten = buildQuoten(totals);

  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {quoten.map((quote, index) => {
        const percent = quote.value ?? 0;
        const dash = (Math.min(percent, 100) / 100) * CIRCUMFERENCE;
        const gradientId = `quote-gradient-${index}`;

        return (
          <div
            key={quote.label}
            className="flex flex-col items-center rounded-[12px] border border-panel-border bg-surface-1 px-4 py-6"
          >
            <div className="relative" style={{ width: SIZE, height: SIZE }}>
              <svg
                width={SIZE}
                height={SIZE}
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                role="img"
                aria-label={`${quote.label}: ${
                  quote.value === null ? "keine Daten" : `${formatPercent(percent)} Prozent`
                }`}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--gold-bright)" />
                    <stop offset="100%" stopColor="var(--gold)" />
                  </linearGradient>
                </defs>

                {/* Track */}
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke="var(--border-soft)"
                  strokeWidth={STROKE}
                />
                {/* Value — starts at twelve o'clock */}
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={`url(#${gradientId})`}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
                  transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {quote.value === null ? (
                  <span className="text-[15px] text-text-3">—</span>
                ) : (
                  <>
                    <span className="font-display text-[24px] font-medium leading-none tnum text-text-1">
                      {formatPercent(percent, 0)}
                    </span>
                    <span className="mt-0.5 text-[12px] text-text-2">Prozent</span>
                  </>
                )}
              </div>
            </div>

            <p className="mt-4 text-center font-display text-[13px] uppercase tracking-[0.05em] text-gold break-anywhere">
              {quote.label}
            </p>
            <p className="mt-1 max-w-[24ch] text-center text-[12px] text-text-3">
              {quote.hint}
            </p>
          </div>
        );
      })}
    </div>
  );
}
