import { Suspense } from "react";
import { AdminStatistik } from "./AdminStatistik";
import { EmptyState } from "@/components/ui/EmptyState";

export default function AdminStatistikPage() {
  return (
    // useSearchParams needs a Suspense boundary during prerender.
    <Suspense fallback={<EmptyState>Chatter werden geladen…</EmptyState>}>
      <AdminStatistik />
    </Suspense>
  );
}
