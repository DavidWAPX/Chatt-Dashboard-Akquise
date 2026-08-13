"use client";

/** Temporary design preview — no auth, mock data. Removed after review. */

import { useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Trash2, UserPlus } from "lucide-react";
import { PillNav } from "@/components/layout/PillNav";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { Segmented } from "@/components/ui/Segmented";
import { StatCard } from "@/components/ui/StatCard";
import { Panel } from "@/components/ui/Panel";
import { Table, type Column } from "@/components/ui/Table";
import { Chip, CheckboxChip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { Button, IconButton } from "@/components/ui/Button";
import { Input, NumberInput } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Trichter } from "@/components/analytics/Trichter";
import { QuotenRinge } from "@/components/analytics/QuotenRinge";
import { VerlaufsDiagramm } from "@/components/analytics/VerlaufsDiagramm";
import { METRICS, PLATFORM_LABEL, formatNumber } from "@/lib/metrics";
import { getPeriod } from "@/lib/date-ranges";
import type { Entry, MetricValues, Platform } from "@/lib/types";

const TOTALS: MetricValues = {
  first_messages: 1842,
  conversations: 486,
  followups: 771,
  appointments: 124,
  qualified: 79,
  unqualified: 45,
};

const PREV: MetricValues = {
  first_messages: 1610,
  conversations: 512,
  followups: 690,
  appointments: 108,
  qualified: 64,
  unqualified: 51,
};

const SERIES: Record<string, number[]> = {
  first_messages: [42, 55, 61, 48, 70, 66, 74, 58, 81, 77, 69, 88, 92, 84],
  conversations: [12, 16, 14, 19, 22, 18, 24, 20, 26, 23, 21, 28, 30, 27],
  followups: [20, 24, 28, 22, 31, 27, 33, 29, 36, 34, 30, 38, 41, 37],
  appointments: [3, 5, 4, 6, 7, 5, 8, 6, 9, 7, 8, 10, 11, 9],
  qualified: [2, 3, 3, 4, 5, 3, 5, 4, 6, 5, 5, 7, 7, 6],
  unqualified: [1, 2, 1, 2, 2, 2, 3, 2, 3, 2, 3, 3, 4, 3],
};

const PLATFORMS: Platform[] = ["tiktok", "instagram", "x", "facebook"];

const USERS = [
  { id: "u1", name: "Jana Brünner", email: "jana.bruenner@beispiel.de", role: "Nutzer" },
  {
    id: "u2",
    name: "Maximilian von Hohenstein-Wertheim",
    email: "maximilian.von.hohenstein-wertheim@sehr-lange-domain-beispiel.de",
    role: "Admin",
  },
];

const ROWS: Entry[] = Array.from({ length: 6 }).map((_, i) => ({
  id: String(i),
  profile_id: "x",
  entry_date: `2026-08-${String(13 - i).padStart(2, "0")}`,
  platform: PLATFORMS[i % 4] ?? "tiktok",
  first_messages: 120 - i * 7,
  conversations: 34 - i * 2,
  followups: 51 - i * 3,
  appointments: 9 - (i % 4),
  qualified: 6 - (i % 3),
  unqualified: 3 + (i % 2),
  created_at: "",
  updated_at: "",
}));

const CHART_ENTRIES: Entry[] = Array.from({ length: 28 }).flatMap((_, d) =>
  PLATFORMS.map((p, pi) => ({
    id: `${d}-${p}`,
    profile_id: "x",
    entry_date: `2026-08-${String((d % 28) + 1).padStart(2, "0")}`,
    platform: p,
    first_messages: 30 + ((d * 7 + pi * 13) % 60),
    conversations: 8 + ((d * 3 + pi * 5) % 22),
    followups: 10 + ((d * 5) % 25),
    appointments: (d + pi) % 9,
    qualified: (d * 2) % 6,
    unqualified: (d + pi) % 5,
    created_at: "",
    updated_at: "",
  })),
);

export default function DesignPreview() {
  const [range, setRange] = useState("month");
  const [platform, setPlatform] = useState("all");
  const [entryPlatform, setEntryPlatform] = useState("tiktok");
  const [modalOpen, setModalOpen] = useState(false);
  const [checked, setChecked] = useState(true);
  const [numbers, setNumbers] = useState<Record<string, number | "">>({
    first_messages: 248,
    conversations: 64,
    followups: 112,
    appointments: 9,
    qualified: 6,
    unqualified: 3,
  });
  const period = getPeriod("month", new Date(2026, 7, 13));

  const columns: ReadonlyArray<Column<Entry>> = [
    {
      key: "date",
      head: "Datum",
      isTitle: true,
      cell: (row) => (
        <span className="font-sans text-[14px] font-medium tnum text-text-1">
          {row.entry_date}
        </span>
      ),
    },
    {
      key: "platform",
      head: "Plattform",
      cell: (row) => <Chip>{PLATFORM_LABEL[row.platform]}</Chip>,
    },
    ...METRICS.map((m) => ({
      key: m.key,
      head: m.short,
      align: "right" as const,
      cell: (row: Entry) => (
        <span className="text-[14px] tnum text-text-2" title={m.label}>
          {formatNumber(row[m.key])}
        </span>
      ),
    })),
  ];

  return (
    <>
      <PillNav role="admin" />
      <main className="content-shell stack-sections">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="shrink-0 text-[14px] font-normal text-text-2">Zeitraum:</span>
              <Segmented
                label="Zeitraum"
                value={range}
                onChange={setRange}
                options={[
                  { key: "day", label: "Tag" },
                  { key: "week", label: "Woche" },
                  { key: "month", label: "Monat" },
                  { key: "year", label: "Jahr" },
                ]}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="shrink-0 text-[14px] font-normal text-text-2">Plattform:</span>
              <Segmented
                label="Plattform"
                value={platform}
                onChange={setPlatform}
                options={[
                  { key: "all", label: "Alle" },
                  { key: "tiktok", label: "TikTok" },
                  { key: "instagram", label: "Instagram" },
                  { key: "x", label: "X" },
                  { key: "facebook", label: "Facebook" },
                ]}
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <IconButton label="Vorherige Periode">
              <ChevronLeft size={16} aria-hidden="true" />
            </IconButton>
            <p className="text-[15px] font-medium tracking-[0.01em] text-text-1">
              August 2026
            </p>
            <IconButton label="Nächste Periode" disabled>
              <ChevronRight size={16} aria-hidden="true" />
            </IconButton>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {METRICS.map((metric) => (
            <StatCard
              key={metric.key}
              label={metric.label}
              value={TOTALS[metric.key]}
              delta={TOTALS[metric.key] - PREV[metric.key]}
              deltaPercent={
                ((TOTALS[metric.key] - PREV[metric.key]) / PREV[metric.key]) * 100
              }
              series={SERIES[metric.key]}
            />
          ))}
        </div>

        <Panel bare eyebrow="August 2026" title="Trichter">
          <p className="-mt-2 mb-6 max-w-[62ch] text-[14px] text-text-2">
            Wie viel von der Kaltakquise am Ende übrig bleibt — vom Opener bis zur
            qualifizierten Person.
          </p>
          <div className="flex flex-col gap-8">
            <Trichter totals={TOTALS} />
            <QuotenRinge totals={TOTALS} />
          </div>
        </Panel>

        <Panel bare eyebrow="August 2026" title="Verlauf">
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:max-w-[560px]">
            <Select
              label="Kennzahl 1"
              defaultValue="first_messages"
              options={METRICS.map((m) => ({ value: m.key, label: m.label }))}
            />
            <Select
              label="Kennzahl 2"
              defaultValue="conversations"
              options={METRICS.map((m) => ({ value: m.key, label: m.label }))}
            />
          </div>
          <VerlaufsDiagramm
            entries={CHART_ENTRIES}
            range="month"
            period={period}
            selected={["first_messages", "conversations"]}
          />
        </Panel>

        <Panel bare eyebrow="August 2026" title="Alle Einträge">
          <Table
            caption="Demo"
            rows={ROWS}
            rowKey={(r) => r.id}
            columns={columns}
            empty="Noch keine Einträge."
          />
        </Panel>

        {/* Tageseintrag — same composition as the real form */}
        <Panel eyebrow="Tageseintrag" title="Zahlen erfassen">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Datum" type="date" defaultValue="2026-08-13" />
            <div>
              <p className="mb-2 font-sans text-[14px] font-medium text-text-1">Plattform</p>
              <Segmented
                label="Plattform"
                value={entryPlatform}
                onChange={setEntryPlatform}
                options={[
                  { key: "tiktok", label: "TikTok" },
                  { key: "instagram", label: "Instagram" },
                  { key: "x", label: "X" },
                  { key: "facebook", label: "Facebook" },
                ]}
              />
            </div>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {METRICS.map((m) => (
              <NumberInput
                key={m.key}
                label={m.label}
                value={numbers[m.key] ?? ""}
                onValueChange={(v) => setNumbers((n) => ({ ...n, [m.key]: v }))}
                placeholder="0"
              />
            ))}
          </div>
          <div className="mt-8 flex justify-end">
            <Button>Speichern</Button>
          </div>
        </Panel>

        {/* Benutzerverwaltung — panel header with action, plus the modal */}
        <Panel
          eyebrow="User Management"
          title="Team Management"
          action={
            <Button
              icon={<UserPlus size={16} aria-hidden="true" />}
              onClick={() => setModalOpen(true)}
            >
              Nutzer erstellen
            </Button>
          }
        >
          <Table
            caption="Benutzer"
            rows={USERS}
            rowKey={(r) => r.id}
            empty="Noch keine Benutzer."
            columns={[
              {
                key: "name",
                head: "Name",
                isTitle: true,
                cell: (r) => (
                  <span className="font-sans text-[14px] font-medium text-text-1 break-anywhere">
                    {r.name}
                  </span>
                ),
              },
              {
                key: "email",
                head: "E-Mail",
                cell: (r) => (
                  <span className="text-[13px] text-text-2 break-anywhere">{r.email}</span>
                ),
              },
              {
                key: "role",
                head: "Rolle",
                cell: (r) => <span className="text-[13px] text-text-2">{r.role}</span>,
              },
              {
                key: "groups",
                head: "Gruppen",
                cell: () => (
                  <div className="flex flex-wrap justify-end gap-2 tbl:justify-start">
                    <Chip>Gruppe 1</Chip>
                    <Chip>Gruppe 2</Chip>
                  </div>
                ),
              },
              {
                key: "actions",
                head: "Aktionen",
                isActions: true,
                align: "right",
                cell: () => (
                  <div className="flex justify-end gap-2">
                    <IconButton label="Bearbeiten">
                      <Pencil size={16} aria-hidden="true" />
                    </IconButton>
                    <IconButton label="Entfernen" variant="danger">
                      <Trash2 size={16} aria-hidden="true" />
                    </IconButton>
                  </div>
                ),
              },
            ]}
          />
        </Panel>
      </main>

      <Modal
        open={modalOpen}
        title="Nutzer erstellen"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="neutral" onClick={() => setModalOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={() => setModalOpen(false)}>Speichern</Button>
          </>
        }
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Name" placeholder="Vor- und Nachname" />
          <Input label="E-Mail Adresse" type="email" placeholder="name@beispiel.de" />
          <Select
            label="Rolle"
            options={[
              { value: "user", label: "Nutzer" },
              { value: "admin", label: "Admin" },
            ]}
          />
        </div>
        <p className="mt-8 font-display text-[11px] font-medium uppercase tracking-[0.08em] text-text-2">
          Zugewiesene Gruppen
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <CheckboxChip label="Gruppe 1" checked={checked} onChange={setChecked} />
          <CheckboxChip label="Gruppe 2" checked={!checked} onChange={() => setChecked(!checked)} />
        </div>
      </Modal>

      <LogoutButton />
    </>
  );
}
