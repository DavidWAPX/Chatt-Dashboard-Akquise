import { cn } from "@/lib/cn";

type Tone =
  | "won"
  | "lost"
  | "followup"
  | "alert"
  | "open"
  | "termin"
  | "inactive"
  | "neutral";

const TONE_CLASS: Record<Tone, string> = {
  won: "chip-won",
  lost: "chip-lost",
  followup: "chip-followup",
  alert: "chip-alert",
  open: "chip-open",
  termin: "chip-termin",
  inactive: "chip-inactive",
  neutral: "",
};

/**
 * Maps the sheet's free-text status onto a tone.
 *
 * Order matters. "No Show" and "abgesagt" are checked before "Termin",
 * because a cancelled appointment still contains the word Termin and must not
 * come out gold.
 */
function toneFor(status: string): Tone {
  const value = status.trim().toLowerCase();
  if (value === "") return "neutral";

  // Alles mit No Show oder abgesagt — helleres, auffälligeres Grau.
  if (value.includes("no show") || value.includes("noshow")) return "alert";
  if (value.includes("abgesagt")) return "alert";

  // Alles mit Termin — Gold.
  if (value.includes("termin")) return "termin";

  if (value.includes("gewonnen")) return "won";

  // Unqualifiziert und alles Verlorene — dasselbe Rot.
  if (value.includes("unqualifiziert")) return "lost";
  if (value.includes("verloren")) return "lost";
  // "Kauf abgelehnt" ist eine Absage des Kunden — dieselbe Kategorie wie Verloren.
  if (value.includes("abgelehnt")) return "lost";

  // Leads, an denen niemand mehr arbeiten kann: gesperrt oder falsche Daten.
  // Bewusst nicht rot — hier ist kein Deal verloren gegangen, der Kontakt ist
  // nur raus aus der Liste.
  if (value.includes("blacklist")) return "inactive";
  if (value.includes("falsche telefon")) return "inactive";
  if (value === "fake") return "inactive";

  // Alles mit Followup — "FU" steht im Blatt für Followup.
  if (value.includes("follow") || /\bfu\b/.test(value)) return "followup";

  // Offen und in Arbeit: der Lead wartet auf den nächsten Schritt.
  if (value.includes("entscheidung ausstehend")) return "open";
  if (value.includes("erstkontakt")) return "open";
  if (value.includes("cc offen")) return "open";

  // Alles andere bleibt bewusst neutral, statt eine Farbe zu raten.
  return "neutral";
}

export function LeadStatusChip({ status }: { status: string }) {
  const label = status.trim();

  if (label === "") {
    return <span className="text-[13px] text-text-3">—</span>;
  }

  const tone = toneFor(label);

  // Der Text steckt in einem eigenen Span: so kann er im Notfall mit "…"
  // abgeschnitten werden, statt aus der Zelle heraus in die Nachbarspalte zu
  // laufen. `title` hält den vollen Wortlaut beim Draufzeigen bereit.
  if (tone === "neutral") {
    return (
      <span
        title={label}
        className="inline-flex max-w-full items-center rounded-[6px] border border-border-default bg-surface-2 px-3.5 py-1.5 text-[13px] text-text-1"
      >
        <span className="truncate">{label}</span>
      </span>
    );
  }

  return (
    <span className={cn("chip-status", TONE_CLASS[tone])} title={label}>
      <span className="truncate">{label}</span>
    </span>
  );
}
