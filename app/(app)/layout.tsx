import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import { PillNav } from "@/components/layout/PillNav";
import { LogoutButton } from "@/components/layout/LogoutButton";

/** Auth guard for everything behind the login. */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSessionProfile();

  if (!profile) redirect("/login");

  return (
    <>
      <PillNav role={profile.role} />
      <main className="content-shell stack-sections">{children}</main>
      <LogoutButton />
    </>
  );
}
