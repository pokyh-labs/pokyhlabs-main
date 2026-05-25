# pokyh.studio

Digital Studio aus Südtirol — building fast, scalable, and immersive web experiences.

**Live:** [pokyh.studio](https://pokyh.studio)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, App Router, SSR |
| Animations | GSAP, ScrollTrigger |
| Backend API | Express.js, Node.js 20+ |
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

### Prerequisites

- **Node.js 20+** (pin with `nvm use` — `.nvmrc` is provided)
- **npm 9+**
- **Docker & Docker Compose** (optional, for containerised deployments)

### Local Development

```bash
# 1. Clone and install
git clone https://github.com/pokyhlabs/pokyhlabs-main.git
cd pokyhlabs-main
npm install         # also runs npm install --prefix backend via postinstall

# 2. Configure environment
cp .env.example .env
# Edit .env — set JWT_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY at minimum

# 3. Generate secure secrets
npm run generate-secrets   # prints random values you can paste into .env

# 4. Create the first admin account
npm run add-admin

# 5. Build the admin SPA, then start the combined server
npm run build:backend      # builds the Vite admin panel
npm run dev                # starts Next.js + Express together on :3000
```

Admin panel: `http://localhost:3000/admin`

### Separate frontend / backend (advanced)

If you want hot-reload on both sides simultaneously:

```bash
# Terminal 1 — backend (port 3001)
PORT=3001 npm run dev:backend

# Terminal 2 — frontend (port 3000)
BACKEND_URL=http://localhost:3001 npm run dev:frontend
```

### Docker

```bash
cp .env.example .env
# Fill in ALL required values (see Environment Variables below)
docker compose up -d
```

Enable the Cloudflare Tunnel sidecar:

```bash
docker compose --profile tunnel up -d
```

> **Note:** The `cloudflared` image is pinned to a specific version in `docker-compose.yml`.  
> Check the [Cloudflare releases page](https://github.com/cloudflare/cloudflared/releases) periodically and bump the tag.

---

## Environment Variables

Copy `.env.example` → `.env` and fill in the values. **Never commit `.env`.**

| Variable | Description | Required |
|---|---|---|
| `PORT` | Server port (default: `3000`) | No |
| `NODE_ENV` | `production` or `development` | No |
| `JWT_SECRET` | Secret for access tokens — use `npm run generate-secrets` | **Yes** |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | **Yes** |
| `ENCRYPTION_KEY` | 32-byte hex for AES-256-GCM (API token storage) | **Yes** |
| `JWT_EXPIRES_IN` | Access token TTL (default: `15m`) | No |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL (default: `7d`) | No |
| `SQLITE_PATH` | Path to the SQLite file (default: `./data/database.sqlite`) | No |
| `UPLOAD_PATH` | Path to uploads directory (default: `./uploads`) | No |
| `MAX_FILE_SIZE_MB` | Max image upload size in MB (default: `15`) | No |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins (default: `http://localhost:$PORT`) | No |
| `BACKEND_URL` | Backend URL used by Next.js SSR (default: `http://localhost:$PORT`) | No |
| `NEXT_PUBLIC_API_URL` | Public API base URL used by the browser-side client | No |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | No |
| `CLOUDFLARE_API_TOKEN` | API token with zone read + cache purge permissions | No |
| `CLOUDFLARE_ZONE_ID` | Zone ID for the domain | No |
| `CLOUDFLARE_TUNNEL_TOKEN` | Cloudflare Tunnel token (for `--profile tunnel`) | No |
| `DB_NAME` | MySQL DB name for Docker Compose MySQL setup (default: `pokyhlabs`) | No |
| `DB_USER` | MySQL user (default: `pokyhlabs_user`) | No |
| `DB_PASSWORD` | MySQL user password | Docker MySQL |
| `DB_ROOT_PASSWORD` | MySQL root password — **no default, must be set explicitly** | Docker MySQL |
| `ADMIN_USERNAME` | Initial admin username (used by `npm run add-admin` only) | No |
| `ADMIN_EMAIL` | Initial admin email | No |
| `ADMIN_PASSWORD` | Initial admin password | No |

---

## npm Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start combined Next.js + Express server in dev mode |
| `npm run dev:frontend` | Next.js only (separate mode) |
| `npm run dev:backend` | Express backend only (separate mode, via nodemon) |
| `npm run build` | Production build: Next.js + admin Vite bundle |
| `npm run build:backend` | Build admin Vite bundle only |
| `npm start` | Start combined server (production) |
| `npm run add-admin` | Create the first admin user interactively |
| `npm run generate-secrets` | Print secure random values for `.env` |
| `npm run security-test` | Run the backend security test suite |

---

## Roles

| Role | Access |
|---|---|
| `admin` | Full access to all pages and settings |
| `editor` | Blog editor only |

---

## Security

### Measures in place

- **JWT rotation** — refresh tokens are single-use; rotated on every call with error handling to prevent token re-use on revocation failure
- **Rate limiting** — global (200/15min), auth (5/15min), admin (60/15min), upload (10/15min)
- **Helmet** — strict CSP nonce-based, HSTS in production, X-Frame-Options DENY
- **Input sanitization** — SQL injection, XSS, path traversal detection middleware
- **LIKE wildcard escaping** — user-supplied filter values are sanitized before SQL LIKE queries
- **Magic-byte validation** — uploaded images validated beyond MIME type
- **EXIF stripping** — Sharp strips all metadata on image upload
- **Presigned one-time upload tokens** — image uploads use a token system (64-char hex, 10min TTL) rather than direct multipart API endpoints
- **SSRF protection** — tunnel `local_service` is restricted to loopback addresses (`localhost`, `127.0.0.1`, `::1`) and ports 1024–65535
- **Suspicious activity logging** — security events written to `suspicious_activities` table
- **IP geolocation** — fully offline via `geoip-lite`, no external API calls
- **Cloudflare IP detection** — `CF-Connecting-IP` header used for real client IPs
- **Honeypot endpoints** — common attack paths (`.env`, `wp-admin`, `/api/credentials`, etc.) return HTTP 418 with a random troll message

### Known limitations / roadmap

- **Admin JWT in localStorage** — the admin dashboard currently stores tokens in `localStorage`, which is vulnerable to XSS. A future improvement is to move to `httpOnly` cookies with a double-submit CSRF token. Mitigated today by the strict CSP that blocks inline scripts.
- **No CSRF tokens** — less critical with `localStorage`-based auth (CSRF requires cookie-based auth to be exploitable), but should be added when the auth flow is updated.

---

## Cross-Platform Notes

| Platform | Status |
|---|---|
| macOS | Fully supported |
| Linux | Fully supported |
| Windows | Supported via **WSL2** or **Docker**. Native Windows support is limited: Cloudflare tunnel auto-install is not available, use Docker instead. |

All file paths are resolved with `path.resolve()` to avoid cross-platform separator issues.

The Node version is pinned via `.nvmrc` (Node 20 LTS). Use `nvm use` to activate it.

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
│   └── seo.config.ts           # Central SEO config, JSON-LD schemas
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── cache.js        # NodeCache instance (blog & project caching)
│   │   │   ├── honeypot.js     # Honeypot sentences + paths — edit freely
│   │   │   └── security.js     # AES-256-GCM helpers, magic-byte validator
│   │   ├── controllers/        # auth, blogs, projects, logs, seo, cloudflare, system, upload
│   │   ├── middleware/         # authenticate, authorize, rateLimiter, requestLogger, sanitize
│   │   ├── models/             # User, Blog, Project, AccessLog, AuthLog, ErrorLog, RefreshToken
│   │   ├── routes/             # Express routers
│   │   └── services/
│   │       └── tunnelService.js   # cloudflared lifecycle management (cross-platform)
│   ├── admin-src/              # React 18 admin SPA (built by Vite)
│   │   ├── components/         # Sidebar, Topbar, WorldMap (choropleth), Toast, …
│   │   └── pages/              # Dashboard, Projects, Blogs, Logs, Seo, Tunnel, Users
│   ├── scripts/
│   │   ├── generate-secrets.js # Generates JWT_SECRET, REFRESH_SECRET, ENCRYPTION_KEY
│   │   └── setup-admin.js      # Creates initial admin user
│   ├── docker-compose.yml      # Backend-only MySQL + cloudflared compose (advanced)
│   └── uploads/                # User-uploaded files (gitignored)
├── data/                       # Runtime-generated (gitignored)
│   ├── database.sqlite
│   └── backups/
├── server.js                   # Combined Next.js + Express entry point
├── docker-compose.yml          # Main Docker deployment (unified app + cloudflared tunnel)
├── .env.example                # Environment template — copy to .env
├── .nvmrc                      # Node 20 LTS version pin (use: nvm use)
├── .editorconfig               # LF line endings, 2-space indent, UTF-8
└── Dockerfile                  # Multi-stage production image
```

---

## Customising the Honeypot

Edit `backend/src/config/honeypot.js` — add/remove sentences in the `responses` array and paths in the `paths` array. No code changes needed elsewhere; the config is hot-read at startup.

---

## License

MIT
