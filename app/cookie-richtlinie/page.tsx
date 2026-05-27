import type { Metadata } from "next"
import LegalLayout, { Section } from "@/components/LegalLayout"
import CookieSettingsButton from "@/components/CookieSettingsButton"
import { legal } from "@/lib/legal.config"

export const metadata: Metadata = {
  title: "Cookie-Richtlinie",
  description: "Übersicht der auf pokyh.studio verwendeten Cookies und Speichermechanismen.",
  alternates: { canonical: "/cookie-richtlinie" },
}

export default function CookieRichtliniePage() {
  return (
    <LegalLayout title="Cookie-Richtlinie" lastUpdated={legal.lastUpdated}>
      <p>
        Diese Seite erläutert, welche Cookies und vergleichbaren Speichermechanismen wir einsetzen.
        Notwendige Speicherungen sind für den Betrieb erforderlich und einwilligungsfrei. Alle
        übrigen (Analyse) werden ausschließlich nach deiner Einwilligung aktiviert.
      </p>

      <Section heading="Notwendig (immer aktiv)">
        <ul>
          <li>
            <strong>pokyh-lang</strong> (localStorage) — speichert deine gewählte Sprache. Dauer:
            dauerhaft, bis du sie löschst.
          </li>
          <li>
            <strong>pokyh-consent</strong> (localStorage) — speichert deine Cookie-Auswahl, damit
            wir dich nicht erneut fragen. Dauer: dauerhaft, bis Widerruf/Löschung.
          </li>
          <li>
            <strong>Sitzungs-Token</strong> — nur bei Anmeldung im Adminbereich, zur
            Authentifizierung.
          </li>
        </ul>
      </Section>

      <Section heading="Analyse (nur mit Einwilligung)">
        <ul>
          <li>
            <strong>_ga, _ga_*</strong> (Google Analytics 4) — Cookies zur anonymisierten
            Reichweitenmessung. Anbieter: Google Ireland Limited. Dauer: bis zu 24 Monate. Werden
            erst nach Einwilligung gesetzt und beim Widerruf entfernt.
          </li>
        </ul>
        <p>
          Details zur Verarbeitung findest du in der{" "}
          <a href="/datenschutz">Datenschutzerklärung</a>.
        </p>
      </Section>

      <Section heading="Einwilligung verwalten">
        <p>
          Du kannst deine Auswahl jederzeit ändern oder widerrufen:
        </p>
        <p>
          <CookieSettingsButton
            style={{
              display: "inline-block",
              background: "#0c0c0c",
              color: "#e4e2dc",
              padding: "0.6rem 1.15rem",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Cookie-Einstellungen öffnen
          </CookieSettingsButton>
        </p>
      </Section>
    </LegalLayout>
  )
}
