"use client";

import type { CSSProperties } from "react";

const socialLinkStyle: CSSProperties = {
  width: 34,
  height: 34,
  display: "grid",
  placeItems: "center",
  color: "#0c0c0c",
  textDecoration: "none",
  transition: "transform .2s ease, opacity .2s ease",
};

function SocialLink({
  href,
  label,
  target,
  children,
}: {
  href: string;
  label: string;
  target?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target={target}
      rel={target === "_blank" ? "noopener" : undefined}
      style={socialLinkStyle}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.opacity = "0.65";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "";
        (e.currentTarget as HTMLElement).style.opacity = "";
      }}
    >
      {children}
    </a>
  );
}

export default function Socials() {
  return (
    <aside
      aria-label="Socials"
      style={{
        position: "absolute",
        left: 42,
        bottom: 32,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 22,
      }}
    >
      <SocialLink href="https://github.com/pokyh-labs" label="GitHub" target="_blank">
        <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 32, height: 32, fill: "currentColor" }}>
          <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.04 1.53 1.04.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.69-4.57 4.94.36.31.68.91.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
        </svg>
      </SocialLink>

      <SocialLink href="mailto:hello@pokyh.studio" label="Email">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          style={{
            width: 32,
            height: 32,
            fill: "none",
            stroke: "currentColor",
            strokeWidth: 1.7,
            strokeLinecap: "round",
            strokeLinejoin: "round",
          }}
        >
          <rect x="3" y="5" width="18" height="14" rx="1.5" />
          <path d="M3.5 6.5l8.5 6 8.5-6" />
        </svg>
      </SocialLink>

      <SocialLink href="https://discord.gg/ffhK8ztv9C" label="Discord" target="_blank">
        <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 32, height: 32, fill: "currentColor" }}>
          <path d="M19.27 5.33A17.4 17.4 0 0 0 15.05 4l-.21.43a16.1 16.1 0 0 0-5.68 0L8.95 4a17.4 17.4 0 0 0-4.22 1.33C2 9.46 1.26 13.5 1.63 17.47a17.6 17.6 0 0 0 5.37 2.7l1.08-1.5a11.3 11.3 0 0 1-1.72-.83l.42-.33a12.5 12.5 0 0 0 10.44 0l.42.33a11.3 11.3 0 0 1-1.72.83l1.08 1.5a17.6 17.6 0 0 0 5.37-2.7c.43-4.6-.7-8.6-3.1-12.14zM8.52 14.9c-1.06 0-1.93-.99-1.93-2.2 0-1.22.85-2.2 1.93-2.2 1.08 0 1.95.99 1.93 2.2 0 1.21-.85 2.2-1.93 2.2zm6.96 0c-1.06 0-1.93-.99-1.93-2.2 0-1.22.85-2.2 1.93-2.2s1.95.99 1.93 2.2c0 1.21-.85 2.2-1.93 2.2z" />
        </svg>
      </SocialLink>
    </aside>
  );
}
