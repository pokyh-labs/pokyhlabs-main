export interface Project {
  id: string
  title: string
  description: string
  tags: string[]
  url?: string
  year: number
  status?: "live" | "wip" | "concept"
}

// ─── Add your projects here ──────────────────────────────────────────────────
// Each entry appears as a card on the /works page.
// Copy & uncomment the template below to add a new project.
export const projects: Project[] = [
  // {
  //   id: "my-project",
  //   title: "My Project",
  //   description: "A short description of what this project is and what makes it special.",
  //   tags: ["Next.js", "GSAP", "TypeScript"],
  //   url: "https://example.com",
  //   year: 2025,
  //   status: "live",
  // },
]
