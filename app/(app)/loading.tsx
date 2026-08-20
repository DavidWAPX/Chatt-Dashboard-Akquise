/**
 * Shown the instant a nav item is clicked, while the next page renders on the
 * server. Without it the bar looks unresponsive for the length of that render.
 * Shapes only — no spinner, nothing that claims to know what is coming.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Wird geladen…</span>

      <div className="h-[47px] w-full max-w-[420px] rounded-[6px] border border-panel-border bg-surface-1" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-[132px] rounded-[12px] border border-panel-border bg-surface-1"
          />
        ))}
      </div>

      <div className="h-[220px] rounded-[12px] border border-panel-border bg-surface-1" />
    </div>
  );
}
