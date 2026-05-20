"use client";

import { useEffect, useRef, ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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
  const revealsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Cursor glow lives outside the React tree to avoid hydration mismatches
    const cursor = document.createElement("div");
    cursor.style.cssText =
      "position:fixed;top:0;left:0;width:400px;height:400px;border-radius:50%;" +
      "background-image:radial-gradient(circle,rgba(89,61,248,0.10)0%,transparent 70%);" +
      "pointer-events:none;transform:translate(-50%,-50%);z-index:0;";
    document.body.appendChild(cursor);

    const moveCursor = (e: MouseEvent) =>
      gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.8, ease: "power3.out" });
    window.addEventListener("mousemove", moveCursor);

    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { borderTopLeftRadius: "0%", borderTopRightRadius: "0%" },
        {
          borderTopLeftRadius: "50% 150px",
          borderTopRightRadius: "50% 150px",
          ease: "none",
          scrollTrigger: {
            trigger: contentRef.current,
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        }
      );
    }

    revealsRef.current.forEach((el) => {
      if (!el) return;
      const words = el.querySelectorAll(".reveal-word");
      if (words.length > 0) {
        gsap.fromTo(
          words,
          { opacity: 0.15, y: 10 },
          {
            opacity: 1,
            y: 0,
            ease: "none",
            stagger: 0.05,
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              end: "top 40%",
              scrub: true,
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
              start: "top 85%",
              end: "top 60%",
              scrub: true,
            },
          }
        );
      }
    });

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      if (document.body.contains(cursor)) document.body.removeChild(cursor);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div style={{ backgroundColor: "var(--bg)", minHeight: "100vh" }}>
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
    </div>
  );
}
