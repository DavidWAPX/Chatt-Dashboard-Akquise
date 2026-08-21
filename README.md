# Remote Chatter Dashboard

Internes Tracking-Werkzeug für Remote Chatter: Kennzahlen der Kaltakquise auf TikTok,
Instagram und Facebook erfassen und über Tag / Woche / Monat / Jahr auswerten.
Dazu das Chatting-Skript (live aus einem Google-Dokument) und der Weg zur
Terminbuchung.

Next.js 15 (App Router) · TypeScript strict · Tailwind CSS · Supabase (Auth + Postgres + RLS) ·
recharts · lucide-react · date-fns

---

## Setup in drei Schritten

```bash
cp .env.example .env.local   # Supabase-URL und Keys eintragen
npm install
npm run dev
```

### 1 — Supabase-Projekt anlegen

Unter [supabase.com](https://supabase.com) ein Projekt erstellen. Die drei Werte für
`.env.local` stehen in *Project Settings → API*:

| Variable | Fundort |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` / `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key — **niemals** ins Frontend |

### 2 — Migration einspielen

Den Inhalt von `supabase/migrations/0001_init.sql` im *SQL Editor* des Supabase-Dashboards
ausführen. Legt genau die Tabellen an, die die App benutzt (`profiles`, `entries`), dazu
die RLS-Policies und den `updated_at`-Trigger.

Alternativ mit der Supabase CLI:

```bash
supabase link --project-ref <dein-project-ref>
supabase db push
```

### 3 — Code-Login einrichten ⚠️

Zwei Einstellungen, ohne die der Login nicht funktioniert.

**3a — Code-Länge auf 6 stellen.** Neue Supabase-Projekte erzeugen teilweise 8-stellige Codes,
die App hat aber sechs Eingabefelder. Unter *Authentication → Sign In / Providers → Email* die
Option **Email OTP Length** auf `6` setzen.

**3b — E-Mail-Template auf den Code umstellen.** Standardmäßig verschickt Supabase einen Magic
Link; das Formular erwartet Ziffern.

> **Wichtig:** Supabase lässt die Vorlagen nur bearbeiten, wenn ein **eigener SMTP-Versand**
> hinterlegt ist (*Authentication → Emails → Set up SMTP*). Mit dem eingebauten Standard-Mailer
> ist das Feld schreibgeschützt — und der ist mit ~2 Mails pro Stunde ohnehin nur zum
> Ausprobieren zu gebrauchen, nicht für ein echtes Team. Ein kostenloser Anbieter wie Resend,
> Brevo oder Postmark reicht.
>
> Zum reinen Testen ohne SMTP lässt sich ein Code auch direkt über die Admin-API erzeugen
> (`auth.admin.generateLink({ type: 'magiclink', email })` liefert `properties.email_otp`),
> ganz ohne Mailversand.

Sobald SMTP eingerichtet ist, unter *Authentication → Emails → Magic Link* das Template so
ändern, dass es `{{ .Token }}` ausgibt statt `{{ .ConfirmationURL }}`. Zum Beispiel:

```html
<h2>Dein Login Code</h2>
<p>Gib diesen Code im Dashboard ein:</p>
<p style="font-size:28px;letter-spacing:6px"><strong>{{ .Token }}</strong></p>
<p>Der Code ist 60 Minuten gültig.</p>
```

### 4 — Ersten Admin anlegen

Es gibt **keine Selbstregistrierung** (`shouldCreateUser: false`). Der erste Admin wird von
Hand angelegt, alle weiteren Nutzer danach über die Oberfläche unter *Admin → Benutzer bearbeiten*.

1. Supabase-Dashboard → *Authentication → Users → Add user* → E-Mail eintragen,
   *Auto Confirm User* aktivieren.
2. Die User-ID kopieren und im SQL Editor ausführen:

Das geht **nicht** über den SQL-Editor oder den Table Editor: Die Regeln auf `profiles`
erlauben das Anlegen nur einem Admin, und den gibt es beim frischen Projekt noch nicht
(*"new row violates row-level security policy"*). Der Service-Schlüssel steht über diesen
Regeln — dafür gibt es das Skript:

```bash
node --env-file=.env.local scripts/ersten-admin-anlegen.mjs <email> "<Name>"
```

Es sucht den Benutzer über die Admin-Schnittstelle, legt sein Profil mit `role = 'admin'`
an und lässt sich gefahrlos mehrfach ausführen. Danach unter `/login` mit dieser E-Mail
anmelden; alle weiteren Nutzer entstehen dann bequem über *Admin → Benutzer verwalten*.

Der Name muss zeichengenau so in der Spalte **Lead von** der Google-Tabelle stehen, sonst
bleibt *Meine Leads* leer.

---

## Deployment (Vercel)

Repository importieren, die drei Environment-Variablen aus `.env.local` in den Projekt-
Einstellungen hinterlegen, deployen. In Supabase unter *Authentication → URL Configuration*
die Vercel-Domain als Site URL eintragen.

Zwei Stolpersteine, beide schon einmal getreten:

- **Geänderte Environment-Variablen wirken erst nach einem neuen Build.** Die beiden
  `NEXT_PUBLIC_`-Werte werden beim Bauen fest in den Code geschrieben. Also nach jeder
  Änderung *Deployments → ⋯ → Redeploy*, den Haken bei *Use existing Build Cache*
  entfernen.
- **Die Commit-Adresse muss zu einem GitHub-Konto gehören.** Ohne gesetzte `user.email`
  nimmt git etwas wie `name@MacBook-von-X.local`; GitHub kann das keinem Nutzer zuordnen
  und Vercel blockt den Build im Hobby-Tarif mit *"could not associate the committer with a
  GitHub user"*. Einmalig setzen:

  ```bash
  git config --global user.name "Dein Name"
  git config --global user.email "<id>+<login>@users.noreply.github.com"
  ```

---

## Struktur

```
app/
  login/                Zweistufiger OTP-Login
  (app)/                Alles hinter dem Auth-Guard
    page.tsx            Workreport Verlauf (Startseite)
    tageseintrag/       Workreport — Zahlen erfassen
    leads/              Meine Leads — aus der Google-Tabelle
    admin/              Admin-Guard: role === 'admin', zwei Reiter
      statistik/        Benutzer Übersicht (Chatter Tracking)
      benutzer/         Benutzer bearbeiten
    skript/             Chatting Skript, live aus dem Google-Dokument
  api/admin/users/      Route Handler, nur Service-Role
components/
  ui/                   Button, Input, Select, Modal, Segmented, Table, StatCard,
                        PlatformLogo …
  skript/               Darstellung des Chatting-Skripts + Kopieren-Knopf
  analytics/            Auswertung — geteilt von /(app)/page und /admin/statistik
lib/
  leads.ts              liest die Google-Tabelle serverseitig und filtert je Chatter
  csv.ts                CSV-Parser (ohne Fremdbibliothek)
  supabase/             client (Browser) · server (RSC) · admin (Service-Role)
  metrics.ts            Die drei Kennzahlen und die Plattformen an einer Stelle
  skript.ts             holt das Chatting-Skript aus Google Docs und zerlegt es
  date-ranges.ts        Tag / Woche / Monat / Jahr, Wochen ab Montag
supabase/migrations/
```

## Chatting Skript

Das Skript steht in einem Google-Dokument und wird dort gepflegt. Die App holt es
serverseitig, zerlegt es (`lib/skript.ts`) und baut es im eigenen Design neu auf —
Googles HTML wird nie direkt eingebettet.

- Das Dokument muss auf *Jeder mit dem Link – Betrachter* stehen.
- Anderes Dokument? `SKRIPT_DOC_HTML_URL` in `.env.local` setzen
  (`https://docs.google.com/document/d/<id>/export?format=html`).
- Änderungen erscheinen innerhalb einer Minute (Zwischenspeicher in `lib/skript.ts`).
- Kapitel erkennt der Parser an den Kreis-Markern ①…⑧ / ⊙ am Zeilenanfang.

## Meine Leads

Die Leadliste kommt direkt aus einer Google-Tabelle und wird **nicht** in der Datenbank
gespiegelt — sie wird in der App nie bearbeitet, also gibt es nichts zu speichern.

- Die Tabelle muss auf *Jeder mit dem Link – Betrachter* stehen.
- Andere Tabelle? `LEADS_SHEET_CSV_URL` in `.env.local` setzen
  (`https://docs.google.com/spreadsheets/d/<id>/export?format=csv`).
- Ein Chatter sieht die Zeilen, deren Spalte **Lead von** seinem Profilnamen entspricht —
  verglichen ohne Groß-/Kleinschreibung und ohne Randleerzeichen. Der Abgleich passiert
  **serverseitig**, bevor irgendetwas den Browser erreicht.
- Das Blatt wird 60 Sekunden zwischengespeichert; *Aktualisieren* verwirft den Cache sofort.

## Konventionen

- **Oberfläche Deutsch, Code Englisch.** Variablen, Kommentare und Commits auf Englisch.
- **Keine hartkodierten Farben.** Jeder Farbwert steht als CSS-Variable in `app/globals.css`
  und wird über Tailwind-Utilities (`bg-surface-1`, `text-gold`) referenziert.
- **Kein `localStorage` / `sessionStorage`.** Zustand lebt in React-State, URL-Parametern
  oder der Datenbank.
- **RLS ist der Zugriffsschutz**, nicht die UI. Guards in den Layouts sind die zweite Schicht.
