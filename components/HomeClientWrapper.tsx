"use client";

import { useEffect, useRef, ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

const WordReveal = ({ text }: { text: string }) => (
  <>
    {text.split(" ").map((word, i) => (
      <span key={i} className="reveal-word" style={{ display: "inline-block", whiteSpace: "pre-wrap" }}>
        {word}{" "}
      </span>
    ))}
  </>
);

export default function HomeClientWrapper({ children }: { children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const whiteRef = useRef<HTMLDivElement>(null);
  const linePathRef = useRef<SVGPathElement>(null);
  const revealsRef = useRef<(HTMLDivElement | null)[]>([]);
  const aboutRevealsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // --- Lenis smooth scroll ---
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });

    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    let rafId = requestAnimationFrame(raf);

    lenis.on("scroll", ScrollTrigger.update);

    // --- Dark section: rises with rounded top corners ---
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { borderTopLeftRadius: 0, borderTopRightRadius: 0, y: 60 },
        {
          borderTopLeftRadius: 80,
          borderTopRightRadius: 80,
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: contentRef.current,
            start: "top bottom",
            end: "top top",
            scrub: 0.5,
          },
        }
      );
    }

    // --- Word reveals inside dark section ---
    revealsRef.current.forEach((el) => {
      if (!el) return;
      const words = el.querySelectorAll(".reveal-word");
      if (words.length > 0) {
        gsap.fromTo(
          words,
          { opacity: 0.1, y: 16 },
          {
            opacity: 1,
            y: 0,
            ease: "none",
            stagger: 0.05,
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              end: "top 25%",
              scrub: 0.5,
            },
          }
        );
      } else {
        gsap.fromTo(
          el,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              end: "top 65%",
              scrub: 0.5,
            },
          }
        );
      }
    });

    // --- White About section: rises over dark with rounded top ---
    if (whiteRef.current) {
      gsap.fromTo(
        whiteRef.current,
        { borderTopLeftRadius: 0, borderTopRightRadius: 0, y: 60 },
        {
          borderTopLeftRadius: 80,
          borderTopRightRadius: 80,
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: whiteRef.current,
            start: "top bottom",
            end: "top top",
            scrub: 0.5,
          },
        }
      );
    }

    // --- The line: one solid stroke that paints itself top→bottom as you scroll ---
    if (linePathRef.current && whiteRef.current) {
      const p = linePathRef.current;
      // Use the real path length in user-units. dasharray == length means a
      // single dash that covers the entire path = solid line. dashoffset == length
      // shifts it fully off, so the path starts invisible.
      const len = p.getTotalLength();
      p.setAttribute("stroke-dasharray", String(len));
      p.setAttribute("stroke-dashoffset", String(len));

      gsap.to(p, {
        attr: { "stroke-dashoffset": 0 },
        ease: "none",
        scrollTrigger: {
          trigger: whiteRef.current,
          start: "top 80%",
          end: "center top",
          scrub: true,
        },
      });
    }

    // --- About content reveals (word-by-word like the dark section) ---
    aboutRevealsRef.current.forEach((el) => {
      if (!el) return;
      const words = el.querySelectorAll(".reveal-word");
      if (words.length > 0) {
        gsap.fromTo(
          words,
          { opacity: 0.1, y: 16 },
          {
            opacity: 1,
            y: 0,
            ease: "none",
            stagger: 0.05,
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              end: "top 30%",
              scrub: 0.5,
            },
          }
        );
      } else {
        gsap.fromTo(
          el,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top 92%",
              end: "top 65%",
              scrub: 0.5,
            },
          }
        );
      }
    });

    ScrollTrigger.refresh();

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div style={{ backgroundColor: "var(--bg)" }}>
      {/* Hero */}
      <div
        style={{
          position: "relative",
          height: "100vh",
          width: "100%",
          backgroundColor: "var(--bg)",
          zIndex: 1,
        }}
      >
        {children}
      </div>

      {/* Dark section */}
      <div
        ref={contentRef}
        style={{
          position: "relative",
          zIndex: 2,
          backgroundColor: "#1a1a1a",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "10vh 5vw",
          color: "#fff",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
            textAlign: "center",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div ref={(el) => { if (el) revealsRef.current[0] = el; }}>
            <h2
              suppressHydrationWarning
              style={{ fontSize: "clamp(2rem, 3.5vw, 4rem)", fontWeight: 400, lineHeight: 1.3, marginBottom: "3rem" }}
            >
              <WordReveal text="We are Pokyhlabs – a digital studio crafting fast," /><br />
              <WordReveal text="scalable, and immersive web experiences that" /><br />
              <WordReveal text="merge creativity with engineering precision." />
            </h2>
          </div>

          <div ref={(el) => { if (el) revealsRef.current[1] = el; }}>
            <p
              suppressHydrationWarning
              style={{
                fontSize: "clamp(1rem, 1.5vw, 1.5rem)",
                fontWeight: 300,
                lineHeight: 1.6,
                marginBottom: "4rem",
                color: "#d1d1d1",
              }}
            >
              <WordReveal text="We specialize in developing digital platforms, cutting-edge products, and interactive" /><br />
              <WordReveal text="brand experiences using modern web technologies." />
            </p>
          </div>

          <div ref={(el) => { if (el) revealsRef.current[2] = el; }}>
            <Link
              href="/works"
              style={{
                backgroundColor: "var(--ink)",
                color: "#fff",
                borderRadius: "30px",
                padding: "1rem 2rem",
                fontSize: "1rem",
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                textDecoration: "none",
              }}
            >
              Discover Our Work
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.2)",
                }}
              >
                ↗
              </span>
            </Link>
          </div>
        </div>

        <div
          style={{
            maxWidth: "1000px",
            textAlign: "left",
            width: "100%",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div ref={(el) => { if (el) revealsRef.current[3] = el; }}>
            <h2
              suppressHydrationWarning
              style={{ fontSize: "clamp(2rem, 3.5vw, 4rem)", fontWeight: 400, lineHeight: 1.3, marginBottom: "2rem" }}
            >
              <WordReveal text="Pushing the boundaries of the digital world." />
            </h2>
          </div>

          <div ref={(el) => { if (el) revealsRef.current[4] = el; }}>
            <p
              suppressHydrationWarning
              style={{
                fontSize: "clamp(1rem, 1.5vw, 1.5rem)",
                fontWeight: 300,
                lineHeight: 1.6,
                marginBottom: "3rem",
                color: "#d1d1d1",
                maxWidth: "800px",
              }}
            >
              <WordReveal text="Every pixel we place and every line of code we write is intentional. By combining beautiful design with robust development, we build digital products that not only look incredible but perform flawlessly under pressure." />
            </p>
          </div>

          <div ref={(el) => { if (el) revealsRef.current[5] = el; }}>
            <a
              href="/contact"
              style={{
                backgroundColor: "transparent",
                color: "#fff",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "30px",
                padding: "1rem 2rem",
                fontSize: "1rem",
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                textDecoration: "none",
              }}
            >
              Get In Touch
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.1)",
                }}
              >
                →
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* White About section — thick translucent line draws itself top→bottom */}
      <section
        ref={whiteRef}
        id="about"
        style={{
          position: "relative",
          zIndex: 3,
          backgroundColor: "#fafafa",
          minHeight: "240vh",
          color: "#0c0c0c",
          overflow: "hidden",
          marginTop: "-1px",
        }}
      >
        {/* The line — one continuous curve that paints itself as you scroll */}
        <svg
          viewBox="0 0 100 480"
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          <path
            ref={linePathRef}
            d="M 50 0 C 88 42, 12 85, 50 128 C 88 170, 12 213, 50 256 C 88 298, 12 341, 50 384 C 88 426, 12 469, 50 480"
            fill="none"
            stroke="var(--ink)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="9999"
            strokeDashoffset="9999"
            style={{ strokeWidth: 3, opacity: 0.2 }}
          />
        </svg>

        {/* About content — centered, in the rhythm of the dark section above */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "1000px",
            margin: "0 auto",
            padding: "0 5vw",
          }}
        >
          {/* Block 1 — Intro */}
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <div
              ref={(el) => { if (el) aboutRevealsRef.current[0] = el; }}
              style={{
                fontFamily: "var(--font-dm-mono), 'JetBrains Mono', monospace",
                fontSize: 12,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "#888",
                marginBottom: "2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
              }}
            >
              <span style={{ display: "inline-block", width: 28, height: 1, background: "#888" }} />
              About
              <span style={{ display: "inline-block", width: 28, height: 1, background: "#888" }} />
            </div>

            <div ref={(el) => { if (el) aboutRevealsRef.current[1] = el; }}>
              <h2
                suppressHydrationWarning
                style={{
                  fontSize: "clamp(2.4rem, 5vw, 5rem)",
                  fontWeight: 500,
                  lineHeight: 1.1,
                  letterSpacing: "-0.025em",
                  marginBottom: "2.2rem",
                }}
              >
                <WordReveal text="Two developers." /><br />
                <WordReveal text="One studio." /><br />
                <WordReveal text="Built from Südtirol." />
              </h2>
            </div>

            <div ref={(el) => { if (el) aboutRevealsRef.current[2] = el; }}>
              <p
                suppressHydrationWarning
                style={{
                  fontSize: "clamp(1rem, 1.5vw, 1.4rem)",
                  fontWeight: 300,
                  lineHeight: 1.65,
                  color: "#555",
                  maxWidth: "640px",
                  margin: "0 auto",
                }}
              >
                <WordReveal text="A small studio with one obsession — how the web feels," /><br />
                <WordReveal text="how it moves, and how it stays with you long after you leave." />
              </p>
            </div>
          </div>

          {/* Block 2 — Manifesto */}
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div ref={(el) => { if (el) aboutRevealsRef.current[3] = el; }}>
              <h3
                suppressHydrationWarning
                style={{
                  fontSize: "clamp(1.8rem, 3.2vw, 3.4rem)",
                  fontWeight: 400,
                  lineHeight: 1.3,
                  letterSpacing: "-0.015em",
                  marginBottom: "2rem",
                  maxWidth: "820px",
                }}
              >
                <WordReveal text="We don't do templates. Every project starts from zero —" /><br />
                <WordReveal text="engineered for speed, built to scale, crafted to last." />
              </h3>
            </div>

            <div ref={(el) => { if (el) aboutRevealsRef.current[4] = el; }}>
              <p
                suppressHydrationWarning
                style={{
                  fontSize: "clamp(1rem, 1.4vw, 1.3rem)",
                  fontWeight: 300,
                  lineHeight: 1.7,
                  color: "#555",
                  maxWidth: "640px",
                }}
              >
                <WordReveal text="Pixel by pixel, line by line. We write code we'd want to read" /><br />
                <WordReveal text="and ship interfaces we'd want to use." />
              </p>
            </div>
          </div>

          {/* Block 3 — The Team */}
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              paddingBottom: "40vh",
            }}
          >
            <div
              ref={(el) => { if (el) aboutRevealsRef.current[5] = el; }}
              style={{
                fontFamily: "var(--font-dm-mono), 'JetBrains Mono', monospace",
                fontSize: 12,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "#888",
                marginBottom: "3rem",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <span style={{ display: "inline-block", width: 28, height: 1, background: "#888" }} />
              The Team
            </div>

            {[
              { name: "plattnericus", role: "Software Developer", github: "https://github.com/plattnericus" },
              { name: "ryhox", role: "Software Developer", github: "https://github.com/ryhox" },
            ].map((m, i) => (
              <article
                key={m.name}
                ref={(el) => { if (el) aboutRevealsRef.current[6 + i] = el as HTMLDivElement; }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1.5rem",
                  padding: "2.2rem 0",
                  borderTop: "1px solid rgba(12,12,12,0.12)",
                  ...(i === 1 ? { borderBottom: "1px solid rgba(12,12,12,0.12)" } : {}),
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: 11,
                    color: "var(--ink)",
                    letterSpacing: "0.2em",
                    width: 32,
                    flexShrink: 0,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h4
                  style={{
                    fontSize: "clamp(1.6rem, 3vw, 2.8rem)",
                    fontWeight: 700,
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                    color: "#0c0c0c",
                    textTransform: "uppercase",
                    flexShrink: 0,
                  }}
                >
                  {m.name}
                </h4>
                <div style={{ flex: 1, height: 1, background: "rgba(12,12,12,0.12)", minWidth: 20 }} />
                <span
                  style={{
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: 11,
                    color: "#666",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    flexShrink: 0,
                  }}
                >
                  {m.role}
                </span>
                <a
                  href={m.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${m.name} on GitHub`}
                  style={{
                    flexShrink: 0,
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    border: "1px solid rgba(12,12,12,0.18)",
                    display: "grid",
                    placeItems: "center",
                    color: "#0c0c0c",
                    textDecoration: "none",
                    transition: "background 0.25s, border-color 0.25s, color 0.25s, transform 0.25s",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = "var(--ink)";
                    el.style.borderColor = "var(--ink)";
                    el.style.color = "#fff";
                    el.style.transform = "rotate(45deg)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = "transparent";
                    el.style.borderColor = "rgba(12,12,12,0.18)";
                    el.style.color = "#0c0c0c";
                    el.style.transform = "";
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 14, height: 14, fill: "currentColor" }}>
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                </a>
              </article>
            ))}

            <div
              ref={(el) => { if (el) aboutRevealsRef.current[8] = el; }}
              style={{ marginTop: "4rem", display: "flex", justifyContent: "center" }}
            >
              <a
                href="/contact"
                style={{
                  backgroundColor: "var(--ink)",
                  color: "#fff",
                  borderRadius: "30px",
                  padding: "1rem 2rem",
                  fontSize: "1rem",
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  textDecoration: "none",
                }}
              >
                Start a project
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(255,255,255,0.2)",
                  }}
                >
                  →
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
