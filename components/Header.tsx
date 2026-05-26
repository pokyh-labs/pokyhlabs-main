"use client";

import { useEffect, useRef, useState } from "react";


const SPRING = "cubic-bezier(0.32, 0.72, 0, 1)";
const DUR = "0.5s";
const COLOR_DUR = "0.35s";

type Lang = "DE" | "EN" | "IT";
const LANGS: { code: Lang; label: string }[] = [
  { code: "DE", label: "Deutsch" },
  { code: "EN", label: "English" },
  { code: "IT", label: "Italiano" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const SAMPLE_Y = 36;
    const check = () => {
      const targets = document.querySelectorAll<HTMLElement>(
        'footer, [data-theme="dark"]'
      );
      let isDark = false;
      let footerNear = false;
      for (const t of targets) {
        const r = t.getBoundingClientRect();
        if (r.top <= SAMPLE_Y && r.bottom >= SAMPLE_Y) isDark = true;
        if (t.tagName === "FOOTER" && r.top <= 80) footerNear = true;
      }
      setDark(isDark);
      setAtBottom(footerNear);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  const textColor = dark ? "#e4e2dc" : "#0c0c0c";
  const pillBg = scrolled
    ? dark
      ? "rgba(12, 12, 14, 0.95)"
      : "rgba(252, 250, 246, 0.95)"
    : "transparent";
  const pillBorder = "none";

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        padding: "14px 32px",
        background: pillBg,
        border: pillBorder,
        borderRadius: 0,
        backdropFilter: scrolled ? "blur(12px) saturate(1.4)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px) saturate(1.4)" : "none",
        color: textColor,
        transform: atBottom ? "translateY(-130%)" : "translateY(0)",
        opacity: atBottom ? 0 : 1,
        pointerEvents: atBottom ? "none" : "auto",
        transition: [
          `background ${COLOR_DUR} ease`,
          `border-color ${COLOR_DUR} ease`,
          `color ${COLOR_DUR} ease`,
          `transform ${DUR} ${SPRING}`,
          `opacity ${COLOR_DUR} ease`,
        ].join(", "),
      }}
    >
      <a
        href="/"
        aria-label="pokyh.studio home"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
          justifySelf: "start",
        }}
      >
        <img
          src="/assets/logo.png"
          alt="pokyh.studio logo"
          width={36}
          height={36}
          style={{ display: "block", objectFit: "contain", width: 36, height: 36 }}
        />
        <span
          style={{
            fontWeight: 800,
            fontStyle: "italic",
            fontSize: 22,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
            lineHeight: 1,
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            display: "flex",
            alignItems: "baseline",
          }}
        >
          <span>pokyh</span>
          <span
            style={{
              display: "inline-block",
              width: "0.28em",
              height: "0.28em",
              background: dark ? "#e4e2dc" : "#0c0c0c",
              borderRadius: "50%",
              margin: "0 0.12em 0.08em",
              transform: "translateY(-0.05em)",
              transition: `background ${COLOR_DUR} ease`,
            }}
          />
          <span>studio</span>
        </span>
      </a>

      <NavLinks />

      <nav
        aria-label="Primary"
        style={{
          justifySelf: "end",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <LanguageButton dark={dark} />
        <ContactPill dark={dark} />
      </nav>
    </header>
  );
}

function NavLinks() {
  const links = [
    { href: "/", label: "Home" },
    { href: "/#about", label: "About" },
    { href: "/works", label: "Works" },
    { href: "/blog", label: "Blog" },
  ];
  return (
    <nav
      aria-label="Sections"
      style={{
        display: "flex",
        gap: 52,
        alignItems: "center",
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        fontSize: 17,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        color: "currentColor",
      }}
    >
      {links.map(({ href, label }) => (
        <NavLink key={href} href={href} label={label} />
      ))}
    </nav>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      style={{
        color: "currentColor",
        textDecoration: "none",
        padding: "6px 2px",
        position: "relative",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget.querySelector<HTMLSpanElement>(".underline");
        if (el) el.style.transform = "scaleX(1)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget.querySelector<HTMLSpanElement>(".underline");
        if (el) el.style.transform = "scaleX(0)";
      }}
    >
      {label}
      <span
        className="underline"
        style={{
          position: "absolute",
          left: 2,
          right: 2,
          bottom: 3,
          height: 1.5,
          background: "currentColor",
          transform: "scaleX(0)",
          transformOrigin: "left center",
          transition: "transform .35s cubic-bezier(.2,.7,.2,1)",
        }}
      />
    </a>
  );
}

function ContactPill({ dark }: { dark: boolean }) {
  const bg = dark ? "#e4e2dc" : "#0c0c0c";
  const fg = dark ? "#0c0c0c" : "#fff";
  return (
    <a
      href="/contact"
      style={{
        background: bg,
        color: fg,
        borderRadius: 999,
        padding: "13px 26px 14px",
        fontSize: 16,
        fontWeight: 600,
        textDecoration: "none",
        lineHeight: 1,
        letterSpacing: "0.005em",
        transition: `background ${COLOR_DUR} ease, color ${COLOR_DUR} ease, transform .25s ease`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--ink)";
        (e.currentTarget as HTMLElement).style.color = "#fff";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = bg;
        (e.currentTarget as HTMLElement).style.color = fg;
        (e.currentTarget as HTMLElement).style.transform = "";
      }}
    >
      Contact
    </a>
  );
}

function LanguageButton({ dark }: { dark: boolean }) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("DE");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("pokyh-lang") as Lang | null;
      if (saved && LANGS.some((l) => l.code === saved)) setLang(saved);
    } catch {}
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const select = (l: Lang) => {
    setLang(l);
    try {
      localStorage.setItem("pokyh-lang", l);
    } catch {}
    setOpen(false);
  };

  const bg = dark ? "#e4e2dc" : "#0c0c0c";
  const fg = dark ? "#0c0c0c" : "#fff";
  const menuBg = dark ? "rgba(12, 12, 14, 0.95)" : "rgba(252, 250, 246, 0.95)";
  const menuBorder = dark
    ? "1px solid rgba(255,255,255,0.08)"
    : "1px solid rgba(12,12,12,0.08)";
  const menuText = dark ? "#e4e2dc" : "#0c0c0c";
  const itemHover = dark ? "rgba(255,255,255,0.06)" : "rgba(12,12,12,0.05)";
  const itemActive = dark ? "rgba(255,255,255,0.1)" : "rgba(12,12,12,0.08)";

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        aria-label="Language"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: bg,
          color: fg,
          border: "none",
          padding: 0,
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          transition: `background ${COLOR_DUR} ease, color ${COLOR_DUR} ease, transform .25s ease`,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "var(--ink)";
          (e.currentTarget as HTMLElement).style.color = "#fff";
          (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = bg;
          (e.currentTarget as HTMLElement).style.color = fg;
          (e.currentTarget as HTMLElement).style.transform = "";
        }}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          style={{
            width: 18,
            height: 18,
            stroke: "currentColor",
            fill: "none",
            strokeWidth: 1.6,
            strokeLinecap: "round",
            strokeLinejoin: "round",
          }}
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a14 14 0 0 1 0 18" />
          <path d="M12 3a14 14 0 0 0 0 18" />
        </svg>
      </button>

      <div
        role="menu"
        style={{
          position: "absolute",
          top: "calc(100% + 22px)",
          left: "50%",
          minWidth: 180,
          padding: 6,
          background: menuBg,
          border: menuBorder,
          borderRadius: 14,
          color: menuText,
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          fontSize: 14,
          fontWeight: 500,
          opacity: open ? 1 : 0,
          transform: open
            ? "translate(-50%, 0)"
            : "translate(-50%, -6px)",
          pointerEvents: open ? "auto" : "none",
          transition: "opacity .2s ease, transform .25s cubic-bezier(.2,.7,.2,1)",
        }}
      >
        {LANGS.map(({ code, label }) => {
          const active = lang === code;
          return (
            <button
              key={code}
              role="menuitemradio"
              aria-checked={active}
              type="button"
              onClick={() => select(code)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "9px 12px",
                borderRadius: 10,
                background: active ? itemActive : "transparent",
                color: menuText,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "inherit",
                fontWeight: active ? 600 : 500,
                textAlign: "left",
                transition: "background .15s ease",
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = itemHover;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = active
                  ? itemActive
                  : "transparent";
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-dm-mono), "JetBrains Mono", monospace',
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    opacity: 0.6,
                    width: 22,
                  }}
                >
                  {code}
                </span>
                <span>{label}</span>
              </span>
              {active && (
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  style={{
                    width: 14,
                    height: 14,
                    stroke: "currentColor",
                    fill: "none",
                    strokeWidth: 2.2,
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                  }}
                >
                  <path d="M5 12.5 10 17.5 19 7.5" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
