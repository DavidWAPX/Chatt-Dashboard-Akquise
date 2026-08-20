import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminUserPayload, UserRole } from "@/lib/types";

/**
 * Every handler here runs the same first step: prove the caller is a signed-in
 * admin. Only then does the service-role client come into play.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return {
      error: NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 }),
    };
  }

  return { callerId: user.id };
}

function isValidPayload(body: unknown): body is AdminUserPayload {
  if (!body || typeof body !== "object") return false;
  const candidate = body as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0 &&
    typeof candidate.email === "string" &&
    candidate.email.trim().length > 0 &&
    (candidate.role === "user" || candidate.role === "admin")
  );
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const body: unknown = await request.json();
  if (!isValidPayload(body)) {
    return NextResponse.json({ error: "Name, E-Mail und Rolle sind nötig." }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  if (createError || !created.user) {
    const message = createError?.message?.toLowerCase() ?? "";
    if (message.includes("already") || message.includes("registered")) {
      return NextResponse.json(
        { error: "Diese E-Mail-Adresse ist bereits angelegt." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Der Nutzer konnte nicht angelegt werden." },
      { status: 500 },
    );
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    email,
    name: body.name.trim(),
    role: body.role as UserRole,
  });

  if (profileError) {
    // Roll the auth user back so no orphan is left behind.
    await admin.auth.admin.deleteUser(created.user.id);
    const message = profileError.message?.toLowerCase() ?? "";
    if (message.includes("duplicate") || message.includes("unique")) {
      return NextResponse.json(
        { error: "Diese E-Mail-Adresse ist bereits angelegt." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Das Profil konnte nicht angelegt werden." },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: created.user.id }, { status: 201 });
}

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const body: unknown = await request.json();
  if (!isValidPayload(body) || typeof body.id !== "string") {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const targetId = body.id;
  const email = body.email.trim().toLowerCase();
  const admin = createAdminClient();

  // An admin must not strip their own admin rights.
  if (targetId === guard.callerId && body.role !== "admin") {
    return NextResponse.json(
      { error: "Du kannst dir die Admin-Rolle nicht selbst entziehen." },
      { status: 400 },
    );
  }

  const { data: current } = await admin
    .from("profiles")
    .select("email")
    .eq("id", targetId)
    .maybeSingle();

  if (!current) {
    return NextResponse.json({ error: "Nutzer nicht gefunden." }, { status: 404 });
  }

  if (current.email !== email) {
    const { error: emailError } = await admin.auth.admin.updateUserById(targetId, {
      email,
      email_confirm: true,
    });

    if (emailError) {
      const message = emailError.message?.toLowerCase() ?? "";
      if (message.includes("already") || message.includes("registered")) {
        return NextResponse.json(
          { error: "Diese E-Mail-Adresse ist bereits angelegt." },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: "Die E-Mail-Adresse konnte nicht geändert werden." },
        { status: 500 },
      );
    }
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ name: body.name.trim(), email, role: body.role as UserRole })
    .eq("id", targetId);

  if (updateError) {
    return NextResponse.json(
      { error: "Die Änderungen konnten nicht gespeichert werden." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { searchParams } = new URL(request.url);
  const targetId = searchParams.get("id");

  if (!targetId) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  if (targetId === guard.callerId) {
    return NextResponse.json(
      { error: "Du kannst dein eigenes Konto nicht entfernen." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Deleting the auth user cascades to profiles and entries.
  const { error } = await admin.auth.admin.deleteUser(targetId);

  if (error) {
    return NextResponse.json(
      { error: "Der Nutzer konnte nicht entfernt werden." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
