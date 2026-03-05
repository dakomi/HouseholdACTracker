# PR #1 — Full Edit History

**Title:** Fix TypeScript build errors, backend persistence, and first-run setup experience  
**URL:** https://github.com/dakomi/HouseholdACTracker/pull/1  
**State:** Open (draft)  
**Branch:** `copilot/build-ac-usage-tracker` → `main`  
**Author:** Copilot  
**Created:** 2026-03-04T05:41:04Z  
**Last updated:** 2026-03-05T07:47:42Z  
**Stats:** +12,905 / −2 across 73 files in 11 commits  

---

## 1. Commits (chronological, oldest → newest)

| # | SHA (short) | Date (UTC) | Author | Message |
|---|---|---|---|---|
| 1 | `c294a4ca` | 2026-03-04 05:41:01 | dakomi | Initial commit |
| 2 | `19b2f1a0` | 2026-03-04 05:41:04 | Copilot | Initial plan |
| 3 | `225dabad` | 2026-03-04 05:48:14 | Copilot | Add complete Node.js/Express/TypeScript backend for Household AC Tracker |
| 4 | `0ec834b7` | 2026-03-04 05:58:49 | Copilot | Build complete React/TypeScript frontend for Household AC Tracker |
| 5 | `0676b93c` | 2026-03-04 06:02:20 | Copilot | Build complete Household AC Tracker: backend API, frontend PWA, bot integration, tests, docs |
| 6 | `40c88e6c` | 2026-03-04 06:20:10 | Copilot | Fix misleading test name and add missing coverage for empty zones lookup |
| 7 | `1279f6ee` | 2026-03-04 06:30:02 | Copilot | Add 19 rich seed sessions covering all calculator scenarios and time windows |
| 8 | `fd0f779f` | 2026-03-04 06:41:57 | Copilot | Add zone kWh/rate context to seed, screenshots to docs/, and Screenshots section to README |
| 9 | `435071d5` | 2026-03-04 07:00:12 | Copilot | Fix negative duration display and cap time-remaining at auto-off window |
| 10 | `22744d75` | 2026-03-04 07:26:02 | Copilot | Replace all screenshots with fresh captures showing correct session data |
| 11 | `bd63eb8d` | 2026-03-04 07:46:16 | Copilot | Fix TS build errors and document persistent backend running with PM2 |
| 12 | `cf12cf52` | 2026-03-04 09:13:07 | Copilot | Make prisma:seed optional; add first-setup UI guidance in SelectUser and Admin pages |

### Commit detail messages

<details>
<summary>Commit 3 — Add complete backend</summary>

```
Add complete Node.js/Express/TypeScript backend for Household AC Tracker

- Prisma schema with User, Zone, ZoneCombination, Session, SessionZone, SessionZoneLog, Settings
- SQLite database seeded with 5 users, 4 zones, 1 combo, settings
- Express REST API: users, zones, zone-combinations, sessions, reports, settings, bot webhook
- Socket.io real-time events: session:started/ended/updated, status:update
- Usage calculator with overlap/shared-cost logic, combo rates, midnight-spanning support
- Facebook Messenger bot with ac on/off/status/history/edit/help commands
- Jest tests: 17 passing
```
</details>

<details>
<summary>Commit 4 — Add complete frontend</summary>

```
Build complete React/TypeScript frontend for Household AC Tracker

- PWA setup with manifest.json, sw.js service worker, placeholder icons
- React 18 + TypeScript + Vite + React Router v6 + Socket.io client + Recharts
- Pages: Home/Dashboard, Stats, Sessions, History, Admin, Select User
- Typed API client (src/api/api.ts) for all backend endpoints
- Socket.io client (src/api/socket.ts) for real-time session/status updates
- UserContext (localStorage persistence) and AppContext (global state)
- useApi and useSocket hooks
- ZoneSelectionModal with optional confirmation step
- EditSessionModal for editing session start/end time and zones
- Admin panel with Members/Zones/Settings tabs
- Mobile-first responsive CSS, 44px minimum touch targets
- TypeScript strict mode, zero type errors, build succeeds
```
</details>

---

## 2. Reviews

### Review by `copilot-pull-request-reviewer[bot]`
- **State:** COMMENTED  
- **Submitted:** 2026-03-04T09:28:49Z  
- **Commit reviewed:** `cf12cf52`  
- **Files reviewed:** 54 of 73 changed files (1 skipped: `frontend/package-lock.json` — language not supported)  
- **Inline comments generated:** 12  

**Review summary:**

> This PR addresses first-run developer experience and operational reliability by fixing backend TypeScript/Prisma build issues, improving backend persistence guidance, and adding a full React/Vite frontend with first-run setup prompts plus reporting/admin UX.

**File-level summary from review:**

| File | Description |
|---|---|
| `README.md` | Expanded documentation (quick start, background running, deployment, API reference) |
| `backend/package.json` | Build now runs `prisma generate && tsc`; adds scripts and deps |
| `backend/tsconfig.json` | TS compiler settings updated (ES2020 + DOM libs, output settings) |
| `backend/.gitignore` | Ignores env, build output, and local SQLite DB files |
| `backend/.env.example` | Adds example env vars for DB, ports, CORS, Messenger |
| `backend/src/app.ts` | Express app wiring, CORS config, route registration, health endpoint |
| `backend/src/server.ts` | HTTP server bootstrap + Socket.io initialization |
| `backend/src/middleware/errorHandler.ts` | Central JSON error handling + 404 handler |
| `backend/src/middleware/auth.ts` | Admin-check middleware via `x-user-id` header |
| `backend/src/prisma/client.ts` | PrismaClient singleton |
| `backend/src/routes/users.ts` | Users CRUD + PIN authenticate endpoint |
| `backend/src/routes/zones.ts` | Zones CRUD endpoints |
| `backend/src/routes/zoneCombinations.ts` | Zone combination CRUD endpoints |
| `backend/src/routes/sessions.ts` | Sessions CRUD + start/end + socket broadcasts |
| `backend/src/routes/settings.ts` | Settings singleton read/update endpoints |
| `backend/src/routes/reports.ts` | Usage + household reports and export endpoint |
| `backend/src/routes/bot.ts` | Messenger webhook verification + event receiver route |
| `backend/src/services/socketService.ts` | Socket.io server wrapper and emit helpers |
| `backend/src/services/messengerBot.ts` | Messenger bot command handling and Prisma integration |
| `backend/src/services/usageCalculator.ts` | Usage/cost calculation (exclusive/shared overlap + combos) |
| `backend/tests/usageCalculator.test.ts` | Jest unit tests for usage calculator behavior |
| `backend/prisma/schema.prisma` | Prisma schema for users/zones/sessions/settings/logs/combos |
| `backend/prisma/seed.ts` | Optional demo seed data (users, zones, combos, sessions, settings) |
| `frontend/package.json` | New frontend package (React/Vite/TS, build/dev scripts) |
| `frontend/vite.config.ts` | Vite config (React plugin, dev proxy to backend, ports) |
| `frontend/index.html` | App HTML shell + service worker registration |
| `frontend/public/manifest.json` | PWA manifest definition |
| `frontend/public/sw.js` | Service worker caching strategy (static cache + network-first API) |
| `frontend/src/main.tsx` | React root + router + context providers |
| `frontend/src/App.tsx` | App routes and top-level layout |
| `frontend/src/index.css` | Base styling for pages/components (mobile-first UI) |
| `frontend/src/types/index.ts` | Shared frontend TS types for API models and reports |
| `frontend/src/api/api.ts` | Typed REST client wrapper + endpoint helpers |
| `frontend/src/api/socket.ts` | Socket.io client singleton + subscription helpers |
| `frontend/src/contexts/UserContext.tsx` | User selection/auth context + localStorage persistence |
| `frontend/src/contexts/AppContext.tsx` | App-wide state (active sessions, zones, settings) + socket refresh |
| `frontend/src/components/Header.tsx` | Navigation header + AC status badge + user switch control |
| `frontend/src/components/SessionCard.tsx` | Session display card (active/ended, edit/end actions) |
| `frontend/src/components/EditSessionModal.tsx` | Edit session modal (time + zones) |
| `frontend/src/components/ZoneSelectionModal.tsx` | Start-session zone picker + optional confirmation flow |
| `frontend/src/pages/HomePage.tsx` | Home page (AC banner, quick entry, active sessions, links) |
| `frontend/src/pages/SelectUserPage.tsx` | User selection + first-run guidance when no users exist |
| `frontend/src/pages/AdminPage.tsx` | Admin panel (members/zones/settings) + setup callouts |
| `frontend/src/pages/StatsPage.tsx` | Stats UI (individual/household, pie chart, recent sessions) |
| `frontend/src/pages/SessionsPage.tsx` | Paginated sessions list + filtering + end/edit actions |
| `frontend/src/pages/HistoryPage.tsx` | "My last 5 sessions" view |
| `frontend/dist/*` | Committed build output artifacts (flagged for removal — see inline comments) |

---

## 3. Inline Review Comments (12 total)

All comments were submitted at 2026-03-04T09:28:45Z–49Z by `copilot-pull-request-reviewer[bot]`. None are currently resolved.

### Comment 1 — `backend/src/routes/users.ts` line 10
> `GET /api/users` returns the full `User` records, including the `pin` field. Since the PIN is an authentication secret, returning it to any client defeats the PIN check and leaks credentials. Return a "safe user" shape (omit `pin`) for list/read endpoints, and consider hashing PINs at rest instead of storing plaintext.

### Comment 2 — `backend/src/routes/bot.ts` line 7
> `VERIFY_TOKEN` falls back to a known constant (`'default_verify_token'`) when `MESSENGER_VERIFY_TOKEN` is not set. In production this makes webhook verification trivially bypassable if the env var is forgotten. Prefer failing fast at startup when the token is missing.
>
> **Suggested fix:**
> ```typescript
> const VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN;
> if (!VERIFY_TOKEN) {
>   throw new Error('MESSENGER_VERIFY_TOKEN environment variable must be set');
> }
> ```

### Comment 3 — `frontend/.gitignore` line 2
> `dist/` is listed in `.gitignore`, but this PR also adds `frontend/dist/**` build artifacts. Committing generated build output will cause noisy diffs and merge conflicts. Remove `frontend/dist` from the repo so CI/build pipelines produce it instead.

### Comment 4 — `frontend/src/types/index.ts` line 61
> `Settings` includes an `updated_at` field, but the Prisma schema has no `updated_at` column. The frontend types are inaccurate. Either remove/make `updated_at` optional, or add the column in Prisma and return it from the API.

### Comment 5 — `frontend/src/components/EditSessionModal.tsx` line 49
> When `endTime` is blank, the update request omits `end_time` entirely (`undefined`). An ended session can't be made active again. Consider either disabling the end-time field for ended sessions, or explicitly sending `end_time: null` and updating the backend to handle null by clearing the column.

### Comment 6 — `frontend/src/api/api.ts` line 73
> `endSession()` calls `/api/sessions/:id/end` with `method: 'PUT'`, but the backend route is registered as `POST /api/sessions/:id/end`. This will result in a 404/method-mismatch when ending a session. Align the HTTP method on either the frontend or backend.

### Comment 7 — `frontend/src/types/index.ts` line 68
> `UsageResult` doesn't match what the backend returns from `calculateUsage()`. Backend results include `exclusiveHours`, `sharedHours`, and `totalHours` (not `hours`). The UI will read `undefined` for hours and calculations will produce `NaN`. Update the interface to match the API response shape.

### Comment 8 — `frontend/src/pages/StatsPage.tsx` line 92
> `totalHours` is computed from `usageResults` via `u.hours`, but the backend report objects use `totalHours`. As written, `u.hours` will be `undefined` and the reducers will produce `NaN`. Use the correct field name from the API response.

### Comment 9 — `frontend/src/pages/StatsPage.tsx` line 181
> The "Recent Sessions" panel is labeled as period-scoped ("No sessions found for this period."), but the code always fetches the latest 5 sessions without any period filter. Either adjust the copy or extend the endpoint/client to support period bounds.

### Comment 10 — `backend/src/routes/sessions.ts` line 16
> `sessionInclude` uses `user: true`, which will include the user's `pin` in every sessions response (and `broadcastStatus()` also includes `user: true`). This exposes authentication secrets to all clients over REST and Socket.io. Use a `select` on the `user` relation that omits `pin`.

### Comment 11 — `frontend/index.html` line 5
> The favicon link declares `type="image/svg+xml"` but points to a PNG (`/icons/icon-192.png`). Update the MIME type to `image/png` (or switch to an actual SVG).

### Comment 12 — `backend/prisma/schema.prisma` line 17
> The `User.pin` field appears to store user PINs in plaintext. This is a password-equivalent value and should be stored using a strong, salted password hashing algorithm (e.g., bcrypt, Argon2) rather than as a raw string. Consider changing `pin` to hold only hashed values and updating the authentication logic to compare user input against the hash.

---

## 4. Issue-Level Comments

No issue-level (non-review) comments have been posted on PR #1.

---

## Summary

| Category | Count |
|---|---|
| Commits | 12 (11 on branch + 1 initial on main) |
| Reviews submitted | 1 |
| Inline review comments | 12 |
| Issue-level comments | 0 |
| Unresolved review threads | 12 |
