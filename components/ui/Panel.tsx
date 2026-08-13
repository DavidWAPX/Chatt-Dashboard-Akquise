import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PanelProps {
  /** Small gold label above the title, e.g. "User Management". */
  eyebrow?: string;
  title?: string;
  /** Right-hand slot in the header row, e.g. a primary action. */
  action?: ReactNode;
  /** Drops the card chrome so the content sits straight on the page. */
  bare?: boolean;
  children: ReactNode;
  className?: string;
}

/** Panel — §6.7, plus a bare variant for the quieter look. */
export function Panel({
  eyebrow,
  title,
  action,
  bare = false,
  children,
  className,
}: PanelProps) {
  const hasHeader = Boolean(eyebrow || title || action);

  return (
    <section
      className={cn(
        bare
          ? "px-0 py-0"
          : "rounded-[12px] border border-panel-border bg-surface-1 p-5 tbl:p-8",
        className,
      )}
    >
      {hasHeader && (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {eyebrow && (
              <p className="font-display text-[11px] font-medium uppercase tracking-[0.09em] text-gold">
                {eyebrow}
              </p>
            )}
            {title && (
              <h1 className="mt-1 font-display text-[19px] font-medium uppercase tracking-[0.05em] text-text-1 tbl:text-[21px]">
                {title}
              </h1>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
