"use client";

import { forwardRef, useId } from "react";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hideLabel?: boolean;
  options: ReadonlyArray<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hideLabel = false, options, className, id, ...rest },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="w-full">
      <label
        htmlFor={selectId}
        className={cn(
          "mb-2 block font-display text-[12px] font-normal uppercase tracking-[0.05em] text-text-2",
          hideLabel && "sr-only",
        )}
      >
        {label}
      </label>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "h-12 w-full appearance-none rounded-[8px] bg-input-bg border border-input-border pl-4 pr-11",
            "text-[15px] text-text-1 transition-colors duration-[var(--dur)] ease-[var(--ease-ref)]",
            "focus:outline-none focus:border-gold focus:shadow-[0_0_0_3px_var(--focus-ring)]",
            "disabled:opacity-45 disabled:cursor-not-allowed",
            className,
          )}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-2"
        />
      </div>
    </div>
  );
});
