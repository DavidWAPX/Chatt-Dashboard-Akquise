import path from "path";
import type { NextConfig } from "next";

/**
 * Schutzkopfzeilen für jede Antwort.
 *
 * Sie kosten nichts und schließen die Lücken, die ein Browser sonst offen
 * lässt: das Dashboard darf nicht in einem fremden Rahmen stecken, der Browser
 * soll den Inhaltstyp nicht raten, und beim Klick auf einen Link nach außen
 * (Calendly, Google Docs) soll die aufgerufene Seite nicht erfahren, von
 * welcher Unterseite der Klick kam.
 */
const SICHERHEITS_HEADER = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Pinned because a lockfile higher up the tree would otherwise be inferred
  // as the workspace root.
  outputFileTracingRoot: path.join(__dirname),

  async headers() {
    return [{ source: "/:path*", headers: SICHERHEITS_HEADER }];
  },
};

export default nextConfig;
