# CAT Habit Tracker — Premium Edition · PRD

## Original Problem
Upgrade an existing TanStack-Start habit tracker (deployed on Cloudflare Workers) into a premium dashboard with Apple/Linear-style dark/neon aesthetics, R3F 3D centerpieces, Framer Motion micro-interactions, editable exam goal, and CSV/XLSX/JSON timetable ingestion.

## User Choice
- Stack: React (CRA) + FastAPI + MongoDB (Emergent preview platform — Option A)
- Theme: Deep dark + neon cyan/violet
- 3D: Bold interactive centerpiece (R3F)
- Data: Persisted in MongoDB (not localStorage)
- Auth: Email/password + Emergent Google. Apple Sign-In intentionally **Coming Soon** (no Apple Developer account)

## Architecture
- **Frontend** (`/app/frontend`) – React 18, Tailwind, Framer Motion, React-Three/Fiber + drei, canvas-confetti, axios. Three.js components use `React.createElement` directly to bypass the visual-edits Babel injection that broke R3F primitives.
- **Backend** (`/app/backend/server.py`) – FastAPI + Motor. Single file with auth, settings, habits, timetable, file upload. Sessions in `user_sessions` (httpOnly Secure SameSite=None cookie + Bearer fallback). bcrypt for passwords. openpyxl for XLSX, csv stdlib, json stdlib.
- **DB Collections** – `users`, `user_sessions`, `habits`, `timetable`.

## Implemented (✓ tested 100%)
- 2026-06-17 · Login page (email/pwd + Google + disabled Apple), tabbed sign-in/register, branded hero copy
- 2026-06-17 · Dashboard: greeting (time-aware), Completion ring, 3D Streak (color shifts: grey→cyan→neon orange→gold), 3D Countdown orbit rings, EDIT GOAL modal, Habits (animated checkbox + localized confetti), 30-day Heatmap, Weekly bars, Today-only Timetable
- 2026-06-17 · Timetable CRUD + file upload (CSV/XLSX/JSON) with **add** or **replace** modes
- 2026-06-17 · Auth: bcrypt email/password + Emergent Google session exchange (unified session_token)
- 2026-06-17 · Responsive: 12-col grid → stacks on tablet/mobile; 44×44 mobile-friendly habit checkboxes
- 2026-06-17 · Staggered entrance animations, magnetic hover glow, tracing-beam border, confetti, pulse dots

## Test Status
- Backend: 19/19 pytest pass (`/app/backend/tests/backend_test.py`)
- Frontend: 7/7 Playwright flows pass (login, dashboard, habit toggle persist, edit goal, schedule add, CSV upload, logout)

## Backlog (P1/P2)
- **P1** Apple Sign-In wiring (needs Apple Developer Team ID + Service ID + .p8 key + Key ID from user)
- **P1** Per-day timetable navigation (calendar picker — currently shows today only by design)
- **P1** Export streak as shareable card (PNG) for social media — premium engagement
- **P2** Cloud sync with TanStack Start on Cloudflare Workers (separate codebase)
- **P2** Push reminders / notifications
- **P2** XLSX template download button in upload modal

## Test Credentials
- Admin: `admin@cattracker.app` / `Admin@2026`
- User : `aspirant@cattracker.app` / `Aspirant@2026`
- Demo Google session: `demo_session_shridhar_2026`
