import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PanelProps {
  /** Small gold label above the title, e.g. "User Management". */
  eyebrow?: string;
  title?: string;
  /** Right-hand slot in the header row, e.g. a primary action. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Panel — §6.7. */
export function Panel({ eyebrow, title, action, children, className }: PanelProps) {
  const hasHeader = Boolean(eyebrow || title || action);

  return (
    <section
      className={cn(
        "rounded-[16px] border border-panel-border bg-surface-1 p-5 tbl:p-8",
        className,
      )}
    >
      {hasHeader && (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {eyebrow && (
              <p className="font-display text-[14px] font-medium uppercase tracking-[0.14em] text-gold">
                {eyebrow}
              </p>
            )}
            {title && (
              <h1 className="mt-1 font-display text-[22px] font-medium uppercase tracking-[0.08em] text-text-1 tbl:text-[26px]">
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
