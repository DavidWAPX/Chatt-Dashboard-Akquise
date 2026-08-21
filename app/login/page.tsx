import { redirect } from "next/navigation";
import { createClient, getSessionProfile, isConfigured } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";
import { LogoutButton } from "@/components/layout/LogoutButton";

export default async function LoginPage() {
  const configured = isConfigured();

  /*
   * Geprüft wird das Profil, nicht bloß die Sitzung.
   *
   * Der Guard hinter der Anmeldung verlangt ein Profil; wer eine gültige
   * Sitzung hat, aber keine Zeile in `profiles`, wurde von dort hierher
   * geschickt — und von hier gleich wieder zurück. Das ergab eine endlose
   * Schleife, bis der Browser abbrach ("zu viele Umleitungen"). Jetzt endet
   * dieser Fall hier, mit einer Erklärung statt einer Schleife.
   */
  const profile = configured ? await getSessionProfile() : null;
  if (profile) redirect("/");

  let angemeldetOhneProfil = false;

  if (configured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    angemeldetOhneProfil = Boolean(user);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-16">
      {!configured ? (
        <div className="w-full max-w-[470px] rounded-[12px] border border-panel-border bg-surface-1 p-6 sm:p-10">
          <h1 className="font-display text-[24px] font-medium uppercase tracking-[0.48px] text-text-1">
            Remote Chatter
          </h1>
          <p className="mt-3 text-[14px] text-text-2 break-anywhere">
            Die Supabase-Zugangsdaten fehlen noch. Trag{" "}
            <code className="text-text-1">NEXT_PUBLIC_SUPABASE_URL</code> und{" "}
            <code className="text-text-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
            <code className="text-text-1">.env.local</code> ein und starte den Server neu.
            Die Schritte stehen in der README.
          </p>
        </div>
      ) : angemeldetOhneProfil ? (
        <>
          <div className="w-full max-w-[470px] rounded-[12px] border border-panel-border bg-surface-1 p-6 sm:p-10">
            <h1 className="font-display text-[24px] font-medium uppercase tracking-[0.48px] text-text-1">
              Zugang noch nicht freigeschaltet
            </h1>
            <p className="mt-3 text-[14px] text-text-2">
              Deine Anmeldung hat geklappt, aber zu diesem Konto gehört noch kein
              Profil. Ein Admin muss dich anlegen, dann kommst du sofort hinein.
            </p>
          </div>
          <LogoutButton />
        </>
      ) : (
        <LoginForm />
      )}
    </main>
  );
}
