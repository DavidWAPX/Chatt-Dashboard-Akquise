"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "gold" | "neutral" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Swaps the label for `loadingLabel` and locks the button — §6.4. */
  loading?: boolean;
  loadingLabel?: string;
  fullWidth?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const BASE =
  "inline-flex items-center justify-center gap-[10px] rounded-[10px] font-display text-[13px] font-medium uppercase tracking-[0.12em] " +
  "transition-colors duration-[160ms] ease-out disabled:opacity-45 disabled:cursor-not-allowed";

const VARIANTS: Record<Variant, string> = {
  gold:
    "h-[52px] px-6 border border-gold text-gold bg-transparent gold-ghost-glow " +
    "enabled:hover:bg-gold-dim",
  neutral:
    "h-[44px] px-5 border border-[var(--btn-neutral-border)] text-text-1 bg-transparent " +
    "enabled:hover:bg-surface-2",
  danger:
    "h-[44px] px-5 border border-danger-border text-danger bg-danger-dim " +
    "enabled:hover:bg-[var(--danger-hover)]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "gold",
    loading = false,
    loadingLabel,
    fullWidth = false,
    icon,
    children,
    className,
    disabled,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      // Locked while an async action runs, so a double click never acts twice.
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(BASE, VARIANTS[variant], fullWidth && "w-full", className)}
      {...rest}
    >
      {!loading && icon}
      <span>{loading ? (loadingLabel ?? "Bitte warten…") : children}</span>
    </button>
  );
});

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required — icon-only controls must be announced. */
  label: string;
  variant?: "neutral" | "danger";
  children: ReactNode;
}

/** Round 38 × 38 icon button — §6.4. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { label, variant = "neutral", children, className, type = "button", ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border",
          "transition-colors duration-[160ms] ease-out disabled:opacity-45 disabled:cursor-not-allowed",
          variant === "neutral"
            ? "border-[var(--btn-icon-border)] text-text-2 bg-transparent enabled:hover:border-border-gold enabled:hover:text-text-1"
            : "border-danger-border text-danger bg-danger-dim enabled:hover:bg-[var(--danger-hover-strong)]",
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
