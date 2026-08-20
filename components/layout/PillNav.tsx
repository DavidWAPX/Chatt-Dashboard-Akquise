"use client";

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
export const CALENDLY_URL =
  "https://calendly.com/d/dtnf-7n9-pzj/dein-kostenloses-erstgesprach-klon";

/* Daily work first, then its history, then the two tools, then administration.
   User management no longer has its own entry — it lives inside Admin. */
const ITEMS = [
  { href: "/leads", label: "Meine Leads", icon: ListChecks, adminOnly: false, extern: false },
  { href: "/tageseintrag", label: "Workreport", icon: SquarePen, adminOnly: false, extern: false },
  { href: "/", label: "Workreport Verlauf", icon: BarChart3, adminOnly: false, extern: false },
  {
    href: "/skript",
    label: "Chatting Skript",
    icon: MessageSquareQuote,
    adminOnly: false,
    extern: false,
  },
  {
    href: CALENDLY_URL,
    label: "Termin Buchen",
    icon: CalendarPlus,
    adminOnly: false,
    extern: true,
  },
  { href: "/admin", label: "Admin", icon: Users, adminOnly: true, extern: false },
] as const;

/**
 * The floating gold bar — §5.4 / §6.1. The one loud element on the page.
 * Hiding admin items here is convenience only; the real guard is server-side.
 */
export function PillNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = ITEMS.filter((item) => !item.adminOnly || role === "admin");

  return (
    <nav
      aria-label="Hauptnavigation"
      className={cn(
        "nav-glow fixed left-1/2 top-4 z-50 h-[54px] -translate-x-1/2",
        // w-max ist nötig, nicht Zierde: ein fixiertes Element mit left-1/2
        // bekommt sonst nur die halbe Fensterbreite als Platz zugeteilt und
        // schneidet den letzten Menüpunkt ab.
        "no-scrollbar flex w-max max-w-[calc(100vw-32px)] items-center gap-0.5 overflow-x-auto",
        "rounded-full border border-border-gold bg-surface-1 p-1.5",
      )}
    >
      {items.map((item) => {
        const active =
          item.extern
            ? false
            : item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
        const Icon = item.icon;

        const klassen = cn(
          "flex h-[42px] shrink-0 items-center justify-center gap-2.5 rounded-full",
          "px-3.5 text-[15px] font-medium tracking-normal lg:px-4",
          "transition-colors duration-[var(--dur)] ease-[var(--ease-ref)]",
          // Three distinct states: gold wash when active, a raised neutral
          // surface on hover, plain bright label at rest.
          active
            ? "nav-item-active text-gold-bright"
            : "text-[var(--nav-inactive)] hover:bg-[var(--nav-hover)] hover:text-text-1",
        );

        /* Unter 1024px bleiben nur die Symbole: sechs Beschriftungen brauchen
           953px, die es dort nicht gibt. Jeder Punkt trägt title und
           aria-label, der Name ist also weiter abrufbar. */
        const inhalt = (
          <>
            <Icon size={18} aria-hidden="true" className="shrink-0" />
            <span className="hidden lg:inline">{item.label}</span>
          </>
        );

        if (item.extern) {
          return (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${item.label} (öffnet Calendly in einem neuen Tab)`}
              title={item.label}
              className={klassen}
            >
              {inhalt}
            </a>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
            title={item.label}
            className={klassen}
          >
            {inhalt}
          </Link>
        );
      })}
    </nav>
  );
}
