import { KopierButton } from "./KopierButton";
import type { SkriptAbschnitt, SkriptBlock } from "@/lib/skript";

/**
 * Rendert die aus dem Google-Dokument gelesene Struktur.
 *
 * Das `dangerouslySetInnerHTML` unten ist bewusst und sicher: der String
 * stammt nicht aus dem Dokument, sondern wird in `lib/skript.ts` Zeichen für
 * Zeichen neu aufgebaut — Text wird escaped, erlaubt sind nur <strong>, <em>,
 * <br> und geprüfte http(s)-Links.
 */
function Block({ block }: { block: SkriptBlock }) {
  if (block.art === "trenner") {
    return <hr className="my-7 border-0 border-t border-border-soft" />;
  }

  if (block.art === "untertitel") {
    return (
      <h3 className="mt-7 font-display text-[13px] font-semibold uppercase tracking-[0.07em] text-blau-hell first:mt-0">
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
            <span aria-hidden="true" className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full bg-blau" />
            <span dangerouslySetInnerHTML={{ __html: punkt.html }} />
          </li>
        ))}
      </ul>
    );
  }

  /*
   * Absätze sind das, was der Chatter wirklich braucht: die fertigen
   * Nachrichten. Jeder bekommt darum einen eigenen Kopieren-Knopf statt eines
   * einzigen für die ganze Seite.
   */
  return (
    <div className="skript-block group mt-4 rounded-[10px] border border-transparent px-4 py-3.5 transition-colors duration-[var(--dur)] ease-[var(--ease-ref)] hover:border-border-default hover:bg-surface-2">
      <div className="flex items-start justify-between gap-4">
        <p
          className="skript-text min-w-0 whitespace-pre-line text-[15px] leading-[1.7] text-text-2"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
        <KopierButton
          text={block.text}
          label="Diesen Textbaustein kopieren"
          className="skript-kopieren"
        />
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
              className="mt-[2px] flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blau-rand bg-blau-dim font-display text-[12px] font-semibold tnum text-blau-hell"
            >
              {index + 1}
            </span>
            <h2 className="min-w-0 font-display text-[17px] font-medium uppercase tracking-[0.04em] text-text-1 tbl:text-[19px]">
              {abschnitt.titel}
            </h2>
          </header>

          {abschnitt.bloecke.map((block, blockIndex) => (
            <Block key={blockIndex} block={block} />
          ))}
        </section>
      ))}
    </div>
  );
}
