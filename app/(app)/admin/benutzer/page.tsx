import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import { UserAdmin } from "./UserAdmin";

export default async function BenutzerPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  return <UserAdmin currentUserId={profile.id} />;
}
