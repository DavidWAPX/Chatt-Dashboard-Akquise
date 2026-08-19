"use server";

import { revalidateTag } from "next/cache";
import { getSessionProfile } from "@/lib/supabase/server";
import { LEADS_TAG } from "@/lib/leads";

/** Drops the cached sheet so the next render pulls it fresh. */
export async function refreshLeads(): Promise<void> {
  // Only signed-in users may force a refetch of the sheet.
  const profile = await getSessionProfile();
  if (!profile) return;

  revalidateTag(LEADS_TAG);
}
