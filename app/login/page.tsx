import { redirect } from "next/navigation";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const configured = isConfigured();

  if (configured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // Someone already signed in has no business on the login page.
    if (user) redirect("/");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-16">
      {configured ? (
        <LoginForm />
      ) : (
        <div className="w-full max-w-[470px] rounded-[16px] border border-panel-border bg-surface-1 p-6 sm:p-10">
          <h1 className="font-display text-[26px] font-semibold uppercase tracking-[0.06em] text-text-1 sm:text-[30px]">
            Remote Chatter
          </h1>
          <p className="mt-3 text-[15px] text-text-2 break-anywhere">
            Die Supabase-Zugangsdaten fehlen noch. Trag{" "}
            <code className="text-text-1">NEXT_PUBLIC_SUPABASE_URL</code> und{" "}
            <code className="text-text-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
            <code className="text-text-1">.env.local</code> ein und starte den Server neu.
            Die Schritte stehen in der README.
          </p>
        </div>
      )}
    </main>
  );
}
