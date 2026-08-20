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
 *
 * It carries the gold of the app's other controls at rest (see
 * `.btn-icon-action`), because a grey glyph on a black cell does not tell
 * anyone it can be pressed.
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
      className="btn-icon-action"
    >
      <Icon size={15} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
