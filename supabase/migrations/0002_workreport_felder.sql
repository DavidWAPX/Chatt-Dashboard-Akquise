-- ===========================================================================
-- Workreport: neue Kennzahl und Freitexte
--
-- "Followup Nachrichten" wird nicht mehr erfasst, dafür "Antwort erhalten",
-- und jeder Eintrag bekommt drei Freitextfelder. Im SQL-Editor des Projekts
-- einmal ausführen.
-- ===========================================================================

alter table entries
  add column if not exists replies      integer not null default 0 check (replies >= 0),
  add column if not exists used_opener  text    not null default '',
  add column if not exists search_terms text    not null default '',
  add column if not exists notes        text    not null default '';

-- Bereits erfasste Followup-Zahlen sind nicht dasselbe wie erhaltene
-- Antworten; die Spalte fällt weg, statt eine Bedeutung zu erben, die sie
-- nie hatte.
alter table entries drop column if exists followups;
