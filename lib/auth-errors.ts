/**
 * Maps Supabase auth failures onto the exact wording from §4.
 * Raw provider errors are never shown to the user.
 */
export function loginErrorMessage(error: unknown): string {
  const raw =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : "";
  const message = raw.toLowerCase();

  const status =
    error && typeof error === "object" && "status" in error
      ? Number((error as { status: unknown }).status)
      : undefined;

  // Email not provisioned — with shouldCreateUser: false Supabase reports
  // "Signups not allowed for otp" / "user not found".
  if (
    message.includes("signups not allowed") ||
    message.includes("signup is disabled") ||
    message.includes("user not found") ||
    message.includes("invalid login credentials")
  ) {
    return "Diese E-Mail-Adresse ist nicht freigeschaltet. Wende dich an deinen Admin.";
  }

  if (message.includes("expired")) {
    return "Der Code ist abgelaufen. Fordere einen neuen an.";
  }

  if (status === 429 || message.includes("rate limit") || message.includes("too many")) {
    return "Zu viele Versuche. Warte eine Minute und versuche es erneut.";
  }

  if (
    message.includes("invalid") ||
    message.includes("token") ||
    message.includes("otp")
  ) {
    return "Der Code stimmt nicht. Prüfe die Eingabe oder fordere einen neuen an.";
  }

  return "Das hat nicht geklappt. Versuche es noch einmal.";
}
