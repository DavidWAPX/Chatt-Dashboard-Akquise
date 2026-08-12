"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Right-aligned button row below the divider. */
  footer?: ReactNode;
  className?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Modal — §6.8. */
export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  className,
}: ModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  // Remembered so focus goes back where it came from on close.
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !cardRef.current) return;

      const focusable = Array.from(
        cardRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      // Wrap the tab order so focus stays inside the card.
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;

    openerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    // Focus the first field rather than the card itself.
    const timer = window.setTimeout(() => {
      const focusable = cardRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      focusable?.[0]?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-[var(--overlay)] p-4 backdrop-blur-[6px]"
      // Clicking the overlay closes; clicking the card does not.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "my-auto w-[calc(100vw-32px)] max-w-[840px] rounded-[16px] border border-input-border bg-modal p-5 tbl:p-8",
          className,
        )}
      >
        <h2
          id={titleId}
          className="font-display text-[18px] font-medium uppercase tracking-[0.10em] text-gold"
        >
          {title}
        </h2>

        <div className="mt-6">{children}</div>

        {footer && (
          <>
            <hr className="my-6 border-0 border-t border-border-default" />
            <div className="flex flex-wrap justify-end gap-3">{footer}</div>
          </>
        )}
      </div>
    </div>
  );
}
