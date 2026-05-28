"use client";

import { useEffect, useRef } from "react";
import { useT } from "@/lib/i18n/context";

export default function Headline() {
  const ref = useRef<HTMLHeadingElement>(null);
  const t = useT();

  const lines = [
    { text: t("hero_line1"), bold: false },
    { text: t("hero_line2"), bold: true },
  ];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const lineEls = el.querySelectorAll<HTMLSpanElement>(".line");
    const stagger = 35;
    const lineGap = 120;
    lineEls.forEach((line, li) => {
      const text = (line.getAttribute("data-text") ?? "").trim();
      line.textContent = "";
      let idx = 0;
      for (const ch of text) {
        if (ch === " ") {
          const sp = document.createElement("span");
          sp.className = "sp";
          line.appendChild(sp);
          continue;
        }
        const s = document.createElement("span");
        s.className = "ch";
        s.textContent = ch;
        s.style.setProperty("--d", li * lineGap + idx * stagger + "ms");
        line.appendChild(s);
        idx++;
      }
    });
  }, [lines[0].text, lines[1].text]);

  return (
    <div className="headline-wrapper">
      <div className="headline-content">
        <h1
          ref={ref}
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
          {lines.map(({ text, bold }) => (
            <span
              key={text}
              className="line"
              data-text={text}
              suppressHydrationWarning
              style={{
                display: "block",
                fontWeight: bold ? 600 : undefined,
              }}
            >
              {text}
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
