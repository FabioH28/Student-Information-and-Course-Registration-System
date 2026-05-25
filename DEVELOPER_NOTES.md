# Developer notes — CIS (Student Information & Course Registration System)

Quick orientation for working in this repo.

## Stack
- Backend: **FastAPI + SQLAlchemy ORM**, code in `backend/src` (`models/`, `routes/`,
  `config/`, `utils/`), app entry `backend/src/main.py` (`uvicorn src.main:app`).
- Frontend: **React + Vite + Tailwind**, code in `frontend/src` (`pages/`, `components/`,
  `layouts/`, `contexts/AuthContext.tsx`, `lib/api.ts`).
- DB: **MySQL 8 / MariaDB**, schema in `database/schema.sql`, demo data in `database/seed.sql`.

## Run quickstart
```
# 1. DB (create + load). Default DATABASE_URL in backend/.env may use port 3306 or 3307 — match your server.
mysql -u root -P <port> -h 127.0.0.1 < database/schema.sql
mysql -u root -P <port> -h 127.0.0.1 CampusIS < database/seed.sql

# 2. Backend (port 8000)
cd backend
python -m venv .venv          # recreate locally; the committed .venv is built for another machine
.venv\Scripts\python -m pip install -r requirements.txt "python-jose[cryptography]" "bcrypt==4.0.1"
.venv\Scripts\python -m uvicorn src.main:app --host 127.0.0.1 --port 8000

# 3. Frontend (port 8088). Root .env should have VITE_API_BASE_URL=http://127.0.0.1:8000
npm install && npm run dev
```

**Setup gotchas (you will hit these):**
- `requirements.txt` omits `python-jose` although `src/utils/security.py` imports `jose` — install it.
- Pin **`bcrypt==4.0.1`** (passlib breaks on newer bcrypt → login 500 "password cannot be longer than 72 bytes").

Demo logins (all `password123`): `alice.smith@cis.edu` (student), `rebecca.morgan@cis.edu`
(academic staff), `anna.nguyen@cis.edu` (instructor), `admin@cis.edu` (admin).
Roles: `student`, `instructor`, `academic_staff`(=`staff`), `finance_staff`, `system_admin`(=`admin`).

## Conventions / warnings
- A page rendering *"This section is ready for the next page implementation."* is an
  unfinished `PlaceholderPage` stub (see `frontend/src/App.tsx`) — not a bug.
- New ORM tables: add `Model.__table__.create(bind=engine, checkfirst=True)` to the
  `ensure_new_feature_tables` startup hook in `backend/src/main.py`, and use the
  `UnsignedInteger` variant for PK/FK columns (to match `users.id` INT UNSIGNED).
- This project is **not under git** — coordinate before copying files between teammates' copies.

## Communications / Clubs / Messaging module

### Database
- New tables: `messages`, `club_categories`, `clubs`, `club_memberships`,
  `campus_events`, `event_registrations`.
- Reuses existing tables: `announcements`, `notifications`.
- PK/FK columns use `UnsignedInteger = Integer().with_variant(mysql.INTEGER(unsigned=True), "mysql")`
  to match `users.id` (INT UNSIGNED). Plain `Integer` FKs fail to create (FK type mismatch).

### Backend models — `backend/src/models/`
- `message.py` → `Message`
- `club.py` → `ClubCategory`, `Club`, `ClubMembership`
- `campus_event.py` → `CampusEvent`, `EventRegistration`

### Backend routes — `backend/src/routes/` (registered in `main.py`)

Student-facing:
- `messages.py`: `GET /messages/inbox`, `GET /messages/sent`, `GET /messages/contacts`,
  `POST /messages`, `PUT /messages/{id}/read`
- `clubs.py`: `GET /clubs` (directory + my memberships + requests + club events),
  `POST /clubs/{id}/join`
- `communications.py`: `GET /communications/feed` (announcements + upcoming events),
  `POST /communications/events/{id}/register`

Staff-facing (require role `academic_staff` or `system_admin`) — in `communications.py`:
- `GET /communications/dashboard` (stats + recents)
- `GET /communications/announcements`, `POST /communications/announcements`
- `POST /communications/events`, `PUT /communications/events/{id}`
- `GET /communications/clubs/overview`
- `PUT /communications/clubs/requests/{membership_id}` — body `{"decision":"approved|waitlisted|rejected"}`; notifies the student

### Frontend — `frontend/src/`
- `pages/student/StudentNews.tsx` — announcements + events + register
- `pages/student/StudentClubs.tsx` — directory, My Clubs, join/request
- `pages/student/StudentInbox.tsx` — Notifications / Messages / Sent tabs + compose modal
- `pages/academic-staff/StaffCommunications.tsx` — Overview / News / Events / Club Requests tabs
- Wiring: routes in `App.tsx`; nav items in `components/layout/AppSidebar.tsx`
  (`studentNav`, `academicStaffNav`, `staffNav`); page titles in
  `layouts/StudentLayout.tsx` and `layouts/AcademicStaffLayout.tsx`.

### Design decisions
- **Communications is owned by `academic_staff`** — roles in this codebase are `student`,
  `instructor`, `academic_staff` (alias `staff`), `finance_staff`, `system_admin` (alias `admin`).
  There is no separate comms-staff role, so all communications management lives under
  `/staff/communications`.
- News feed reuses the existing `announcements` table; there is no separate `news_posts` table.
- Messaging contacts: students may message staff/instructors/admins but **not** other students.

### Open items
- **Advisor view**: instructors who advise a club (`clubs.advisor_instructor_id`) have no UI
  to see their club's members/requests. Backend has the column; no endpoint/page yet.
- **Automated tests**: none for the communications module — verified manually.
- **Known bug in another module:** `backend/src/routes/notifications.py` `POST /announcements`
  returns a raw SQLAlchemy object → pydantic 500. Use `POST /communications/announcements`
  instead (clean version).
