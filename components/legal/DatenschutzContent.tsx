"use client"

import LegalLayout, { Section, PH } from "@/components/LegalLayout"
import { legal } from "@/lib/legal.config"
import { useT } from "@/lib/i18n/context"

export default function DatenschutzContent() {
  const t = useT()
  const s2body = t("datenschutz_s2_body").replace("{days}", String(legal.logRetentionDays))
  return (
    <LegalLayout
      title={t("datenschutz_title")}
      lastUpdated={legal.lastUpdated}
      kickerText={t("legal_kicker")}
      standLabel={t("legal_updated")}
    >
      <p>{t("datenschutz_intro")}</p>

      <Section heading={t("datenschutz_s1")}>
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

      <Section heading={t("datenschutz_s2")}>
        <p>{s2body}</p>
      </Section>

      <Section heading={t("datenschutz_s3")}>
        <p>{t("datenschutz_s3_body")}</p>
      </Section>

      <Section heading={t("datenschutz_s4")}>
        <p>{t("datenschutz_s4_body")}</p>
      </Section>

      <Section heading={t("datenschutz_s5")}>
        <p>{t("datenschutz_s5_body")}</p>
      </Section>

      <Section heading={t("datenschutz_s6")}>
        <p>
          {t("datenschutz_s6_body").split("/cookie-richtlinie")[0]}
          <a href="/cookie-richtlinie">{t("cookie_richtlinie_title")}</a>
          {t("datenschutz_s6_body").split("/cookie-richtlinie")[1]}
        </p>
      </Section>

      <Section heading={t("datenschutz_s7")}>
        <p>{t("datenschutz_s7_intro")}</p>
        <ul>
          <li>{t("datenschutz_right1")}</li>
          <li>{t("datenschutz_right2")}</li>
          <li>{t("datenschutz_right3")}</li>
          <li>{t("datenschutz_right4")}</li>
          <li>{t("datenschutz_right5")}</li>
          <li>{t("datenschutz_right6")}</li>
          <li>{t("datenschutz_right7")}</li>
        </ul>
        <p>
          {t("datenschutz_rights_contact")}{" "}
          <a href={`mailto:${legal.email}`}>{legal.email}</a>.
        </p>
      </Section>

      <Section heading={t("datenschutz_s8")}>
        <p>
          {t("datenschutz_s8_body").split("Garante per la protezione dei dati personali")[0]}
          <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">
            Garante per la protezione dei dati personali
          </a>
          {t("datenschutz_s8_body").split("Garante per la protezione dei dati personali")[1]}
        </p>
      </Section>
    </LegalLayout>
  )
}
