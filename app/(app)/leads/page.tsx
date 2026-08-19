import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import { getLeadsForProfile } from "@/lib/leads";
import { LeadListe } from "./LeadListe";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ chatter?: string }>;
}) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  const { chatter } = await searchParams;

  // Filtering happens here, on the server. The browser only ever receives
  // the rows this profile is allowed to see.
  const result = await getLeadsForProfile(profile, chatter);

  return (
    <LeadListe
      profileName={profile.name}
      isAdmin={profile.role === "admin"}
      leads={result.ok ? result.leads : []}
      total={result.ok ? result.total : 0}
      capped={result.ok ? result.capped : false}
      owners={result.ok ? result.owners : []}
      chatter={chatter ?? ""}
      fetchedAt={result.ok ? result.fetchedAt : null}
      problem={result.ok ? null : result.reason}
    />
  );
}
