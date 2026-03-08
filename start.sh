#!/bin/sh
# start.sh – build everything and start the server in a single step.
#
# Intended for PaaS platforms that run one command to both build and start the
# app (e.g. Render "Web Service" with a custom start command, Heroku, etc.).
#
# Environment variables (set in the platform dashboard):
#   DATABASE_URL   – Prisma datasource URL (required)
#   PORT           – port to listen on (default: 3000)
#   FRONTEND_URL   – public URL of this deployment, used for CORS
#                    (e.g. https://your-app.onrender.com)
#   VITE_API_URL   – leave empty ("") when frontend & backend share the same
#                    origin; set to the backend URL for separate-service setups

set -e

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── 1. Build frontend ─────────────────────────────────────────────────────────
echo "==> Installing frontend dependencies..."
cd "$REPO_ROOT/frontend"
npm ci

echo "==> Building frontend..."
# Use relative paths (empty VITE_API_URL) so the built assets work when served
# by the backend on the same origin.  Override VITE_API_URL before running
# this script if you want a different backend URL baked into the build.
VITE_API_URL="${VITE_API_URL:-}" npm run build

# ── 2. Copy frontend build output into backend/public ────────────────────────
echo "==> Copying frontend dist → backend/public..."
mkdir -p "$REPO_ROOT/backend/public"
cp -r dist/* "$REPO_ROOT/backend/public/"

# ── 3. Build backend ──────────────────────────────────────────────────────────
echo "==> Installing backend dependencies..."
cd "$REPO_ROOT/backend"
npm ci

echo "==> Building backend..."
npm run build

# ── 4. Apply database schema ──────────────────────────────────────────────────
echo "==> Applying database schema..."
npx prisma db push --skip-generate

# ── 5. Start the server ───────────────────────────────────────────────────────
echo "==> Starting server on port ${PORT:-3000}..."
if [ ! -f "$REPO_ROOT/backend/dist/server.js" ]; then
  echo "Error: backend/dist/server.js not found – build may have failed"
  exit 1
fi
exec node "$REPO_ROOT/backend/dist/server.js"
