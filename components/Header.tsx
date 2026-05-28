"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useLanguage, useT } from "@/lib/i18n/context";
import type { Lang } from "@/lib/i18n/translations";

// useLayoutEffect warns during SSR. Fall back to useEffect on the server so
// Next.js doesn't print the warning, but use the layout variant on the client
// — header snapping needs to happen before the browser paints to avoid a
// frame where the burger is the wrong size after a resize.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const COLOR_DUR = "0.35s";
const MOBILE_BREAKPOINT = 1024;

const LANGS: { code: Lang; label: string }[] = [
  { code: "DE", label: "Deutsch" },
  { code: "EN", label: "English" },
  { code: "IT", label: "Italiano" },
];

const NAV_HREFS = [
  { href: "/", key: "nav_home" as const },
  { href: "/#about", key: "nav_about" as const },
  { href: "/works", key: "nav_works" as const },
  { href: "/blog", key: "nav_blog" as const },
];

const MENU_HREFS = [
  { href: "/", labelKey: "nav_home" as const, descKey: "menu_home_desc" as const, metaKey: "menu_home_meta" as const },
  { href: "/#about", labelKey: "nav_about" as const, descKey: "menu_about_desc" as const, metaKey: "menu_about_meta" as const },
  { href: "/works", labelKey: "nav_works" as const, descKey: "menu_works_desc" as const, metaKey: "menu_works_meta" as const },
  { href: "/blog", labelKey: "nav_blog" as const, descKey: "menu_blog_desc" as const, metaKey: "menu_blog_meta" as const },
  { href: "/contact", labelKey: "nav_contact" as const, descKey: "menu_contact_desc" as const, metaKey: "menu_contact_meta" as const },
];

// Smooth filter swap for the header logo: stays neutral on the page surface,
// turns to a pure black silhouette once the purple footer is behind it. Only
// the logo image transitions — every other header element keeps its default
// styling, so there's no global color flip on scroll.
const LOGO_FILTER_TRANSITION = "filter 0.45s cubic-bezier(.55,.05,.25,1)";

// Smooth-scroll helpers that prefer the page Lenis instance (exposed by
// HomeClientWrapper) and fall back to native smooth scroll if it isn't ready.
function smoothScrollToTop() {
  const lenis = (window as unknown as { __lenis?: { scrollTo: (t: number | HTMLElement, o?: object) => void } }).__lenis;
  if (lenis) {
    lenis.scrollTo(0, { duration: 1.2 });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function smoothScrollToHash(hash: string) {
  const id = hash.replace(/^#/, "");
  const target = document.getElementById(id);
  if (!target) return false;
  const lenis = (window as unknown as { __lenis?: { scrollTo: (t: number | HTMLElement, o?: object) => void } }).__lenis;
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.2, offset: 0 });
  } else {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return true;
}

type HeaderEls = {
  logoText: HTMLElement | null;
  nav: HTMLElement | null;
  lang: HTMLElement | null;
  burger: HTMLElement | null;
  contact: HTMLElement | null;
};

// Instantly snap every header element to the correct state for the given
// viewport + scroll combo. Used on mount and on viewport-breakpoint crossings
// so resizing the window doesn't leave stale inline transforms or widths.
function snapToState(isMobile: boolean, scrolled: boolean, els: HeaderEls) {
  if (isMobile) {
    // Logo text fades on scroll
    gsap.set(els.logoText, {
      opacity: scrolled ? 0 : 1,
      x: scrolled ? -16 : 0,
      y: 0,
      scale: scrolled ? 0.9 : 1,
      pointerEvents: scrolled ? "none" : "auto",
    });
    // Everything else: visible, no transform residue. Nav + contact are
    // additionally hidden by CSS media queries, but we clear their tween
    // state so coming back to desktop is clean.
    gsap.set([els.nav, els.lang, els.contact], {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      pointerEvents: "auto",
    });
    gsap.set(els.burger, {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      width: 54,
      pointerEvents: "auto",
    });
    return;
  }

  // Desktop snap
  if (scrolled) {
    gsap.set([els.logoText, els.nav, els.lang], {
      opacity: 0,
      x: 0,
      y: -14,
      scale: 0.88,
      pointerEvents: "none",
    });
    gsap.set(els.burger, {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      width: 54,
      pointerEvents: "auto",
    });
    gsap.set(els.contact, {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      pointerEvents: "auto",
    });
  } else {
    gsap.set([els.logoText, els.nav, els.lang], {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      pointerEvents: "auto",
    });
    gsap.set(els.burger, {
      opacity: 0,
      x: 70,
      y: 0,
      scale: 1,
      width: 0,
      pointerEvents: "none",
    });
    gsap.set(els.contact, {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      pointerEvents: "auto",
    });
  }
}

export default function Header() {
  const { lang, switchLanguage } = useLanguage();
  const t = useT();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoBlack, setLogoBlack] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const logoRef = useRef<HTMLAnchorElement>(null);
  const logoTextRef = useRef<HTMLSpanElement>(null);
  const navLinksRef = useRef<HTMLElement>(null);
  const langBtnRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const contactRef = useRef<HTMLAnchorElement>(null);
  const firstScrollRun = useRef(true);
  const scrollTlRef = useRef<gsap.core.Timeline | null>(null);
  const prevIsMobileRef = useRef<boolean | null>(null);

  // --- viewport tracking: mobile / medium share the compact header layout ---
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // --- scroll detection with directional damper ---
  // Going down: enter the "scrolled" state quickly (snappy).
  // Going up: leave the "scrolled" state well before reaching the top,
  // so the reverse animation finishes by the time scrollY hits 0.
  useEffect(() => {
    const ENTER = 64;
    const EXIT = 480;

    let lastY = window.scrollY;
    let dir: "up" | "down" | null = null;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;

      // Only commit a direction change on meaningful movement — this
      // keeps micro-jitter inside the buffer zone from flipping the state.
      if (Math.abs(delta) > 3) {
        dir = delta > 0 ? "down" : "up";
        lastY = y;
      }

      setScrolled((prev) => {
        if (y <= 0) return false;
        if (dir === null) return y > ENTER;
        if (!prev && dir === "down" && y > ENTER) return true;
        if (prev && dir === "up" && y < EXIT) return false;
        return prev;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // --- footer detection: turn the logo black once the purple footer is the
  // surface immediately under the header. rAF-throttled to stay smooth. ---
  useEffect(() => {
    const PROBE_Y = 44;
    let frame: number | null = null;

    const sample = () => {
      frame = null;
      const sections = document.querySelectorAll<HTMLElement>('[data-theme="brand"]');
      let next = false;
      sections.forEach((sec) => {
        const r = sec.getBoundingClientRect();
        if (r.top <= PROBE_Y && r.bottom >= PROBE_Y) next = true;
      });
      setLogoBlack((prev) => (prev === next ? prev : next));
    };

    const schedule = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(sample);
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    sample();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);


  // --- GSAP transition: scrolled state ---
  // Two modes feed into this effect:
  //   1. Scroll position changes → animate between unscrolled/scrolled state
  //   2. Viewport size crosses the mobile breakpoint → SNAP to the correct
  //      state for the new viewport (no animation), wiping any leftover
  //      inline transforms / widths GSAP applied in the other mode.
  // The snap path is what makes window-resizing work — otherwise the burger
  // is left at translateX(70px) when going desktop→mobile, etc.
  // Runs as a layout effect so the snap happens before the browser paints
  // (otherwise you can see one frame of the previous mode's layout).
  useIsoLayoutEffect(() => {
    scrollTlRef.current?.kill();

    const viewportChanged = prevIsMobileRef.current !== isMobile;
    prevIsMobileRef.current = isMobile;

    const isFirst = firstScrollRun.current;
    firstScrollRun.current = false;

    // Snap (no animation) when viewport just crossed the breakpoint OR on
    // the very first paint.
    const snap = isFirst || viewportChanged;

    if (snap) {
      snapToState(isMobile, scrolled, {
        logoText: logoTextRef.current,
        nav: navLinksRef.current,
        lang: langBtnRef.current,
        burger: burgerRef.current,
        contact: contactRef.current,
      });
      return;
    }

    // Past this point: only the scroll state changed. Animate.
    if (isMobile) {
      const tl = gsap.timeline();
      scrollTlRef.current = tl;
      if (scrolled) {
        tl.to(logoTextRef.current, {
          opacity: 0,
          x: -16,
          scale: 0.9,
          pointerEvents: "none",
          duration: 0.35,
          ease: "power3.in",
        });
      } else {
        tl.to(logoTextRef.current, {
          opacity: 1,
          x: 0,
          scale: 1,
          pointerEvents: "auto",
          duration: 0.4,
          ease: "power3.out",
        });
      }
      return;
    }

    if (scrolled) {
      const tl = gsap.timeline();
      scrollTlRef.current = tl;

      tl.to([logoTextRef.current, navLinksRef.current, langBtnRef.current], {
        opacity: 0,
        y: -14,
        scale: 0.88,
        pointerEvents: "none",
        duration: 0.35,
        ease: "power3.in",
        stagger: 0.035,
      });

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

      tl.fromTo(
        contactRef.current,
        { scale: 0.94 },
        { scale: 1, duration: 0.4, ease: "back.out(2)" },
        "<0.05"
      );
    } else {
      const tl = gsap.timeline();
      scrollTlRef.current = tl;

      tl.to(burgerRef.current, {
        opacity: 0,
        x: 70,
        width: 0,
        pointerEvents: "none",
        duration: 0.65,
        ease: "back.in(1.6)",
      });

      tl.fromTo(
        contactRef.current,
        { scale: 1.06 },
        { scale: 1, duration: 0.4, ease: "back.out(2)" },
        "<0.05"
      );

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
  }, [scrolled, isMobile]);

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

  const onLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window === "undefined") return;
    if (window.location.pathname === "/") {
      e.preventDefault();
      smoothScrollToTop();
      if (window.location.hash) {
        history.replaceState(null, "", "/");
      }
    }
  };

  return (
    <>
      <header
        className="site-header"
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
          onClick={onLogoClick}
          className="site-header-logo"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            justifySelf: "start",
            pointerEvents: "auto",
          }}
        >
          <Image
            src="/assets/logo.png"
            alt="pokyh.studio logo"
            width={46}
            height={46}
            priority
            className="site-header-logo-img"
            style={{
              display: "block",
              objectFit: "contain",
              filter: logoBlack ? "brightness(0)" : "none",
              transition: LOGO_FILTER_TRANSITION,
            }}
          />
          <span
            ref={logoTextRef}
            className="site-header-logo-text"
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
          className="site-header-nav"
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
          {NAV_HREFS.map(({ href, key }) => (
            <NavLink key={href} href={href} label={t(key)} />
          ))}
        </nav>

        <nav
          aria-label="Primary"
          className="site-header-actions"
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
            setLang={switchLanguage}
          />
          <ContactPill contactRef={contactRef} t={t} />
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
        setLang={switchLanguage}
        t={t}
      />
    </>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window === "undefined") return;
    if (href.startsWith("/#") && window.location.pathname === "/") {
      const hash = href.slice(1); // "#about"
      if (smoothScrollToHash(hash)) {
        e.preventDefault();
        history.replaceState(null, "", href);
      }
    }
  };
  return (
    <a
      href={href}
      onClick={onClick}
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

function ContactPill({ contactRef, t }: { contactRef: React.RefObject<HTMLAnchorElement | null>; t: (k: import("@/lib/i18n/translations").TranslationKey) => string }) {
  return (
    <a
      ref={contactRef}
      href="/contact"
      className="site-header-contact"
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
      {t("header_contact")}
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
  // Initial inline state matches the *desktop unscrolled* layout (collapsed).
  // The GSAP snap effect in <Header /> instantly overrides this on first paint
  // for any other state, and CSS @media rules force the visible state on
  // tablets/phones regardless of inline values — so resizing the window keeps
  // the burger in sync without any flicker.
  return (
    <button
      ref={burgerRef}
      type="button"
      aria-label="Open menu"
      onClick={onClick}
      className="site-header-burger"
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
    <div
      ref={wrapRef}
      className="site-header-lang"
      style={{ position: "relative", display: "inline-block" }}
    >
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
          className="site-header-lang-menu"
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
  t,
}: {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: import("@/lib/i18n/translations").TranslationKey) => string;
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

  const onMenuLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    onClose();
    if (typeof window === "undefined") return;
    if (href === "/" && window.location.pathname === "/") {
      e.preventDefault();
      setTimeout(() => smoothScrollToTop(), 50);
      if (window.location.hash) history.replaceState(null, "", "/");
      return;
    }
    if (href.startsWith("/#") && window.location.pathname === "/") {
      e.preventDefault();
      const hash = href.slice(1);
      setTimeout(() => {
        if (smoothScrollToHash(hash)) {
          history.replaceState(null, "", href);
        }
      }, 50);
    }
  };

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
        className="menu-overlay-inner"
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
          className="menu-overlay-grid"
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
            className="menu-overlay-links"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.05em",
              paddingLeft: "5vw",
            }}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {MENU_HREFS.map(({ href, labelKey }, i) => (
              <a
                key={href}
                href={href}
                onClick={(e) => onMenuLinkClick(e, href)}
                onMouseEnter={() => setHoveredIdx(i)}
                className="menu-link"
                style={{
                  display: "block",
                  color: "#fcfaf6",
                  textDecoration: "none",
                  fontSize: "clamp(2.2rem, 7.5vw, 6.5rem)",
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
                  {t(labelKey)}
                </span>
              </a>
            ))}
          </div>

          {/* Right side: hover preview */}
          <div
            ref={previewRef}
            aria-hidden="true"
            className="menu-overlay-preview"
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
                : t(MENU_HREFS[hoveredIdx].metaKey)}
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
                ? t("menu_default_desc")
                : t(MENU_HREFS[hoveredIdx].descKey)}
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
                {t("menu_explore")}
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
              (e.currentTarget as HTMLElement).style.color = "#efebe2";
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
