"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

/**
 * Logout — §6.2. Present on every signed-in page, at every width.
 * The content shell reserves 112px at the bottom so it never covers a submit button.
 */
export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    const supabase = createClient();
    // Even if signOut fails (offline, expired session) we still leave the app —
    // staying on a page the user asked to leave is the worse outcome.
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className={cn(
        "fixed bottom-4 right-4 z-50 inline-flex items-center gap-[10px] sm:bottom-6 sm:right-6",
        "rounded-full border border-border-default bg-surface-1 px-[26px] py-[14px]",
        "font-display text-[13px] uppercase tracking-[0.12em] text-text-1",
        "transition-colors duration-[160ms] ease-out",
        "enabled:hover:border-border-gold enabled:hover:bg-surface-2",
        "disabled:cursor-not-allowed disabled:opacity-45",
      )}
    >
      <LogOut size={18} aria-hidden="true" />
      <span>{pending ? "Wird abgemeldet…" : "Logout"}</span>
    </button>
  );
}
