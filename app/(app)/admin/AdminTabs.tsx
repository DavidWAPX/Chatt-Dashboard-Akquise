"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/admin/statistik", label: "Benutzer Übersicht" },
  { href: "/admin/benutzer", label: "Benutzer bearbeiten" },
] as const;

/**
 * The two halves of the admin area. Real links rather than local state, so a
 * tab can be shared, bookmarked and reached with the back button.
 */
export function AdminTabs() {
  const pathname = usePathname();

  return (
    <div
      role="tablist"
      aria-label="Admin-Bereich"
      className="no-scrollbar inline-flex max-w-full items-center overflow-x-auto rounded-[8px] border border-border-default bg-surface-2 p-1"
    >
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={active}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-[4px] px-[16px] py-2 text-[13px]",
              active
                ? "bg-gold font-semibold text-on-gold"
                : "text-text-2 hover:text-text-1",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
