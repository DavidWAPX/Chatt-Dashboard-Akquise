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
      notizen: tidy(record["Notizen"] ?? ""),
      setting_activity: tidy(record["Setting Activity"] ?? ""),
      closing_activity: tidy(record["Closing Activity"] ?? ""),
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
