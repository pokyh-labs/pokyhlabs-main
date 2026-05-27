import type { Metadata } from "next"
import LegalLayout, { Section, PH } from "@/components/LegalLayout"
import { legal } from "@/lib/legal.config"

export const metadata: Metadata = {
  title: "Widerrufsbelehrung",
  description: "Widerrufsrecht für Verbraucher und Muster-Widerrufsformular.",
  alternates: { canonical: "/widerruf" },
}

export default function WiderrufPage() {
  return (
    <LegalLayout title="Widerrufsbelehrung" lastUpdated={legal.lastUpdated}>
      <p>
        Die folgende Belehrung gilt für Verbraucher, d. h. jede natürliche Person, die ein
        Rechtsgeschäft zu Zwecken abschließt, die überwiegend weder ihrer gewerblichen noch ihrer
        selbständigen beruflichen Tätigkeit zugerechnet werden können.
      </p>

      <Section heading="Widerrufsrecht">
        <p>
          Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu
          widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.
        </p>
        <p>
          Um dein Widerrufsrecht auszuüben, musst du uns
        </p>
        <address>
          <strong><PH value={legal.operatorName} /></strong><br />
          <PH value={legal.street} /><br />
          <PH value={legal.zip} /> <PH value={legal.city} />, {legal.province}<br />
          {legal.country}<br />
          E-Mail: <a href={`mailto:${legal.email}`}>{legal.email}</a><br />
          Telefon: <PH value={legal.phone} />
        </address>
        <p>
          mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine
          E-Mail) über deinen Entschluss, diesen Vertrag zu widerrufen, informieren. Du kannst
          dafür das unten stehende Muster-Widerrufsformular verwenden, das jedoch nicht
          vorgeschrieben ist. Zur Wahrung der Widerrufsfrist reicht es aus, dass du die Mitteilung
          über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absendest.
        </p>
      </Section>

      <Section heading="Folgen des Widerrufs">
        <p>
          Wenn du diesen Vertrag widerrufst, haben wir dir alle Zahlungen, die wir von dir erhalten
          haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an
          dem die Mitteilung über deinen Widerruf bei uns eingegangen ist. Für die Rückzahlung
          verwenden wir dasselbe Zahlungsmittel, das du bei der ursprünglichen Transaktion
          eingesetzt hast, es sei denn, mit dir wurde ausdrücklich etwas anderes vereinbart.
        </p>
      </Section>

      <Section heading="Vorzeitiges Erlöschen des Widerrufsrechts">
        <p>
          Das Widerrufsrecht erlischt bei einem Vertrag zur Erbringung von Dienstleistungen, wenn
          wir die Dienstleistung vollständig erbracht haben und mit der Ausführung erst begonnen
          haben, nachdem du ausdrücklich zugestimmt hast und gleichzeitig bestätigt hast, dass dir
          bekannt ist, dass du dein Widerrufsrecht bei vollständiger Vertragserfüllung verlierst.
          Bei individuell nach Kundenspezifikation angefertigten Leistungen (z. B. maßgeschneiderte
          Software-/Webentwicklung) besteht zudem kein Widerrufsrecht.
        </p>
      </Section>

      <Section heading="Muster-Widerrufsformular">
        <p>
          (Wenn du den Vertrag widerrufen möchtest, fülle dieses Formular aus und sende es zurück.)
        </p>
        <div
          style={{
            border: "1px solid rgba(12,12,12,0.18)",
            borderRadius: 12,
            padding: "1.25rem 1.4rem",
            background: "rgba(255,255,255,0.35)",
          }}
        >
          <p style={{ margin: "0 0 0.75rem" }}>
            An <strong><PH value={legal.operatorName} /></strong>,{" "}
            <PH value={legal.street} />, <PH value={legal.zip} /> <PH value={legal.city} />,{" "}
            {legal.country}, E-Mail: {legal.email}:
          </p>
          <p style={{ margin: "0 0 0.75rem" }}>
            Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die
            Erbringung der folgenden Dienstleistung (*):
          </p>
          <p style={{ margin: "0 0 0.4rem" }}>______________________________________________</p>
          <ul style={{ margin: "0.75rem 0 0" }}>
            <li>Bestellt am (*) / erhalten am (*): ____________________</li>
            <li>Name des/der Verbraucher(s): ____________________</li>
            <li>Anschrift des/der Verbraucher(s): ____________________</li>
            <li>Datum: ____________________</li>
            <li>Unterschrift (nur bei Mitteilung auf Papier): ____________________</li>
          </ul>
          <p style={{ margin: "0.75rem 0 0", fontSize: 13, color: "rgba(12,12,12,0.6)" }}>
            (*) Unzutreffendes streichen.
          </p>
        </div>
      </Section>
    </LegalLayout>
  )
}
