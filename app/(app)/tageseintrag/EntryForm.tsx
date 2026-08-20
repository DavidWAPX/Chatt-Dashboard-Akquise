"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NumberInput } from "@/components/ui/Input";
import { Segmented } from "@/components/ui/Segmented";
import { Panel } from "@/components/ui/Panel";
import { PlatformLogo } from "@/components/ui/PlatformLogo";
import { Toast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { METRICS, PLATFORMS, PLATFORM_LABEL } from "@/lib/metrics";
import { todayISO } from "@/lib/date-ranges";
import type { MetricKey, Platform } from "@/lib/types";

type FormValues = Record<MetricKey, number | "">;

const EMPTY_FORM: FormValues = {
  first_messages: "",
  followups: "",
  appointments: "",
};

function toNumbers(values: FormValues): Record<MetricKey, number> {
  return METRICS.reduce(
    (acc, metric) => ({
      ...acc,
      [metric.key]: values[metric.key] === "" ? 0 : Number(values[metric.key]),
    }),
    {} as Record<MetricKey, number>,
  );
}

/** "Donnerstag, 21. August 2026" — written out, so the day is unmistakable. */
function formatHeute(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function EntryForm({ profileId }: { profileId: string }) {
  /*
   * Getrackt wird immer der heutige Tag — es gibt keine Datumsauswahl mehr.
   * Wer zurückblicken will, tut das im Workreport Verlauf; damit kann ein
   * Eintrag auch nicht mehr versehentlich am falschen Tag landen.
   */
  const today = todayISO();

  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [existing, setExisting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  /** Loads whatever is already stored for today and this platform. */
  const loadEntry = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from("entries")
      .select("*")
      .eq("profile_id", profileId)
      .eq("entry_date", today)
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
  }, [profileId, today, platform]);

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
    setSaved(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: saveError } = await supabase.from("entries").upsert(
      {
        profile_id: profileId,
        entry_date: today,
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

  return (
    <>
      <Panel eyebrow="Workreport" title="Aktivitäten für heute tracken">
        {/* Das Datum steht direkt unter dem Titel: es ist die einzige
            Information, die der Eintrag nicht vom Nutzer erfragt. */}
        <p className="-mt-4 mb-7 inline-flex items-center gap-2.5 rounded-[8px] border border-border-gold bg-surface-3 px-4 py-2.5 text-[14px] font-medium text-text-1">
          <CalendarDays size={16} aria-hidden="true" className="shrink-0 text-gold" />
          {formatHeute(today)}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <fieldset className="border-0 p-0">
            <legend className="mb-1 font-sans text-[13px] font-semibold text-text-1">
              1. Auf welcher Plattform warst du unterwegs?
            </legend>
            <p className="mb-3 text-[13px] text-text-2">
              Jede Plattform wird getrennt getrackt — trag sie nacheinander ein.
            </p>
            <Segmented
              label="Plattform"
              value={platform}
              onChange={(next) => {
                if (!confirmDiscard()) return;
                setPlatform(next);
              }}
              options={PLATFORMS.map((p) => ({
                key: p.key,
                label: p.label,
                icon: <PlatformLogo platform={p.key} size={15} />,
              }))}
            />
          </fieldset>

          {existing && !loading && (
            <p className="mt-6 flex items-start gap-3 rounded-[8px] border border-border-gold bg-surface-3 px-4 py-3 text-[14px] text-text-2">
              <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-gold" />
              Für heute und {PLATFORM_LABEL[platform]} hast du schon etwas eingetragen.
              Die Zahlen unten stehen bereits drin — Speichern aktualisiert sie.
            </p>
          )}

          <fieldset className="mt-9 border-0 p-0">
            <legend className="mb-1 font-sans text-[13px] font-semibold text-text-1">
              2. Was hast du heute auf {PLATFORM_LABEL[platform]} gemacht?
            </legend>
            <p className="mb-4 text-[13px] text-text-2">
              Trag ein, was du wirklich geschafft hast. Leere Felder zählen als 0.
            </p>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {METRICS.map((metric) => (
                <NumberInput
                  key={metric.key}
                  label={metric.label}
                  hint={metric.hint}
                  value={values[metric.key]}
                  onValueChange={(next) => updateValue(metric.key, next)}
                  disabled={loading}
                  placeholder="0"
                />
              ))}
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="mt-6 text-[14px] text-danger">
              {error}
            </p>
          )}

          <div className="mt-9 flex flex-col-reverse items-stretch gap-3 border-t border-border-default pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-text-3">
              {saved && !dirty ? (
                <span className="inline-flex items-center gap-2 text-gold">
                  <Check size={15} aria-hidden="true" />
                  Für {PLATFORM_LABEL[platform]} gespeichert.
                </span>
              ) : (
                "Du kannst jederzeit nachbessern — Speichern überschreibt den heutigen Eintrag."
              )}
            </p>
            <Button
              type="submit"
              loading={saving}
              loadingLabel="Wird gespeichert…"
              disabled={loading}
              className="sm:min-w-[190px]"
            >
              Workreport speichern
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
        Deine Workreports findest du unter{" "}
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-[4px] text-gold transition-colors duration-[var(--dur)] ease-[var(--ease-ref)] hover:text-gold-bright"
        >
          Workreport Verlauf
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
        .
      </p>
    </>
  );
}
