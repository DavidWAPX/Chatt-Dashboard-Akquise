"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarPlus,
  ListChecks,
  MessageSquareQuote,
  SquarePen,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { UserRole } from "@/lib/types";

/** Termin buchen führt zu Calendly — außerhalb dieser App. */
const CALENDLY_URL =
  "https://calendly.com/d/dtnf-7n9-pzj/dein-kostenloses-erstgesprach-klon";

/* Daily work first, then its history, then administration. User management
   no longer has its own entry — it lives inside Admin as a tab. */
const ITEMS = [
  { href: "/leads", label: "Meine Leads", icon: ListChecks, adminOnly: false },
  { href: "/tageseintrag", label: "Workreport", icon: SquarePen, adminOnly: false },
  { href: "/", label: "Workreport Verlauf", icon: BarChart3, adminOnly: false },
  { href: "/admin", label: "Admin", icon: Users, adminOnly: true },
] as const;

/**
 * The floating gold bar — §5.4 / §6.1. The one loud element on the page.
 * Hiding admin items here is convenience only; the real guard is server-side.
 */
export function PillNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = ITEMS.filter((item) => !item.adminOnly || role === "admin");

  /*
   * Der angeklickte Punkt leuchtet sofort auf, nicht erst wenn die neue Seite
   * gerendert ist. Ohne das wirkt die Leiste beim Klicken tot, solange der
   * Server antwortet — und genau diese Lücke fühlt sich wie Ladezeit an.
   */
  const [geklickt, setGeklickt] = useState<string | null>(null);
  useEffect(() => setGeklickt(null), [pathname]);

  const istAktiv = (href: string) => {
    if (geklickt) return geklickt === href;
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  };

  const skriptAktiv = istAktiv("/skript");

  return (
    /*
     * Zwei Zeilen in einem fixierten Behälter: oben die Bereiche des
     * Dashboards, darunter die beiden Werkzeuge. w-max ist nötig, nicht
     * Zierde — ein fixiertes Element mit left-1/2 bekommt sonst nur die halbe
     * Fensterbreite zugeteilt und schneidet den letzten Eintrag ab.
     */
    <div className="fixed left-1/2 top-4 z-50 flex w-max max-w-[calc(100vw-24px)] -translate-x-1/2 flex-col items-center gap-2">
      <nav
        aria-label="Hauptnavigation"
        className={cn(
          "nav-glow no-scrollbar flex h-[54px] w-max max-w-full items-center gap-0.5 overflow-x-auto",
          "rounded-full border border-border-gold bg-surface-1 p-1.5",
        )}
      >
        {items.map((item) => {
          const active = istAktiv(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
              onClick={() => setGeklickt(item.href)}
              /* prefetch greift nur im fertigen Build; im Entwicklungsmodus
                 baut Next die Zielseite grundsätzlich erst beim Klick. */
              prefetch
              className={cn(
                "flex h-[42px] shrink-0 items-center justify-center gap-2.5 rounded-full",
                "px-3.5 text-[15px] font-medium tracking-normal xs:px-5",
                "transition-colors duration-[var(--dur)] ease-[var(--ease-ref)]",
                // Three distinct states: gold wash when active, a raised neutral
                // surface on hover, plain bright label at rest.
                active
                  ? "nav-item-active text-gold-bright"
                  : "text-[var(--nav-inactive)] hover:bg-[var(--nav-hover)] hover:text-text-1",
              )}
            >
              <Icon size={18} aria-hidden="true" className="shrink-0" />
              {/* Below 520px only the icons remain — the bar never wraps. */}
              <span className="hidden xs:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <nav
        aria-label="Werkzeuge"
        className={cn(
          "nav-tools no-scrollbar flex h-[38px] w-max max-w-full items-center gap-0.5 overflow-x-auto",
          "rounded-full border bg-surface-1 p-1",
        )}
      >
        <Link
          href="/skript"
          aria-current={skriptAktiv ? "page" : undefined}
          title="Chatting Skript"
          onClick={() => setGeklickt("/skript")}
          prefetch
          className={cn(
            "nav-tool flex h-[30px] shrink-0 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium",
            skriptAktiv && "bg-[var(--blau-dim)] text-text-1",
          )}
        >
          <MessageSquareQuote size={15} aria-hidden="true" className="shrink-0" />
          Chatting Skript
        </Link>

        <a
          href={CALENDLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Termin Buchen (öffnet Calendly in einem neuen Tab)"
          className="nav-tool flex h-[30px] shrink-0 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium"
        >
          <CalendarPlus size={15} aria-hidden="true" className="shrink-0" />
          Termin Buchen
        </a>
      </nav>
    </div>
  );
}
