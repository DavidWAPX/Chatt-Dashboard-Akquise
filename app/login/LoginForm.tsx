"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { loginErrorMessage } from "@/lib/auth-errors";
import { CodeInput, compactCode } from "./CodeInput";

type Step = "email" | "code";

const RESEND_SECONDS = 60;

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const requestCode = useCallback(
    async (address: string) => {
      setError(null);
      setPending(true);

      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: address,
        // No self-registration: only addresses an admin created may sign in.
        options: { shouldCreateUser: false },
      });

      setPending(false);

      if (otpError) {
        setError(loginErrorMessage(otpError));
        return;
      }

      setStep("code");
      setSecondsLeft(RESEND_SECONDS);
    },
    [],
  );

  async function handleEmailSubmit(event: React.FormEvent) {
    event.preventDefault();
    const address = email.trim();
    if (!address) {
      setError("Bitte gib deine E-Mail-Adresse ein.");
      return;
    }
    await requestCode(address);
  }

  async function handleCodeSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    const token = compactCode(code);

    if (token.length !== 6) {
      setError("Bitte gib den sechsstelligen Code ein.");
      return;
    }

    setError(null);
    setPending(true);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: "email",
    });

    if (verifyError) {
      setPending(false);
      setError(loginErrorMessage(verifyError));
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-[470px] rounded-[16px] border border-panel-border bg-surface-1 p-6 sm:p-10">
      <h1 className="font-display text-[26px] font-semibold uppercase tracking-[0.06em] text-text-1 sm:text-[30px]">
        Remote Chatter
      </h1>

      {step === "email" ? (
        <>
          <p className="mt-3 text-[15px] text-text-2">Melde dich mit deiner E-Mail an.</p>

          <form onSubmit={handleEmailSubmit} className="mt-8" noValidate>
            <Input
              label="E-Mail Adresse"
              type="email"
              name="email"
              autoComplete="email"
              autoFocus
              placeholder="name@beispiel.de"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={error ?? undefined}
            />
            <Button type="submit" fullWidth loading={pending} loadingLabel="Wird gesendet…" className="mt-6">
              Login Code anfordern
            </Button>
          </form>
        </>
      ) : (
        <>
          <p className="mt-3 text-[15px] text-text-2 break-anywhere">
            Wir haben dir einen Code an <strong className="text-text-1">{email}</strong>{" "}
            geschickt.
          </p>

          <form onSubmit={handleCodeSubmit} className="mt-8" noValidate>
            <CodeInput
              value={code}
              onChange={(next) => {
                setCode(next);
                if (error) setError(null);
              }}
              disabled={pending}
            />

            {error && (
              <p role="alert" className="mt-4 text-center text-[13px] text-danger">
                {error}
              </p>
            )}

            <Button type="submit" fullWidth loading={pending} loadingLabel="Wird geprüft…" className="mt-6">
              Anmelden
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              type="button"
              disabled={secondsLeft > 0 || pending}
              onClick={() => requestCode(email.trim())}
              className="rounded-[8px] px-2 py-1 font-sans text-[14px] text-gold transition-colors duration-[160ms] enabled:hover:text-gold-bright disabled:cursor-not-allowed disabled:text-text-3"
            >
              {secondsLeft > 0
                ? `Code erneut senden (${secondsLeft} s)`
                : "Code erneut senden"}
            </button>

            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
              className="rounded-[8px] px-2 py-1 font-sans text-[14px] text-text-2 transition-colors duration-[160ms] enabled:hover:text-text-1"
            >
              E-Mail ändern
            </button>
          </div>
        </>
      )}
    </div>
  );
}
