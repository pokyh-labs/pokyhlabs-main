# pokyh.studio

Digital Studio aus Südtirol — building fast, scalable, and immersive web experiences.

**Live:** [pokyh.studio](https://pokyh.studio)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, App Router, SSR |
| Animations | GSAP, ScrollTrigger |
| Backend API | Express.js, Node.js 18+ |
| Database | SQLite via Sequelize ORM |
| Auth | JWT (access + refresh tokens, single-use rotation) |
| Admin Panel | React 18, Vite |
| CDN / Tunnel | Cloudflare |
| Deployment | Docker Compose or single Node.js process |

---

## Features

### Public Site
- SSR-rendered pages — projects and blog posts are server-side fetched for instant load and full SEO indexability
- Blog with multilingual SEO (DE/EN/IT), structured data (Article, BreadcrumbList)
- Works/Portfolio page dynamically fed from the admin panel
- Automatic `sitemap.xml` and `robots.txt` generation
- Organization, LocalBusiness, and Service JSON-LD schemas

### Admin Panel (`/admin`)
- **Dashboard** — real-time stats, system health, auto-refresh every 30s
- **Projects** — CRUD, drag-to-reorder, image upload with preview, tags, status (live/wip/concept), external URL
- **Blog editor** — Markdown + HTML, image/PDF upload, draft/publish workflow, slug auto-generation
- **Logs & Analytics** — access logs, auth events, security events, error logs with stack traces, choropleth world map powered by IP geolocation (fully offline via `geoip-lite`)
- **SEO Editor** — keyword chips, meta description, Google/Bing verification tokens
- **Cloudflare Controls** — API credentials, zone analytics, cache purge, tunnel status
- **Users** — role-based access (admin / editor), password management
- **Honeypot endpoints** — troll-responds to scanners and bots on common attack paths (`.env`, `wp-admin`, etc.) with configurable funny messages
- One-click database backup with 10-minute cooldown

---

## Architecture

The frontend (Next.js) and backend (Express) run in a single Node.js process via `server.js`. Requests are routed based on path prefix:

```
localhost:3000
  ├─ /api/*          → Express backend
  ├─ /admin/*        → Express backend (serves React admin SPA)
  ├─ /uploads/*      → Express static file serving
  └─ everything else → Next.js
```

This means one port, one process, zero CORS configuration needed in production.

---

## Quick Start

### Local Development

```bash
# 1. Clone and install
git clone https://github.com/pokyhlabs/pokyhlabs-main.git
cd pokyhlabs-main
npm install         # also runs npm install --prefix backend via postinstall

# 2. Configure environment
cp .env.example .env
# Edit .env — set JWT_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY at minimum

# 3. Generate secure secrets (optional helper)
npm run generate-secrets   # prints random values you can paste into .env

# 4. Create the first admin account
npm run add-admin

# 5. Build the admin SPA, then start the combined server
npm run build:backend      # builds the Vite admin panel
npm run dev                # starts Next.js + Express together on :3000
```

Admin panel: `http://localhost:3000/admin`

### Docker

```bash
cp .env.example .env
# Fill in required values
docker compose up -d
```

Enable the Cloudflare Tunnel sidecar:

```bash
docker compose --profile tunnel up -d
```

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `PORT` | Server port (default: `3000`) | No |
| `NODE_ENV` | `production` or `development` | No |
| `JWT_SECRET` | Secret for access tokens — generate with `npm run generate-secrets` | **Yes** |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | **Yes** |
| `ENCRYPTION_KEY` | 32-byte hex for AES-256-GCM (API token storage) | **Yes** |
| `JWT_EXPIRES_IN` | Access token TTL (default: `15m`) | No |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL (default: `7d`) | No |
| `SQLITE_PATH` | Absolute path to the SQLite file | No |
| `UPLOAD_PATH` | Path to uploads directory (default: `./uploads`) | No |
| `MAX_FILE_SIZE_MB` | Max image upload size in MB (default: `15`) | No |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | No |
| `BACKEND_URL` | Internal backend URL for SSR data fetching (default: `http://localhost:$PORT`) | No |
| `NEXT_PUBLIC_API_URL` | Public API base URL used by the Next.js client | No |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | No |
| `CLOUDFLARE_API_TOKEN` | API token with zone read + cache purge permissions | No |
| `CLOUDFLARE_ZONE_ID` | Zone ID for the domain | No |
| `CLOUDFLARE_TUNNEL_TOKEN` | Cloudflare Tunnel token | No |
| `ADMIN_USERNAME` | Initial admin username (setup only) | No |
| `ADMIN_EMAIL` | Initial admin email (setup only) | No |

> `.env` is gitignored. Copy `.env.example` as your template. **Never commit secrets.**

---

## Roles

| Role | Access |
|---|---|
| `admin` | Full access to all pages and settings |
| `editor` | Blog editor only |

---

## Security

- **JWT rotation** — refresh tokens are single-use; rotated on every call
- **Rate limiting** — global (200/15min), auth (5/15min), admin (60/15min), upload (10/15min)
- **Helmet** — strict CSP nonce-based, HSTS in production, X-Frame-Options DENY
- **Input sanitization** — SQL injection, XSS, path traversal detection middleware
- **Magic-byte validation** — uploaded images validated beyond MIME type
- **EXIF stripping** — sharp strips all metadata on image upload
- **Suspicious activity logging** — security events written to `suspicious_activities` table
- **IP geolocation** — fully offline via `geoip-lite`, no external API calls
- **Cloudflare IP detection** — `CF-Connecting-IP` header used for real client IPs
- **Honeypot endpoints** — common attack paths (`.env`, `wp-admin`, `/api/credentials`, etc.) return HTTP 418 with a random troll message; configurable in `backend/src/config/honeypot.js`

---

## Project Structure

```
.
├── app/                        # Next.js App Router pages (server components)
│   ├── works/page.tsx          # Fetches projects SSR → passes to WorksPage
│   ├── blog/page.tsx           # Fetches blogs SSR → passes to BlogsPage
│   ├── blog/[slug]/page.tsx    # Fetches post SSR, generates OG metadata
│   ├── sitemap.ts              # Dynamic sitemap from DB + SEO config
│   └── robots.ts               # Bot rules
├── components/                 # Next.js client components (GSAP animations, etc.)
│   ├── WorksPage.tsx
│   ├── BlogsPage.tsx
│   └── ...
├── lib/
│   ├── server-api.ts           # SSR data fetching helpers (server only)
│   └── seo.config.ts           # Central SEO config
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── honeypot.js     # Honeypot sentences + paths — edit freely
│   │   │   └── security.js
│   │   ├── controllers/        # auth, blogs, projects, logs, seo, cloudflare, system
│   │   ├── middleware/         # authenticate, authorize, rateLimiter, requestLogger, errorLogger
│   │   ├── models/             # User, Blog, Project, AccessLog, AuthLog, ErrorLog, …
│   │   └── routes/             # Express routers including honeypot.js
│   ├── admin-src/              # React 18 admin SPA (Vite)
│   │   ├── components/         # Sidebar, Topbar, WorldMap (choropleth), Toast, …
│   │   └── pages/              # Dashboard, Projects, Blogs, Logs, Seo, Tunnel, Users
│   └── uploads/                # User-uploaded files (gitignored)
├── data/                       # Runtime-generated (gitignored)
│   ├── database.sqlite
│   └── backups/
├── server.js                   # Combined Next.js + Express entry point
├── docker-compose.yml
└── .env.example
```

---

## Customising the Honeypot

Edit `backend/src/config/honeypot.js` — add/remove sentences in the `responses` array and paths in the `paths` array. No code changes needed elsewhere; the config is hot-read at startup.

---

## License

MIT
