"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { AdminUserPayload, Profile, UserRole } from "@/lib/types";

interface UserModalProps {
  open: boolean;
  /** null = create, otherwise edit. */
  user: Profile | null;
  /** The signed-in admin, who may not demote themselves. */
  currentUserId: string;
  onClose: () => void;
  onSubmit: (payload: AdminUserPayload) => Promise<string | null>;
}

const ROLE_OPTIONS = [
  { value: "user", label: "Nutzer" },
  { value: "admin", label: "Admin" },
];

export function UserModal({
  open,
  user,
  currentUserId,
  onClose,
  onSubmit,
}: UserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setRole(user?.role ?? "user");
    setError(null);
    setDirty(false);
  }, [open, user]);

  const editingSelf = user?.id === currentUserId;

  function handleClose() {
    // Unsaved changes get one question, not a silent discard.
    if (dirty && !window.confirm("Du hast ungespeicherte Änderungen. Willst du sie verwerfen?")) {
      return;
    }
    onClose();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Bitte gib einen Namen ein.");
      return;
    }
    if (!email.trim()) {
      setError("Bitte gib eine E-Mail-Adresse ein.");
      return;
    }

    setSaving(true);
    setError(null);

    const message = await onSubmit({
      id: user?.id,
      name: name.trim(),
      email: email.trim(),
      role,
    });

    setSaving(false);

    if (message) {
      setError(message);
      return;
    }

    setDirty(false);
    onClose();
  }

  return (
    <Modal
      open={open}
      title={user ? "Nutzer bearbeiten" : "Nutzer erstellen"}
      onClose={handleClose}
      footer={
        <>
          <Button variant="neutral" onClick={handleClose} disabled={saving}>
            Abbrechen
          </Button>
          <Button
            type="submit"
            form="user-form"
            loading={saving}
            loadingLabel="Wird gespeichert…"
          >
            Speichern
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Name"
            value={name}
            placeholder="Vor- und Nachname"
            onChange={(event) => {
              setName(event.target.value);
              setDirty(true);
            }}
          />
          <Input
            label="E-Mail Adresse"
            type="email"
            value={email}
            placeholder="name@beispiel.de"
            onChange={(event) => {
              setEmail(event.target.value);
              setDirty(true);
            }}
          />
          <Select
            label="Rolle"
            value={role}
            disabled={editingSelf}
            options={ROLE_OPTIONS}
            onChange={(event) => {
              setRole(event.target.value as UserRole);
              setDirty(true);
            }}
          />
        </div>

        {editingSelf && (
          <p className="mt-3 text-[13px] text-text-2">
            Du kannst dir die Admin-Rolle nicht selbst entziehen.
          </p>
        )}

        {error && (
          <p role="alert" className="mt-6 text-[14px] text-danger">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
