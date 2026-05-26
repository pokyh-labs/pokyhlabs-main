#!/bin/sh
set -e

# Create runtime directories AFTER volumes are mounted (Dockerfile mkdir runs before mount).
# This runs as root so it always succeeds regardless of volume ownership.
mkdir -p /app/data /app/backend/uploads /app/backend/logs

# Hand ownership to appuser so the app (non-root) can write to these dirs.
chown appuser:appgroup /app/data /app/backend/uploads /app/backend/logs

# Drop from root to appuser, then hand off to dumb-init → node
exec su-exec appuser dumb-init -- "$@"
