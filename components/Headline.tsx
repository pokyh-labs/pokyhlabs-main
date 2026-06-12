"use client";

import { useT } from "@/lib/i18n/context";
import CharFlyIn from "@/components/CharFlyIn";

export default function Headline() {
  const t = useT();

  const lines = [
    { text: t("hero_line1"), bold: false },
    { text: t("hero_line2"), bold: true },
  ];

  return (
    <div className="headline-wrapper">
      <div className="headline-content">
        <h1
          style={{
            width: "100%",
            color: "#0c0c0c",
            fontWeight: 500,
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            fontSize: "clamp(28px, 5.6vw, 96px)",
            userSelect: "none",
          }}
        >
          {lines.map(({ text, bold }, li) => (
            <span
              key={text}
              className="line"
              style={{
                display: "block",
                fontWeight: bold ? 600 : undefined,
              }}
            >
              <CharFlyIn text={text} lineIndex={li} />
            </span>
          ))}
        </h1>
        <p
          data-speakable="true"
          style={{
            marginTop: "1.5rem",
            fontFamily: "var(--font-dm-mono), 'JetBrains Mono', monospace",
            fontSize: "clamp(1rem, 1.4vw, 1.25rem)",
            fontWeight: 400,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#0c0c0c",
            opacity: 0.7,
            userSelect: "none",
            animation: "chIn 0.6s cubic-bezier(0.22, 0.61, 0.36, 1) 900ms both",
          }}
        >
          {t("hero_subline")}
        </p>
      </div>
    </div>

  );
}
