"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

interface SegmentedProps<T extends string> {
  /** Announced to screen readers; render a visible label separately if wanted. */
  label: string;
  options: ReadonlyArray<{ key: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Segmented control — §6.3. A tablist with arrow-key navigation, scrollable
 * sideways on small screens rather than wrapping.
 */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: SegmentedProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(event: React.KeyboardEvent, index: number) {
    const lastIndex = options.length - 1;
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") nextIndex = index === lastIndex ? 0 : index + 1;
    if (event.key === "ArrowLeft") nextIndex = index === 0 ? lastIndex : index - 1;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = lastIndex;
    if (nextIndex === null) return;

    event.preventDefault();
    const option = options[nextIndex];
    if (!option) return;
    onChange(option.key);
    refs.current[nextIndex]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "no-scrollbar inline-flex max-w-full items-center gap-0 overflow-x-auto",
        "rounded-[10px] border border-border-default bg-surface-2 p-1",
        className,
      )}
    >
      {options.map((option, index) => {
        const selected = option.key === value;
        return (
          <button
            key={option.key}
            ref={(node) => {
              refs.current[index] = node;
            }}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.key)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-[8px] px-[18px] py-2 font-display text-[13px]",
              "transition-colors duration-[160ms] ease-out",
              selected
                ? "bg-gold font-semibold text-on-gold"
                : "text-text-2 hover:text-text-1",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
