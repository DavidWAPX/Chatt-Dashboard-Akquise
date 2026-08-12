"use client";

import type { ReactNode } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface ChipProps {
  children: ReactNode;
  /** Renders a × that removes the chip. */
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
}

/** Static chip — group badges in tables — §6.6. */
export function Chip({ children, onRemove, removeLabel, className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-[10px] border border-chip-border bg-surface-2",
        "px-[14px] py-1.5 text-[12px] text-text-2",
        className,
      )}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel ?? "Entfernen"}
          title={removeLabel ?? "Entfernen"}
          className="-mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-text-3 transition-colors duration-[160ms] hover:text-danger"
        >
          <X size={13} aria-hidden="true" />
        </button>
      )}
    </span>
  );
}

interface CheckboxChipProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * Checkbox chip — group assignment in the user modal — §6.6.
 * A real <label> wrapping a visually hidden checkbox, so keyboard and screen
 * readers behave exactly as they would with any checkbox.
 */
export function CheckboxChip({
  label,
  checked,
  onChange,
  disabled = false,
}: CheckboxChipProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-[10px] border px-4 py-[14px]",
        "transition-colors duration-[160ms] ease-out",
        "focus-within:border-gold focus-within:shadow-[0_0_0_3px_var(--focus-ring)]",
        checked
          ? "border-[var(--gold-border-chip)] bg-gold-dim text-gold"
          : "border-border-default bg-surface-2 text-text-2",
        disabled && "cursor-not-allowed opacity-45",
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border",
          checked ? "border-gold bg-gold" : "border-border-default bg-transparent",
        )}
      >
        {checked && <Check size={14} strokeWidth={3} className="text-on-gold" />}
      </span>
      <span className="text-[14px] break-anywhere">{label}</span>
    </label>
  );
}
