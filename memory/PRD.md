# CAT Habit Tracker — Premium Edition · PRD

## Original Problem
Upgrade an existing TanStack-Start habit tracker into a premium dashboard with Apple/Linear-style dark/neon aesthetics, R3F 3D centerpieces, Framer Motion micro-interactions, editable exam goal, CSV/XLSX/JSON timetable ingestion. Database backend: **Supabase Postgres**.

## User Choices (latest)
- Stack: React (CRA) + FastAPI + **Supabase Postgres** (SQLAlchemy async + Alembic)
- Theme: Deep dark + neon cyan/violet
- 3D: Bold interactive centerpiece (R3F)
- Auth: Email/password (bcrypt) + Emergent Google. Apple Sign-In intentionally **Coming Soon**
- RLS enabled on all tables with deny-all policy for anon/authenticated; backend connects as `postgres` (bypasses RLS)
- Migration: existing Mongo data was migrated 1:1 to Supabase via `migrate_mongo_to_supabase.py`

## Architecture
- **Frontend** (`/app/frontend`) – React 18, Tailwind, Framer Motion, React-Three/Fiber + drei, canvas-confetti, axios. Three.js components use `React.createElement` directly to bypass the visual-edits Babel injection.
- **Backend** (`/app/backend/`)
  - `server.py` – FastAPI routes (auth/settings/habits/timetable/upload), Pydantic, openpyxl
  - `database.py` – async SQLAlchemy engine + sessionmaker. `statement_cache_size=0` is **mandatory** for the Supabase Transaction Pooler.
  - `models.py` – `User`, `UserSession`, `Habit`, `TimetableEntry` (text[] for `completed_dates`)
  - `alembic/` – migrations (initial schema + RLS enable)
  - `migrate_mongo_to_supabase.py` – one-off Mongo dump → Supabase
- **DB tables** – `users`, `user_sessions`, `habits`, `timetable` (all RLS enabled)

## Implemented (✓ tested 100%)
- 2026-06-17 · Login page (email/pwd + Google + disabled Apple), tabbed sign-in/register
- 2026-06-17 · Dashboard: greeting, Completion ring, 3D Streak flame (color shifts grey→cyan→neon orange→gold), 3D Countdown orbit rings, EDIT GOAL modal, animated Habits with localized confetti, 30-day Heatmap, Weekly bars, Today-only Timetable
- 2026-06-17 · Timetable CRUD + CSV/XLSX/JSON upload with add/replace modes
- 2026-06-17 · Auth: bcrypt email/password + Emergent Google session exchange (unified session_token)
- 2026-06-17 · Responsive layout: viewport-locked, overflow-x-hidden, fluid grid 1→2→12 cols, 44×44 touch targets, dvh heights
- 2026-06-17 · **Supabase migration**: SQLAlchemy async, Alembic, RLS, Mongo→Supabase data migration

## Test Status
- Backend: 19/19 pytest + 1/1 persistence ✓
- Frontend: 7/7 Playwright flows ✓

## Backlog (P1/P2)
- **P1** Apple Sign-In (needs Apple Developer Team ID + Service ID + .p8 key + Key ID)
- **P1** Per-day timetable calendar navigation
- **P1** Export streak as shareable PNG card for social
- **P2** Push reminders, PWA install
- **P2** Split server.py into routers/* once 5+ endpoints per domain
- **P2** Lock CORS_ORIGINS to specific frontend origin

## Test Credentials
- Admin: `admin@cattracker.app` / `Admin@2026`
- User : `aspirant@cattracker.app` / `Aspirant@2026`
