import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie on every request so server components
 * always see a valid session. Access control itself lives in the layouts.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without configuration there is no session to refresh — let the page render
  // and show its own setup hint rather than failing the whole request.
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  /*
   * The middleware exists to refresh an expiring session cookie. Calling
   * getUser() unconditionally cost a network round-trip on every request,
   * refresh needed or not. getSession() reads the cookie locally, so the
   * expiry can be checked for free and the round-trip only happens when a
   * refresh is actually due.
   *
   * This is not where authorisation happens — getSessionProfile verifies the
   * token's signature before any guard trusts it.
   */
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const expiresInMs = (session?.expires_at ?? 0) * 1000 - Date.now();
  const REFRESH_WINDOW_MS = 10 * 60 * 1000;

  if (!session || expiresInMs < REFRESH_WINDOW_MS) {
    await supabase.auth.getUser();
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
