"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { SearchInput } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Auswertung } from "@/components/analytics/Auswertung";
import { createClient } from "@/lib/supabase/client";
import { METRICS, formatNumber, sumMetrics } from "@/lib/metrics";
import { getPeriod, isRangeKey, parseAnchor } from "@/lib/date-ranges";
import type { Entry, Group, Profile, ProfileGroup, ProfileWithGroups } from "@/lib/types";
import { cn } from "@/lib/cn";

export function AdminStatistik() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedId = searchParams.get("chatter");
  const rangeParam = searchParams.get("range");
  const range = isRangeKey(rangeParam) ? rangeParam : "day";
  const anchor = parseAnchor(searchParams.get("date"));
  const period = useMemo(() => getPeriod(range, anchor), [range, anchor]);

  const [users, setUsers] = useState<ProfileWithGroups[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [teamEntries, setTeamEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const supabase = createClient();
      const [profilesResult, groupsResult, linksResult] = await Promise.all([
        supabase.from("profiles").select("*").order("name"),
        supabase.from("groups").select("*").order("name"),
        supabase.from("profile_groups").select("*"),
      ]);

      if (cancelled) return;

      if (profilesResult.error || groupsResult.error || linksResult.error) {
        setError("Die Chatter konnten nicht geladen werden. Lade die Seite neu.");
        setLoading(false);
        return;
      }

      const allGroups = (groupsResult.data ?? []) as Group[];
      const links = (linksResult.data ?? []) as ProfileGroup[];

      setGroups(allGroups);
      setUsers(
        ((profilesResult.data ?? []) as Profile[]).map((profile) => ({
          ...profile,
          groups: links
            .filter((link) => link.profile_id === profile.id)
            .map((link) => allGroups.find((group) => group.id === link.group_id))
            .filter((group): group is Group => group !== undefined),
        })),
      );
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
      const next = new URLSearchParams(searchParams.toString());
      if (id) next.set("chatter", id);
      else next.delete("chatter");
      router.replace(`?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const visibleUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesTerm = term === "" || user.name.toLowerCase().includes(term);
      const matchesGroup =
        groupFilter === "all" || user.groups.some((group) => group.id === groupFilter);
      return matchesTerm && matchesGroup;
    });
  }, [users, search, groupFilter]);

  const selected = users.find((user) => user.id === selectedId) ?? null;
  const teamTotals = useMemo(() => sumMetrics(teamEntries), [teamEntries]);

  const list = (
    <div className="flex flex-col gap-6">
      <Panel eyebrow="Team" title="Alle Chatter">
        <div className="flex flex-col gap-4">
          <SearchInput
            label="Chatter suchen"
            placeholder="Nach Name suchen…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            label="Gruppe"
            value={groupFilter}
            onChange={(event) => setGroupFilter(event.target.value)}
            options={[
              { value: "all", label: "Alle Gruppen" },
              ...groups.map((group) => ({ value: group.id, label: group.name })),
            ]}
          />
        </div>

        <div className="mt-6 border-t border-border-default pt-6">
          <p className="font-display text-[12px] uppercase tracking-[0.10em] text-text-2">
            Team gesamt · {period.label}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-3">
            {METRICS.map((metric) => (
              <div key={metric.key}>
                <dt className="text-[12px] text-text-3">{metric.label}</dt>
                <dd className="font-display text-[18px] tnum text-text-1">
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
              Kein Chatter passt zu dieser Suche. Ändere den Namen oder die Gruppe.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-2">
              {visibleUsers.map((user) => {
                const active = user.id === selectedId;
                return (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => selectChatter(user.id)}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "w-full rounded-[10px] border-l-2 px-4 py-3 text-left transition-colors duration-[160ms]",
                        active
                          ? "border-l-gold bg-surface-3"
                          : "border-l-transparent hover:bg-surface-2",
                      )}
                    >
                      <span className="block font-sans text-[15px] font-semibold text-text-1 break-anywhere">
                        {user.name}
                      </span>
                      <span className="mt-0.5 block text-[13px] text-text-2 break-anywhere">
                        {user.email}
                      </span>
                      {user.groups.length > 0 && (
                        <span className="mt-2 flex flex-wrap gap-2">
                          {user.groups.map((group) => (
                            <Chip key={group.id}>{group.name}</Chip>
                          ))}
                        </span>
                      )}
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
                Wähle links einen Chatter aus, um seine Zahlen zu sehen.
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
              className="inline-flex items-center gap-2 self-start rounded-[8px] px-1 py-1 font-sans text-[14px] text-gold transition-colors duration-[160ms] hover:text-gold-bright"
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
