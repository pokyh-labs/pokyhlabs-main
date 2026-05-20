# pokyhlabs

Interactive particle canvas built with Next.js and TypeScript. Particles form and morph between shapes — torus, sphere, star, heart, flower — with a physics-based mouse repulsion effect.

## Stack

- **Framework** — Next.js 16 (App Router)
- **Language** — TypeScript
- **Rendering** — Canvas 2D API with requestAnimationFrame
- **Styling** — CSS (globals only, no CSS-in-JS)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |

## Project Structure

```
app/
  layout.tsx       # Root layout
  page.tsx         # Entry point
  globals.css      # Global styles and animations
components/
  ParticleCanvas   # WebGL-style canvas animation
  Headline         # Animated letter fly-in
  Header           # Top navigation
  Socials          # Social links
  ScrollIndicator  # Animated scroll arrow
  RailLine         # Decorative rail element
```
