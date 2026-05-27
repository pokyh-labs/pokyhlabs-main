"use client"

import LegalLayout, { Section, PH } from "@/components/LegalLayout"
import { legal, isPlaceholder } from "@/lib/legal.config"
import { siteConfig } from "@/lib/seo.config"
import { useT } from "@/lib/i18n/context"

export default function ImpressumContent() {
  const t = useT()
  return (
    <LegalLayout
      title={t("impressum_title")}
      lastUpdated={legal.lastUpdated}
      kickerText={t("legal_kicker")}
      standLabel={t("legal_updated")}
    >
      <p>{t("impressum_intro")}</p>

      <Section heading={t("impressum_s_provider")}>
        <address>
          <strong><PH value={legal.operatorName} /></strong><br />
          {legal.legalForm}<br />
          <PH value={legal.street} /><br />
          <PH value={legal.zip} /> <PH value={legal.city} /><br />
          {legal.province}<br />
          {legal.country}
        </address>
      </Section>

      <Section heading={t("impressum_s_contact")}>
        <p>
          E-Mail: <a href={`mailto:${legal.email}`}>{legal.email}</a><br />
          Telefon: <PH value={legal.phone} />
        </p>
      </Section>

      <Section heading={t("impressum_s_tax")}>
        <p>
          Partita IVA: <PH value={legal.vatId} /><br />
          Codice Fiscale: <PH value={legal.taxId} />
          {!isPlaceholder(legal.reaNumber) && legal.reaNumber !== "" && (
            <>
              <br />
              REA Bolzano: {legal.reaNumber}
            </>
          )}
        </p>
      </Section>

      <Section heading={t("impressum_s_responsible")}>
        <p><PH value={legal.operatorName} /></p>
      </Section>

      <Section heading={t("impressum_s_eu")}>
        <p>
          {t("impressum_eu_body").split("https://ec.europa.eu/consumers/odr")[0]}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
            https://ec.europa.eu/consumers/odr
          </a>
          {t("impressum_eu_body").split("https://ec.europa.eu/consumers/odr")[1]}
        </p>
      </Section>

      <Section heading={t("impressum_s_liability_content")}>
        <p>{t("impressum_liability_content_body")}</p>
      </Section>

      <Section heading={t("impressum_s_liability_links")}>
        <p>{t("impressum_liability_links_body")}</p>
      </Section>

      <Section heading={t("impressum_s_copyright")}>
        <p>{t("impressum_copyright_body")}</p>
        <p style={{ marginTop: "1.5rem", fontSize: 13, color: "rgba(12,12,12,0.55)" }}>
          {siteConfig.name} — {siteConfig.url}
        </p>
      </Section>
    </LegalLayout>
  )
}
