"use client";

import { useEffect } from "react";
import { Check } from "lucide-react";

interface ToastProps {
  message: string;
  /** Optional second line, e.g. a pointer to where the result shows up. */
  detail?: string;
  onDismiss: () => void;
}

/** Quiet confirmation, top right, gone after 3 s — §7.3. */
export function Toast({ message, detail, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 3000);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 top-[84px] z-100 flex items-start gap-3 rounded-[10px] border border-border-gold bg-surface-1 px-4 py-3 sm:right-6"
    >
      <Check size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-gold" />
      <div>
        <p className="font-display text-[13px] uppercase tracking-[0.12em] text-text-1">
          {message}
        </p>
        {detail && <p className="mt-1 text-[13px] text-text-2">{detail}</p>}
      </div>
    </div>
  );
}
