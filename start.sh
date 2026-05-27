#!/bin/sh
set -e

# Start Cloudflare tunnel in background if token is configured.
# Token comes from CLOUDFLARE_TUNNEL_TOKEN in .env — set it once, runs forever.
if [ -n "$CLOUDFLARE_TUNNEL_TOKEN" ]; then
  echo "[start] Cloudflare tunnel starting..."
  cloudflared tunnel --no-autoupdate run --token "$CLOUDFLARE_TUNNEL_TOKEN" &
else
  echo "[start] CLOUDFLARE_TUNNEL_TOKEN not set — tunnel skipped."
fi

exec node server.js
