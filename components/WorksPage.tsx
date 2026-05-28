"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import type { BookProject } from "@/components/ProjectBook/bookScene"
import { useT } from "@/lib/i18n/context"

const ProjectBook = dynamic(() => import("@/components/ProjectBook"), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100%", height: "100vh", background: "var(--bg, #e4e2dc)" }} />
  ),
})

export default function WorksPage({ initialProjects = [] }: { initialProjects?: BookProject[] }) {
  const t = useT()
  const [projects, setProjects] = useState<BookProject[]>(initialProjects)

  // Client-side fallback if the server didn't have data (e.g. backend was warming up).
  useEffect(() => {
    if (initialProjects.length > 0) return
    const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api$/, "")
    fetch(`${base}/api/projects`)
      .then((r) => (r.ok ? r.json() : { projects: [] }))
      .then((d) => setProjects(d.projects || []))
      .catch(() => {})
  }, [initialProjects])

  return (
    <ProjectBook
      projects={projects}
      emptyHeading={t("works_coming_soon")}
      emptyBody={t("works_admin_note")}
    />
  )
}
