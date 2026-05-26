# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Root deps (Next.js, gsap, dotenv …)
COPY package*.json ./
RUN npm ci --ignore-scripts

# Backend deps
COPY backend/package*.json ./backend/
RUN cd backend && npm ci

# Copy everything and build
COPY . .
RUN npm run build          # next build + vite admin build

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

RUN mkdir -p data backend/uploads logs && chown -R appuser:appgroup /app

USER appuser
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0" NODE_ENV=production

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
