import { siFacebook, siInstagram, siTiktok } from "simple-icons";
import type { Platform } from "@/lib/types";

/*
 * Die echten Markenzeichen, nicht nachgezeichnete Symbole: die Pfade kommen
 * aus simple-icons, damit TikTok auch wie TikTok aussieht.
 *
 * Bewusst einfarbig statt in den Markenfarben. TikToks Logo ist offiziell
 * schwarz und wäre auf dieser Oberfläche unsichtbar, und drei bunte Logos
 * nebeneinander würden das ruhige Schwarz-Gold der App zerschlagen. Die Form
 * allein erkennt jeder wieder; die Farbe erbt das Logo von seinem Umfeld, so
 * wird es zusammen mit dem Text gold, wenn etwas ausgewählt ist.
 */
const PFADE: Record<Platform, string | null> = {
  tiktok: siTiktok.path,
  instagram: siInstagram.path,
  facebook: siFacebook.path,
  // X wurde aus dem Produkt entfernt; alte Einträge zeigen nur den Namen.
  x: null,
};

interface PlatformLogoProps {
  platform: Platform;
  /** Kantenlänge in Pixeln. */
  size?: number;
  className?: string;
}

export function PlatformLogo({ platform, size = 16, className }: PlatformLogoProps) {
  const pfad = PFADE[platform];
  if (!pfad) return null;

  return (
    <svg
      role="img"
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
    >
      <path d={pfad} />
    </svg>
  );
}
