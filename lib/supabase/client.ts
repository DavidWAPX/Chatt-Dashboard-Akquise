"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types";

/** Browser client. Sees only the anon key — every read is bounded by RLS. */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
}
