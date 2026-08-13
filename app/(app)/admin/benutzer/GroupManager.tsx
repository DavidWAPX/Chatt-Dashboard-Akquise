"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";
import type { Group, ProfileWithGroups } from "@/lib/types";

interface GroupManagerProps {
  groups: readonly Group[];
  users: readonly ProfileWithGroups[];
  onChanged: () => Promise<void>;
}

export function GroupManager({ groups, users, onChanged }: GroupManagerProps) {
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Group | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Bitte gib einen Gruppennamen ein.");
      return;
    }

    setAdding(true);
    setError(null);

    const supabase = createClient();
    // Groups are written under RLS — only admins pass the policy.
    const { error: insertError } = await supabase.from("groups").insert({ name: trimmed });

    setAdding(false);

    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "Diese Gruppe gibt es schon."
          : "Die Gruppe konnte nicht angelegt werden.",
      );
      return;
    }

    setName("");
    await onChanged();
  }

  async function handleDelete() {
    if (!pendingDelete) return;

    setDeleting(true);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("groups")
      .delete()
      .eq("id", pendingDelete.id);

    setDeleting(false);

    if (deleteError) {
      setError("Die Gruppe konnte nicht entfernt werden.");
      setPendingDelete(null);
      return;
    }

    setPendingDelete(null);
    await onChanged();
  }

  const affectedCount = pendingDelete
    ? users.filter((user) => user.groups.some((group) => group.id === pendingDelete.id))
        .length
    : 0;

  return (
    <>
      <Panel eyebrow="Gruppen" title="Benutzergruppen">
        {groups.length === 0 ? (
          <p className="text-[15px] text-text-3">
            Noch keine Gruppen. Leg unten die erste an.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {groups.map((group) => (
              <Chip
                key={group.id}
                onRemove={() => setPendingDelete(group)}
                removeLabel={`Gruppe ${group.name} entfernen`}
              >
                {group.name}
              </Chip>
            ))}
          </div>
        )}

        <form
          onSubmit={handleAdd}
          className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <div className="sm:max-w-[320px] sm:flex-1">
            <Input
              label="Neue Gruppe"
              value={name}
              placeholder="Name der Gruppe"
              onChange={(event) => setName(event.target.value)}
              error={error ?? undefined}
            />
          </div>
          <Button
            type="submit"
            loading={adding}
            loadingLabel="Wird angelegt…"
            icon={<Plus size={16} aria-hidden="true" />}
          >
            Hinzufügen
          </Button>
        </form>
      </Panel>

      <Modal
        open={pendingDelete !== null}
        title="Gruppe entfernen"
        onClose={() => setPendingDelete(null)}
        footer={
          <>
            <Button variant="neutral" onClick={() => setPendingDelete(null)} disabled={deleting}>
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
        <p className="text-[14px] text-text-2">
          Willst du <strong className="text-text-1">{pendingDelete?.name}</strong> wirklich
          entfernen?{" "}
          {affectedCount === 0
            ? "Aktuell ist kein Nutzer dieser Gruppe zugeordnet."
            : `${affectedCount} ${affectedCount === 1 ? "Nutzer verliert" : "Nutzer verlieren"} diese Zuordnung.`}{" "}
          Die Nutzer selbst bleiben bestehen.
        </p>
      </Modal>
    </>
  );
}
