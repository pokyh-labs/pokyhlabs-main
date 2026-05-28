#!/usr/bin/env bash
# ── pokyhlabs setup / update script ──────────────────────────────────────────
# Runs on macOS and Linux.
# Usage:
#   chmod +x setup.sh && ./setup.sh          # fresh install or update
#   ./setup.sh --update                      # pull latest code, rebuild, restart
set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

ok()   { echo -e "${GREEN}✓${NC}  $*"; }
info() { echo -e "${CYAN}→${NC}  $*"; }
warn() { echo -e "${YELLOW}⚠${NC}  $*"; }
fail() { echo -e "${RED}✗  $*${NC}"; exit 1; }
hr()   { echo -e "${CYAN}────────────────────────────────────────────────────${NC}"; }

UPDATE_MODE=false
for arg in "$@"; do
  case "$arg" in
    --update) UPDATE_MODE=true ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

hr
echo -e "${BOLD}  pokyhlabs  –  Setup & Deploy${NC}"
hr

# ── 1. Prerequisites ──────────────────────────────────────────────────────────
info "Checking prerequisites..."

command -v node >/dev/null 2>&1 || fail "Node.js not installed. Install v20+ from https://nodejs.org"
command -v npm  >/dev/null 2>&1 || fail "npm not installed. It ships with Node.js."

NODE_MAJOR=$(node -e "process.stdout.write(String(process.version.split('.')[0].slice(1)))")
if [ "$NODE_MAJOR" -lt 20 ]; then
  fail "Node.js v20+ required (found $(node --version)). Upgrade at https://nodejs.org"
fi
ok "Node.js $(node --version)  /  npm $(npm --version)"

# ── 2. Pull latest code (update mode) ─────────────────────────────────────────
if $UPDATE_MODE; then
  info "Pulling latest code..."
  git pull || warn "git pull failed — continuing with local code"
  ok "Code up to date"
fi

# ── 3. .env ───────────────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  info "No .env found — copying .env.example..."
  cp .env.example .env
  warn "IMPORTANT: Edit .env before starting the server!"
  warn "  Required: JWT_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY"
  warn "  Run  npm run generate-secrets  to generate safe random values."
  echo ""
else
  ok ".env exists"
fi

# Warn about unchanged placeholder secrets
if grep -q "CHANGE_ME" .env 2>/dev/null; then
  warn "Your .env still contains CHANGE_ME placeholders."
  warn "Run  npm run generate-secrets  to generate safe random values, then update .env."
  echo ""
fi

# ── 4. Install dependencies ───────────────────────────────────────────────────
info "Installing root dependencies..."
npm install
ok "Root dependencies installed"

# backend deps are installed via postinstall, but ensure it ran
if [ ! -d "backend/node_modules" ]; then
  info "Installing backend dependencies..."
  npm install --prefix backend
  ok "Backend dependencies installed"
fi

# ── 5. Build ──────────────────────────────────────────────────────────────────
info "Building project (Next.js + admin panel)..."
npm run build
ok "Build complete"

# ── 6. Database / first-run setup ────────────────────────────────────────────
PORT=$(grep -E "^PORT=" .env 2>/dev/null | cut -d= -f2 | tr -d ' ')
PORT="${PORT:-3000}"

DB_PATH=$(grep -E "^SQLITE_PATH=" .env 2>/dev/null | cut -d= -f2 | tr -d ' ')
DB_PATH="${DB_PATH:-./data/database.sqlite}"

if [ ! -f "$DB_PATH" ]; then
  echo ""
  warn "No database found at $DB_PATH"
  echo -e "  ${BOLD}Do you want to create an admin user now?${NC} (y/N) "
  read -r REPLY
  if [[ "$REPLY" =~ ^[Yy]$ ]]; then
    info "Creating admin user (reads ADMIN_USERNAME/EMAIL/PASSWORD from .env)..."
    npm run add-admin
    ok "Admin user created"
  else
    info "Skipped. Run  npm run add-admin  later to create one."
  fi
fi

# ── 7. Start ──────────────────────────────────────────────────────────────────
hr
ok "Setup complete!"
echo ""

if command -v pm2 >/dev/null 2>&1; then
  echo -e "  ${BOLD}Start options:${NC}"
  echo -e "    ${GREEN}pm2 start server.js --name pokyhlabs${NC}   (recommended — survives terminal close)"
  echo -e "    ${GREEN}npm start${NC}                               (foreground)"
else
  echo -e "  ${BOLD}Start the server:${NC}"
  echo -e "    ${GREEN}npm start${NC}"
  echo ""
  info "For production use, install pm2 to keep the server running after logout:"
  echo -e "    npm install -g pm2 && pm2 start server.js --name pokyhlabs"
fi

echo ""
info "App will be at:   http://localhost:${PORT}"
info "Admin dashboard:  http://localhost:${PORT}/admin"
hr
