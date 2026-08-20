import { cn } from "@/lib/cn";
import type { SkriptAbschnitt, SkriptBlock } from "@/lib/skript";

/**
 * Rendert die aus dem Google-Dokument gelesene Struktur.
 *
 * Das `dangerouslySetInnerHTML` unten ist bewusst und sicher: der String
 * stammt nicht aus dem Dokument, sondern wird in `lib/skript.ts` Zeichen für
 * Zeichen neu aufgebaut — Text wird escaped, erlaubt sind nur <strong>, <em>,
 * <br> und geprüfte http(s)-Links.
 */
function Block({ block, vorspann }: { block: SkriptBlock; vorspann: boolean }) {
  if (block.art === "trenner") {
    return <hr className="my-7 border-0 border-t border-border-soft" />;
  }

  if (block.art === "untertitel") {
    return (
      <h3 className="mt-7 font-display text-[13px] font-semibold uppercase tracking-[0.07em] text-gold first:mt-0">
        {block.text}
      </h3>
    );
  }

  if (block.art === "bild") {
    // Data-URI aus dem Dokument: next/image kann daran nichts optimieren,
    // geladen wird ohnehin nichts nach.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={block.src}
        alt=""
        className="my-6 w-full rounded-[10px] border border-border-default"
      />
    );
  }

  if (block.art === "liste") {
    return (
      <ul className="mt-4 flex flex-col gap-2">
        {block.punkte.map((punkt, index) => (
          <li key={index} className="flex gap-3 text-[15px] leading-[1.65] text-text-2">
            <span aria-hidden="true" className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full bg-gold" />
            <span dangerouslySetInnerHTML={{ __html: punkt.html }} />
          </li>
        ))}
      </ul>
    );
  }

  /*
   * Ein Absatz kann beides enthalten: den Text, der an den Lead geht, und
   * Regieanweisungen an den Chatter. Das Erste steht abgesetzt im Rahmen —
   * so ist auf einen Blick klar, was in den Chat kopiert wird und was nur
   * dabeisteht. Kopiert wird von Hand, mit Maus und Tastatur.
   */
  const nachricht = !vorspann && block.nachricht;

  return (
    <div
      className={cn(
        "skript-block mt-4 rounded-[10px] border px-4 py-3.5",
        nachricht ? "border-border-default bg-surface-2/40" : "border-transparent px-0 py-1",
      )}
    >
      <div className="skript-text text-[15px] leading-[1.7]">
        {block.zeilen.map((zeile, index) => (
          <p
            key={index}
            className={cn(
              zeile.hinweis
                ? "skript-hinweis text-[13.5px] leading-[1.6] text-text-3"
                : "text-text-2",
            )}
            dangerouslySetInnerHTML={{ __html: zeile.html }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkriptAbschnitte({ abschnitte }: { abschnitte: SkriptAbschnitt[] }) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      {abschnitte.map((abschnitt, index) => (
        <section
          key={abschnitt.id}
          id={abschnitt.id}
          // scroll-mt: die schwebende Navigation darf die Überschrift nicht
          // verdecken, wenn man aus dem Inhaltsverzeichnis herspringt.
          className="scroll-mt-[110px] rounded-[12px] border border-panel-border bg-surface-1 p-5 tbl:p-7"
        >
          <header className="mb-5 flex items-start gap-3.5 border-b border-border-soft pb-5">
            <span
              aria-hidden="true"
              className="mt-[2px] flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border-gold bg-gold-dim font-display text-[12px] font-semibold tnum text-gold-bright"
            >
              {index + 1}
            </span>
            <h2 className="min-w-0 font-display text-[17px] font-medium uppercase tracking-[0.04em] text-text-1 tbl:text-[19px]">
              {abschnitt.titel}
            </h2>
          </header>

          {abschnitt.bloecke.map((block, blockIndex) => (
            <Block key={blockIndex} block={block} vorspann={abschnitt.vorspann} />
          ))}
        </section>
      ))}
    </div>
  );
}
