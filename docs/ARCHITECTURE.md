# CIS — Architecture

Reference document for the Campus Information System.

## 1. System overview

A three-tier web application:

```
┌─────────────────┐      HTTPS/JSON       ┌─────────────────┐      SQL        ┌──────────────┐
│  React frontend │ ────────────────────▶ │  FastAPI backend│ ──────────────▶ │  MySQL 8     │
│  (Vite, :8088)  │                       │  (uvicorn :8000)│                 │  CampusIS    │
└─────────────────┘                       └─────────────────┘                 └──────────────┘
       ▲                                          │
       │ JWT (HS256, Authorization: Bearer)       │
       └──────────────────────────────────────────┘
```

- **Frontend** is a single-page React application served by Vite. State is managed by TanStack Query; auth state lives in `AuthContext`.
- **Backend** is a FastAPI service. SQLAlchemy ORM handles persistence; passlib + bcrypt hash passwords; python-jose signs/validates JWTs.
- **Database** is MySQL 8 (or MariaDB 10.4+ via XAMPP).

## 2. Roles & RBAC

Five canonical roles, with aliases normalized server-side:

| Canonical | Aliases | Home route |
|---|---|---|
| `student` | — | `/student` |
| `instructor` | `teacher`, `professor` | `/instructor` |
| `academic_staff` | `staff` | `/academic-staff` (also `/staff`) |
| `finance_staff` | — | `/finance-staff` |
| `system_admin` | `admin` | `/admin` |

Every protected endpoint declares its allowed roles via `Depends(require_roles(...))` in `backend/src/utils/security.py`. The frontend mirrors this with `RequireAuth` route guards and `canonicalRole()` in `frontend/src/lib/authRoles.ts`.

Additionally, `finance_staff` and `academic_staff` are scoped to their assigned faculties via `FinanceFacultyScope` / `StaffFacultyScope` join tables.

## 3. Data model (high-level)

Detailed ERD: see [erd_dbdiagram.dbml](erd_dbdiagram.dbml).

Core entities and their relationships:

```
users ──┬── students ────┬── registrations ── grades
        │                ├── student_course_selections
        │                ├── attendance_records
        │                ├── invoices ── payments
        │                └── holds
        ├── instructors ── offerings ── timetable_entries ── class_sessions
        ├── staff_profiles
        └── ai_chat_sessions ── ai_chat_messages

courses ── offerings (per semester)
courses ── course_prerequisites
courses ── course_materials, weekly_topics, assignments ── assignment_submissions

faculties ── departments ── programs ── courses
faculties ── buildings ── classrooms
faculties ── student_groups

clubs ── club_memberships
campus_events ── event_registrations
announcements
notifications
messages
```

PK/FK columns use `INT UNSIGNED` (matches `users.id`); ORM models use a `UnsignedInteger` SQLAlchemy variant.

## 4. Module / page map

| Domain | Backend routes | Frontend pages |
|---|---|---|
| Auth | `/auth/*` | `LoginPage`, `RegisterPage`, `VerifyEmailPage`, `ChangePasswordPage` |
| Student dashboard | `/students/me`, `/api/student/*` | 17 pages under `pages/student/` |
| Instructor | `/api/teacher/*`, `/api/instructor/profile`, `/grades/*`, `/attendance/*` | 9 pages under `pages/instructor/` |
| Academic staff | `/api/staff/*`, `/courses`, `/students`, `/communications/*` | 10 pages under `pages/academic-staff/` |
| Finance | `/finance/*` | 6 pages under `pages/finance-staff/` |
| Admin | `/users`, `/semesters`, all of the above | 8 pages under `pages/admin/` |
| Communications | `/communications/*` (announcements, events, clubs, dashboard) | `StaffCommunications`, student `News`, `Clubs`, `Inbox` |

## 5. Key technical decisions

- **JWT in localStorage** — tokens stored client-side, sent in `Authorization` header. `JWT_EXPIRE_MINUTES=480` (8 hours).
- **bcrypt 4.0.1 pin** — newer bcrypt versions break passlib's bcrypt handler with the "password cannot be longer than 72 bytes" error.
- **TanStack Query for fetching** — pages use typed wrappers (`gradesApi`, `financeApi`, etc.) from `lib/api.ts`. Caching + invalidation per mutation.
- **shadcn/ui** — Radix primitives + Tailwind via `class-variance-authority`. No external UI library lock-in.
- **Auto-create migrations** — `ensure_new_feature_tables` on FastAPI startup creates any new ORM tables that aren't yet in the DB, so feature branches don't need manual migrations.
- **Communications consolidated into `academic_staff`** — there is intentionally no separate "communications staff" role; the academic staff handles announcements, events, and club approvals.

## 6. Security model

- **Authentication** — JWT signed with `JWT_SECRET_KEY` (HS256). Configurable lifetime.
- **Authorization** — `require_roles(*roles)` dependency injection. Aliases normalized via `canonical_role()`.
- **Password storage** — bcrypt via passlib `CryptContext`. No plaintext anywhere.
- **Email verification + password reset** — token-based flows in `email_verification_tokens` / `password_reset_tokens`.
- **Audit log** — `AuditLog` model captures sensitive mutations.
- **Faculty scoping** — finance and staff queries are filtered to their assigned faculties.

### Known production hardening required

- Rotate the default `JWT_SECRET_KEY` placeholder before deploying.
- Tighten `CORSMiddleware` from `allow_origins=["*"]` to the actual frontend origin.
- Reseed all demo accounts with strong unique passwords.

## 7. Folder layout

```
backend/src/
  config/      database + settings
  models/      30+ SQLAlchemy ORM models
  routes/      domain-grouped FastAPI routers
  schemas/     Pydantic request/response shapes
  utils/       security (JWT, RBAC), audit, email
  main.py      app entry, startup hooks

frontend/src/
  components/  shared UI (sidebar, top bar, shadcn primitives)
  contexts/    AuthContext
  hooks/       use-toast, use-mobile
  layouts/     per-role layout shells
  lib/         typed API client, role helpers, utils
  pages/       role-grouped page components
```

## 8. Local development quickstart

See [README.md](../README.md#getting-started) and [DEVELOPER_NOTES.md](../DEVELOPER_NOTES.md) for setup, gotchas, and per-module file maps.

## 9. Test strategy

- Backend tests live in `backend/tests/` (pytest). Existing coverage: `test_security`, `test_rbac`, `test_app`.
- Frontend tests via Vitest (`npm run test`). Currently no UI tests in the suite.
- End-to-end smoke testing has been validated by hand against the live API for every role.
