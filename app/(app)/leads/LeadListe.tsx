"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Search, X } from "lucide-react";
import { Table, type Column } from "@/components/ui/Table";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { LeadStatusChip } from "@/components/leads/LeadStatusChip";
import { InfoButton } from "@/components/leads/InfoButton";
import { formatNumber } from "@/lib/metrics";
import type { Lead } from "@/lib/types";
import { refreshLeads } from "./actions";

interface LeadListeProps {
  /** The signed-in chatter's name — matched against "Lead von" on the server. */
  profileName: string;
  /** Already filtered server-side; never contains other chatters' rows. */
  leads: Lead[];
  fetchedAt: string | null;
  problem: "unreachable" | "not-shared" | null;
}

const ALL = "all";

/** The sheet stores numbers without the leading plus. */
function formatPhone(value: string): string {
  const digits = value.replace(/[^\d]/g, "");
  if (digits === "") return "—";
  return `+${digits}`;
}

interface OpenText {
  title: string;
  lead: string;
  text: string;
}

export function LeadListe({ profileName, leads, fetchedAt, problem }: LeadListeProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [open, setOpen] = useState<OpenText | null>(null);

  function handleRefresh() {
    startTransition(async () => {
      await refreshLeads();
      router.refresh();
    });
  }

  const statusOptions = useMemo(() => {
    const values = [...new Set(leads.map((lead) => lead.lead_status.trim()))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "de"));
    return [
      { value: ALL, label: "Alle Leads" },
      ...values.map((value) => ({ value, label: value })),
    ];
  }, [leads]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (status !== ALL && lead.lead_status.trim() !== status) return false;
      if (term === "") return true;
      // Search covers the hidden long texts too, not just what is on screen.
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
      width: "20%",
      cell: (lead) => (
        <span className="font-sans text-[14px] font-medium text-text-1">
          {lead.name || "—"}
        </span>
      ),
    },
    {
      key: "email",
      head: "Email",
      width: "24%",
      cell: (lead) => (
        <span className="text-[13px] text-text-2 break-anywhere">{lead.email || "—"}</span>
      ),
    },
    {
      key: "telefon",
      head: "Telefon",
      width: "16%",
      cell: (lead) => (
        <span className="whitespace-nowrap text-[13px] tnum text-text-2">
          {formatPhone(lead.telefon)}
        </span>
      ),
    },
    {
      key: "lead_status",
      head: "Lead Status",
      width: "16%",
      cell: (lead) => <LeadStatusChip status={lead.lead_status} />,
    },
    {
      key: "notizen",
      head: "Notizen",
      width: "8%",
      cell: (lead) => (
        <InfoButton
          text={lead.notizen}
          onOpen={() =>
            setOpen({ title: "Notizen", lead: lead.name, text: lead.notizen })
          }
        />
      ),
    },
    {
      key: "setting_activity",
      head: "Setting Aktivität",
      width: "8%",
      cell: (lead) => (
        <InfoButton
          text={lead.setting_activity}
          onOpen={() =>
            setOpen({
              title: "Setting Aktivität",
              lead: lead.name,
              text: lead.setting_activity,
            })
          }
        />
      ),
    },
    {
      key: "closing_activity",
      head: "Closing Aktivität",
      width: "8%",
      cell: (lead) => (
        <InfoButton
          text={lead.closing_activity}
          onOpen={() =>
            setOpen({
              title: "Closing Aktivität",
              lead: lead.name,
              text: lead.closing_activity,
            })
          }
        />
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
    <>
      {/* One framed card, like the other dashboards: gold heading, a line of
          explanation, search on the right, then the table inside its frame. */}
      <section className="rounded-[12px] border border-panel-border bg-surface-1 p-5 tbl:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-[19px] font-medium uppercase tracking-[0.05em] text-gold tbl:text-[21px]">
              Lead Status
            </h1>
            <p className="mt-2 max-w-[70ch] text-[14px] text-text-2">
              Hier siehst du alle Leads, die dir als{" "}
              <span className="text-text-1">{profileName}</span> zugeordnet sind, und wo
              sie gerade stehen.
            </p>
          </div>
          <Button
            variant="neutral"
            onClick={handleRefresh}
            loading={pending}
            loadingLabel="Wird geladen…"
            icon={<RefreshCw size={15} aria-hidden="true" />}
            className="shrink-0 enabled:hover:border-gold enabled:hover:text-gold-bright enabled:hover:shadow-[0_0_0_3px_var(--focus-ring)]"
          >
            Aktualisieren
          </Button>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
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
              placeholder="Name oder Status suchen…"
              className="h-[47px] w-full rounded-[6px] border border-input-border bg-input-bg pl-11 pr-11 text-[15.2px] text-text-1 placeholder:text-text-3 focus:border-gold focus:shadow-[0_0_0_3px_var(--focus-ring)] focus:outline-none"
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

          <div className="w-full sm:w-[220px]">
            <Select
              label="Status"
              hideLabel
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              options={statusOptions}
            />
          </div>
        </div>

        <div className="mt-3 mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-text-3">
          <span className="tnum">
            {filtered
              ? `${formatNumber(visible.length)} von ${formatNumber(leads.length)} Einträge`
              : `${formatNumber(leads.length)} Einträge`}
          </span>
          {stamp && <span aria-hidden="true">·</span>}
          {stamp && <span>Stand {stamp}</span>}
        </div>

        {problem === "not-shared" && (
          <p className="mb-5 text-[14px] text-text-2">
            Die Google-Tabelle ist nicht freigegeben. Stell sie auf „Jeder mit dem Link –
            Betrachter“, dann erscheinen die Leads hier automatisch.
          </p>
        )}

        <Table
          framed
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
      </section>

      <Modal
        open={open !== null}
        title={open?.title ?? ""}
        onClose={() => setOpen(null)}
        footer={
          <Button variant="neutral" onClick={() => setOpen(null)}>
            Schließen
          </Button>
        }
      >
        {open && (
          <>
            <p className="-mt-2 mb-4 text-[13px] text-text-3">
              Lead: <span className="text-text-2">{open.lead || "ohne Namen"}</span>
            </p>
            {/* The sheet's own line breaks are kept — they carry the structure. */}
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-text-2 break-anywhere">
              {open.text}
            </p>
          </>
        )}
      </Modal>
    </>
  );
}
