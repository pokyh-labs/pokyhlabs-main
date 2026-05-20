export interface TeamMember {
  id: string
  name: string
  github: string
  role: string
  bio: string
}

// ─── Add or edit team members here ──────────────────────────────────────────
export const team: TeamMember[] = [
  {
    id: "plattnericus",
    name: "plattnericus",
    github: "https://github.com/plattnericus",
    role: "Software Developer",
    bio: "Developer from Südtirol with a strong background in computer science. Focused on building fast, scalable web applications and immersive digital experiences that push the boundaries of what the web can do.",
  },
  {
    id: "ryhox",
    name: "ryhox",
    github: "https://github.com/ryhox",
    role: "Software Developer",
    bio: "Developer from Südtirol with deep expertise in computer science and modern web technologies. Passionate about crafting pixel-perfect interfaces and engineering robust systems that perform flawlessly at scale.",
  },
]
