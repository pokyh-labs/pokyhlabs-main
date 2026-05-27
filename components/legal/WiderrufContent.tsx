"use client"

import LegalLayout, { Section, PH } from "@/components/LegalLayout"
import { legal } from "@/lib/legal.config"
import { useT } from "@/lib/i18n/context"

export default function WiderrufContent() {
  const t = useT()
  return (
    <LegalLayout
      title={t("widerruf_title")}
      lastUpdated={legal.lastUpdated}
      kickerText={t("legal_kicker")}
      standLabel={t("legal_updated")}
    >
      <p>{t("widerruf_intro")}</p>

      <Section heading={t("widerruf_s1")}>
        <p>{t("widerruf_s1_body")}</p>
        <address style={{ marginTop: "1rem" }}>
          <strong><PH value={legal.operatorName} /></strong><br />
          <PH value={legal.street} /><br />
          <PH value={legal.zip} /> <PH value={legal.city} />, {legal.province}<br />
          {legal.country}<br />
          E-Mail: <a href={`mailto:${legal.email}`}>{legal.email}</a><br />
          Tel: <PH value={legal.phone} />
        </address>
      </Section>

      <Section heading={t("widerruf_s2")}>
        <p>{t("widerruf_s2_body")}</p>
      </Section>

      <Section heading={t("widerruf_s3")}>
        <p>{t("widerruf_s3_body")}</p>
      </Section>

      <Section heading={t("widerruf_s4")}>
        <p>{t("widerruf_form_intro")}</p>
        <div
          style={{
            border: "1px solid rgba(12,12,12,0.18)",
            borderRadius: 12,
            padding: "1.25rem 1.4rem",
            background: "rgba(255,255,255,0.35)",
            marginTop: "1rem",
          }}
        >
          <p style={{ margin: "0 0 0.75rem" }}>
            {t("widerruf_form_to")} <strong><PH value={legal.operatorName} /></strong>,{" "}
            <PH value={legal.street} />, <PH value={legal.zip} /> <PH value={legal.city} />,{" "}
            {legal.country}, E-Mail: {legal.email}:
          </p>
          <p style={{ margin: "0 0 0.75rem" }}>{t("widerruf_form_declaration")}</p>
          <p style={{ margin: "0 0 0.4rem" }}>______________________________________________</p>
          <ul style={{ margin: "0.75rem 0 0" }}>
            <li>{t("widerruf_form_ordered")} ____________________</li>
            <li>{t("widerruf_form_name")} ____________________</li>
            <li>{t("widerruf_form_address")} ____________________</li>
            <li>{t("widerruf_form_date")} ____________________</li>
            <li>{t("widerruf_form_signature")} ____________________</li>
          </ul>
        </div>
      </Section>
    </LegalLayout>
  )
}
