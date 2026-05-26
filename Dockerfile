# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

# Build tools required for native addons (sqlite3 needs compilation on Alpine/musl)
RUN apk add --no-cache python3 make g++

# Root deps (Next.js, gsap, dotenv …)
COPY package*.json ./
RUN npm ci --ignore-scripts

# Backend deps — only package.json (no lock file) so npm install picks up the
# latest compatible versions. .npmrc suppresses noise during install.
COPY backend/package.json backend/.npmrc ./backend/
RUN cd backend && npm install

# Copy everything and build (next build + vite admin build)
COPY . .
RUN npm run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:24-alpine
# su-exec: lightweight privilege-drop tool (Alpine standard, replaces gosu)
RUN apk add --no-cache dumb-init wget su-exec
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Next.js runtime artefacts
COPY --from=builder --chown=appuser:appgroup /app/.next            ./.next
COPY --from=builder --chown=appuser:appgroup /app/public           ./public
COPY --from=builder --chown=appuser:appgroup /app/node_modules     ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json     ./package.json
COPY --from=builder --chown=appuser:appgroup /app/server.js        ./server.js

# Backend source + built admin + scripts + deps
COPY --from=builder --chown=appuser:appgroup /app/backend/package.json   ./backend/package.json
COPY --from=builder --chown=appuser:appgroup /app/backend/src            ./backend/src
COPY --from=builder --chown=appuser:appgroup /app/backend/public         ./backend/public
COPY --from=builder --chown=appuser:appgroup /app/backend/scripts        ./backend/scripts
COPY --from=builder --chown=appuser:appgroup /app/backend/node_modules   ./backend/node_modules

# Entrypoint script: creates runtime dirs + fixes volume ownership at startup,
# then drops from root to appuser before handing off to node.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0" NODE_ENV=production

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
