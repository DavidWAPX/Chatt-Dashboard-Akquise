import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import { AdminTabs } from "./AdminTabs";

/**
 * Admin guard — §4. Hiding the nav item is convenience; this is the access
 * control. Calling /admin/* directly as a plain user lands on "/".
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSessionProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/");

  return (
    <>
      <AdminTabs />
      {children}
    </>
  );
}
