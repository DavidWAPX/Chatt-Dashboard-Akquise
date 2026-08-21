import "server-only";

import { csvToObjects } from "@/lib/csv";
import type { Lead, Profile } from "@/lib/types";

/**
 * The lead list lives in a Google Sheet and is never written from this app,
 * so it is read straight from there instead of mirrored into a database.
 *
 * The fetch runs on the server only. That matters: filtering happens here,
 * before anything is serialised to the browser, so a chatter's page never
 * contains another chatter's rows — not even in the payload.
 */

const SHEET_URL =
  process.env.LEADS_SHEET_CSV_URL ??
  "https://docs.google.com/spreadsheets/d/1REk7jWQioCl2-lO7ZJmtyKL9zg7CFtsdf4Psd6JCkFw/export?format=csv";

/**
 * The sheet is ~4.5 MB, past the 2 MB ceiling on Next's data cache, so
 * `next: { revalidate }` silently stored nothing and every request
 * re-downloaded the whole file. The parsed rows are cached here instead — a
 * fraction of the size and already in the shape the page needs.
 */
type LeadCache = {
  leads: Lead[];
  at: number;
  /** Läuft gerade eine Auffrischung? Verhindert ein Dutzend paralleler Abrufe. */
  laeuft?: Promise<void>;
} | null;

/*
 * Held on globalThis, not in a module variable: Next can load this module in
 * more than one bundle (the server action and the page render), and separate
 * copies would each get their own cache — so "Aktualisieren" would clear one
 * while the page kept reading the other. One object, one truth.
 */
const store = globalThis as typeof globalThis & { __leadsCache?: LeadCache };

/**
 * Nach einer Minute gilt der Bestand als alt — aber niemand wartet deswegen.
 * Die Seite bekommt sofort den vorhandenen Stand, die Auffrischung läuft
 * nebenher; der nächste Aufruf sieht dann die neuen Zeilen. Vorher blockierte
 * jeder erste Aufruf nach Ablauf der Minute rund 1,4 Sekunden lang.
 */
const TTL_MS = 60 * 1000;

/** Drops the cached sheet so the next read pulls it fresh. */
export function invalidateLeadsCache(): void {
  store.__leadsCache = null;
}

/** Collapses the sheet's ragged line breaks without losing the content. */
function tidy(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export type LeadsResult =
  | { ok: true; leads: Lead[]; fetchedAt: string }
  | { ok: false; reason: "unreachable" | "not-shared" };

/** Names are typed by hand in the sheet — compare them forgivingly. */
export function normaliseName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

type SheetErgebnis =
  | { ok: true; leads: Lead[] }
  | { ok: false; reason: "unreachable" | "not-shared" };

async function fetchSheet(): Promise<SheetErgebnis> {
  const cached = store.__leadsCache;

  if (cached) {
    // Zu alt? Dann im Hintergrund nachladen und trotzdem sofort antworten.
    if (Date.now() - cached.at >= TTL_MS && !cached.laeuft) {
      cached.laeuft = ladeFrisch()
        .then(() => undefined)
        .catch(() => {
          // Ein misslungener Abruf darf den vorhandenen Stand nicht wegwerfen.
        })
        .finally(() => {
          const aktuell = store.__leadsCache;
          if (aktuell) aktuell.laeuft = undefined;
        });
    }
    return { ok: true, leads: cached.leads };
  }

  // Noch nichts da: dieses eine Mal muss gewartet werden.
  return ladeFrisch();
}

async function ladeFrisch(): Promise<SheetErgebnis> {
  let csv: string;

  try {
    // A changing query parameter defeats any caching between here and Google,
    // so a refresh really returns what the sheet says right now.
    const url = new URL(SHEET_URL);
    url.searchParams.set("_", String(Date.now()));

    const response = await fetch(url, { redirect: "follow", cache: "no-store" });
    if (!response.ok) throw new Error(String(response.status));
    csv = await response.text();
  } catch {
    return { ok: false, reason: "unreachable" };
  }

  // Google serves an HTML sign-in page when the sheet is not link-shared.
  if (csv.trimStart().startsWith("<")) {
    return { ok: false, reason: "not-shared" };
  }

  const leads = csvToObjects(csv)
    .map((record, index) => ({
      id: String(index + 1),
      name: record["Name"] ?? "",
      email: record["Email"] ?? "",
      telefon: record["Telefon"] ?? "",
      lead_status: record["Lead Status"] ?? "",
      lead_von: record["Lead von"] ?? "",
      notizen: tidy(record["Notizen"] ?? ""),
      setting_activity: tidy(record["Setting Activity"] ?? ""),
      closing_activity: tidy(record["Closing Activity"] ?? ""),
      termin_buchungsdatum: record["Termin Buchungsdatum"] ?? "",
    }))
    // Rows carrying neither a name nor an owner hold nothing worth showing.
    .filter((lead) => lead.name.trim() !== "" || lead.lead_von.trim() !== "");

  // Newest rows sit at the bottom of the sheet — show them first.
  leads.reverse();

  store.__leadsCache = { leads, at: Date.now() };
  return { ok: true, leads };
}

/**
 * The rows this profile may see: the ones whose "Lead von" matches their own
 * name. Admins are treated exactly like everyone else here — this page is a
 * chatter's own list, not a management view.
 */
export async function getLeadsForProfile(
  profile: Pick<Profile, "name">,
): Promise<LeadsResult> {
  const result = await fetchSheet();
  if (!result.ok) return result;

  const own = normaliseName(profile.name);
  // An empty profile name must never match the sheet's empty owner cells.
  const leads =
    own === ""
      ? []
      : result.leads.filter((lead) => normaliseName(lead.lead_von) === own);

  return { ok: true, leads, fetchedAt: new Date().toISOString() };
}
