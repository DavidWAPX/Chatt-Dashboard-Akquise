"use client";

import { Info } from "lucide-react";

interface InfoButtonProps {
  /** The full text this button reveals. Empty means nothing to show. */
  text: string;
  onOpen: () => void;
}

/**
 * Long free-text columns collapse into this button. The sheet's notes run to
 * 3000 characters — in a table cell they crush every other column, so the
 * cell holds a control and the text lives in a dialog.
 */
export function InfoButton({ text, onOpen }: InfoButtonProps) {
  if (text.trim() === "") {
    return <span className="text-[13px] text-text-3">—</span>;
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex items-center gap-1.5 rounded-[4px] border border-border-default bg-surface-1 px-2.5 py-1.5 text-[12px] text-text-2 hover:border-border-gold hover:bg-surface-2 hover:text-text-1"
    >
      <Info size={13} aria-hidden="true" />
      Info
    </button>
  );
}
