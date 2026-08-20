import "server-only";

import { parse, type HTMLElement, type Node } from "node-html-parser";

/**
 * Das Chatting-Skript liegt in einem Google-Dokument und wird dort gepflegt.
 * Diese Datei holt es live, zerlegt es und gibt eine eigene, aufgeräumte
 * Struktur zurück — die Seite rendert also nie Googles HTML, sondern nur noch
 * Text, den sie selbst wieder zusammensetzt.
 *
 * Warum nicht einfach Googles HTML einbetten? Es bringt sein komplettes
 * Stylesheet mit (schwarze Schrift auf weißem Grund, Arial, feste Ränder),
 * das mitten in dieser Oberfläche wie ein Fremdkörper läge. Und fremdes HTML
 * ungeprüft in die Seite zu schreiben, wäre eine offene Tür für alles, was
 * jemals in dieses Dokument geraten könnte.
 */

const DOC_ID = "1Ekpy9nxiWNaYF68uVBVkszKZcANvG6WXDDmfotod_uM";

const DOC_URL =
  process.env.SKRIPT_DOC_HTML_URL ??
  `https://docs.google.com/document/d/${DOC_ID}/export?format=html`;

/** Der Link, unter dem das Dokument bearbeitet wird. */
export const SKRIPT_DOC_EDIT_URL = `https://docs.google.com/document/d/${DOC_ID}/edit`;

export type SkriptBlock =
  | { art: "untertitel"; text: string }
  | {
      art: "absatz";
      zeilen: SkriptZeile[];
      /** Enthält mindestens eine Zeile, die so in den Chat geht. */
      nachricht: boolean;
    }
  | { art: "liste"; punkte: Array<{ html: string; text: string }> }
  | { art: "trenner" }
  | { art: "bild"; src: string };

export interface SkriptZeile {
  html: string;
  text: string;
  /**
   * Regieanweisung an den Chatter statt Text für den Lead — wird nicht
   * mitkopiert und tritt in der Darstellung zurück.
   */
  hinweis: boolean;
}

export interface SkriptAbschnitt {
  /** Anker für das Inhaltsverzeichnis. */
  id: string;
  titel: string;
  bloecke: SkriptBlock[];
  /**
   * Alles vor dem ersten Kapitel: Titelbild, Kriterien, Rahmenbedingungen.
   * Dort steht nichts, was jemals in einen Chat kopiert wird.
   */
  vorspann: boolean;
}

export type SkriptErgebnis =
  | { ok: true; titel: string; abschnitte: SkriptAbschnitt[]; geholtAm: string }
  | { ok: false; grund: "nicht-erreichbar" | "nicht-freigegeben" };

/* Wie bei der Lead-Tabelle: ein kleiner eigener Zwischenspeicher, damit nicht
   jeder Seitenaufruf 300 KB bei Google abholt, eine Änderung am Dokument aber
   trotzdem innerhalb einer Minute sichtbar wird. */
type Cache = { wert: SkriptErgebnis; um: number } | null;
const store = globalThis as typeof globalThis & { __skriptCache?: Cache };
const TTL_MS = 60 * 1000;

export function invalidateSkriptCache(): void {
  store.__skriptCache = null;
}

/* ---------------------------------------------------------------- Stil --- */

interface Stil {
  fett: boolean;
  kursiv: boolean;
  /** Schriftgröße in pt, soweit das Dokument eine angibt. */
  groesse: number | null;
}

/** Liest Googles Klassen-Stylesheet aus, damit "fett" erkennbar wird. */
function leseKlassen(dokument: HTMLElement): Map<string, Stil> {
  const karte = new Map<string, Stil>();
  const css = dokument.querySelectorAll("style").map((s) => s.text).join("\n");

  for (const treffer of css.matchAll(/\.([\w-]+)\{([^}]*)\}/g)) {
    const name = treffer[1];
    const regeln = treffer[2];
    if (!name || !regeln) continue;

    const gewicht = /font-weight:\s*(\d+|bold)/.exec(regeln)?.[1];
    const groesse = /font-size:\s*([\d.]+)pt/.exec(regeln)?.[1];

    karte.set(name, {
      fett: gewicht === "bold" || Number(gewicht) >= 600,
      kursiv: /font-style:\s*italic/.test(regeln),
      groesse: groesse ? Number(groesse) : null,
    });
  }

  return karte;
}

/** Vereinigt die Stile aller Klassen eines Elements mit dem geerbten Stil. */
function stilFuer(element: HTMLElement, klassen: Map<string, Stil>, geerbt: Stil): Stil {
  let stil = { ...geerbt };
  for (const name of element.getAttribute("class")?.split(/\s+/) ?? []) {
    const gefunden = klassen.get(name);
    if (!gefunden) continue;
    stil = {
      fett: stil.fett || gefunden.fett,
      kursiv: stil.kursiv || gefunden.kursiv,
      groesse: gefunden.groesse ?? stil.groesse,
    };
  }
  return stil;
}

/* ------------------------------------------------------------- Inhalte --- */

function escape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Google verpackt jeden Link in eine Weiterleitung
 * (google.com/url?q=ZIEL&sa=…). Hier wird das Ziel wieder ausgepackt.
 */
function echterLink(href: string): string | null {
  try {
    const url = new URL(href, "https://docs.google.com");
    const ziel = url.hostname.endsWith("google.com") && url.pathname === "/url"
      ? url.searchParams.get("q")
      : href;
    if (!ziel) return null;
    const geprueft = new URL(ziel);
    // Nur http(s) — kein javascript:, kein data:.
    return geprueft.protocol === "http:" || geprueft.protocol === "https:"
      ? geprueft.toString()
      : null;
  } catch {
    return null;
  }
}

interface RohZeile {
  html: string;
  text: string;
  /** Wahr, solange jedes Stück dieser Zeile kursiv gesetzt ist. */
  nurKursiv: boolean;
  /** Wahr, sobald die Zeile etwas anderes als Leerraum enthält. */
  gefuellt: boolean;
}

function neueZeile(): RohZeile {
  return { html: "", text: "", nurKursiv: true, gefuellt: false };
}

/**
 * Baut aus Googles Auszeichnung eigenes, sicheres Inline-HTML — und zerlegt
 * dabei gleich an den Zeilenumbrüchen.
 *
 * Warum nicht hinterher am <br> trennen? Weil eine kursive Passage über einen
 * Umbruch hinweg laufen kann. Ein nachträglicher Schnitt zerschneidet dann das
 * <em>-Tag, die erste Zeile bleibt ohne Abschluss und gilt nicht mehr als
 * kursiv — womit die Erkennung von Regieanweisungen ins Leere liefe.
 */
function inline(knoten: Node[], klassen: Map<string, Stil>, geerbt: Stil): RohZeile[] {
  const zeilen: RohZeile[] = [neueZeile()];

  /** Hängt fertige Teilzeilen an: die erste an die laufende, der Rest neu. */
  function anfuegen(teile: RohZeile[]) {
    for (const [index, teil] of teile.entries()) {
      if (index > 0) {
        zeilen.push(neueZeile());
      }
      const aktuell = zeilen[zeilen.length - 1];
      if (!aktuell) continue;
      aktuell.html += teil.html;
      aktuell.text += teil.text;
      if (teil.gefuellt) {
        aktuell.nurKursiv = aktuell.gefuellt ? aktuell.nurKursiv && teil.nurKursiv : teil.nurKursiv;
        aktuell.gefuellt = true;
      }
    }
  }

  for (const kind of knoten) {
    // Textknoten. `.text` löst die HTML-Entities auf, mit denen Google alles
    // jenseits von ASCII schreibt — ohne das stünde "M&auml;dchen" wörtlich auf
    // der Seite, und die Kapitelmarker ①…⑧ wären gar nicht auffindbar.
    if (kind.nodeType === 3) {
      const roh = kind.text.replace(/\u00a0/g, " ");
      anfuegen([
        {
          html: escape(roh),
          text: roh,
          nurKursiv: geerbt.kursiv,
          gefuellt: roh.trim() !== "",
        },
      ]);
      continue;
    }

    if (kind.nodeType !== 1) continue;
    const element = kind as HTMLElement;
    const tag = element.rawTagName?.toLowerCase();

    if (tag === "br") {
      zeilen.push(neueZeile());
      continue;
    }

    if (tag === "a") {
      const ziel = echterLink(element.getAttribute("href") ?? "");
      const innen = inline(element.childNodes, klassen, geerbt);
      anfuegen(
        innen.map((zeile) => ({
          ...zeile,
          html: ziel
            ? `<a href="${escape(ziel)}" target="_blank" rel="noopener noreferrer">${zeile.html}</a>`
            : zeile.html,
        })),
      );
      continue;
    }

    const stil = stilFuer(element, klassen, geerbt);
    const innen = inline(element.childNodes, klassen, stil);
    anfuegen(
      innen.map((zeile) => {
        let html = zeile.html;
        // Die Auszeichnung wird je Zeile gesetzt, nicht über den Umbruch hinweg.
        if (stil.kursiv && !geerbt.kursiv && zeile.gefuellt) html = `<em>${html}</em>`;
        if (stil.fett && !geerbt.fett && zeile.gefuellt) html = `<strong>${html}</strong>`;
        return { ...zeile, html };
      }),
    );
  }

  return zeilen;
}

/** Fasst die Zeilen eines Absatzes wieder zu einem Stück zusammen. */
function alsStueck(zeilen: RohZeile[]): { html: string; text: string } {
  const gefuellt = zeilen.filter((zeile) => zeile.gefuellt);
  return {
    html: gefuellt.map((zeile) => zeile.html.trim()).join("<br />"),
    text: gefuellt.map((zeile) => zeile.text.trim()).join("\n"),
  };
}

const LEERER_STIL: Stil = { fett: false, kursiv: false, groesse: null };

/**
 * Wörter, mit denen das Dokument eine Regieanweisung eröffnet. Sie stehen
 * immer am Zeilenanfang und immer vor einem Doppelpunkt.
 */
const HINWEIS_WORT =
  /^(ziel|tipp|wichtig|achtung|hinweis|info|beachte|merke|anmerkung|nur bei|falls antwort)\b/i;

/**
 * Trennt Text für den Lead von Text für den Chatter.
 *
 * Das Dokument macht den Unterschied selbst, nur eben typografisch: eine
 * Anweisung beginnt mit einem Pfeil, steht in Klammern, ist kursiv gesetzt
 * oder fängt mit "Ziel:" / "Tipp:" / "Wichtig:" an. Genau daran hängt diese
 * Erkennung — nichts wird geraten, und wer im Dokument einen Hinweis anders
 * schreibt, bekommt ihn im Zweifel als Nachricht angezeigt statt umgekehrt.
 */
function istHinweis(zeile: RohZeile): boolean {
  const text = zeile.text.trim();
  if (text === "") return false;

  // Pfeil am Anfang: die Schreibweise des Dokuments für "mach dann dies".
  if (/^[\u2192\u2794\u27A1]/u.test(text)) return true;

  // Vollständig eingeklammert — im Dokument durchgehend Randbemerkungen.
  if (/^\([\s\S]*\)$/.test(text)) return true;

  // Mehrere Pfeile in einer Zeile beschreiben einen Ablauf ("Erstnachricht →
  // Bedarf → Beruf"). Eine Nachricht an den Lead sieht nie so aus.
  if ((text.match(/[\u2192\u2794\u27A1]/gu) ?? []).length >= 2) return true;

  /*
   * Kursiv allein reicht nicht: im Dokument liegt manche kursive Passage über
   * der Anweisung UND der Nachricht darunter. Erst der Doppelpunkt am Ende
   * macht daraus zuverlässig eine Ansage — "Bei „Ja“ kritisch nachfassen:"
   * kündigt an, was danach kommt, statt selbst verschickt zu werden.
   */
  if (zeile.nurKursiv && /:\s*$/.test(text)) return true;

  return HINWEIS_WORT.test(text);
}

/** Macht aus den Rohzeilen die Zeilen, die die Seite anzeigt. */
function inZeilen(roh: RohZeile[]): SkriptZeile[] {
  return roh
    .filter((zeile) => zeile.gefuellt)
    .map((zeile) => ({
      html: zeile.html.trim(),
      text: zeile.text.trim(),
      hinweis: istHinweis(zeile),
    }));
}

/**
 * Kapitel tragen im Dokument einen Marker: ①…⑳, ⊙ oder einen Pfeil. Der muss
 * am Zeilenanfang stehen — sonst würde ein Satz wie "Bei einem klaren Ja →
 * langsam in den Pitch übergehen" mitten im Text ein neues Kapitel aufmachen.
 * Die vier Zeichen Vorlauf sind für ein vorangestelltes Emoji ("🌟 ⑧ 🌟").
 */
function istKapitel(titel: string): boolean {
  if (/[\u2460-\u2473\u2299\u25CE]/u.test(titel.slice(0, 4))) return true;
  return titel.startsWith("\u2192") && titel.length <= 30;
}

/**
 * "🌟 ⑧ 🌟 Termin setzen" → "Termin setzen". Die Nummer steht auf der Seite
 * schon im Kreis vor der Überschrift; sie ein zweites Mal im Titel zu führen,
 * sieht nach Versehen aus.
 */
function ohneMarker(titel: string): string {
  return titel.replace(/^[\s\u2460-\u2473\u2299\u25CE\u2192\u{1F300}-\u{1FAFF}]+/u, "").trim() || titel;
}

/** Aus "①Erstnachricht" wird "erstnachricht" — brauchbar als Anker. */
function ankerFuer(titel: string, index: number): string {
  const anker = titel
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return anker === "" ? `abschnitt-${index + 1}` : anker;
}

async function holeDokument(): Promise<SkriptErgebnis> {
  const zwischenstand = store.__skriptCache;
  if (zwischenstand && Date.now() - zwischenstand.um < TTL_MS) {
    return zwischenstand.wert;
  }

  let roh: string;
  try {
    const url = new URL(DOC_URL);
    // Wechselnder Parameter: so liefert der Abruf wirklich den aktuellen Stand.
    url.searchParams.set("_", String(Date.now()));
    const antwort = await fetch(url, { redirect: "follow", cache: "no-store" });
    if (!antwort.ok) throw new Error(String(antwort.status));
    roh = await antwort.text();
  } catch {
    return { ok: false, grund: "nicht-erreichbar" };
  }

  // Ist das Dokument nicht freigegeben, liefert Google eine Anmeldeseite.
  if (/<title>[^<]*(Anmeldung|Sign in)[^<]*<\/title>/i.test(roh)) {
    return { ok: false, grund: "nicht-freigegeben" };
  }

  const dokument = parse(roh);
  const klassen = leseKlassen(dokument);
  const body = dokument.querySelector("body");
  if (!body) return { ok: false, grund: "nicht-erreichbar" };

  const abschnitte: SkriptAbschnitt[] = [];
  let aktuell: SkriptAbschnitt | null = null;
  let dokumentTitel = "Chatting Skript";
  let ersteUeberschrift = true;

  function neuerAbschnitt(titel: string, vorspann = false) {
    aktuell = {
      id: ankerFuer(titel, abschnitte.length),
      titel,
      bloecke: [],
      vorspann,
    };
    abschnitte.push(aktuell);
  }

  function schreibe(block: SkriptBlock) {
    if (!aktuell) neuerAbschnitt("Überblick", true);
    aktuell?.bloecke.push(block);
  }

  for (const kind of body.childNodes) {
    if (kind.nodeType !== 1) continue;
    const element = kind as HTMLElement;
    const tag = element.rawTagName?.toLowerCase();

    if (tag === "hr") {
      schreibe({ art: "trenner" });
      continue;
    }

    if (tag === "ul" || tag === "ol") {
      const punkte = element
        .querySelectorAll("li")
        .map((li) => alsStueck(inline(li.childNodes, klassen, LEERER_STIL)))
        .filter((punkt) => punkt.text.trim() !== "");
      if (punkte.length > 0) schreibe({ art: "liste", punkte });
      continue;
    }

    if (tag !== "p") continue;

    const bild = element.querySelector("img")?.getAttribute("src");
    if (bild?.startsWith("data:image/")) {
      schreibe({ art: "bild", src: bild });
      continue;
    }

    const eigenerStil = stilFuer(element, klassen, LEERER_STIL);
    const rohZeilen = inline(element.childNodes, klassen, eigenerStil);
    const inhalt = alsStueck(rohZeilen);
    const text = inhalt.text;
    if (text === "") continue;

    /*
     * Google exportiert keine echten <h2>. Eine Überschrift erkennt man daran,
     * dass die ganze Zeile fett gesetzt und kurz ist — Fließtext ist auch mal
     * fett, läuft dann aber über mehrere Zeilen.
     */
    const komplettFett = /^<strong>[\s\S]*<\/strong>$/.test(inhalt.html.trim());
    const gross = (eigenerStil.groesse ?? 12) > 13;
    const istUeberschrift = (komplettFett || gross) && text.length <= 90;

    if (istUeberschrift) {
      // Zeilenumbrüche innerhalb einer Überschrift ("①\nErstnachricht")
      // gehören zum Satzbild des Dokuments, nicht zur Bedeutung.
      const titel = text.replace(/\s+/g, " ").trim();

      if (ersteUeberschrift) {
        dokumentTitel = titel;
        ersteUeberschrift = false;
        continue;
      }

      // Die Kapitel des Skripts tragen im Dokument einen Kreis-Marker (①…⑧, ⊙).
      // Alles andere Fettgedruckte ist eine Zwischenüberschrift innerhalb eines
      // Kapitels und darf das Inhaltsverzeichnis nicht aufblähen.
      if (istKapitel(titel)) neuerAbschnitt(ohneMarker(titel));
      else schreibe({ art: "untertitel", text: titel });
      continue;
    }

    const zeilen = inZeilen(rohZeilen);
    if (zeilen.length === 0) continue;

    schreibe({
      art: "absatz",
      zeilen,
      nachricht: zeilen.some((zeile) => !zeile.hinweis),
    });
  }

  const ergebnis: SkriptErgebnis = {
    ok: true,
    titel: dokumentTitel,
    abschnitte: abschnitte.filter((a) => a.bloecke.length > 0),
    geholtAm: new Date().toISOString(),
  };

  store.__skriptCache = { wert: ergebnis, um: Date.now() };
  return ergebnis;
}

export function getSkript(): Promise<SkriptErgebnis> {
  return holeDokument();
}
