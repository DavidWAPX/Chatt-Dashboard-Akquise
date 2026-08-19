import { cn } from "@/lib/cn";

/**
 * The sheet uses 25 free-text statuses. Rather than invent a colour per value,
 * they collapse into four readings: won, lost, appointment booked, in progress.
 * Anything unknown falls through to neutral instead of guessing.
 */
type Tone = "won" | "lost" | "termin" | "offen" | "neutral";

const TONES: Record<Tone, string> = {
  won: "border-gold bg-gold-dim text-gold-bright",
  lost: "border-danger-border bg-danger-dim text-danger",
  termin: "border-border-gold bg-surface-3 text-gold",
  offen: "border-chip-border bg-surface-2 text-text-1",
  neutral: "border-chip-border bg-surface-2 text-text-2",
};

function toneFor(status: string): Tone {
  const value = status.trim().toLowerCase();
  if (value === "") return "neutral";

  if (value === "gewonnen") return "won";
  if (
    value === "verloren" ||
    value === "qualifiziert-verloren" ||
    value === "kauf abgelehnt" ||
    value === "unqualifiziert" ||
    value === "blacklist" ||
    value === "fake" ||
    value === "falsche telefonnummer"
  ) {
    return "lost";
  }
  if (value.includes("termin") && !value.includes("no show")) return "termin";
  if (
    value.includes("follow") ||
    value.includes("ausstehend") ||
    value.includes("offen") ||
    value.includes("erstkontakt")
  ) {
    return "offen";
  }
  return "neutral";
}

export function LeadStatusChip({ status }: { status: string }) {
  const label = status.trim();

  if (label === "") {
    return <span className="text-[13px] text-text-3">—</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-[4px] border px-2.5 py-1 text-[12px]",
        TONES[toneFor(label)],
      )}
    >
      {label}
    </span>
  );
}
