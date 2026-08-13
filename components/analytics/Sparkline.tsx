import { useId } from "react";

interface SparklineProps {
  /** One value per bucket of the current period. */
  values: readonly number[];
  className?: string;
}

const WIDTH = 120;
const HEIGHT = 34;

/**
 * Mini trend inside a KPI tile. Decorative only in the sense that the exact
 * numbers live above it — it carries the shape, never a value the user needs
 * to read off precisely.
 */
export function Sparkline({ values, className }: SparklineProps) {
  const gradientId = useId();

  // A single point has no shape, and an all-zero series has nothing to draw.
  if (values.length < 2 || values.every((value) => value === 0)) return null;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * WIDTH;
    const y = HEIGHT - ((value - min) / span) * (HEIGHT - 4) - 2;
    return [x, y] as const;
  });

  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} ${WIDTH},${HEIGHT} 0,${HEIGHT}`;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradientId})`} />
      <polyline
        points={line}
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
