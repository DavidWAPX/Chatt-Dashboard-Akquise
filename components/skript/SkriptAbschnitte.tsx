import { cn } from "@/lib/cn";
import type { SkriptAbschnitt, SkriptBlock, SkriptZeile } from "@/lib/skript";

/**
 * Rendert die aus dem Google-Dokument gelesene Struktur.
 *
 * Das `dangerouslySetInnerHTML` unten ist bewusst und sicher: der String
 * stammt nicht aus dem Dokument, sondern wird in `lib/skript.ts` Zeichen für
 * Zeichen neu aufgebaut — Text wird escaped, erlaubt sind nur <strong>, <em>,
 * <br> und geprüfte http(s)-Links.
 */

/** Text, der so in den Chat geht: abgesetzt im eigenen Feld. */
function Feld({ children }: { children: React.ReactNode }) {
  return (
    <div className="skript-text mt-3 rounded-[10px] border border-border-default bg-surface-2/40 px-4 py-3.5 text-[15px] leading-[1.7] text-text-2">
      {children}
    </div>
  );
}

/** Regieanweisung an den Chatter: ohne Rahmen, eine Stufe zurückgenommen. */
function Notiz({ zeilen }: { zeilen: SkriptZeile[] }) {
  return (
    <div className="skript-text mt-3">
      {zeilen.map((zeile, index) => (
        <p
          key={index}
          className="skript-hinweis text-[13.5px] leading-[1.6] text-text-3"
          dangerouslySetInnerHTML={{ __html: zeile.html }}
        />
      ))}
    </div>
  );
}

/**
 * Teilt die Zeilen eines Absatzes in aufeinanderfolgende Blöcke gleicher Art.
 * Dadurch steht eine Anweisung über oder unter dem Feld — je nachdem, wo sie
 * im Dokument steht — aber nie mitten darin.
 */
function inGruppen(
  zeilen: SkriptZeile[],
): Array<{ hinweis: boolean; zeilen: SkriptZeile[] }> {
  const gruppen: Array<{ hinweis: boolean; zeilen: SkriptZeile[] }> = [];

  for (const zeile of zeilen) {
    const letzte = gruppen[gruppen.length - 1];
    if (letzte && letzte.hinweis === zeile.hinweis) letzte.zeilen.push(zeile);
    else gruppen.push({ hinweis: zeile.hinweis, zeilen: [zeile] });
  }

  return gruppen;
}

function Block({ block, vorspann }: { block: SkriptBlock; vorspann: boolean }) {
  if (block.art === "trenner") {
    return <hr className="my-7 border-0 border-t border-border-soft" />;
  }

  if (block.art === "untertitel") {
    return (
      <h3 className="skript-untertitel mt-7 font-display text-[13px] font-semibold uppercase tracking-[0.07em] text-gold first:mt-0">
        {block.text}
      </h3>
    );
  }

  if (block.art === "bild") {
    /*
     * Das Dokument bringt Kopf- und Fußgrafik auf schwarzem Grund mit. Ohne
     * Rahmen und mit weich auslaufenden Kanten geht sie in die Seite über,
     * statt wie ein eingeklebter Fremdkörper darauf zu liegen.
     */
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={block.src} alt="" className="skript-bild w-full" />
    );
  }

  if (block.art === "liste") {
    return (
      <div className="mt-1">
        {block.punkte.map((punkt, index) =>
          punkt.nachricht && !vorspann ? (
            // Jede fertige Nachricht bekommt ihr eigenes Feld — so markiert
            // man immer genau eine, nie versehentlich die ganze Liste.
            <Feld key={index}>
              <span dangerouslySetInnerHTML={{ __html: punkt.html }} />
            </Feld>
          ) : (
            <p
              key={index}
              className="skript-text mt-2 flex gap-3 text-[15px] leading-[1.7] text-text-2"
            >
              <span
                aria-hidden="true"
                className="mt-[10px] h-[5px] w-[5px] shrink-0 rounded-full bg-gold"
              />
              <span dangerouslySetInnerHTML={{ __html: punkt.html }} />
            </p>
          ),
        )}
      </div>
    );
  }

  /*
   * Im Vorspann steht Rahmeninformation, kein Chattext: dort bleibt alles
   * gleichförmiger Fließtext mit gleichen Abständen, ohne Felder.
   */
  if (vorspann || !block.nachricht) {
    return (
      <div className="skript-text mt-3 text-[15px] leading-[1.7]">
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
    );
  }

  return (
    <>
      {inGruppen(block.zeilen).map((gruppe, index) =>
        gruppe.hinweis ? (
          <Notiz key={index} zeilen={gruppe.zeilen} />
        ) : (
          <Feld key={index}>
            {gruppe.zeilen.map((zeile, zeilenIndex) => (
              <p key={zeilenIndex} dangerouslySetInnerHTML={{ __html: zeile.html }} />
            ))}
          </Feld>
        ),
      )}
    </>
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
          className="scroll-mt-[150px] rounded-[12px] border border-panel-border bg-surface-1 p-5 tbl:p-7"
        >
          {/* Zahl über dem Titel, beides mittig: der Kapitelkopf soll eine
              Zäsur setzen, nicht als Zeile mitlaufen. */}
          <header className="mb-6 flex flex-col items-center gap-3 border-b border-border-soft pb-6 text-center">
            <span aria-hidden="true" className="skript-nummer shrink-0">
              {index + 1}
            </span>
            <h2 className="skript-kapitel min-w-0 font-display text-[19px] font-semibold uppercase tracking-[0.05em] tbl:text-[22px]">
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
