import { Fragment } from "react"

// Per-character fly-in, split at render time (including SSR) instead of in a
// useEffect: the plain text is never painted before the animation, and the
// pure-CSS animation keeps running on the compositor even while the main
// thread is busy hydrating or loading data. Chars are grouped per word
// (nowrap) so the headline can only break between words, never mid-word.
export default function CharFlyIn({
  text,
  lineIndex = 0,
  stagger = 35,
  lineGap = 120,
}: {
  text: string
  lineIndex?: number
  stagger?: number
  lineGap?: number
}) {
  let idx = 0
  return (
    <>
      {text.trim().split(/\s+/).filter(Boolean).map((word, wi) => (
        <Fragment key={wi}>
          {wi > 0 && <span className="sp" />}
          <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
            {Array.from(word).map((ch, ci) => {
              const d = lineIndex * lineGap + idx * stagger
              idx++
              return (
                <span key={ci} className="ch" style={{ "--d": `${d}ms` } as React.CSSProperties}>
                  {ch}
                </span>
              )
            })}
          </span>
        </Fragment>
      ))}
    </>
  )
}
