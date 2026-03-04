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

### Option 1: Railway (Recommended — Free Tier)

Railway offers a free-tier hobby plan with persistent storage.

1. Create an account at [railway.app](https://railway.app)
2. Install the Railway CLI: `npm i -g @railway/cli`
3. **Deploy backend:**
   ```bash
   cd backend
   railway login
   railway init
   railway up
   ```
4. In the Railway dashboard → add environment variables from `.env.example`
5. Add a PostgreSQL plugin in Railway and copy the `DATABASE_URL` to your env vars
6. Run migrations: `railway run npx prisma migrate deploy`
7. **Deploy frontend:**
   ```bash
   cd frontend
   # Set VITE_API_URL to your Railway backend URL
   echo "VITE_API_URL=https://your-backend.railway.app" > .env.production
   npm run build
   # Deploy the dist/ folder to Railway as a static site, or use Vercel (below)
   ```

### Option 2: Render (Free Tier)

1. Create an account at [render.com](https://render.com)
2. **Backend (Web Service):**
   - Connect your GitHub repo
   - Root directory: `backend`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Add environment variables in the Render dashboard
   - Add a PostgreSQL database and link it via `DATABASE_URL`
3. **Frontend (Static Site):**
   - New Static Site → Root directory: `frontend`
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
   - Add env var: `VITE_API_URL=https://your-backend.onrender.com`

> **Note:** Render free tier spins down after 15 minutes of inactivity; the first request after sleep may take ~30 seconds.

### Option 3: Fly.io (Free Tier)

1. Install flyctl: `curl -L https://fly.io/install.sh | sh`
2. `fly auth login`
3. **Backend:**
   ```bash
   cd backend
   fly launch --name ac-tracker-api
   fly secrets set DATABASE_URL="file:./prod.db" PORT=3001 FRONTEND_URL=https://ac-tracker-web.fly.dev
   fly deploy
   ```
4. **Frontend:**
   ```bash
   cd frontend
   echo "VITE_API_URL=https://ac-tracker-api.fly.dev" > .env.production
   npm run build
   fly launch --name ac-tracker-web
   fly deploy
   ```

### Option 4: Raspberry Pi (Self-hosted)

> This gives you a local server accessible on your home network (and optionally exposed via a tunnel).

**Prerequisites:**
- Raspberry Pi 3B+ or newer with Raspberry Pi OS (64-bit recommended)
- Node.js 18+: `curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs`

**Setup:**

```bash
# 1. Clone the repo
git clone https://github.com/dakomi/HouseholdACTracker.git
cd HouseholdACTracker

# 2. Backend
cd backend
npm install
cp .env.example .env
# Edit .env: set FRONTEND_URL to your Pi's local IP, e.g. http://192.168.1.100:3000
npx prisma db push
npm run build
# Optional: load sample data for demos/testing
# npm run prisma:seed

# 3. Frontend
cd ../frontend
# Edit/create .env.production with your Pi's local IP
echo "VITE_API_URL=http://192.168.1.100:3001" > .env.production
npm install
npm run build

# 4. Install PM2 to keep the server alive
npm install -g pm2
cd ../backend
pm2 start dist/server.js --name ac-tracker-api
pm2 save
pm2 startup  # Follow the printed command to auto-start on boot

# 5. Serve frontend with a simple static server
npm install -g serve
pm2 start "serve -s /home/pi/HouseholdACTracker/frontend/dist -p 3000" --name ac-tracker-web
pm2 save
```

**Access the app:**
- From any device on your home network: `http://192.168.1.100:3000`
- Install as PWA from your phone's browser → "Add to Home Screen"

**Optional — Remote Access via Cloudflare Tunnel (free):**
```bash
# Install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

# Create a tunnel (requires free Cloudflare account)
cloudflared tunnel login
cloudflared tunnel create ac-tracker
cloudflared tunnel route dns ac-tracker ac-tracker.yourdomain.com
```

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
