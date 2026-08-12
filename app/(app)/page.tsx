import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import { Auswertung } from "@/components/analytics/Auswertung";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function StatistikPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  return (
    // useSearchParams needs a Suspense boundary during prerender.
    <Suspense fallback={<EmptyState>Zahlen werden geladen…</EmptyState>}>
      <Auswertung profileId={profile.id} />
    </Suspense>
  );
}
