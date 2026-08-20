// Mintet einen sechsstelligen Login-Code über die Supabase-Admin-API.
// Nötig, solange kein eigener SMTP-Versand eingerichtet ist.
// Start:  node --env-file=.env.local scripts/login-code.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Fehlt in .env.local:", { url: !!url, serviceRoleKey: !!key });
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email: "connor.blim23@gmail.com",
});

if (error) {
  console.error("Fehler:", error.message);
  process.exit(1);
}

console.log("\n  Login-Code:", data.properties.email_otp, "\n");
