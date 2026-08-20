"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { SearchInput } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Auswertung } from "@/components/analytics/Auswertung";
import { createClient } from "@/lib/supabase/client";
import { METRICS, formatNumber, sumMetrics } from "@/lib/metrics";
import { getPeriod, isRangeKey, parseAnchor } from "@/lib/date-ranges";
import type { Entry, Profile } from "@/lib/types";
import { cn } from "@/lib/cn";

/** "MS" aus "Maria Schmidt" — gibt jeder Zeile einen Ankerpunkt fürs Auge. */
function initialen(name: string): string {
  const teile = name.trim().split(/\s+/).filter(Boolean);
  if (teile.length === 0) return "?";
  const erste = teile[0]?.[0] ?? "";
  const letzte = teile.length > 1 ? (teile[teile.length - 1]?.[0] ?? "") : "";
  return (erste + letzte).toUpperCase();
}

export function AdminStatistik() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlSelected = searchParams.get("chatter");
  // Local first, URL after — the highlight must not wait on the router.
  const [selectedId, setSelectedId] = useState<string | null>(urlSelected);
  useEffect(() => setSelectedId(urlSelected), [urlSelected]);
  const rangeParam = searchParams.get("range");
  const range = isRangeKey(rangeParam) ? rangeParam : "day";
  const anchor = parseAnchor(searchParams.get("date"));
  const period = useMemo(() => getPeriod(range, anchor), [range, anchor]);

  const [users, setUsers] = useState<Profile[]>([]);
  const [teamEntries, setTeamEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data, error: loadError } = await supabase
        .from("profiles")
        .select("*")
        .order("name");

      if (cancelled) return;

      if (loadError) {
        setError("Die Chatter konnten nicht geladen werden. Lade die Seite neu.");
        setLoading(false);
        return;
      }

      setUsers((data ?? []) as Profile[]);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Team totals for the selected period — admins read every row under RLS.
  useEffect(() => {
    let cancelled = false;

    async function loadTotals() {
      const supabase = createClient();
      const { data } = await supabase
        .from("entries")
        .select("*")
        .gte("entry_date", period.startISO)
        .lte("entry_date", period.endISO);

      if (!cancelled) setTeamEntries((data ?? []) as Entry[]);
    }

    void loadTotals();
    return () => {
      cancelled = true;
    };
  }, [period.startISO, period.endISO]);

  const selectChatter = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      const next = new URLSearchParams(searchParams.toString());
      if (id) next.set("chatter", id);
      else next.delete("chatter");
      startTransition(() => {
        router.replace(`?${next.toString()}`, { scroll: false });
      });
    },
    [router, searchParams],
  );

  const visibleUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term === "") return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term),
    );
  }, [users, search]);

  const selected = users.find((user) => user.id === selectedId) ?? null;
  const teamTotals = useMemo(() => sumMetrics(teamEntries), [teamEntries]);

  const list = (
    <div className="flex flex-col gap-6">
      <Panel eyebrow="Team" title="Chatter Tracking">
        <p className="-mt-3 mb-5 text-[14px] text-text-2">
          Wähle einen Chatter aus, um seine Workreports zu sehen.
        </p>

        <SearchInput
          label="Chatter suchen"
          placeholder="Nach Name oder E-Mail suchen…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="mt-6 rounded-[10px] border border-border-default bg-surface-2 p-4">
          <p className="font-display text-[11px] font-medium uppercase tracking-[0.08em] text-gold">
            Team gesamt · {period.label}
          </p>
          {/* Untereinander statt nebeneinander: in der 360px schmalen Spalte
              brechen drei Kennzahlen nebeneinander in zwei Zeilen um. */}
          <dl className="mt-3 flex flex-col gap-2">
            {METRICS.map((metric) => (
              <div key={metric.key} className="flex items-baseline justify-between gap-4">
                <dt className="min-w-0 text-[13px] text-text-2">{metric.label}</dt>
                <dd className="shrink-0 font-display text-[18px] font-medium tnum text-text-1">
                  {formatNumber(teamTotals[metric.key])}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-6">
          {loading ? (
            <EmptyState>Chatter werden geladen…</EmptyState>
          ) : visibleUsers.length === 0 ? (
            <EmptyState>
              Kein Chatter passt zu dieser Suche. Ändere den Suchbegriff.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {visibleUsers.map((user) => {
                const active = user.id === selectedId;
                return (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => selectChatter(user.id)}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-[10px] border px-3.5 py-3 text-left",
                        "transition-colors duration-[var(--dur)] ease-[var(--ease-ref)]",
                        active
                          ? "border-border-gold bg-surface-3"
                          : "border-transparent hover:border-border-default hover:bg-surface-2",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                          "font-display text-[12px] font-semibold tracking-[0.03em]",
                          active
                            ? "bg-gold text-on-gold"
                            : "bg-surface-2 text-text-2",
                        )}
                      >
                        {initialen(user.name)}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-sans text-[14px] font-medium text-text-1">
                          {user.name}
                        </span>
                        <span className="mt-0.5 block truncate text-[12.5px] text-text-3">
                          {user.email}
                        </span>
                      </span>

                      <ChevronRight
                        size={16}
                        aria-hidden="true"
                        className={cn(
                          "shrink-0",
                          active ? "text-gold" : "text-text-3",
                        )}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Panel>
    </div>
  );

  return (
    <>
      {error && (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      )}

      {/* ≥ 1024px: list beside the evaluation. */}
      <div className="hidden lg:grid lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start lg:gap-8">
        {list}
        <div className="flex flex-col gap-8">
          {selected ? (
            <Auswertung profileId={selected.id} heading={selected.name} />
          ) : (
            <Panel>
              <EmptyState>
                Wähle links einen Chatter aus, um seine Workreports zu sehen.
              </EmptyState>
            </Panel>
          )}
        </div>
      </div>

      {/* < 1024px: the list, and the evaluation as its own view. */}
      <div className="lg:hidden">
        {selected ? (
          <div className="flex flex-col gap-8">
            <button
              type="button"
              onClick={() => selectChatter(null)}
              className="inline-flex items-center gap-2 self-start rounded-[4px] px-1 py-1 font-sans text-[14px] text-gold transition-colors duration-[var(--dur)] ease-[var(--ease-ref)] hover:text-gold-bright"
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Zurück zur Liste
            </button>
            <Auswertung profileId={selected.id} heading={selected.name} />
          </div>
        ) : (
          list
        )}
      </div>
    </>
  );
}
