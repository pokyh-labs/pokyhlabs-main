"use client"

import LegalLayout, { Section } from "@/components/LegalLayout"
import CookieSettingsButton from "@/components/CookieSettingsButton"
import { legal } from "@/lib/legal.config"
import { useT } from "@/lib/i18n/context"

export default function CookieRichtlinieContent() {
  const t = useT()
  return (
    <LegalLayout
      title={t("cookie_richtlinie_title")}
      lastUpdated={legal.lastUpdated}
      kickerText={t("legal_kicker")}
      standLabel={t("legal_updated")}
    >
      <p>{t("cookie_richtlinie_intro")}</p>

      <Section heading={t("cookie_richtlinie_s1")}>
        <ul>
          <li>
            <strong>pokyh-lang</strong> (localStorage) — {t("cookie_richtlinie_pokyh_lang")}
          </li>
          <li>
            <strong>pokyh-consent</strong> (localStorage) — {t("cookie_richtlinie_pokyh_consent")}
          </li>
          <li>
            <strong>{t("cookie_richtlinie_session_label")}</strong> — {t("cookie_richtlinie_session")}
          </li>
        </ul>
      </Section>

      <Section heading={t("cookie_richtlinie_s2")}>
        <p>{t("cookie_richtlinie_ga_body")}</p>
      </Section>

      <Section heading={t("cookie_richtlinie_s3")}>
        <p>{t("cookie_richtlinie_s3_body")}</p>
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
            {t("cookie_richtlinie_revoke_btn")}
          </CookieSettingsButton>
        </p>
      </Section>
    </LegalLayout>
  )
}
