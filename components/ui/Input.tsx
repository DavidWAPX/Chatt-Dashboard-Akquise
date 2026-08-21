"use client";

import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

const FIELD =
  "h-[47px] w-full rounded-[4px] bg-input-bg border border-input-border px-[19.2px] text-[15.2px] text-text-1 " +
  "placeholder:text-text-3 transition-all duration-[var(--dur)] ease-[var(--ease-ref)] " +
  "focus:outline-none focus:border-gold focus:shadow-[0_0_0_3px_var(--focus-ring)] " +
  "disabled:opacity-45 disabled:cursor-not-allowed";

const ERROR_FIELD = "border-danger focus:border-danger";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Hides the label visually but keeps it for screen readers. */
  hideLabel?: boolean;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hideLabel = false, error, hint, className, id, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;

  return (
    <div className="w-full">
      <label
        htmlFor={inputId}
        className={cn(
          "mb-2 block font-sans text-[14px] font-medium text-text-1",
          hideLabel && "sr-only",
        )}
      >
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={cn(FIELD, error && ERROR_FIELD, className)}
        {...rest}
      />
      {(error || hint) && (
        <p
          id={messageId}
          className={cn("mt-2 text-[13px]", error ? "text-danger" : "text-text-2")}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
});

interface NumberInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type"> {
  label: string;
  value: number | "";
  onValueChange: (value: number | "") => void;
  error?: string;
}

/**
 * Whole numbers ≥ 0 only — §11. Letters, comma, minus and "e" are rejected on
 * the way in rather than validated afterwards. An empty field counts as 0.
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  function NumberInput({ label, value, onValueChange, error, className, id, ...rest }, ref) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const messageId = `${inputId}-message`;

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className="mb-2 block font-display text-[12px] font-normal uppercase tracking-[0.05em] text-text-2"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          value={value === "" ? "" : String(value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? messageId : undefined}
          onChange={(event) => {
            const digitsOnly = event.target.value.replace(/[^0-9]/g, "");
            if (digitsOnly === "") {
              onValueChange("");
              return;
            }
            // Strip leading zeros so "007" reads back as 7.
            onValueChange(Number.parseInt(digitsOnly, 10));
          }}
          className={cn(
            FIELD,
            "no-spinner text-right tnum",
            error && ERROR_FIELD,
            className,
          )}
          {...rest}
        />
        {error && (
          <p id={messageId} className="mt-2 text-[13px] text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
}

/**
 * Mehrzeiliges Feld für die Freitexte im Workreport. Es teilt sich Rahmen,
 * Farben und Fokusring mit den einzeiligen Feldern — nur die Höhe ist eine
 * andere, damit man sieht, dass hier ein Satz erwartet wird und keine Zahl.
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea({ label, hint, className, id, ...rest }, ref) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const messageId = `${inputId}-message`;

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className="mb-2 block font-display text-[12px] font-normal uppercase tracking-[0.05em] text-text-2"
        >
          {label}
        </label>
        <textarea
          ref={ref}
          id={inputId}
          rows={3}
          aria-describedby={hint ? messageId : undefined}
          className={cn(
            FIELD,
            "h-auto min-h-[84px] resize-y py-[12px] leading-[1.6]",
            className,
          )}
          {...rest}
        />
        {hint && (
          <p id={messageId} className="mt-2 text-[12.5px] text-text-3">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

/** Pill-shaped search field with a leading icon — §6.5. */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput({ label, className, id, ...rest }, ref) {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="w-full">
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
        <div className="relative">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-3"
          />
          <input
            ref={ref}
            id={inputId}
            type="search"
            className={cn(FIELD, "rounded-full pl-11", className)}
            {...rest}
          />
        </div>
      </div>
    );
  },
);
