import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import { getLeadsForProfile } from "@/lib/leads";
import { LeadListe } from "./LeadListe";

export default async function LeadsPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  // Filtering happens here, on the server. The browser only ever receives
  // the rows belonging to this profile — admins included.
  const result = await getLeadsForProfile(profile);

  return (
    <LeadListe
      profileName={profile.name}
      leads={result.ok ? result.leads : []}
      fetchedAt={result.ok ? result.fetchedAt : null}
      problem={result.ok ? null : result.reason}
    />
  );
}
