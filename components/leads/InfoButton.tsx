"use client";

import type { LucideIcon } from "lucide-react";

interface InfoButtonProps {
  /** The full text this button reveals. Empty means nothing to show. */
  text: string;
  /** Full column name, e.g. "Setting Aktivität" — used for tooltip and screen reader. */
  label: string;
  icon: LucideIcon;
  onOpen: () => void;
}

/**
 * Long free-text columns collapse into this button. The sheet's notes run to
 * 3000 characters — in a table cell they crush every other column, so the
 * cell holds a control and the text lives in a dialog.
 *
 * The control is an icon, not the word "Klick": three text buttons per row
 * cost 59px of column each, which the table does not have (see the column
 * widths in LeadListe), and three identical words read as noise. The column
 * head names the field, the tooltip repeats it in full.
 */
export function InfoButton({ text, label, icon: Icon, onOpen }: InfoButtonProps) {
  if (text.trim() === "") {
    return (
      <span className="text-[13px] text-text-3" title={`${label}: kein Eintrag`}>
        —
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      title={`${label} öffnen`}
      aria-label={`${label} öffnen`}
      className="inline-flex size-[32px] items-center justify-center rounded-[6px] border border-border-default bg-surface-2 text-text-2 transition-colors duration-[var(--dur)] ease-[var(--ease-ref)] hover:border-border-gold hover:text-gold-bright focus-visible:border-gold focus-visible:shadow-[0_0_0_3px_var(--focus-ring)] focus-visible:outline-none"
    >
      <Icon size={15} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
