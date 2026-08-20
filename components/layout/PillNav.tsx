"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ListChecks, SquarePen, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import type { UserRole } from "@/lib/types";

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

  return (
    <nav
      aria-label="Hauptnavigation"
      className={cn(
        "nav-glow fixed left-1/2 top-4 z-50 h-[54px] -translate-x-1/2",
        "flex max-w-[calc(100vw-32px)] items-center gap-0.5 overflow-hidden",
        "rounded-full border border-border-gold bg-surface-1 p-1.5",
      )}
    >
      {items.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
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
  );
}
