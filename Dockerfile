# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Build tools required for native addons (sqlite3 has no musl pre-built binary
# and must be compiled from source on Alpine Linux)
RUN apk add --no-cache python3 make g++

# Root deps (Next.js, gsap, dotenv …)
COPY package*.json ./
RUN npm ci --ignore-scripts

# Backend deps — postinstall (vite build) was removed from package.json so plain
# npm ci is safe here; install scripts for native addons (sqlite3, sharp …) run.
COPY backend/package*.json ./backend/
RUN cd backend && npm ci

# Copy everything and build (next build + vite admin build)
COPY . .
RUN npm run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine
RUN apk add --no-cache dumb-init wget
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

# All COPY commands above already use --chown=appuser:appgroup.
# Only the newly created directories need ownership set — NOT all of /app
# (chown -R on node_modules takes ~68 seconds and adds no value).
RUN mkdir -p data backend/uploads logs \
 && chown appuser:appgroup data backend/uploads logs

USER appuser
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0" NODE_ENV=production

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
