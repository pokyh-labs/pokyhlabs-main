"use client";

import Image from "next/image";

export default function Header() {
  return (
    <header
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "start",
        padding: "22px 28px",
      }}
    >
      <a
        href="/"
        aria-label="pokyh.studio home"
        style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}
      >
        <Image
          src="/assets/logo.png"
          alt="pokyh.studio logo"
          width={42}
          height={42}
          style={{ display: "block", objectFit: "contain" }}
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
        style={{ justifySelf: "end", display: "flex", alignItems: "center", gap: 22 }}
      >
        <NavLinks />
        <a
          href="/contact"
          style={{
            background: "#0c0c0c",
            color: "#fff",
            borderRadius: 999,
            padding: "9px 18px 10px",
            fontSize: 14,
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
    { href: "/contact", label: "Contact" },
  ];
  return (
    <div
      style={{
        display: "flex",
        gap: 22,
        alignItems: "center",
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        fontSize: 15,
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
      style={{ color: "#0c0c0c", textDecoration: "none", padding: "6px 2px", position: "relative" }}
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
          bottom: 4,
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
        width: 38,
        height: 38,
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
        style={{ width: 16, height: 16, stroke: "currentColor", fill: "none", strokeWidth: 1.8 }}
      >
        <path d="M7 17 L17 7 M9 7 H17 V15" />
      </svg>
    </a>
  );
}
