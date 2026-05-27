"use client"

import LegalLayout, { Section, PH } from "@/components/LegalLayout"
import { legal } from "@/lib/legal.config"
import { useT } from "@/lib/i18n/context"

export default function AGBContent() {
  const t = useT()
  return (
    <LegalLayout
      title={t("agb_title")}
      lastUpdated={legal.lastUpdated}
      kickerText={t("legal_kicker")}
      standLabel={t("legal_updated")}
    >
      <Section heading={t("agb_s1")}>
        <p>
          {t("agb_s1_body").split("dem Anbieter")[0]}
          <PH value={legal.operatorName} />
          {t("agb_s1_body").split("dem Anbieter").slice(1).join("dem Anbieter")}
        </p>
      </Section>
      <Section heading={t("agb_s2")}><p>{t("agb_s2_body")}</p></Section>
      <Section heading={t("agb_s3")}><p>{t("agb_s3_body")}</p></Section>
      <Section heading={t("agb_s4")}><p>{t("agb_s4_body")}</p></Section>
      <Section heading={t("agb_s5")}><p>{t("agb_s5_body")}</p></Section>
      <Section heading={t("agb_s6")}><p>{t("agb_s6_body")}</p></Section>
      <Section heading={t("agb_s7")}><p>{t("agb_s7_body")}</p></Section>
      <Section heading={t("agb_s8")}><p>{t("agb_s8_body")}</p></Section>
      <Section heading={t("agb_s9")}><p>{t("agb_s9_body")}</p></Section>
      <Section heading={t("agb_s10")}><p>{t("agb_s10_body")}</p></Section>
    </LegalLayout>
  )
}
