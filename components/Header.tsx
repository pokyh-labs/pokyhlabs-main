"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const COLOR_DUR = "0.35s";

type Lang = "DE" | "EN" | "IT";
const LANGS: { code: Lang; label: string }[] = [
  { code: "DE", label: "Deutsch" },
  { code: "EN", label: "English" },
  { code: "IT", label: "Italiano" },
];

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#about", label: "About" },
  { href: "/works", label: "Works" },
  { href: "/blog", label: "Blog" },
];

const MENU_LINKS: { href: string; label: string; description: string; meta: string }[] = [
  { href: "/", label: "Home", description: "Back to the start.", meta: "Index" },
  { href: "/#about", label: "About", description: "Two developers, one studio — built from Südtirol.", meta: "Studio" },
  { href: "/works", label: "Works", description: "Selected projects from 2024–2026.", meta: "Portfolio" },
  { href: "/blog", label: "Blog", description: "Notes on craft, code & process.", meta: "Writing" },
  { href: "/contact", label: "Contact", description: "Start a project — reply within 24h.", meta: "Get in touch" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("DE");

  const logoRef = useRef<HTMLAnchorElement>(null);
  const logoTextRef = useRef<HTMLSpanElement>(null);
  const navLinksRef = useRef<HTMLElement>(null);
  const langBtnRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const contactRef = useRef<HTMLAnchorElement>(null);
  const firstScrollRun = useRef(true);
  const scrollTlRef = useRef<gsap.core.Timeline | null>(null);

  // --- scroll detection ---
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

  // --- localStorage lang persistence ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pokyh-lang") as Lang | null;
      if (saved && LANGS.some((l) => l.code === saved)) setLang(saved);
    } catch {}
  }, []);

  // --- GSAP transition: scrolled state ---
  useEffect(() => {
    // Skip the very first run so the initial mount doesn't trigger an animation
    if (firstScrollRun.current) {
      firstScrollRun.current = false;
      return;
    }

    // Kill any in-flight scroll transition so the new one starts from the
    // current rendered state (not from a reverted initial state).
    scrollTlRef.current?.kill();

    if (scrolled) {
      const tl = gsap.timeline();
      scrollTlRef.current = tl;

        // Phase 1: fade out NavLinks / Sprachen-Button and Logo text
        tl.to([logoTextRef.current, navLinksRef.current, langBtnRef.current], {
          opacity: 0,
          y: -14,
          scale: 0.88,
          pointerEvents: "none",
          duration: 0.35,
          ease: "power3.in",
          stagger: 0.035,
        });

        // Phase 2: Burger slides in from the right + width 0→54 pushes Contact left
        tl.fromTo(
          burgerRef.current,
          { opacity: 0, x: 70, width: 0 },
          {
            opacity: 1,
            x: 0,
            width: 54,
            pointerEvents: "auto",
            duration: 0.65,
            ease: "back.out(1.6)",
          },
          "+=0.05"
        );

        // Tiny bounce on Contact so the push feels alive
        tl.fromTo(
          contactRef.current,
          { scale: 0.94 },
          { scale: 1, duration: 0.4, ease: "back.out(2)" },
          "<0.05"
        );
    } else {
      const tl = gsap.timeline();
      scrollTlRef.current = tl;

        // Phase 1 (mirror of scroll-down Phase 2): Burger slides back out
        // → Contact pushes the burger to the right, width 54→0 closes the gap
        tl.to(burgerRef.current, {
          opacity: 0,
          x: 70,
          width: 0,
          pointerEvents: "none",
          duration: 0.65,
          ease: "back.in(1.6)",
        });

        // Contact bounces back as the burger is pushed out
        tl.fromTo(
          contactRef.current,
          { scale: 1.06 },
          { scale: 1, duration: 0.4, ease: "back.out(2)" },
          "<0.05"
        );

        // Phase 2 (mirror of scroll-down Phase 1): NavLinks / Sprachen and Logo text fade in
        tl.fromTo(
          [logoTextRef.current, navLinksRef.current, langBtnRef.current],
          { opacity: 0, y: -14, scale: 0.88 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            pointerEvents: "auto",
            duration: 0.35,
            ease: "power3.out",
            stagger: 0.035,
          },
          "+=0.05"
        );
    }
  }, [scrolled]);

  // --- lock body scroll when menu open ---
  useEffect(() => {
    if (menuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [menuOpen]);

  const setLanguage = (l: Lang) => {
    setLang(l);
    try {
      localStorage.setItem("pokyh-lang", l);
    } catch {}
  };

  return (
    <>
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
          padding: "20px 44px",
          background: "transparent",
          color: "#0c0c0c",
          pointerEvents: "none",
        }}
      >
        <a
          ref={logoRef}
          href="/"
          aria-label="pokyh.studio home"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            justifySelf: "start",
            pointerEvents: "auto",
          }}
        >
          <img
            src="/assets/logo.png"
            alt="pokyh.studio logo"
            width={46}
            height={46}
            style={{ display: "block", objectFit: "contain", width: 46, height: 46 }}
          />
          <span
            ref={logoTextRef}
            style={{
              fontWeight: 800,
              fontStyle: "italic",
              fontSize: 28,
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
                background: "#0c0c0c",
                borderRadius: "50%",
                margin: "0 0.12em 0.08em",
                transform: "translateY(-0.05em)",
              }}
            />
            <span>studio</span>
          </span>
        </a>

        <nav
          ref={navLinksRef}
          aria-label="Sections"
          style={{
            display: "flex",
            gap: 64,
            alignItems: "center",
            justifySelf: "center",
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "currentColor",
            pointerEvents: "auto",
          }}
        >
          {NAV_LINKS.map(({ href, label }) => (
            <NavLink key={href} href={href} label={label} />
          ))}
        </nav>

        <nav
          aria-label="Primary"
          style={{
            justifySelf: "end",
            display: "flex",
            alignItems: "center",
            gap: 14,
            pointerEvents: "auto",
          }}
        >
          <LanguageButton
            wrapRef={langBtnRef}
            lang={lang}
            setLang={setLanguage}
          />
          <ContactPill contactRef={contactRef} />
          <BurgerButton
            burgerRef={burgerRef}
            onClick={() => setMenuOpen(true)}
          />
        </nav>
      </header>

      <MenuOverlay
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        lang={lang}
        setLang={setLanguage}
      />
    </>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      style={{
        color: "currentColor",
        textDecoration: "none",
        padding: "8px 4px",
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
          left: 4,
          right: 4,
          bottom: 4,
          height: 2,
          background: "currentColor",
          transform: "scaleX(0)",
          transformOrigin: "left center",
          transition: "transform .35s cubic-bezier(.2,.7,.2,1)",
        }}
      />
    </a>
  );
}

function ContactPill({ contactRef }: { contactRef: React.RefObject<HTMLAnchorElement | null> }) {
  return (
    <a
      ref={contactRef}
      href="/contact"
      style={{
        background: "#0c0c0c",
        color: "#fff",
        borderRadius: 999,
        padding: "16px 32px 17px",
        fontSize: 18,
        fontWeight: 600,
        textDecoration: "none",
        lineHeight: 1,
        letterSpacing: "0.005em",
        transition: `background ${COLOR_DUR} ease, color ${COLOR_DUR} ease, transform .25s ease`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--ink)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "#0c0c0c";
        (e.currentTarget as HTMLElement).style.transform = "";
      }}
    >
      Contact
    </a>
  );
}

function BurgerButton({
  burgerRef,
  onClick,
}: {
  burgerRef: React.RefObject<HTMLButtonElement | null>;
  onClick: () => void;
}) {
  return (
    <button
      ref={burgerRef}
      type="button"
      aria-label="Open menu"
      onClick={onClick}
      style={{
        width: 0,
        height: 54,
        borderRadius: "50%",
        background: "#0c0c0c",
        color: "#fff",
        border: "none",
        padding: 0,
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        opacity: 0,
        pointerEvents: "none",
        overflow: "hidden",
        flexShrink: 0,
        transition: "background .25s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--ink)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "#0c0c0c";
      }}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{
          width: 22,
          height: 22,
          stroke: "currentColor",
          fill: "none",
          strokeWidth: 2,
          strokeLinecap: "round",
        }}
      >
        <path d="M4 8 H20" />
        <path d="M4 16 H20" />
      </svg>
    </button>
  );
}

function LanguageButton({
  wrapRef,
  lang,
  setLang,
}: {
  wrapRef: React.RefObject<HTMLDivElement | null>;
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  const [open, setOpen] = useState(false);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (innerRef.current && !innerRef.current.contains(e.target as Node)) {
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
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "inline-block" }}>
      <div ref={innerRef} style={{ position: "relative" }}>
        <button
          type="button"
          aria-label="Language"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          style={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            background: "#0c0c0c",
            color: "#fff",
            border: "none",
            padding: 0,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            transition: "background .25s ease, transform .25s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--ink)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#0c0c0c";
            (e.currentTarget as HTMLElement).style.transform = "";
          }}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{
              width: 22,
              height: 22,
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
            top: "calc(100% + 18px)",
            left: "50%",
            minWidth: 220,
            padding: 8,
            background: "#fcfaf6",
            border: "1px solid rgba(12,12,12,0.08)",
            borderRadius: 18,
            color: "#0c0c0c",
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fontSize: 16,
            fontWeight: 500,
            opacity: open ? 1 : 0,
            transform: open ? "translate(-50%, 0)" : "translate(-50%, -6px)",
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
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: active ? "rgba(12,12,12,0.08)" : "transparent",
                  color: "#0c0c0c",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  fontWeight: active ? 600 : 500,
                  textAlign: "left",
                  transition: "background .15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(12,12,12,0.05)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = active
                    ? "rgba(12,12,12,0.08)"
                    : "transparent";
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-dm-mono), "JetBrains Mono", monospace',
                      fontSize: 13,
                      letterSpacing: "0.12em",
                      opacity: 0.6,
                      width: 28,
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
                      width: 16,
                      height: 16,
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
    </div>
  );
}

// ─── Fullscreen menu overlay with INSANE GSAP animation ──────────────────────
function MenuOverlay({
  open,
  onClose,
  lang,
  setLang,
}: {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const linksContainerRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const footerRef = useRef<HTMLAnchorElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // open / close animation — initial state is set via inline styles so there is no flicker
  useEffect(() => {
    if (!overlayRef.current) return;

    const overlay = overlayRef.current;
    const backdrop = backdropRef.current!;
    const linkInnerEls = linksContainerRef.current
      ? Array.from(linksContainerRef.current.querySelectorAll<HTMLElement>(".menu-link-inner"))
      : [];
    const langEls = langRef.current
      ? Array.from(langRef.current.querySelectorAll<HTMLElement>(".menu-lang"))
      : [];

    if (open) {
      // Sync GSAP's internal state with the inline-style initial values so the
      // tween starts from the correct from-position (avoids stale state).
      gsap.set(overlay, { visibility: "visible", pointerEvents: "auto" });
      gsap.set(backdrop, { clipPath: "circle(0% at 100% 0%)" });
      gsap.set(closeRef.current, { opacity: 0, rotate: -180, scale: 0.5 });
      gsap.set(linkInnerEls, { opacity: 0, y: 60 });
      gsap.set(langEls, { opacity: 0, y: 20 });
      gsap.set(footerRef.current, { opacity: 0, y: 16 });
      gsap.set(previewRef.current, { opacity: 0, x: 30 });

      const tl = gsap.timeline();
      tl.to(backdrop, {
        clipPath: "circle(150% at 100% 0%)",
        duration: 0.55,
        ease: "power3.inOut",
      })
        .to(
          closeRef.current,
          { opacity: 1, rotate: 0, scale: 1, duration: 0.4, ease: "back.out(1.8)" },
          "-=0.35"
        )
        .to(
          linkInnerEls,
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.06,
            ease: "power3.out",
          },
          "-=0.4"
        )
        .to(
          langEls,
          { opacity: 1, y: 0, stagger: 0.04, duration: 0.3, ease: "power2.out" },
          "-=0.3"
        )
        .to(
          previewRef.current,
          { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" },
          "-=0.1"
        )
        .to(
          footerRef.current,
          { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
          "-=0.3"
        );
    } else {
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(overlay, { visibility: "hidden", pointerEvents: "none" });
          gsap.set(backdrop, { clipPath: "circle(0% at 100% 0%)" });
          gsap.set(closeRef.current, { opacity: 0, rotate: -180, scale: 0.5 });
          gsap.set(linkInnerEls, { opacity: 0, y: 60 });
          gsap.set(langEls, { opacity: 0, y: 20 });
          gsap.set(footerRef.current, { opacity: 0, y: 16 });
          gsap.set(previewRef.current, { opacity: 0, x: 30 });
        },
      });
      tl.to(linkInnerEls, {
        opacity: 0,
        y: -40,
        duration: 0.35,
        stagger: 0.025,
        ease: "power3.in",
      })
        .to(
          [langEls, footerRef.current, closeRef.current, previewRef.current],
          { opacity: 0, y: -8, duration: 0.22, ease: "power2.in" },
          "-=0.3"
        )
        .to(
          backdrop,
          {
            clipPath: "circle(0% at 100% 0%)",
            duration: 0.45,
            ease: "power3.inOut",
          },
          "-=0.15"
        );
    }
  }, [open]);

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        visibility: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* Backdrop (clipped circle expand) — initial: closed circle */}
      <div
        ref={backdropRef}
        style={{
          position: "absolute",
          inset: 0,
          background: "#0c0c0e",
          willChange: "clip-path",
          clipPath: "circle(0% at 100% 0%)",
        }}
      />

      {/* Content layer — padding identical to header so the close button
          lines up exactly with the burger position */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          color: "#fcfaf6",
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          padding: "20px 44px",
        }}
      >
        {/* Top row: language pills (left of close) + close (matches burger exactly) */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 14,
            height: 54,
          }}
        >
          <div
            ref={langRef}
            style={{ display: "flex", gap: 4, alignItems: "center" }}
          >
            {LANGS.map(({ code }) => {
              const active = lang === code;
              return (
                <button
                  key={code}
                  type="button"
                  className="menu-lang"
                  onClick={() => setLang(code)}
                  style={{
                    background: active ? "#fcfaf6" : "transparent",
                    color: active ? "#0c0c0e" : "rgba(252,250,246,0.5)",
                    border: "none",
                    borderRadius: 999,
                    padding: "10px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    cursor: "pointer",
                    fontFamily: 'var(--font-dm-mono), "JetBrains Mono", monospace',
                    opacity: 0,
                    transform: "translateY(20px)",
                    transition: "background .2s ease, color .2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = "#fcfaf6";
                  }}
                  onMouseLeave={(e) => {
                    if (!active)
                      (e.currentTarget as HTMLElement).style.color = "rgba(252,250,246,0.5)";
                  }}
                >
                  {code}
                </button>
              );
            })}
          </div>

          <button
            ref={closeRef}
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            style={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              background: "#fcfaf6",
              color: "#0c0c0e",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              opacity: 0,
              transform: "rotate(-180deg) scale(0.5)",
              transition: "background .25s ease, color .25s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "var(--ink)";
              el.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "#fcfaf6";
              el.style.color = "#0c0c0e";
            }}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              style={{
                width: 22,
                height: 22,
                stroke: "currentColor",
                fill: "none",
                strokeWidth: 2,
                strokeLinecap: "round",
              }}
            >
              <path d="M6 6 L18 18 M6 18 L18 6" />
            </svg>
          </button>
        </div>

        {/* Middle: two-column area — nav links left, hover preview right */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
            alignItems: "center",
            gap: 48,
          }}
        >
          {/* Big nav links */}
          <div
            ref={linksContainerRef}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.05em",
              paddingLeft: "5vw",
            }}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {MENU_LINKS.map(({ href, label }, i) => (
              <a
                key={href}
                href={href}
                onClick={onClose}
                onMouseEnter={() => setHoveredIdx(i)}
                className="menu-link"
                style={{
                  display: "block",
                  color: "#fcfaf6",
                  textDecoration: "none",
                  fontSize: "clamp(2.6rem, 7.5vw, 6.5rem)",
                  fontWeight: 600,
                  letterSpacing: "-0.035em",
                  lineHeight: 1.05,
                  cursor: "pointer",
                }}
              >
                <span
                  className="menu-link-inner"
                  style={{
                    display: "inline-block",
                    willChange: "transform, opacity",
                    opacity: 0,
                    transform: "translateY(60px)",
                    transition: "color .3s ease, transform .35s cubic-bezier(.2,.7,.2,1)",
                    color: hoveredIdx === null
                      ? "#fcfaf6"
                      : hoveredIdx === i
                      ? "#fcfaf6"
                      : "rgba(252,250,246,0.28)",
                  }}
                >
                  {label}
                </span>
              </a>
            ))}
          </div>

          {/* Right side: hover preview */}
          <div
            ref={previewRef}
            aria-hidden="true"
            style={{
              alignSelf: "stretch",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 18,
              borderLeft: "1px solid rgba(252,250,246,0.1)",
              paddingLeft: 40,
              minHeight: 220,
              opacity: 0,
            }}
          >
            {/* meta label */}
            <span
              key={`meta-${hoveredIdx ?? "default"}`}
              style={{
                fontFamily: 'var(--font-dm-mono), "JetBrains Mono", monospace',
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "rgba(252,250,246,0.45)",
                animation: "previewFadeIn .35s cubic-bezier(.2,.7,.2,1) both",
              }}
            >
              {hoveredIdx === null
                ? "pokyh · studio"
                : MENU_LINKS[hoveredIdx].meta}
            </span>

            {/* description */}
            <p
              key={`desc-${hoveredIdx ?? "default"}`}
              style={{
                margin: 0,
                fontSize: "clamp(1.1rem, 1.4vw, 1.4rem)",
                fontWeight: 400,
                lineHeight: 1.4,
                color: "rgba(252,250,246,0.85)",
                maxWidth: 420,
                animation: "previewFadeIn .4s cubic-bezier(.2,.7,.2,1) .05s both",
              }}
            >
              {hoveredIdx === null
                ? "Digital studio aus Südtirol — 3D websites, web design & engineering."
                : MENU_LINKS[hoveredIdx].description}
            </p>

            {/* arrow hint when hovering a link */}
            {hoveredIdx !== null && (
              <span
                key={`arr-${hoveredIdx}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 12,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--ink)",
                  fontFamily: 'var(--font-dm-mono), "JetBrains Mono", monospace',
                  animation: "previewFadeIn .4s cubic-bezier(.2,.7,.2,1) .1s both",
                }}
              >
                Explore
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  style={{
                    width: 14,
                    height: 14,
                    stroke: "currentColor",
                    fill: "none",
                    strokeWidth: 1.8,
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                  }}
                >
                  <path d="M5 12 H19 M13 6 L19 12 L13 18" />
                </svg>
              </span>
            )}
          </div>
        </div>

        {/* Bottom: just the email link */}
        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 16 }}>
          <a
            ref={footerRef}
            href="mailto:hello@pokyh.studio"
            style={{
              color: "rgba(252,250,246,0.7)",
              textDecoration: "none",
              fontSize: 14,
              fontFamily: 'var(--font-dm-mono), "JetBrains Mono", monospace',
              letterSpacing: "0.06em",
              opacity: 0,
              transform: "translateY(16px)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#fcfaf6";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "rgba(252,250,246,0.7)";
            }}
          >
            hello@pokyh.studio
          </a>
        </div>
      </div>

      {/* keyframes for the hover preview fade-in */}
      <style>{`
        @keyframes previewFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
