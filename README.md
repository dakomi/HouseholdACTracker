# Household AC Tracker

A dual-interface tool (web app + Facebook Messenger bot) for tracking air conditioner electricity usage across household members. Designed for non-technical users — log an AC session in under 10 seconds.

---

## Features

- **One-tap AC session logging** with zone selection and optional confirmation step
- **Real-time status** — see who has the AC on, in which zone, and how much time is left
- **Shared-usage calculation** — proportional cost attribution when multiple users overlap
- **Per-user dashboard** — Today / Week / Month usage (hours, kWh, cost) with zone pie chart
- **Session history** — edit last 5 sessions; "View All" tab for full history
- **Admin panel** — manage household members, zones, zone combinations, and settings
- **Facebook Messenger bot** — quick commands (`ac on`, `ac off`, `ac status`, etc.)
- **PWA-capable** — installable on home screens, works offline with cached data
- **Data export** — download all data as JSON

---

## Architecture

```
┌─────────────────────────────────────────┐
│              Clients                    │
│  ┌─────────────────┐  ┌─────────────┐  │
│  │   Web App (PWA) │  │  Messenger  │  │
│  │  React + Vite   │  │     Bot     │  │
│  └────────┬────────┘  └──────┬──────┘  │
└───────────┼───────────────────┼─────────┘
            │  REST + Socket.io  │ Webhook
┌───────────▼───────────────────▼─────────┐
│           Backend (Node.js / Express)   │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │  REST API │  │Socket.io │  │  Bot  │ │
│  │ /api/...  │  │ real-time│  │handler│ │
│  └──────────┘  └──────────┘  └───────┘ │
│  ┌─────────────────────────────────┐   │
│  │        Prisma ORM               │   │
│  └────────────────┬────────────────┘   │
└───────────────────┼─────────────────────┘
                    │
          ┌─────────▼─────────┐
          │   SQLite / PgSQL  │
          └───────────────────┘
```

---

## Project Structure

```
HouseholdACTracker/
├── backend/                  # Node.js + Express + TypeScript
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts           # Sample data (5 users, 4 zones, 19 sessions, settings)
│   ├── src/
│   │   ├── app.ts            # Express app + CORS
│   │   ├── server.ts         # HTTP server + Socket.io
│   │   ├── middleware/       # Error handler, auth
│   │   ├── routes/           # users, zones, sessions, reports, settings, bot
│   │   ├── services/         # usageCalculator, messengerBot, socketService
│   │   └── prisma/client.ts  # Prisma singleton
│   └── tests/
│   │   └── usageCalculator.test.ts  # 20 unit tests
│   ├── .env.example
│   └── package.json
│
├── frontend/                 # React 18 + TypeScript + Vite
│   ├── public/
│   │   ├── manifest.json     # PWA manifest
│   │   └── sw.js             # Service worker
│   ├── src/
│   │   ├── api/              # Typed API client + Socket.io client
│   │   ├── components/       # Header, modals, SessionCard, etc.
│   │   ├── contexts/         # UserContext, AppContext
│   │   ├── hooks/            # useApi, useSocket
│   │   ├── pages/            # Home, Stats, Sessions, History, Admin, SelectUser
│   │   └── types/            # TypeScript interfaces
│   └── package.json
│
└── README.md
```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Clone & Install

```bash
git clone https://github.com/dakomi/HouseholdACTracker.git
cd HouseholdACTracker
```

**Backend:**
```bash
cd backend
npm install
cp .env.example .env        # set DATABASE_URL (default: file:./dev.db)
npx prisma db push          # create the database schema
npm run dev                 # starts on http://localhost:3001 (requires open terminal)
```

> **First-time setup:** The app detects an empty database and shows inline guidance to help you add household members and AC zones. No seed data is loaded — you start clean.

> **Optional — sample data:** Run `npm run prisma:seed` to pre-load 5 users, 4 zones, and 19 historical sessions. Useful for demos and testing; skip for a real household install.

> **Note:** `npm run dev` uses `ts-node-dev` and will stop when you close the terminal.
> `npm run build` (run by `npm start`) generates the Prisma client and compiles TypeScript
> automatically — no separate `prisma generate` step needed.
> For persistent background running, see [Running in the Background](#running-in-the-background) below.

**Frontend** (new terminal):
```bash
cd frontend
npm install
npm run dev                  # Starts on http://localhost:3000
```

Open http://localhost:3000 in your browser.

### Running in the Background

To keep the backend running after closing your terminal, use [PM2](https://pm2.keymetrics.io/):

```bash
npm install -g pm2

# Build once (generates Prisma client + compiles TypeScript)
cd backend
npm run build

# Start with PM2 (persists across terminal sessions)
pm2 start dist/server.js --name ac-tracker-api
pm2 save            # persist across reboots

# To restart after code changes:
npm run build && pm2 restart ac-tracker-api
```

For the frontend, serve the built assets with PM2 as well:

```bash
npm install -g serve
cd frontend && npm run build
pm2 start "serve -s dist -p 3000" --name ac-tracker-web
pm2 save
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | SQLite path or PostgreSQL URL | `file:./dev.db` |
| `PORT` | API server port | `3001` |
| `FRONTEND_URL` | CORS origin for frontend | `http://localhost:3000` |
| `MESSENGER_PAGE_ACCESS_TOKEN` | Facebook page access token | — |
| `MESSENGER_VERIFY_TOKEN` | Messenger webhook verify token | — |
| `MESSENGER_APP_SECRET` | Facebook app secret | — |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3001` |

---

## Screenshots

| Select User | Home (AC active) |
|:-----------:|:----------------:|
| ![Select User](docs/screenshots/select-user.png) | ![Home](docs/screenshots/home.png) |

| Stats — Individual | Stats — Household |
|:------------------:|:-----------------:|
| ![Stats Individual](docs/screenshots/stats.png) | ![Stats Household](docs/screenshots/stats-household.png) |

| All Sessions | My Last 5 Sessions |
|:------------:|:-----------------:|
| ![Sessions](docs/screenshots/sessions.png) | ![History](docs/screenshots/history.png) |

| Admin — Members | Admin — Zones & Rates | Admin — Settings |
|:---------------:|:--------------------:|:----------------:|
| ![Admin Members](docs/screenshots/admin-members.png) | ![Admin Zones](docs/screenshots/admin-zones.png) | ![Admin Settings](docs/screenshots/admin-settings.png) |

---

## Running Tests

```bash
cd backend
npm test
```

20 unit tests cover the usage calculator:
- Single-user session cost calculation
- Exclusive vs shared overlap attribution
- Zone combination rate matching
- Midnight-spanning sessions
- Period filtering (today / week / month windows)
- Edge cases (missing zones, empty sessions, ongoing sessions)

---

## Deployment

The app ships with a **`Dockerfile`** and **`railway.toml`** for one-command container deployments, plus a **`start.sh`** script for PaaS platforms that run a single build-and-start command.

> **Architecture note:** The Dockerfile builds the React frontend with relative API URLs and copies it into the backend's `public/` directory.  At runtime, Express serves the frontend on the same port as the API, so you only need **one service and one `$PORT`**.

---

### Option 1: Railway (one-click via GitHub UI)

1. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo → select this repo**.  
   Railway detects the `Dockerfile` and `railway.toml` automatically.
2. Add a **PostgreSQL** database plugin (Railway dashboard → *+ New* → *Database → Add PostgreSQL*).  
   Railway injects `DATABASE_URL` into your service automatically.
3. Set the following environment variables in the Railway service dashboard:

   | Variable | Value |
   |---|---|
   | `FRONTEND_URL` | Your Railway app URL, e.g. `https://your-app.railway.app` |
   | `MESSENGER_PAGE_ACCESS_TOKEN` | *(optional)* Facebook page token |
   | `MESSENGER_VERIFY_TOKEN` | *(optional)* Messenger webhook verify token |
   | `MESSENGER_APP_SECRET` | *(optional)* Facebook app secret |

   > `PORT` and `DATABASE_URL` are injected by Railway automatically — do **not** set them manually.

4. Railway builds and deploys the container.  The `/api/health` endpoint is used as the health-check.
5. Open your Railway URL in a browser — the app is live. ✅

> **First run:** `prisma db push` runs automatically inside the container on every start, creating the schema if it doesn't exist.  This is safe and idempotent.

---

### Option 2: Docker (generic container platforms)

Build and run locally or on any platform that supports Docker (Render, Fly.io, Google Cloud Run, etc.):

```bash
# Build the image (frontend + backend bundled together)
docker build -t ac-tracker .

# Run — replace the placeholder values with your real settings
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/ac_tracker" \
  -e FRONTEND_URL="http://localhost:3000" \
  --name ac-tracker \
  ac-tracker
```

Open `http://localhost:3000` in your browser.

**Docker Compose example** (adds a local PostgreSQL container):

```yaml
# docker-compose.yml
version: "3.9"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://acuser:acpass@db:5432/ac_tracker
      FRONTEND_URL: http://localhost:3000
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: acuser
      POSTGRES_PASSWORD: acpass
      POSTGRES_DB: ac_tracker
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

```bash
docker compose up -d
```

---

### Option 3: PaaS with separate build / start phases (Render, Heroku, etc.)

For platforms where you set a **build command** and a **start command** separately:

| Setting | Value |
|---|---|
| **Root directory** | *(repo root)* |
| **Build command** | `cd frontend && npm ci && VITE_API_URL="" npm run build && cp -r dist ../backend/public && cd ../backend && npm ci && npm run build` |
| **Start command** | `cd backend && npx prisma db push --skip-generate && node dist/server.js` |

Alternatively, use the **`start.sh`** script (combines build + start in one step):

```bash
bash start.sh
```

Set environment variables in the platform dashboard (same as the Railway table above).

> **Render note:** Free-tier web services spin down after 15 minutes of inactivity; the first request after sleep may take ~30 seconds.

---

### Option 4: Raspberry Pi (Self-hosted)

> Gives you a local server accessible on your home network with optional remote access.

**Prerequisites:** Node.js 18+, npm 9+

```bash
# 1. Clone and set up
git clone https://github.com/dakomi/HouseholdACTracker.git
cd HouseholdACTracker

# 2. Build frontend (relative API URLs for same-origin serving)
cd frontend
npm install
VITE_API_URL="" npm run build
cd ..

# 3. Copy frontend build to backend/public
mkdir -p backend/public
cp -r frontend/dist/* backend/public/

# 4. Build backend
cd backend
npm install
cp .env.example .env
# Edit .env: set FRONTEND_URL to http://<your-pi-ip>:3001
npx prisma db push
npm run build

# 5. Start (PM2 keeps it alive across reboots)
npm install -g pm2
pm2 start dist/server.js --name ac-tracker
pm2 save && pm2 startup  # follow the printed command
```

**Access the app:** `http://<pi-ip>:3001` (the backend now serves the frontend too).

**Optional — Remote access via Cloudflare Tunnel (free):**

```bash
cloudflared tunnel login
cloudflared tunnel create ac-tracker
cloudflared tunnel route dns ac-tracker ac.yourdomain.com
cloudflared tunnel run --url http://localhost:3001 ac-tracker
```

---

### Security notes for public deployments

| Topic | Status |
|---|---|
| **Secrets** | All tokens / passwords are read from environment variables; no defaults are hardcoded. |
| **CORS** | Controlled by `FRONTEND_URL`; only that origin is allowed for cross-origin requests. |
| **Admin endpoints** | Protected by the `requireAdmin` middleware (`x-user-id` header + DB lookup). |
| **Data exposure** | No unauthenticated admin or debug endpoints are exposed. |
| **SQLite on PaaS** | SQLite data is lost when the container restarts — use PostgreSQL for persistence. |
| **HTTPS** | Railway, Render, and Fly.io provide TLS automatically. For self-hosted, put the app behind a reverse proxy (Caddy, nginx) or use Cloudflare Tunnel. |

---

## Facebook Messenger Bot Setup

1. Create a Facebook App at [developers.facebook.com](https://developers.facebook.com)
2. Add the "Messenger" product to your app
3. Generate a Page Access Token and copy it to `MESSENGER_PAGE_ACCESS_TOKEN`
4. Set a custom `MESSENGER_VERIFY_TOKEN` (any random string)
5. In Messenger → Settings → Webhooks, set the callback URL to:
   `https://your-backend-url/api/bot/webhook`
6. Enter your `MESSENGER_VERIFY_TOKEN` as the verify token
7. Subscribe to `messages` and `messaging_postbacks` events

**Bot Commands:**
| Command | Description |
|---|---|
| `ac on [zone]` | Start an AC session (zone optional, will prompt if missing) |
| `ac off` | End your current session |
| `ac status` | Show all currently active sessions |
| `ac history` | Show your last 5 sessions |
| `ac edit [1-5]` | Edit one of your last 5 sessions |
| `ac help` | Show available commands |

---

## API Reference

### Sessions
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/sessions` | List sessions (`?user_id=&limit=&offset=`) |
| `GET` | `/api/sessions/active` | All currently active sessions |
| `POST` | `/api/sessions` | Start a new session |
| `PUT` | `/api/sessions/:id` | Edit a session |
| `POST` | `/api/sessions/:id/end` | End a session |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reports/usage` | Per-user usage (`?user_id=&period=today\|week\|month`) |
| `GET` | `/api/reports/household` | Household usage (`?period=today\|week\|month`) |
| `GET` | `/api/data/export` | Export all data as JSON |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| `GET/POST/PUT/DELETE` | `/api/users` | Manage users |
| `GET/POST/PUT/DELETE` | `/api/zones` | Manage zones |
| `GET/POST/PUT/DELETE` | `/api/zone-combinations` | Manage zone combinations |
| `GET/PUT` | `/api/settings` | Read/update settings |

---

## Using PostgreSQL

To use PostgreSQL instead of SQLite, update `backend/.env`:

```env
DATABASE_URL="postgresql://user:password@host:5432/ac_tracker"
```

Then update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Run migrations:
```bash
npx prisma migrate dev --name init
```

---

## Data Models

```
User          { id, name, colour, pin?, is_admin, created_at }
Zone          { id, name, kwh_per_hour, created_at }
ZoneCombination { id, label, kwh_per_hour, zones[] }
Session       { id, user_id, start_time, end_time, zones[], edited, created_at }
SessionZoneLog { id, session_id, zone_id, activated_by, activated_at, deactivated_by?, deactivated_at? }
Settings      { id=1, electricity_rate, auto_off_duration, household_name, require_confirmation }
```

---

## Shared Usage Calculation

When multiple users run AC sessions that overlap in time, costs are split proportionally:

**Example:**
- User A: Zone X, 1pm–3pm
- User B: Zone Y, 2pm–3pm

**Result:**
- 1pm–2pm: Only User A → A gets 1 hour exclusive
- 2pm–3pm: Both users → each gets 0.5 hour shared

The algorithm collects all session boundary timestamps, evaluates which sessions are active in each interval, and divides the interval cost by the number of concurrent users.

---

## License

MIT
