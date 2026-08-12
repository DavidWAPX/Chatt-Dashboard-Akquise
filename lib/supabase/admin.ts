import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

/**
 * Service-role client — bypasses RLS.
 *
 * This module is the ONLY place SUPABASE_SERVICE_ROLE_KEY is read, and the
 * `server-only` import makes importing it from a client component a build
 * error rather than a leak. Used exclusively by app/api/admin/**.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY oder NEXT_PUBLIC_SUPABASE_URL fehlt in der Umgebung.",
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
