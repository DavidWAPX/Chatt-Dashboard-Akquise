# Remote Chatter Dashboard

Internes Tracking-Werkzeug für Remote Chatter: Kennzahlen der Kaltakquise auf TikTok,
Instagram, X und Facebook erfassen und über Tag / Woche / Monat / Jahr auswerten.

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
ausführen. Legt Tabellen, RLS-Policies, den `updated_at`-Trigger und die beiden Startgruppen
`Gruppe 1` und `Gruppe 2` an.

Alternativ mit der Supabase CLI:

```bash
supabase link --project-ref <dein-project-ref>
supabase db push
```

### 3 — E-Mail-Template auf Code umstellen ⚠️

**Ohne diesen Schritt kommt kein 6-stelliger Code an, sondern ein Magic Link — der Login
funktioniert dann nicht.**

Im Supabase-Dashboard unter *Authentication → Email Templates → Magic Link* das Template so
ändern, dass es `{{ .Token }}` ausgibt statt `{{ .ConfirmationURL }}`. Zum Beispiel:

```html
<h2>Dein Login Code</h2>
<p>Gib diesen Code im Dashboard ein:</p>
<p style="font-size:28px;letter-spacing:6px"><strong>{{ .Token }}</strong></p>
<p>Der Code ist 60 Minuten gültig.</p>
```

### 4 — Ersten Admin anlegen

Es gibt **keine Selbstregistrierung** (`shouldCreateUser: false`). Der erste Admin wird von
Hand angelegt, alle weiteren Nutzer danach über die Oberfläche unter *Benutzer*.

1. Supabase-Dashboard → *Authentication → Users → Add user* → E-Mail eintragen,
   *Auto Confirm User* aktivieren.
2. Die User-ID kopieren und im SQL Editor ausführen:

```sql
insert into profiles (id, email, name, role)
values ('<user-id>', '<email>', '<Name>', 'admin');
```

Danach unter `/login` mit dieser E-Mail anmelden.

---

## Deployment (Vercel)

Repository importieren, die drei Environment-Variablen aus `.env.local` in den Projekt-
Einstellungen hinterlegen, deployen. In Supabase unter *Authentication → URL Configuration*
die Vercel-Domain als Site URL eintragen.

---

## Struktur

```
app/
  login/                Zweistufiger OTP-Login
  (app)/                Alles hinter dem Auth-Guard
    page.tsx            Statistik (Startseite)
    tageseintrag/       Tageseintrag
    admin/              Admin-Guard: role === 'admin'
      statistik/        Auswertung aller Chatter
      benutzer/         Benutzer- und Gruppenverwaltung
  api/admin/users/      Route Handler, nur Service-Role
components/
  ui/                   Button, Input, Select, Modal, Segmented, Chip, Table, StatCard …
  analytics/            Auswertung — geteilt von /(app)/page und /admin/statistik
lib/
  supabase/             client (Browser) · server (RSC) · admin (Service-Role)
  metrics.ts            Die sechs Kennzahlen an einer Stelle definiert
  date-ranges.ts        Tag / Woche / Monat / Jahr, Wochen ab Montag
supabase/migrations/
```

## Konventionen

- **Oberfläche Deutsch, Code Englisch.** Variablen, Kommentare und Commits auf Englisch.
- **Keine hartkodierten Farben.** Jeder Farbwert steht als CSS-Variable in `app/globals.css`
  und wird über Tailwind-Utilities (`bg-surface-1`, `text-gold`) referenziert.
- **Kein `localStorage` / `sessionStorage`.** Zustand lebt in React-State, URL-Parametern
  oder der Datenbank.
- **RLS ist der Zugriffsschutz**, nicht die UI. Guards in den Layouts sind die zweite Schicht.
