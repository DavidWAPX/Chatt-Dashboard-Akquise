export type UserRole = "user" | "admin";

/* "x" ist aus der Oberfläche verschwunden, bleibt aber im Typ: der
   Datenbank-Enum kennt den Wert weiter, und alte Zeilen sollen nicht
   plötzlich einem unbekannten Typ entsprechen. */
export type Platform = "tiktok" | "instagram" | "facebook" | "x";

/* Die drei Zahlen, die ein Workreport erfasst. */
export type MetricKey = "first_messages" | "replies" | "appointments";

/** Die drei Freitextfelder eines Workreports. */
export type TextKey = "used_opener" | "search_terms" | "notes";

/* These are type aliases rather than interfaces on purpose: supabase-js
   requires rows to be assignable to Record<string, unknown>, and only type
   aliases get the implicit index signature that makes that work. */

export type Profile = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
};

export type MetricValues = Record<MetricKey, number>;
export type TextValues = Record<TextKey, string>;

export type Entry = MetricValues &
  TextValues & {
    id: string;
    profile_id: string;
    entry_date: string; // yyyy-MM-dd
    platform: Platform;
    created_at: string;
    updated_at: string;
  };

/** One row of the Google Sheet. Read-only — never stored, never written. */
export type Lead = {
  /** Sheet row number; stable enough to key a list. */
  id: string;
  name: string;
  email: string;
  telefon: string;
  lead_status: string;
  lead_von: string;
  notizen: string;
  setting_activity: string;
  closing_activity: string;
  termin_buchungsdatum: string;
};

/** Payload for creating or updating a user through app/api/admin/users. */
export type AdminUserPayload = {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
};

/**
 * Hand-written schema types, shaped like `supabase gen types` output.
 * Views/Functions/CompositeTypes and Relationships must be present, otherwise
 * the client's generics fall back to `never`.
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at"> & { created_at?: string };
        Update: Partial<Omit<Profile, "id">>;
        Relationships: [];
      };
      entries: {
        Row: Entry;
        Insert: Omit<Entry, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Entry, "id">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      platform: Platform;
    };
    CompositeTypes: Record<string, never>;
  };
};
