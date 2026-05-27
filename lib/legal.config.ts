import { siteConfig } from "@/lib/seo.config"

// ── Betreiberdaten (rechtlich erforderlich) ───────────────────────────────────
// Einzelunternehmen / Ditta individuale in Südtirol (Italien).
//
// WICHTIG: Alle mit [...] markierten Felder VOR dem Go-Live ausfüllen.
// Die Rechtsseiten markieren leere Platzhalter sichtbar (siehe isPlaceholder()).
// Felder, die nicht zutreffen (z. B. reaNumber), einfach auf "" setzen — dann
// werden sie auf den Seiten ausgeblendet.

export const legal = {
  // Pflicht — Impressum
  operatorName: "[DEIN VOLLER NAME — z. B. Felix Plattner]",
  legalForm:    "Einzelunternehmen / Ditta individuale",
  street:       "[STRASSE + HAUSNUMMER]",
  zip:          "[PLZ]",
  city:         "[ORT]",
  province:     "Südtirol / Alto Adige",
  country:      "Italien / Italia",

  // Steuerlich (Italien)
  vatId:  "[P.IVA — z. B. IT01234567890]",
  taxId:  "[Codice Fiscale / Steuernummer]",
  // Eintrag Handelskammer Bozen (Registro Imprese / REA) — falls vorhanden,
  // sonst leer lassen ("") und die Zeile wird ausgeblendet.
  reaNumber: "[REA-Nr. Handelskammer Bozen — sonst leer lassen]",

  // Kontakt
  email: siteConfig.social.email, // hello@pokyh.studio
  phone: "[TELEFONNUMMER]",

  // Aufbewahrungsfrist Server-Logs (muss im Backend tatsächlich umgesetzt werden!)
  logRetentionDays: 90,

  // Stand der Rechtstexte (bei Änderungen aktualisieren)
  lastUpdated: "2026-05-27",
}

// true, wenn ein Feld noch ein unausgefüllter Platzhalter ist (beginnt mit "[")
export function isPlaceholder(value: string): boolean {
  return typeof value === "string" && value.trim().startsWith("[")
}

// Vollständige, einzeilige Anschrift für JSON-LD / Fließtext
export function formattedAddress(): string {
  return [
    legal.street,
    `${legal.zip} ${legal.city}`,
    `${legal.province}, ${legal.country}`,
  ].join(", ")
}
