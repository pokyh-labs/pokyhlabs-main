"use client"
import { useEffect } from "react"

export default function RevealObserver() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ isIntersecting, target }) => {
          if (isIntersecting) {
            target.classList.add("is-visible")
            io.unobserve(target)
          }
        })
      },
      { threshold: 0.08, rootMargin: "0px 0px -24px 0px" }
    )

    function scan() {
      document.querySelectorAll("[data-reveal]:not(.is-visible)").forEach((el) => io.observe(el))
    }
    scan()

    const mo = new MutationObserver(scan)
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])

  return null
}
