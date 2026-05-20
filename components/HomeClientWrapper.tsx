"use client";

import { useEffect, useRef, ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Helper for word-by-word animation
const WordReveal = ({ text }: { text: string }) => {
  return (
    <>
      {text.split(" ").map((word, i) => (
        <span key={i} className="blur-word" style={{ display: "inline-block", whiteSpace: "pre-wrap" }}>
          {word}{" "}
        </span>
      ))}
    </>
  );
};

export default function HomeClientWrapper({ children }: { children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const revealsRef = useRef<(HTMLDivElement | null)[]>([]);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    // A wild glow orb that follows the mouse!
    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        gsap.to(cursorRef.current, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.8,
          ease: "power3.out",
        });
      }
    };
    window.addEventListener("mousemove", moveCursor);

    // The dark section starts flat and gets MORE curved the further you scroll down
    gsap.fromTo(contentRef.current, 
      { borderTopLeftRadius: "0%", borderTopRightRadius: "0%" },
      {
        borderTopLeftRadius: "50% 150px",  // Increase the curve
        borderTopRightRadius: "50% 150px", 
        ease: "none",
        scrollTrigger: {
          trigger: contentRef.current,
          start: "top bottom",
          end: "top top",
          scrub: true,
        }
      }
    );

    // Elegant Word-by-Word Blur Text Reveal effect
    revealsRef.current.forEach((el) => {
      if (!el) return;

      const words = el.querySelectorAll('.blur-word');
      
      if (words.length > 0) {
        gsap.fromTo(words, 
          { 
            opacity: 0.2, 
            filter: "blur(12px)",
            y: 10
          },
          {
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            ease: "none",
            stagger: 0.05,
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              end: "top 40%",
              scrub: true,
            }
          }
        );
      } else {
        // Fallback for elements without words (like buttons)
        gsap.fromTo(el, 
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
            }
          }
        );
      }
    });

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div style={{ backgroundColor: "var(--bg)", minHeight: "100vh" }}>
      {/* Normal Hero */}
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

      {/* Scrollable Dark Content Below */}
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
          overflow: "hidden"
        }}
      >
        <div style={{ maxWidth: "1000px", textAlign: "center", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {/* Main Headline */}
          <div ref={(el) => { if (el) revealsRef.current[0] = el; }}>
            <h2 suppressHydrationWarning
              style={{ fontSize: "clamp(2rem, 3.5vw, 4rem)", fontWeight: 400, lineHeight: 1.3, marginBottom: "3rem" }}
            >
              <WordReveal text="We are Pokyhlabs – a digital studio crafting fast," /><br />
              <WordReveal text="scalable, and immersive web experiences that" /><br />
              <WordReveal text="merge creativity with engineering precision." />
            </h2>
          </div>

          {/* Subtext */}
          <div ref={(el) => { if (el) revealsRef.current[1] = el; }}>
            <p suppressHydrationWarning
              style={{ fontSize: "clamp(1rem, 1.5vw, 1.5rem)", fontWeight: 300, lineHeight: 1.6, marginBottom: "4rem", color: "#d1d1d1" }}
            >
              <WordReveal text="We specialize in developing digital platforms, cutting-edge products, and interactive" /><br />
              <WordReveal text="brand experiences using modern web technologies." />
            </p>
          </div>

          {/* About Us Button */}
          <div ref={(el) => { if (el) revealsRef.current[2] = el; }}>
            <button style={{ 
              backgroundColor: "var(--ink)", 
              color: "#fff", 
              border: "none", 
              borderRadius: "30px",
              padding: "1rem 2rem",
              fontSize: "1rem",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              margin: "0 auto"
            }}>
              Discover Our Work
              <span style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                justifyContent: "center",
                width: "30px", 
                height: "30px", 
                borderRadius: "50%", 
                backgroundColor: "rgba(255,255,255,0.2)" 
              }}>
                ↗
              </span>
            </button>
          </div>
        </div>

        {/* Extra scrollable section */}
        <div style={{ maxWidth: "1000px", textAlign: "left", width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div ref={(el) => { if (el) revealsRef.current[3] = el; }}>
            <h2 suppressHydrationWarning
              style={{ fontSize: "clamp(2rem, 3.5vw, 4rem)", fontWeight: 400, lineHeight: 1.3, marginBottom: "2rem" }}
            >
              <WordReveal text="Pushing the boundaries of the digital world." />
            </h2>
          </div>
          <div ref={(el) => { if (el) revealsRef.current[4] = el; }}>
            <p suppressHydrationWarning
              style={{ fontSize: "clamp(1rem, 1.5vw, 1.5rem)", fontWeight: 300, lineHeight: 1.6, marginBottom: "3rem", color: "#d1d1d1", maxWidth: "800px" }}
            >
              <WordReveal text="Every pixel we place and every line of code we write is intentional. By combining beautiful design with robust development, we build digital products that not only look incredible but perform flawlessly under pressure." />
            </p>
          </div>
          <div ref={(el) => { if (el) revealsRef.current[5] = el; }}>
            <button style={{ 
              backgroundColor: "transparent", 
              color: "#fff", 
              border: "1px solid rgba(255, 255, 255, 0.3)", 
              borderRadius: "30px",
              padding: "1rem 2rem",
              fontSize: "1rem",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}>
              Get In Touch
              <span style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                justifyContent: "center",
                width: "30px", 
                height: "30px", 
                borderRadius: "50%", 
                backgroundColor: "rgba(255,255,255,0.1)" 
              }}>
                →
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}