import type { Metadata } from "next"
import LegalLayout, { Section, PH } from "@/components/LegalLayout"
import { legal } from "@/lib/legal.config"

export const metadata: Metadata = {
  title: "AGB",
  description: "Allgemeine Geschäftsbedingungen für die Leistungen von pokyh.studio.",
  alternates: { canonical: "/agb" },
}

export default function AGBPage() {
  return (
    <LegalLayout title="Allgemeine Geschäftsbedingungen" lastUpdated={legal.lastUpdated}>
      <Section heading="1. Geltungsbereich">
        <p>
          Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen{" "}
          <PH value={legal.operatorName} /> ({legal.legalForm}, nachfolgend „Anbieter“) und dem
          Kunden über die Erbringung von Dienstleistungen im Bereich Webdesign, Web- und
          App-Entwicklung, 3D-Inhalte, SEO sowie Hosting. Abweichende Bedingungen des Kunden werden
          nur mit ausdrücklicher schriftlicher Zustimmung Vertragsbestandteil.
        </p>
      </Section>

      <Section heading="2. Vertragsschluss & Angebot">
        <p>
          Anfragen über das Kontaktformular sind unverbindlich. Auf Basis der Anfrage erstellt der
          Anbieter ein individuelles Angebot. Der Vertrag kommt erst mit ausdrücklicher Annahme des
          Angebots (in Textform) durch beide Parteien zustande. Die auf der Website genannten
          Preise — mit Ausnahme des Hosting-Fixpreises — stellen keine verbindlichen Angebote dar.
        </p>
      </Section>

      <Section heading="3. Leistungen der Entwicklung (Werkleistung)">
        <p>
          Umfang, Inhalt und Zeitrahmen der Entwicklungsleistungen ergeben sich aus dem
          individuellen Angebot bzw. der Projektbeschreibung. Der Anbieter erbringt die Leistungen
          mit der gebotenen Sorgfalt nach dem aktuellen Stand der Technik. Mitwirkungsleistungen des
          Kunden (z. B. Bereitstellung von Inhalten, Zugängen, Freigaben) sind rechtzeitig zu
          erbringen; dadurch verursachte Verzögerungen gehen nicht zu Lasten des Anbieters.
        </p>
      </Section>

      <Section heading="4. Hosting">
        <p>
          Der Anbieter bietet verwaltetes Hosting zum Fixpreis von <strong>€20 pro Monat</strong>{" "}
          (zzgl. etwaiger gesetzlicher Steuern) an. Das Hosting-Verhältnis läuft auf unbestimmte
          Zeit und kann von beiden Seiten mit einer Frist von 30 Tagen zum Monatsende gekündigt
          werden. Der Anbieter bemüht sich um eine hohe Verfügbarkeit, schuldet jedoch keine
          ununterbrochene Erreichbarkeit; notwendige Wartungsarbeiten werden nach Möglichkeit
          angekündigt.
        </p>
      </Section>

      <Section heading="5. Preise & Zahlung">
        <p>
          Alle Preise verstehen sich zzgl. der jeweils gesetzlichen Umsatzsteuer, sofern
          ausweisbar. Rechnungen sind, sofern nicht anders vereinbart, innerhalb von 14 Tagen ab
          Rechnungsdatum ohne Abzug zur Zahlung fällig.
        </p>
        <p>
          <strong>Online-Zahlungen:</strong> Derzeit erfolgt die Abrechnung per Rechnung
          (Überweisung). Eine Online-Bezahlung über den Zahlungsdienstleister Stripe ist in
          Vorbereitung. Sobald aktiv, werden die Zahlungsdaten direkt durch Stripe verarbeitet; es
          gelten ergänzend die Bedingungen und die Datenschutzerklärung von Stripe. Diese Klausel
          wird mit Aktivierung des Zahlungsmoduls entsprechend konkretisiert.
        </p>
      </Section>

      <Section heading="6. Nutzungsrechte">
        <p>
          Nach vollständiger Bezahlung räumt der Anbieter dem Kunden die vereinbarten Nutzungsrechte
          an den erstellten Werken ein. Bis zur vollständigen Zahlung bleiben alle Rechte beim
          Anbieter. Eingesetzte Drittkomponenten (Open-Source-Bibliotheken, Schriften, Frameworks)
          unterliegen den jeweiligen Lizenzbedingungen.
        </p>
      </Section>

      <Section heading="7. Gewährleistung & Haftung">
        <p>
          Es gelten die gesetzlichen Gewährleistungsrechte. Der Anbieter haftet unbeschränkt bei
          Vorsatz und grober Fahrlässigkeit sowie bei der Verletzung von Leben, Körper und
          Gesundheit. Bei einfacher Fahrlässigkeit haftet der Anbieter nur bei Verletzung
          wesentlicher Vertragspflichten und der Höhe nach begrenzt auf den vorhersehbaren,
          typischerweise eintretenden Schaden.
        </p>
      </Section>

      <Section heading="8. Widerrufsrecht für Verbraucher">
        <p>
          Verbrauchern steht unter den gesetzlichen Voraussetzungen ein Widerrufsrecht zu. Die
          Einzelheiten ergeben sich aus der <a href="/widerruf">Widerrufsbelehrung</a>.
        </p>
      </Section>

      <Section heading="9. Schlussbestimmungen">
        <p>
          Es gilt italienisches Recht unter Ausschluss des UN-Kaufrechts. Zwingende
          verbraucherschützende Vorschriften des Staates, in dem der Verbraucher seinen
          gewöhnlichen Aufenthalt hat, bleiben unberührt. Sollte eine Bestimmung dieser AGB
          unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
        </p>
      </Section>
    </LegalLayout>
  )
}
