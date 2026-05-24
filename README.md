# pokyh.studio

Digital Studio aus Südtirol — building fast, scalable, and immersive web experiences.

**Live:** [pokyh.studio](https://pokyh.studio)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, App Router |
| Backend API | Express.js, Node.js 18+ |
| Database | SQLite via Sequelize ORM |
| Auth | JWT (access + refresh tokens, single-use rotation) |
| Admin Panel | React 18, Vite |
| CDN / Tunnel | Cloudflare |
| Deployment | Docker Compose |

---

## Features

**Public Site**
- Blog with multilingual SEO (DE/EN/IT)
- Automatic sitemap.xml and robots.txt generation
- Structured data (Organization, LocalBusiness, Service)

**Admin Panel** (`/admin`)
- Dashboard with blog stats and live system health (auto-refresh every 30s)
- Blog editor — Markdown and HTML, image/PDF upload, draft/publish workflow
- User management with role-based access (admin / editor)
- Logs and Analytics — access logs, auth events, security events, error logs, world map (offline geolocation)
- SEO Editor — keywords chips UI, multilingual descriptions, verification tokens, sitemap entries
- Cloudflare Controls — API credentials, zone analytics, cache purge, tunnel status
- One-click database backup with 10-minute cooldown

---

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development without Docker)
- A Cloudflare account (optional — for tunnel and analytics features)

---

## Quick Start (Docker)

```bash
cp .env.example .env
# Fill in required values in .env
docker compose up -d
```

API: `http://localhost:3001` — Frontend: `http://localhost:3000` — Admin: `http://localhost:3001/admin`

Enable the Cloudflare Tunnel sidecar:

```bash
docker compose --profile tunnel up -d
```

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `JWT_SECRET` | Secret for access tokens (min 32 chars) | Yes |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (min 32 chars) | Yes |
| `SQLITE_PATH` | Absolute path to the SQLite file | Yes |
| `UPLOAD_PATH` | Absolute path to uploads directory | Yes |
| `LOG_PATH` | Directory for Winston log files | No |
| `PORT` | Express port (default: 3001) | No |
| `NODE_ENV` | `production` or `development` | No |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | Yes |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | No |
| `CLOUDFLARE_API_TOKEN` | API token with zone read + cache purge permissions | No |
| `CLOUDFLARE_ZONE_ID` | Zone ID for the domain | No |
| `CLOUDFLARE_TUNNEL_TOKEN` | Tunnel token | No |
| `PROJECT_ROOT` | Absolute path to the Next.js project root | No |
| `ENCRYPTION_KEY` | 32-byte hex for AES-256-GCM encryption | No |

> `.env` is gitignored. Use `.env.example` as your template. Never commit secrets.

---

## Admin Roles

| Role | Access |
|---|---|
| `admin` | Full access to all pages and settings |
| `editor` | Blog editor only |

---

## Security

- **JWT rotation** — refresh tokens are single-use, rotated on every call
- **Rate limiting** — global (200/15min), auth (5/15min), admin (60/15min)
- **Helmet** — strict CSP, HSTS in production, X-Frame-Options
- **Input sanitization** — SQL injection, XSS, path traversal detection via middleware
- **Suspicious activity logging** — all security events written to `suspicious_activity` table
- **IP geolocation** — fully offline via `geoip-lite`, no external API calls
- **Error logging** — 5xx errors captured to `error_logs` table and Winston log files
- **Cloudflare tokens** — stored server-side in `.env`, masked in all API responses, never sent to browser

---

## Local Development (without Docker)

```bash
# Backend
cd backend
npm install
npm run dev          # Express on :3001 with nodemon

# Admin panel (in a separate terminal)
cd backend
npm run build:admin  # or vite dev inside admin-src

# Frontend (Next.js)
# from project root
npm install
npm run dev          # Next.js on :3000
```

---

## Project Structure

```
.
├── app/                      # Next.js App Router pages
│   ├── sitemap.ts            # Dynamic sitemap from seo-override.json + blogs
│   └── robots.ts             # Bot rules
├── lib/
│   └── seo.config.ts         # Default SEO configuration (source of truth)
├── backend/
│   ├── src/
│   │   ├── controllers/      # Route handlers (auth, blogs, logs, seo, cloudflare, system)
│   │   ├── middleware/       # authenticate, authorize, rateLimiter, requestLogger, errorLogger
│   │   ├── models/           # Sequelize models (User, Blog, AccessLog, AuthLog, ErrorLog, …)
│   │   ├── routes/           # Express routers
│   │   └── utils/            # logger, envWriter
│   ├── admin-src/            # React 18 admin panel (Vite)
│   │   ├── components/       # Sidebar, Topbar, WorldMap, Toast, …
│   │   └── pages/            # Dashboard, Blogs, Logs, Seo, Tunnel, Users
│   └── uploads/              # User-uploaded files (gitignored)
├── data/                     # Runtime-generated (gitignored)
│   ├── database.sqlite
│   ├── seo-override.json     # SEO overrides written by admin panel
│   └── backups/              # Database backups
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── .env.example
```

---

## License

MIT
