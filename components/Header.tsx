"use client";

import { useEffect, useState } from "react";

const SPRING = "cubic-bezier(0.32, 0.72, 0, 1)";
const DUR = "0.55s";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{
        position: "fixed",
        top: scrolled ? 10 : 0,
        left: scrolled ? 14 : 0,
        right: scrolled ? 14 : 0,
        zIndex: 99999,
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        padding: "12px 22px",
        background: scrolled
          ? "rgba(228, 226, 220, 0.62)"
          : "transparent",
        backdropFilter: scrolled ? "blur(24px) saturate(1.6)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(24px) saturate(1.6)" : "none",
        borderRadius: scrolled ? 999 : 0,
        boxShadow: scrolled
          ? "0 1px 0 rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.08)"
          : "none",
        transition: [
          `top ${DUR} ${SPRING}`,
          `left ${DUR} ${SPRING}`,
          `right ${DUR} ${SPRING}`,
          `border-radius ${DUR} ${SPRING}`,
          `background 0.4s ease`,
          `box-shadow 0.4s ease`,
        ].join(", "),
      }}
    >
      <a
        href="/"
        aria-label="pokyh.studio home"
        style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
      >
        <img
          src="/assets/logo.png"
          alt="pokyh.studio logo"
          width={34}
          height={34}
          style={{ display: "block", objectFit: "contain", width: 34, height: 34 }}
        />
        <span
          style={{
            fontWeight: 800,
            fontStyle: "italic",
            fontSize: 20,
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

      <div />

      <nav
        aria-label="Primary"
        style={{ justifySelf: "end", display: "flex", alignItems: "center", gap: 16 }}
      >
        <NavLinks />
        <a
          href="/contact"
          style={{
            background: "#0c0c0c",
            color: "#fff",
            borderRadius: 999,
            padding: "8px 16px 9px",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
            lineHeight: 1,
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
          Contact
        </a>
        <CircleButton />
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
    <div
      style={{
        display: "flex",
        gap: 18,
        alignItems: "center",
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        fontSize: 14,
        fontWeight: 500,
        color: "#0c0c0c",
      }}
    >
      {links.map(({ href, label }) => (
        <NavLink key={href} href={href} label={label} />
      ))}
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      style={{ color: "#0c0c0c", textDecoration: "none", padding: "5px 2px", position: "relative" }}
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
          height: 1,
          background: "currentColor",
          transform: "scaleX(0)",
          transformOrigin: "left center",
          transition: "transform .35s cubic-bezier(.2,.7,.2,1)",
        }}
      />
    </a>
  );
}

function CircleButton() {
  return (
    <a
      href="/contact"
      aria-label="Go to contact"
      style={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: "#0c0c0c",
        color: "#fff",
        display: "grid",
        placeItems: "center",
        textDecoration: "none",
        transition: "background .25s ease, transform .25s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--ink)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px) rotate(45deg)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "#0c0c0c";
        (e.currentTarget as HTMLElement).style.transform = "";
      }}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ width: 14, height: 14, stroke: "currentColor", fill: "none", strokeWidth: 1.8 }}
      >
        <path d="M7 17 L17 7 M9 7 H17 V15" />
      </svg>
    </a>
  );
}
