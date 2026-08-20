"use client";

import { useEffect, useState } from "react";
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

  // The pressed tab highlights on click instead of when the next page has
  // rendered, so the switch never feels like it was ignored.
  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => setPending(null), [pathname]);

  return (
    <div
      role="tablist"
      aria-label="Admin-Bereich"
      className="no-scrollbar inline-flex max-w-full items-center overflow-x-auto rounded-[8px] border border-border-default bg-surface-2 p-1"
    >
      {TABS.map((tab) => {
        const active = pending ? pending === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            prefetch
            aria-selected={active}
            onClick={() => setPending(tab.href)}
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
