import { redirect } from "next/navigation";
import { ExternalLink, RefreshCw } from "lucide-react";
import { getSessionProfile } from "@/lib/supabase/server";
import { getSkript, SKRIPT_DOC_EDIT_URL } from "@/lib/skript";
import { SkriptAbschnitte } from "@/components/skript/SkriptAbschnitte";
import { EmptyState } from "@/components/ui/EmptyState";

/* Die Seite wird bei jedem Aufruf serverseitig gerendert; der Abruf beim
   Dokument selbst ist eine Minute lang zwischengespeichert (lib/skript.ts).
   Eine Änderung im Google-Dokument steht damit spätestens nach einer Minute
   auch hier. */
export const dynamic = "force-dynamic";

export default async function SkriptPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  const skript = await getSkript();

  if (!skript.ok) {
    return (
      <section className="rounded-[12px] border border-panel-border bg-surface-1 p-5 tbl:p-8">
        <p className="font-display text-[11px] font-medium uppercase tracking-[0.09em] text-gold">
          Chatting Skript
        </p>
        <h1 className="mt-1 font-display text-[19px] font-medium uppercase tracking-[0.05em] text-text-1 tbl:text-[21px]">
          Skript gerade nicht erreichbar
        </h1>
        <p className="mt-4 max-w-[62ch] text-[14px] text-text-2">
          {skript.grund === "nicht-freigegeben"
            ? "Das Google-Dokument ist nicht freigegeben. Stell es auf „Jeder mit dem Link – Betrachter“, dann erscheint das Skript hier automatisch."
            : "Das Google-Dokument war nicht erreichbar. Lade die Seite in einem Moment noch einmal."}
        </p>
        <a
          href={SKRIPT_DOC_EDIT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 text-[14px] text-gold hover:text-gold-bright"
        >
          Dokument in Google Docs öffnen
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      </section>
    );
  }

  const stand = new Date(skript.geholtAm).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <section className="rounded-[12px] border border-panel-border bg-surface-1 p-5 tbl:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-display text-[11px] font-medium uppercase tracking-[0.09em] text-gold">
              Chatting Skript
            </p>
            <h1 className="mt-1 font-display text-[19px] font-medium uppercase tracking-[0.05em] text-text-1 tbl:text-[21px] break-anywhere">
              {skript.titel}
            </h1>
            <p className="mt-3 max-w-[68ch] text-[14px] text-text-2">
              Die abgesetzten Blöcke sind die Nachrichten für den Chat, alles
              Graue drumherum sind Hinweise für dich.
            </p>
          </div>

          <a
            href={SKRIPT_DOC_EDIT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-[44px] shrink-0 items-center gap-2 rounded-[6px] border border-btn-neutral-border bg-surface-1 px-4 text-[14px] text-text-1 transition-colors duration-[var(--dur)] ease-[var(--ease-ref)] hover:border-gold hover:text-gold-bright"
          >
            Im Google-Dokument bearbeiten
            <ExternalLink size={15} aria-hidden="true" />
          </a>
        </div>

        <p className="mt-5 flex flex-wrap items-center gap-2 border-t border-border-soft pt-4 text-[13px] text-text-3">
          <RefreshCw size={13} aria-hidden="true" className="shrink-0" />
          Direkt aus dem Google-Dokument geladen — Änderungen dort erscheinen
          hier innerhalb einer Minute. Stand {stand} Uhr.
        </p>
      </section>

      {skript.abschnitte.length === 0 ? (
        <EmptyState>
          Im Dokument steht noch kein Text, den wir anzeigen könnten.
        </EmptyState>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-8">
          {/* Inhaltsverzeichnis: bleibt beim Scrollen stehen, damit man im
              langen Skript nie die Orientierung verliert. */}
          <nav
            aria-label="Abschnitte des Skripts"
            className="hidden lg:sticky lg:top-[110px] lg:block rounded-[12px] border border-panel-border bg-surface-1 p-4"
          >
            <p className="mb-3 px-2 font-display text-[11px] font-medium uppercase tracking-[0.09em] text-gold">
              Inhalt
            </p>
            <ol className="flex flex-col gap-0.5">
              {skript.abschnitte.map((abschnitt, index) => (
                <li key={abschnitt.id}>
                  <a
                    href={`#${abschnitt.id}`}
                    className="flex items-start gap-2.5 rounded-[6px] px-2 py-1.5 text-[13px] leading-[1.4] text-text-2 transition-colors duration-[var(--dur)] ease-[var(--ease-ref)] hover:bg-surface-2 hover:text-text-1"
                  >
                    <span className="mt-[1px] shrink-0 font-display text-[11px] tnum text-text-3">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">{abschnitt.titel}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <SkriptAbschnitte abschnitte={skript.abschnitte} />
        </div>
      )}
    </>
  );
}
