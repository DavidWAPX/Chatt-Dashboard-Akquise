import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import { EntryForm } from "./EntryForm";

export default async function TageseintragPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  return <EntryForm profileId={profile.id} />;
}
