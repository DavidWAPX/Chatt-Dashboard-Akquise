import { redirect } from "next/navigation";

/** /admin has no page of its own — it opens on the overview tab. */
export default function AdminIndexPage() {
  redirect("/admin/statistik");
}
