"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, NumberInput } from "@/components/ui/Input";
import { Segmented } from "@/components/ui/Segmented";
import { Panel } from "@/components/ui/Panel";
import { Toast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { METRICS, PLATFORMS } from "@/lib/metrics";
import { todayISO } from "@/lib/date-ranges";
import type { MetricKey, Platform } from "@/lib/types";

type FormValues = Record<MetricKey, number | "">;

const EMPTY_FORM: FormValues = {
  first_messages: "",
  conversations: "",
  followups: "",
  appointments: "",
  qualified: "",
  unqualified: "",
};

function toNumbers(values: FormValues): Record<MetricKey, number> {
  return METRICS.reduce(
    (acc, metric) => ({ ...acc, [metric.key]: values[metric.key] === "" ? 0 : Number(values[metric.key]) }),
    {} as Record<MetricKey, number>,
  );
}

export function EntryForm({ profileId }: { profileId: string }) {
  const today = todayISO();

  const [date, setDate] = useState(today);
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [existing, setExisting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  /** Loads whatever is already stored for this date and platform. */
  const loadEntry = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from("entries")
      .select("*")
      .eq("profile_id", profileId)
      .eq("entry_date", date)
      .eq("platform", platform)
      .maybeSingle();

    if (loadError) {
      setError("Die gespeicherten Werte konnten nicht geladen werden. Lade die Seite neu.");
      setLoading(false);
      return;
    }

    if (data) {
      setExisting(true);
      setValues(
        METRICS.reduce(
          (acc, metric) => ({ ...acc, [metric.key]: data[metric.key] }),
          {} as FormValues,
        ),
      );
    } else {
      setExisting(false);
      setValues(EMPTY_FORM);
    }

    setDirty(false);
    setLoading(false);
  }, [profileId, date, platform]);

  useEffect(() => {
    void loadEntry();
  }, [loadEntry]);

  // Unsaved changes must not vanish silently on reload or tab close.
  useEffect(() => {
    if (!dirty) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function confirmDiscard(): boolean {
    if (!dirty) return true;
    return window.confirm(
      "Du hast ungespeicherte Änderungen. Willst du sie verwerfen?",
    );
  }

  function updateValue(key: MetricKey, value: number | "") {
    setValues((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: saveError } = await supabase.from("entries").upsert(
      {
        profile_id: profileId,
        entry_date: date,
        platform,
        ...toNumbers(values),
      },
      // Upsert on the unique key, so saving twice corrects the row
      // instead of creating a second one.
      { onConflict: "profile_id,entry_date,platform" },
    );

    setSaving(false);

    if (saveError) {
      setError("Das Speichern hat nicht geklappt. Versuche es noch einmal.");
      return;
    }

    setExisting(true);
    setDirty(false);
    setSaved(true);
  }

  const numbers = toNumbers(values);
  // A hint, never a block — the chatter decides what is right.
  const implausible =
    numbers.qualified + numbers.unqualified > numbers.conversations;

  return (
    <>
      <Panel eyebrow="Workreport" title="Zahlen erfassen">
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Datum"
              type="date"
              value={date}
              max={today}
              onChange={(event) => {
                if (!confirmDiscard()) return;
                // Future days cannot be reported on.
                setDate(event.target.value > today ? today : event.target.value);
              }}
            />

            <div>
              <p className="mb-2 font-sans text-[13px] font-semibold text-text-1">
                Plattform
              </p>
              <Segmented
                label="Plattform"
                value={platform}
                onChange={(next) => {
                  if (!confirmDiscard()) return;
                  setPlatform(next);
                }}
                options={PLATFORMS.map((p) => ({ key: p.key, label: p.label }))}
              />
            </div>
          </div>

          {existing && !loading && (
            <p className="mt-6 flex items-start gap-3 rounded-[8px] border border-border-gold bg-surface-3 px-4 py-3 text-[14px] text-text-2">
              <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-gold" />
              Für diesen Tag und diese Plattform ist bereits ein Eintrag vorhanden.
              Speichern überschreibt ihn.
            </p>
          )}

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {METRICS.map((metric) => (
              <NumberInput
                key={metric.key}
                label={metric.label}
                value={values[metric.key]}
                onValueChange={(next) => updateValue(metric.key, next)}
                disabled={loading}
                placeholder="0"
              />
            ))}
          </div>

          {implausible && (
            <p className="mt-6 text-[14px] text-text-2">
              Hinweis: Qualifiziert und Unqualifiziert ergeben zusammen mehr als
              Konversationen. Gespeichert wird trotzdem — prüfe die Zahlen kurz.
            </p>
          )}

          {error && (
            <p role="alert" className="mt-6 text-[14px] text-danger">
              {error}
            </p>
          )}

          <div className="mt-8 flex justify-end">
            <Button type="submit" loading={saving} loadingLabel="Wird gespeichert…" disabled={loading}>
              Speichern
            </Button>
          </div>
        </form>
      </Panel>

      {saved && (
        <Toast
          message="Gespeichert"
          detail="Ansehen unter Workreport Verlauf"
          onDismiss={() => setSaved(false)}
        />
      )}

      <p className="text-[14px] text-text-2">
        Deine Zahlen findest du unter{" "}
        <Link
          href="/"
          className="rounded-[4px] text-gold transition-colors duration-[var(--dur)] ease-[var(--ease-ref)] hover:text-gold-bright"
        >
          Statistik
        </Link>
        .
      </p>
    </>
  );
}
