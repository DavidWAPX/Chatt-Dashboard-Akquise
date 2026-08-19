"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Search, X } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Table, type Column } from "@/components/ui/Table";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { LeadStatusChip } from "@/components/leads/LeadStatusChip";
import { formatNumber } from "@/lib/metrics";
import type { Lead } from "@/lib/types";
import { refreshLeads } from "./actions";

interface LeadListeProps {
  /** The signed-in chatter's name — matched against "Lead von" on the server. */
  profileName: string;
  isAdmin: boolean;
  /** Already filtered server-side; never contains other chatters' rows. */
  leads: Lead[];
  /** How many rows exist for the current scope. */
  total: number;
  /** True when `leads` is only the newest slice of `total`. */
  capped: boolean;
  /** Chatter names for the admin filter. */
  owners: string[];
  /** Currently selected chatter (admin only). */
  chatter: string;
  fetchedAt: string | null;
  problem: "unreachable" | "not-shared" | null;
}

const ALL = "all";

export function LeadListe({
  profileName,
  isAdmin,
  leads,
  total,
  capped,
  owners,
  chatter,
  fetchedAt,
  problem,
}: LeadListeProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);

  function handleRefresh() {
    startTransition(async () => {
      await refreshLeads();
      router.refresh();
    });
  }

  /** The chatter filter re-queries on the server, so only the chosen
      chatter's rows are ever sent to the browser. */
  function handleChatter(value: string) {
    startTransition(() => {
      router.push(value === ALL ? "/leads" : `/leads?chatter=${encodeURIComponent(value)}`);
    });
  }

  const statusOptions = useMemo(() => {
    const values = [...new Set(leads.map((lead) => lead.lead_status.trim()))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "de"));
    return [
      { value: ALL, label: "Alle Status" },
      ...values.map((value) => ({ value, label: value })),
    ];
  }, [leads]);

  const ownerOptions = useMemo(
    () => [
      { value: ALL, label: "Alle Chatter" },
      ...owners.map((value) => ({ value, label: value })),
    ],
    [owners],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (status !== ALL && lead.lead_status.trim() !== status) return false;
      if (term === "") return true;
      // Search spans everything on screen, so a status or a note finds a row too.
      return [
        lead.name,
        lead.email,
        lead.telefon,
        lead.lead_status,
        lead.notizen,
        lead.setting_activity,
        lead.closing_activity,
      ].some((value) => value.toLowerCase().includes(term));
    });
  }, [leads, search, status]);

  const filtered = search.trim() !== "" || status !== ALL;

  const columns: ReadonlyArray<Column<Lead>> = [
    {
      key: "name",
      head: "Name",
      isTitle: true,
      cell: (lead) => (
        <span className="font-sans text-[14px] font-medium text-text-1 break-anywhere">
          {lead.name || "—"}
        </span>
      ),
    },
    {
      key: "email",
      head: "Email",
      cell: (lead) => (
        <span className="text-[13px] text-text-2 break-anywhere">{lead.email || "—"}</span>
      ),
    },
    {
      key: "telefon",
      head: "Telefon",
      cell: (lead) => (
        <span className="whitespace-nowrap text-[13px] tnum text-text-2">
          {lead.telefon || "—"}
        </span>
      ),
    },
    {
      key: "lead_status",
      head: "Lead Status",
      cell: (lead) => <LeadStatusChip status={lead.lead_status} />,
    },
    {
      key: "notizen",
      head: "Notizen",
      cell: (lead) => (
        <span className="text-[13px] text-text-2 break-anywhere">{lead.notizen || "—"}</span>
      ),
    },
    {
      key: "setting_activity",
      head: "Setting Aktivität",
      cell: (lead) => (
        <span className="text-[13px] text-text-2 break-anywhere">
          {lead.setting_activity || "—"}
        </span>
      ),
    },
    {
      key: "closing_activity",
      head: "Closing Aktivität",
      cell: (lead) => (
        <span className="text-[13px] text-text-2 break-anywhere">
          {lead.closing_activity || "—"}
        </span>
      ),
    },
  ];

  const stamp = fetchedAt
    ? new Date(fetchedAt).toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Panel
      bare
      eyebrow={isAdmin ? "Alle Chatter" : profileName}
      title="Lead Status"
      action={
        <Button
          variant="neutral"
          onClick={handleRefresh}
          loading={pending}
          loadingLabel="Wird geladen…"
          icon={<RefreshCw size={15} aria-hidden="true" />}
        >
          Aktualisieren
        </Button>
      }
    >
      {/* Toolbar: search carries the width, filters stay compact. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="lead-search" className="sr-only">
            Leads durchsuchen
          </label>
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-3"
          />
          <input
            id="lead-search"
            type="text"
            autoComplete="off"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, Email, Telefon, Status oder Notiz…"
            className="h-[47px] w-full rounded-[4px] border border-input-border bg-input-bg pl-11 pr-11 text-[15.2px] text-text-1 placeholder:text-text-3 focus:border-gold focus:shadow-[0_0_0_3px_var(--focus-ring)] focus:outline-none"
          />
          {search !== "" && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Suche zurücksetzen"
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-text-3 hover:bg-surface-2 hover:text-text-1"
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <div className="w-full sm:w-[190px]">
            <Select
              label="Status"
              hideLabel
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              options={statusOptions}
            />
          </div>
          {isAdmin && (
            <div className="w-full sm:w-[190px]">
              <Select
                label="Chatter"
                hideLabel
                value={chatter === "" ? ALL : chatter}
                onChange={(event) => handleChatter(event.target.value)}
                options={ownerOptions}
              />
            </div>
          )}
        </div>
      </div>

      {/* One quiet status line instead of banners scattered around. */}
      <div className="mt-3 mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-text-3">
        <span className="tnum">
          {filtered
            ? `${formatNumber(visible.length)} von ${formatNumber(leads.length)} Leads`
            : `${formatNumber(total)} Leads`}
        </span>
        {capped && <span aria-hidden="true">·</span>}
        {capped && (
          <span>
            neueste {formatNumber(leads.length)} geladen — wähl einen Chatter für dessen
            vollständige Liste
          </span>
        )}
        {stamp && <span aria-hidden="true">·</span>}
        {stamp && <span>Stand {stamp}</span>}
      </div>

      {problem === "not-shared" && (
        <p className="mb-6 text-[14px] text-text-2">
          Die Google-Tabelle ist nicht freigegeben. Stell sie auf „Jeder mit dem Link –
          Betrachter“, dann erscheinen die Leads hier automatisch.
        </p>
      )}

      {/* The table is always here, headers included — it never pops into
          existence with the first row. */}
      <Table
        caption="Lead Status"
        rows={visible}
        rowKey={(lead) => lead.id}
        columns={columns}
        empty={
          filtered
            ? "Kein Lead passt zu dieser Suche. Ändere den Suchbegriff oder den Filter."
            : "Keine Leads vorhanden, bitte aktualisiere deine Einträge."
        }
      />
    </Panel>
  );
}
