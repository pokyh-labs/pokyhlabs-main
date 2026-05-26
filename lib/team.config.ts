export interface TeamMember {
  id: string
  name: string
  handle: string
  github: string
  role: string
  bio: string
}

// ─── Add or edit team members here ──────────────────────────────────────────
export const team: TeamMember[] = [
  {
    id: "felix",
    name: "Felix Plattner",
    handle: "plattnericus",
    github: "https://github.com/plattnericus",
    role: "Co-Founder · Developer",
    bio: "Felix is a developer from Südtirol with a strong foundation in computer science. He focuses on building fast, scalable web applications and immersive digital experiences that push the boundaries of what the modern web can do.",
  },
  {
    id: "emanuel",
    name: "Emanuel Pfeifer",
    handle: "ryhox",
    github: "https://github.com/ryhox",
    role: "Co-Founder · Developer",
    bio: "Emanuel is a developer from Südtirol with deep expertise in modern web technologies. He has an eye for pixel-perfect interfaces and engineers the systems underneath that keep everything running smoothly at scale.",
  },
]
