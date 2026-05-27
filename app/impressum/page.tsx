import type { Metadata } from "next"
import LegalLayout, { Section, PH } from "@/components/LegalLayout"
import { legal, isPlaceholder } from "@/lib/legal.config"
import { siteConfig } from "@/lib/seo.config"

export const metadata: Metadata = {
  title: "Impressum",
  description: "Anbieterkennzeichnung und rechtliche Angaben zu pokyh.studio.",
  alternates: { canonical: "/impressum" },
}

export default function ImpressumPage() {
  return (
    <LegalLayout title="Impressum" lastUpdated={legal.lastUpdated}>
      <p>
        Angaben gemäß den geltenden gesetzlichen Vorschriften (u. a. Art. 5 EU-Richtlinie
        2000/31/EG / D.Lgs. 70/2003, Italien).
      </p>

      <Section heading="Anbieter">
        <address>
          <strong><PH value={legal.operatorName} /></strong><br />
          {legal.legalForm}<br />
          <PH value={legal.street} /><br />
          <PH value={legal.zip} /> <PH value={legal.city} /><br />
          {legal.province}<br />
          {legal.country}
        </address>
      </Section>

      <Section heading="Kontakt">
        <p>
          E-Mail: <a href={`mailto:${legal.email}`}>{legal.email}</a><br />
          Telefon: <PH value={legal.phone} />
        </p>
      </Section>

      <Section heading="Umsatzsteuer / Steuerliche Angaben">
        <p>
          Umsatzsteuer-Identifikationsnummer (Partita IVA): <PH value={legal.vatId} /><br />
          Steuernummer (Codice Fiscale): <PH value={legal.taxId} />
          {!isPlaceholder(legal.reaNumber) && legal.reaNumber !== "" && (
            <>
              <br />
              Eintrag Handelskammer Bozen (REA): {legal.reaNumber}
            </>
          )}
        </p>
      </Section>

      <Section heading="Verantwortlich für den Inhalt">
        <p>
          <PH value={legal.operatorName} />, Anschrift wie oben.
        </p>
      </Section>

      <Section heading="EU-Streitschlichtung">
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
            https://ec.europa.eu/consumers/odr
          </a>
          . Unsere E-Mail-Adresse findest du oben. Wir sind nicht verpflichtet und grundsätzlich
          nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
          teilzunehmen.
        </p>
      </Section>

      <Section heading="Haftung für Inhalte">
        <p>
          Die Inhalte dieser Seiten wurden mit größtmöglicher Sorgfalt erstellt. Für die
          Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr
          übernehmen. Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den
          allgemeinen Gesetzen verantwortlich.
        </p>
      </Section>

      <Section heading="Haftung für Links">
        <p>
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
          Einfluss haben. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter
          oder Betreiber verantwortlich.
        </p>
      </Section>

      <Section heading="Urheberrecht">
        <p>
          Die durch den Betreiber erstellten Inhalte und Werke auf diesen Seiten (Texte, Grafiken,
          Code, 3D-Inhalte) unterliegen dem Urheberrecht. Beiträge Dritter sind als solche
          gekennzeichnet. Vervielfältigung, Bearbeitung oder Verbreitung außerhalb der Grenzen des
          Urheberrechts bedürfen der schriftlichen Zustimmung des jeweiligen Urhebers.
        </p>
        <p style={{ marginTop: "1.5rem", fontSize: 13, color: "rgba(12,12,12,0.55)" }}>
          {siteConfig.name} — {siteConfig.url}
        </p>
      </Section>
    </LegalLayout>
  )
}
