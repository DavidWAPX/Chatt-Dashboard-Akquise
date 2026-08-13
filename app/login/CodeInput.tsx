"use client";

import { useEffect, useRef } from "react";

interface CodeInputProps {
  /**
   * Always six characters; an empty slot is a space. Storing it padded keeps
   * digit positions stable — a compact string would shift later digits left
   * when a middle one is deleted.
   */
  value: string;
  onChange: (value: string) => void;
  /** Fires when all six slots are filled. */
  onComplete?: (value: string) => void;
  disabled?: boolean;
}

const LENGTH = 6;
const EMPTY = " ";

/** Strips the padding — use before sending the code anywhere. */
export function compactCode(value: string): string {
  return value.replace(/\s/g, "");
}

/**
 * Six digit boxes behaving as one field — §7.1.
 * Paste spreads across the boxes, backspace steps back, arrows move.
 */
export function CodeInput({ value, onChange, onComplete, disabled }: CodeInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    // The code step opens with the first box already focused.
    refs.current[0]?.focus();
  }, []);

  const chars = value.padEnd(LENGTH, EMPTY).slice(0, LENGTH).split("");

  function commit(next: string[]) {
    const joined = next.join("");
    onChange(joined);
    if (!joined.includes(EMPTY)) onComplete?.(joined);
  }

  function handleChange(index: number, raw: string) {
    const digits = raw.replace(/\D/g, "");

    if (!digits) {
      const next = [...chars];
      next[index] = EMPTY;
      commit(next);
      return;
    }

    const next = [...chars];

    if (digits.length > 1) {
      // Pasting into any box fills from that box onwards.
      for (let offset = 0; offset < digits.length && index + offset < LENGTH; offset++) {
        next[index + offset] = digits[offset] ?? EMPTY;
      }
      const landing = Math.min(index + digits.length, LENGTH - 1);
      commit(next);
      refs.current[landing]?.focus();
      return;
    }

    next[index] = digits;
    commit(next);
    if (index < LENGTH - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      const next = [...chars];

      if (next[index] !== EMPTY) {
        // Clear the current box and stay put.
        next[index] = EMPTY;
        commit(next);
      } else if (index > 0) {
        // Already empty — step back and clear that one.
        next[index - 1] = EMPTY;
        commit(next);
        refs.current[index - 1]?.focus();
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < LENGTH - 1) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  return (
    <div
      className="flex justify-center gap-2 xs:gap-3"
      role="group"
      aria-label="Sechsstelliger Login Code"
    >
      {Array.from({ length: LENGTH }).map((_, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={LENGTH}
          disabled={disabled}
          aria-label={`Ziffer ${index + 1} von ${LENGTH}`}
          value={chars[index] === EMPTY ? "" : (chars[index] ?? "")}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onFocus={(event) => event.target.select()}
          className="h-[60px] w-[44px] rounded-[8px] border border-input-border bg-input-bg text-center font-display text-[24px] text-text-1 transition-colors duration-[var(--dur)] ease-[var(--ease-ref)] focus:border-gold focus:shadow-[0_0_0_3px_var(--focus-ring)] focus:outline-none disabled:opacity-45 xs:w-[52px]"
        />
      ))}
    </div>
  );
}
