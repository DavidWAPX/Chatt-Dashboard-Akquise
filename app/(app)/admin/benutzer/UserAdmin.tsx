"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button, IconButton } from "@/components/ui/Button";
import { Table, type Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/client";
import type { AdminUserPayload, Profile } from "@/lib/types";
import { UserModal } from "./UserModal";

const ROLE_LABEL: Record<string, string> = { user: "Nutzer", admin: "Admin" };

export function UserAdmin({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from("profiles")
      .select("*")
      .order("name");

    if (loadError) {
      setError("Die Benutzerdaten konnten nicht geladen werden. Lade die Seite neu.");
      setLoading(false);
      return;
    }

    setUsers((data ?? []) as Profile[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Returns an error message, or null on success. */
  async function submitUser(payload: AdminUserPayload): Promise<string | null> {
    const response = await fetch("/api/admin/users", {
      method: payload.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      const message =
        body && typeof body === "object" && "error" in body
          ? String((body as { error: unknown }).error)
          : "Das hat nicht geklappt. Versuche es noch einmal.";
      return message;
    }

    await load();
    return null;
  }

  async function handleDelete() {
    if (!pendingDelete) return;

    setDeleting(true);
    const response = await fetch(`/api/admin/users?id=${pendingDelete.id}`, {
      method: "DELETE",
    });
    setDeleting(false);

    if (!response.ok) {
      setError("Der Nutzer konnte nicht entfernt werden.");
      setPendingDelete(null);
      return;
    }

    setPendingDelete(null);
    await load();
  }

  const columns: ReadonlyArray<Column<Profile>> = [
    {
      key: "name",
      head: "Name",
      isTitle: true,
      width: "28%",
      cell: (row) => (
        <span className="font-sans text-[14px] font-medium text-text-1 break-anywhere">
          {row.name}
        </span>
      ),
    },
    {
      key: "email",
      head: "E-Mail",
      width: "36%",
      cell: (row) => (
        <span className="text-[13px] text-text-2 break-anywhere">{row.email}</span>
      ),
    },
    {
      key: "role",
      head: "Rolle",
      width: "16%",
      cell: (row) => (
        <span className="text-[13px] text-text-2">{ROLE_LABEL[row.role] ?? row.role}</span>
      ),
    },
    {
      key: "actions",
      head: "Aktionen",
      isActions: true,
      width: "20%",
      align: "right",
      cell: (row) => {
        const isSelf = row.id === currentUserId;
        return (
          <div className="flex justify-end gap-2">
            <IconButton
              label={`${row.name} bearbeiten`}
              onClick={() => {
                setEditing(row);
                setModalOpen(true);
              }}
            >
              <Pencil size={16} aria-hidden="true" />
            </IconButton>
            <IconButton
              label={`${row.name} entfernen`}
              variant="danger"
              disabled={isSelf}
              title={
                isSelf
                  ? "Du kannst dein eigenes Konto nicht entfernen."
                  : `${row.name} entfernen`
              }
              onClick={() => setPendingDelete(row)}
            >
              <Trash2 size={16} aria-hidden="true" />
            </IconButton>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <Panel
        eyebrow="Admin"
        title="Benutzer verwalten"
        action={
          <Button
            icon={<UserPlus size={16} aria-hidden="true" />}
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            Nutzer erstellen
          </Button>
        }
      >
        {error && (
          <p role="alert" className="mb-6 text-[14px] text-danger">
            {error}
          </p>
        )}

        {loading ? (
          <EmptyState>Benutzer werden geladen…</EmptyState>
        ) : (
          <Table
            framed
            caption="Alle Benutzer"
            rows={users}
            rowKey={(row) => row.id}
            columns={columns}
            empty="Noch keine Benutzer. Leg oben rechts den ersten an."
          />
        )}
      </Panel>

      <UserModal
        open={modalOpen}
        user={editing}
        currentUserId={currentUserId}
        onClose={() => setModalOpen(false)}
        onSubmit={submitUser}
      />

      <Modal
        open={pendingDelete !== null}
        title="Nutzer entfernen"
        onClose={() => setPendingDelete(null)}
        footer={
          <>
            <Button
              variant="neutral"
              onClick={() => setPendingDelete(null)}
              disabled={deleting}
            >
              Abbrechen
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
              loadingLabel="Wird entfernt…"
            >
              Entfernen
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-text-2 break-anywhere">
          Willst du <strong className="text-text-1">{pendingDelete?.name}</strong> wirklich
          entfernen? Alle Einträge dieses Nutzers werden gelöscht.
        </p>
      </Modal>
    </>
  );
}
