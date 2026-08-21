"use client";

import { forwardRef } from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
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

/* Measured off the reference app: Outfit 13.6px/400, 1px tracking,
   45px tall, 12.8px/28.8px padding, 4px radius. */
const BASE =
  "inline-flex items-center justify-center gap-[10px] rounded-[4px] font-display text-[13.6px] font-normal uppercase tracking-[1px] " +
  "transition-all duration-[var(--dur)] ease-[var(--ease-ref)] disabled:opacity-45 disabled:cursor-not-allowed";

const VARIANTS: Record<Variant, string> = {
  gold:
    "h-[45px] px-[28.8px] border border-gold text-gold bg-transparent gold-ghost-glow " +
    "enabled:hover:border-gold-bright enabled:hover:text-gold-bright",
  neutral:
    "h-[45px] px-[28.8px] border border-[var(--btn-neutral-border)] text-text-1 bg-transparent " +
    "enabled:hover:bg-surface-2",
  danger:
    "h-[45px] px-[28.8px] border border-danger-border text-danger bg-danger-dim " +
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

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  icon?: ReactNode;
  children: ReactNode;
}

/*
 * Die Hover-Regeln der Varianten hängen an `enabled:` — und `:enabled` trifft
 * auf ein <a> nicht zu, ein Link ist nie "enabled". Ohne diese Entsprechung
 * bliebe ein Link-Button beim Draufzeigen stumm. Ein Link kennt umgekehrt
 * keinen Deaktiviert-Zustand, die Absicherung entfällt hier also.
 */
const LINK_HOVER: Record<Variant, string> = {
  gold: "hover:border-gold-bright hover:text-gold-bright",
  neutral: "hover:bg-surface-2",
  danger: "hover:bg-[var(--danger-hover)]",
};

/**
 * Ein Link, der aussieht wie ein Button — gleiche Größen, gleiche Farben,
 * gleiches Verhalten, weil er sich BASE und VARIANTS mit dem Button teilt.
 * Ein <a> ist hier richtig: das Ziel liegt außerhalb der App, und Rechtsklick,
 * Mittelklick und "Link kopieren" sollen funktionieren.
 */
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  function ButtonLink({ variant = "gold", icon, children, className, ...rest }, ref) {
    return (
      <a
        ref={ref}
        className={cn(BASE, VARIANTS[variant], LINK_HOVER[variant], className)}
        {...rest}
      >
        {icon}
        <span>{children}</span>
      </a>
    );
  },
);

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
          "transition-colors duration-[var(--dur)] ease-[var(--ease-ref)] disabled:opacity-45 disabled:cursor-not-allowed",
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
