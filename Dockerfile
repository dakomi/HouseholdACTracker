# ─── Stage 1: Build frontend ────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /build/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

# VITE_API_URL is intentionally empty so that all API / Socket.io calls use
# relative URLs (e.g. /api/...).  This is correct when the Express backend
# serves the frontend from the same origin (single-service deployment).
# Override at build time with --build-arg VITE_API_URL=https://... if you
# want to deploy the frontend separately.
ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# ─── Stage 2: Build backend ──────────────────────────────────────────────────
FROM node:20-alpine AS backend-builder
WORKDIR /build/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
# Generates the Prisma client and compiles TypeScript → dist/
RUN npm run build

# ─── Stage 3: Production runtime ─────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Backend compiled output
COPY --from=backend-builder /build/backend/dist          ./dist
COPY --from=backend-builder /build/backend/node_modules  ./node_modules
COPY --from=backend-builder /build/backend/prisma        ./prisma
COPY --from=backend-builder /build/backend/package.json  ./package.json

# Frontend static assets – Express will serve these from /public
COPY --from=frontend-builder /build/frontend/dist ./public

# Railway (and most PaaS) injects $PORT at runtime; default to 3000.
ENV PORT=3000
EXPOSE 3000

# Apply any pending schema changes then start the API server.
# --skip-generate: Prisma client was already generated during the build stage.
CMD ["sh", "-c", "node_modules/.bin/prisma db push --skip-generate && node dist/server.js"]
