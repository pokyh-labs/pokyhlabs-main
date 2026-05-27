"use client"

import { useT } from "@/lib/i18n/context"

export default function ScrollIndicator() {
  const t = useT()
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "50%",
        bottom: 24,
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        color: "#0c0c0c",
        fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
        fontSize: 11,
        letterSpacing: "0.32em",
        textTransform: "uppercase",
        pointerEvents: "none",
      }}
    >
      <span style={{ display: "inline-block", fontWeight: 700, fontSize: 12 }}>{t("scroll")}</span>
      <svg
        viewBox="0 0 14 28"
        aria-hidden="true"
        style={{ width: 14, height: 28, display: "block" }}
      >
        {/* ghost */}
        <path d="M7 2 V19" style={{ stroke: "rgba(12,12,12,.18)", strokeWidth: 1.5, fill: "none", strokeLinecap: "butt" }} />
        <path d="M7 19 L2 14" style={{ stroke: "rgba(12,12,12,.18)", strokeWidth: 1.5, fill: "none", strokeLinecap: "butt" }} />
        <path d="M7 19 L12 14" style={{ stroke: "rgba(12,12,12,.18)", strokeWidth: 1.5, fill: "none", strokeLinecap: "butt" }} />
        {/* animated */}
        <path d="M7 2 V19" className="scroll-stem" />
        <path d="M7 19 L2 14" className="scroll-branch" />
        <path d="M7 19 L12 14" className="scroll-branch" />
      </svg>
    </div>
  );
}
