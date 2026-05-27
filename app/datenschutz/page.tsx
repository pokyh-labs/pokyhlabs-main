import type { Metadata } from "next"
import LegalLayout, { Section, PH } from "@/components/LegalLayout"
import { legal } from "@/lib/legal.config"

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description:
    "Informationen zur Verarbeitung personenbezogener Daten auf pokyh.studio gemäß DSGVO.",
  alternates: { canonical: "/datenschutz" },
}

export default function DatenschutzPage() {
  return (
    <LegalLayout title="Datenschutzerklärung" lastUpdated={legal.lastUpdated}>
      <p>
        Diese Datenschutzerklärung informiert dich über die Verarbeitung personenbezogener Daten
        beim Besuch dieser Website gemäß der Datenschutz-Grundverordnung (DSGVO / GDPR) sowie dem
        italienischen Datenschutzrecht (D.Lgs. 196/2003 i. d. F. des D.Lgs. 101/2018).
      </p>

      <Section heading="1. Verantwortlicher">
        <address>
          <strong><PH value={legal.operatorName} /></strong><br />
          {legal.legalForm}<br />
          <PH value={legal.street} /><br />
          <PH value={legal.zip} /> <PH value={legal.city} />, {legal.province}<br />
          {legal.country}<br />
          E-Mail: <a href={`mailto:${legal.email}`}>{legal.email}</a><br />
          Telefon: <PH value={legal.phone} />
        </address>
      </Section>

      <Section heading="2. Server-Logs & Zugriffsdaten">
        <p>
          Beim Aufruf dieser Website werden durch unseren selbst betriebenen Server automatisch
          Informationen erfasst und in einer Protokolldatei (Server-Log) gespeichert. Erfasst
          werden:
        </p>
        <ul>
          <li>IP-Adresse des zugreifenden Geräts</li>
          <li>Datum und Uhrzeit des Zugriffs</li>
          <li>aufgerufene URL, HTTP-Methode und Statuscode</li>
          <li>Browser-Typ und -Version (User-Agent)</li>
          <li>ungefährer Standort (Land/Stadt), abgeleitet aus der IP-Adresse</li>
        </ul>
        <p>
          Die Standortbestimmung erfolgt über eine lokal auf dem Server installierte, offline
          arbeitende Datenbank (<em>geoip-lite</em>). Es werden hierfür keine Daten an Dritte
          übermittelt. Rechtsgrundlage ist unser berechtigtes Interesse an Betriebssicherheit und
          Missbrauchsabwehr (Art. 6 Abs. 1 lit. f DSGVO).
        </p>
        <p>
          Zur Abwehr von Angriffen protokollieren wir zudem auffällige Anfragen (z. B.
          fehlgeschlagene Logins, automatisierte Scans). Diese Sicherheitsprotokolle dienen
          ausschließlich der Gefahrenabwehr.
        </p>
        <p>
          <strong>Speicherdauer:</strong> Server- und Sicherheitslogs werden nach{" "}
          {legal.logRetentionDays} Tagen gelöscht, sofern sie nicht zur Aufklärung eines konkreten
          Sicherheitsvorfalls weiter benötigt werden.
        </p>
      </Section>

      <Section heading="3. Kontaktformular & Anfragen">
        <p>
          Wenn du uns über das Anfrage-/Kontaktformular kontaktierst, verarbeiten wir die von dir
          angegebenen Daten, um deine Anfrage zu bearbeiten und ein Angebot zu erstellen.
          Verarbeitet werden:
        </p>
        <ul>
          <li>Name</li>
          <li>E-Mail-Adresse</li>
          <li>Firma (optional)</li>
          <li>ausgewählte Leistungen, Projektbeschreibung, gewünschter Zeitrahmen</li>
          <li>ggf. angegebene Repository-/Datei-URL (bei Hosting-Anfragen)</li>
        </ul>
        <p>
          Rechtsgrundlage ist die Durchführung vorvertraglicher Maßnahmen bzw. die
          Vertragsanbahnung (Art. 6 Abs. 1 lit. b DSGVO) sowie unser berechtigtes Interesse an der
          Beantwortung von Anfragen (Art. 6 Abs. 1 lit. f DSGVO). Die Daten werden in unserer
          selbst gehosteten Datenbank gespeichert und gelöscht, sobald sie für die Bearbeitung
          nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten
          entgegenstehen.
        </p>
      </Section>

      <Section heading="4. Hosting">
        <p>
          Diese Website wird auf eigener bzw. angemieteter Infrastruktur betrieben und mittels der
          Deployment-Plattform <strong>Dokploy</strong> verwaltet. Die unter Punkt 2 genannten
          Zugriffsdaten fallen im Rahmen des Hostings an.
        </p>
      </Section>

      <Section heading="5. Cloudflare (Tunnel / Netzwerk)">
        <p>
          Die Auslieferung dieser Website erfolgt über einen Cloudflare-Tunnel der Cloudflare,
          Inc. (101 Townsend St, San Francisco, CA 94107, USA). Cloudflare verarbeitet dabei als
          Auftragsverarbeiter technische Verbindungsdaten (insbesondere IP-Adresse und
          HTTP-Header), um die Verbindung sicher und performant bereitzustellen. Rechtsgrundlage
          ist unser berechtigtes Interesse an einem sicheren, performanten Betrieb (Art. 6 Abs. 1
          lit. f DSGVO). Weitere Informationen:{" "}
          <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">
            cloudflare.com/privacypolicy
          </a>
          .
        </p>
      </Section>

      <Section heading="6. Google Analytics (nur mit Einwilligung)">
        <p>
          Mit deiner Einwilligung nutzen wir Google Analytics 4, einen Webanalysedienst der Google
          Ireland Limited (Gordon House, Barrow Street, Dublin 4, Irland). Google Analytics
          verwendet Cookies, die eine Analyse deiner Nutzung der Website ermöglichen. Wir haben die
          IP-Anonymisierung aktiviert.
        </p>
        <p>
          Das Analyse-Skript wird <strong>erst nach deiner aktiven Einwilligung</strong> über
          unseren Cookie-Banner geladen (Art. 6 Abs. 1 lit. a DSGVO). Du kannst deine Einwilligung
          jederzeit mit Wirkung für die Zukunft widerrufen — über den Link{" "}
          <strong>„Cookie-Einstellungen“</strong> im Seitenfuß oder auf der{" "}
          <a href="/cookie-richtlinie">Cookie-Richtlinie</a>-Seite. Beim Widerruf werden die von
          Google Analytics gesetzten Cookies entfernt. Bei einer Übermittlung von Daten in die USA
          stützt sich Google auf das EU-US Data Privacy Framework bzw.
          Standardvertragsklauseln.
        </p>
      </Section>

      <Section heading="7. Cookies & lokale Speicherung">
        <p>
          Wir setzen nur technisch notwendige Speichermechanismen ohne Einwilligung ein
          (Speicherung deiner Sprachwahl und deiner Cookie-Auswahl im <em>localStorage</em> deines
          Browsers; bei Anmeldung im Adminbereich ein Sitzungs-Token). Nicht notwendige Cookies
          (Google Analytics) werden ausschließlich nach Einwilligung gesetzt. Eine Übersicht
          findest du in der <a href="/cookie-richtlinie">Cookie-Richtlinie</a>.
        </p>
      </Section>

      <Section heading="8. Deine Rechte">
        <p>Dir stehen nach der DSGVO folgende Rechte zu:</p>
        <ul>
          <li>Auskunft über die zu dir gespeicherten Daten (Art. 15)</li>
          <li>Berichtigung unrichtiger Daten (Art. 16)</li>
          <li>Löschung (Art. 17)</li>
          <li>Einschränkung der Verarbeitung (Art. 18)</li>
          <li>Datenübertragbarkeit (Art. 20)</li>
          <li>Widerspruch gegen die Verarbeitung (Art. 21)</li>
          <li>Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft (Art. 7 Abs. 3)</li>
        </ul>
        <p>
          Zur Ausübung deiner Rechte genügt eine formlose Nachricht an{" "}
          <a href={`mailto:${legal.email}`}>{legal.email}</a>.
        </p>
      </Section>

      <Section heading="9. Beschwerderecht bei der Aufsichtsbehörde">
        <p>
          Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Die in
          Italien zuständige Behörde ist der{" "}
          <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">
            Garante per la protezione dei dati personali
          </a>{" "}
          (Piazza Venezia 11, 00187 Roma).
        </p>
      </Section>
    </LegalLayout>
  )
}
