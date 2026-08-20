"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";

interface KopierButtonProps {
  /** Der Text, der in der Zwischenablage landen soll. */
  text: string;
  /** Beschriftung für Screenreader und Tooltip. */
  label?: string;
  className?: string;
}

/**
 * Kopiert einen Textbaustein in die Zwischenablage und sagt kurz Bescheid,
 * dass es geklappt hat. Ohne diese Rückmeldung drückt man zweimal, weil man
 * nicht weiß, ob etwas passiert ist.
 */
export function KopierButton({ text, label = "Text kopieren", className }: KopierButtonProps) {
  const [kopiert, setKopiert] = useState(false);
  const [fehler, setFehler] = useState(false);

  useEffect(() => {
    if (!kopiert && !fehler) return;
    const timer = window.setTimeout(() => {
      setKopiert(false);
      setFehler(false);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [kopiert, fehler]);

  async function kopieren() {
    try {
      await navigator.clipboard.writeText(text);
      setKopiert(true);
    } catch {
      setFehler(true);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void kopieren()}
      title={fehler ? "Kopieren hat nicht geklappt" : label}
      aria-label={label}
      className={cn(
        "inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-[6px] border px-2.5",
        "font-sans text-[12px] font-medium",
        "transition-colors duration-[var(--dur)] ease-[var(--ease-ref)]",
        kopiert
          ? "border-[var(--status-won)] bg-[color-mix(in_srgb,var(--status-won)_16%,transparent)] text-[var(--status-won)]"
          : fehler
            ? "border-danger-border bg-danger-dim text-danger"
            : "border-blau-rand bg-blau-dim text-blau-hell hover:border-blau-hell hover:bg-[color-mix(in_srgb,var(--blau)_30%,transparent)] hover:text-text-1",
        className,
      )}
    >
      {kopiert ? (
        <Check size={14} aria-hidden="true" />
      ) : (
        <Copy size={14} aria-hidden="true" />
      )}
      <span aria-live="polite">
        {kopiert ? "Kopiert" : fehler ? "Fehler" : "Kopieren"}
      </span>
    </button>
  );
}
