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

/** Cache tag so "Aktualisieren" can drop the cached sheet on demand. */
export const LEADS_TAG = "leads-sheet";

/** How long a fetched sheet is reused before Next refetches it. */
const REVALIDATE_SECONDS = 300;

/**
 * Free-text columns in the sheet run to 3000 characters. Sending them whole
 * would push an admin's page past 19 MB, and a cell that long is unreadable
 * in a table anyway — so the list carries a preview.
 */
const TEXT_PREVIEW = 200;

/** Rows an admin gets before picking a chatter. */
export const ADMIN_PREVIEW_ROWS = 300;

function shorten(value: string): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > TEXT_PREVIEW ? `${clean.slice(0, TEXT_PREVIEW)}…` : clean;
}

export type LeadsResult =
  | {
      ok: true;
      leads: Lead[];
      fetchedAt: string;
      /** How many rows this profile may see in total. */
      total: number;
      /** True when `leads` is only the newest slice of `total`. */
      capped: boolean;
      /** Every chatter name in the sheet — admin filter options. */
      owners: string[];
    }
  | { ok: false; reason: "unreachable" | "not-shared" };

/** Names are typed by hand in the sheet — compare them forgivingly. */
export function normaliseName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

async function fetchSheet(): Promise<
  { ok: true; leads: Lead[] } | { ok: false; reason: "unreachable" | "not-shared" }
> {
  let csv: string;

  try {
    const response = await fetch(SHEET_URL, {
      redirect: "follow",
      next: { revalidate: REVALIDATE_SECONDS, tags: [LEADS_TAG] },
    });
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
      notizen: shorten(record["Notizen"] ?? ""),
      setting_activity: shorten(record["Setting Activity"] ?? ""),
      closing_activity: shorten(record["Closing Activity"] ?? ""),
      termin_buchungsdatum: record["Termin Buchungsdatum"] ?? "",
    }))
    // Rows carrying neither a name nor an owner hold nothing worth showing.
    .filter((lead) => lead.name.trim() !== "" || lead.lead_von.trim() !== "");

  // Newest rows sit at the bottom of the sheet — show them first.
  leads.reverse();

  return { ok: true, leads };
}

/**
 * The rows this profile may see: an admin sees every row, a chatter only the
 * ones whose "Lead von" matches their own name.
 */
export async function getLeadsForProfile(
  profile: Pick<Profile, "name" | "role">,
  /** Admins only: narrow to one chatter. Ignored for everyone else. */
  chatter?: string,
): Promise<LeadsResult> {
  const result = await fetchSheet();
  if (!result.ok) return result;

  const fetchedAt = new Date().toISOString();
  const isAdmin = profile.role === "admin";

  const owners = isAdmin
    ? [...new Set(result.leads.map((lead) => lead.lead_von.trim()))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "de"))
    : [];

  if (!isAdmin) {
    const own = normaliseName(profile.name);
    // An empty profile name must never match the sheet's empty owner cells.
    const leads =
      own === ""
        ? []
        : result.leads.filter((lead) => normaliseName(lead.lead_von) === own);
    return { ok: true, leads, fetchedAt, total: leads.length, capped: false, owners };
  }

  const wanted = chatter ? normaliseName(chatter) : "";
  const scoped = wanted
    ? result.leads.filter((lead) => normaliseName(lead.lead_von) === wanted)
    : result.leads;

  // Without a chatter chosen, 2600+ rows would be sent for nothing.
  const capped = !wanted && scoped.length > ADMIN_PREVIEW_ROWS;

  return {
    ok: true,
    leads: capped ? scoped.slice(0, ADMIN_PREVIEW_ROWS) : scoped,
    fetchedAt,
    total: scoped.length,
    capped,
    owners,
  };
}
