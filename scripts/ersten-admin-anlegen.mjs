/*
 * Legt den allerersten Admin an.
 *
 * Warum ein Skript und nicht einfach SQL im Dashboard? Die Regeln auf
 * `profiles` erlauben das Anlegen eines Profils nur einem Admin — und beim
 * frisch aufgesetzten Projekt gibt es noch keinen. Henne und Ei. Der
 * Service-Schlüssel steht über diesen Regeln, genau dafür existiert er.
 *
 * Der Benutzer selbst muss vorher im Dashboard angelegt sein:
 * Authentication → Users → Add user → "Auto Confirm User" anhaken.
 *
 * Start:
 *   node --env-file=.env.local scripts/ersten-admin-anlegen.mjs <email> "<Name>"
 */

const [, , email, name] = process.argv;

if (!email || !name) {
  console.error('Aufruf: node --env-file=.env.local scripts/ersten-admin-anlegen.mjs <email> "<Name>"');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("In .env.local fehlen NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const kopf = { apikey: key, Authorization: `Bearer ${key}` };

const antwort = await fetch(`${url}/auth/v1/admin/users`, { headers: kopf });
if (!antwort.ok) {
  console.error("Die Benutzerliste war nicht abrufbar:", antwort.status, await antwort.text());
  process.exit(1);
}

const { users = [] } = await antwort.json();
const benutzer = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

if (!benutzer) {
  console.error(`Kein Benutzer mit ${email} gefunden.`);
  console.error("Erst im Dashboard anlegen: Authentication → Users → Add user.");
  process.exit(1);
}

/*
 * merge-duplicates: das Skript zweimal laufen zu lassen, darf nichts kaputt
 * machen — beim zweiten Mal wird die vorhandene Zeile aktualisiert.
 */
const gespeichert = await fetch(`${url}/rest/v1/profiles`, {
  method: "POST",
  headers: {
    ...kopf,
    "Content-Type": "application/json",
    Prefer: "return=representation,resolution=merge-duplicates",
  },
  body: JSON.stringify({ id: benutzer.id, email: benutzer.email, name, role: "admin" }),
});

if (!gespeichert.ok) {
  console.error("Das Profil konnte nicht angelegt werden:", gespeichert.status, await gespeichert.text());
  process.exit(1);
}

const [profil] = await gespeichert.json();
console.log(`\n  Admin angelegt: ${profil.name} <${profil.email}>`);
console.log(`  Rolle: ${profil.role}\n`);
console.log("  Hinweis: Der Name muss exakt so in der Spalte \"Lead von\" der");
console.log("  Google-Tabelle stehen, sonst bleibt \"Meine Leads\" leer.\n");
