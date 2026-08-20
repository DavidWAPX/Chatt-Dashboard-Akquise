import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types";

/** True once both public Supabase variables are present. */
export function isConfigured(): boolean {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

/** Server client for RSC and route handlers. Still anon key, still under RLS. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // The middleware refreshes the session, so this is safe to ignore.
          }
        },
      },
    },
  );
}

/**
 * The signed-in user's profile, or null. The basis of every guard.
 *
 * Wrapped in cache(): the layout guard and the page each need the profile, so
 * without this every navigation validated the token and read the profiles row
 * twice over — four network round-trips to Supabase where two will do. React
 * keeps the result for the lifetime of one request.
 */
export const getSessionProfile = cache(async () => {
  // Before setup there is no session to read — treat it as signed out so the
  // guards send the visitor to /login, which explains what is missing.
  if (!isConfigured()) return null;

  const supabase = await createClient();

  /*
   * getClaims() verifies the token's signature locally against the project's
   * public JWKS, which it caches. getUser() asks Supabase over the network on
   * every single call — measured at 242-328ms against this project, on every
   * navigation. Local verification is 1ms once the key set is cached, and it
   * is no weaker: the signature is still checked, just without the round-trip.
   */
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  let userId = claimsData?.claims?.sub ?? null;

  // Older projects sign symmetrically, where local verification is not
  // possible — fall back to the network check rather than locking people out.
  if (claimsError || !userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return profile ?? null;
});
