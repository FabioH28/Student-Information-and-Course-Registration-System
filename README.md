# Student Information and Course Registration System (CIS)

A full-stack web application for managing academic operations, student services, and institutional administration in a university environment.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui (Radix UI) |
| Routing | React Router v6 |
| Data Fetching | TanStack Query |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Animation | Framer Motion |
| Backend | FastAPI (Python), SQLAlchemy ORM |
| Database | MySQL 8 / MariaDB 10.4+ |
| Auth | JWT (HS256) + bcrypt (passlib) |
| Tooling | Vitest, ESLint, Docker Compose |

## User Roles & Permissions

The system has five roles with row-level access control enforced on the backend.

| Feature | Student | Instructor | Academic Staff | Finance Staff | System Admin |
|---|---|---|---|---|---|
| View own profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit own profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| Change own password | ✅ | ✅ | ✅ | ✅ | ✅ |
| View grades | Own only | Own courses | All | ❌ | All |
| Edit / publish grades | ❌ | ✅ | ✅ | ❌ | ✅ |
| Mark attendance | ❌ | ✅ | ✅ | ❌ | ❌ |
| Course registration (self) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Approve registrations | ❌ | ❌ | ✅ | ❌ | ✅ |
| Manage course catalog | ❌ | ❌ | ✅ | ❌ | ✅ |
| Manage course offerings | ❌ | ❌ | ✅ | ❌ | ❌ |
| Manage timetable | ❌ | ❌ | ✅ | ❌ | ❌ |
| Manage buildings & rooms | ❌ | ❌ | ✅ | ❌ | ❌ |
| Students list | ❌ | ✅ | ✅ | ✅ (financial view) | ✅ |
| View payment status | Own only | ❌ | ❌ | All | All |
| Issue invoices | ❌ | ❌ | ❌ | ✅ | ✅ |
| Record payments | ❌ | ❌ | ❌ | ✅ | ✅ |
| Place / resolve holds | ❌ | ❌ | View | ✅ | ✅ |
| Create announcements | ❌ | ❌ | ✅ | ❌ | ❌ |
| Create events | ❌ | ❌ | ✅ | ❌ | ❌ |
| News & events feed | ✅ | ❌ | ✅ (publish) | ❌ | ❌ |
| Send messages | ✅ | ✅ | ✅ | ❌ | ❌ |
| Clubs (join/manage) | ✅ (join) | ❌ | ✅ (approve) | ❌ | ❌ |
| Manage semesters | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ❌ | ✅ |
| System analytics | ❌ | ❌ | ❌ | ❌ | ✅ |
| System settings | ❌ | ❌ | ❌ | ❌ | ✅ |
| Full system access | ❌ | ❌ | ❌ | ❌ | ✅ |

## Repository Structure

```
├── backend/                 # FastAPI backend
│   ├── src/
│   │   ├── config/          # Database connection, settings
│   │   ├── models/          # SQLAlchemy ORM models (30+ tables)
│   │   ├── routes/          # API endpoints grouped by domain
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── utils/           # Auth (JWT, RBAC), audit, email
│   │   └── main.py          # FastAPI app entry
│   ├── tests/               # Pytest unit & integration tests
│   ├── .env.example         # Environment variable template
│   └── requirements.txt     # Python dependencies
├── database/
│   ├── schema.sql           # MySQL table definitions
│   └── seed.sql             # Demo users, courses, grades
├── frontend/
│   └── src/
│       ├── components/      # Shared UI (sidebar, top bar, shadcn primitives)
│       ├── contexts/        # AuthContext (token + role state)
│       ├── hooks/           # Reusable hooks (use-toast, use-mobile)
│       ├── layouts/         # Per-role layout shells
│       ├── lib/             # Typed API client, role helpers
│       └── pages/
│           ├── student/         # 17 pages
│           ├── instructor/      # 9 pages
│           ├── academic-staff/  # 10 pages (incl. coworker module)
│           ├── finance-staff/   # 6 pages
│           └── admin/           # 8 pages
├── docs/                    # Architecture, ERD, demo credentials
├── docker-compose.yml       # MySQL + backend + frontend
├── DEVELOPER_NOTES.md       # Run quickstart, gotchas, module map
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- MySQL 8.0+ (or XAMPP MariaDB)

### 1. Database Setup

Create the database and load the schema + seed:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p CampusIS < database/seed.sql
```

Or open both files in MySQL Workbench and execute them in order.

> **XAMPP note:** if you use XAMPP locally, MariaDB defaults to port `3307`. Adjust `DATABASE_URL` and the `mysql -P 3307` flag accordingly.

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate it
.venv\Scripts\activate         # Windows
source .venv/bin/activate      # Mac/Linux

# Install dependencies (python-jose and bcrypt 4.0.1 are required pins)
pip install -r requirements.txt "python-jose[cryptography]" "bcrypt==4.0.1"

# Configure environment
copy .env.example .env         # Windows
cp .env.example .env           # Mac/Linux
# Then edit .env with your MySQL credentials

# Start the server
uvicorn src.main:app --reload --port 8000
```

- API runs at `http://127.0.0.1:8000`
- Interactive docs at `http://127.0.0.1:8000/docs`
- Health check at `http://127.0.0.1:8000/docs` (OpenAPI)

### Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Description |
|---|---|
| `DB_HOST` | MySQL host (default `localhost`) |
| `DB_PORT` | MySQL port (`3306` or `3307` for XAMPP) |
| `DB_NAME` | Database name (`CampusIS`) |
| `DB_USER` | MySQL user |
| `DB_PASSWORD` | MySQL password |
| `DATABASE_URL` | Full SQLAlchemy URL (overrides the four above if set) |
| `JWT_SECRET_KEY` | JWT signing secret — generate with `openssl rand -hex 32` |
| `JWT_ALGORITHM` | Signing algorithm (default `HS256`) |
| `JWT_EXPIRE_MINUTES` | Token lifetime (default `480`) |
| `SMTP_HOST` | SMTP server for verification/reset emails (optional) |
| `SMTP_PORT` | SMTP port |
| `SMTP_USER` | SMTP login |
| `SMTP_PASSWORD` | SMTP credential |

### 3. Frontend Setup

```bash
# From the repo root (Vite project lives at the root, sources in frontend/src)
npm install
npm run dev -- --host 127.0.0.1 --port 8088
```

Frontend runs at `http://127.0.0.1:8088`.

The frontend reads `VITE_API_BASE_URL` from the root `.env` (defaults to `http://127.0.0.1:8000`).

### 4. Login Credentials (development)

All seeded accounts use password: **`password123`**

| Role | Email |
|---|---|
| Student | `alice.smith@cis.edu` |
| Instructor | `john.carter@cis.edu` |
| Academic Staff | `rebecca.morgan@cis.edu` |
| Finance Staff | `finance.csit@cis.edu` |
| System Admin | `admin@cis.edu` |

Additional seeded accounts (students, instructors, staff per faculty) are listed in [docs/DEMO_LOGIN_CREDENTIALS.txt](docs/DEMO_LOGIN_CREDENTIALS.txt). All use the same password.

> **Production note:** the seeded password is for local development only. Rotate `JWT_SECRET_KEY` and reset all account passwords before deploying.

## Docker Option

Bring up MySQL, backend, and frontend with one command:

```bash
docker compose up --build
```

Services:

- Frontend → `http://localhost:8088`
- Backend → `http://localhost:8000`
- MySQL → `localhost:3306`

The Docker MySQL container is initialized from `database/schema.sql` and `database/seed.sql`.

## API Overview

The backend exposes 80+ REST endpoints across these areas:

| Area | Prefix | Notes |
|---|---|---|
| Authentication | `/auth` | Login, register, email verify, password reset, change password |
| Students | `/students` | Profile self-service + admin list/edit |
| Courses | `/courses` | Catalog CRUD (academic_staff + admin) |
| Offerings | `/offerings` | Section instances per semester |
| Registrations | `/registrations` | Enrollment + status transitions |
| Course selections | `/api/student/course-selections` | Student request → staff approve |
| Grades | `/grades` | Config, upsert, publish |
| Attendance | `/attendance` | Sessions + per-student records |
| Materials | `/api/teacher/materials`, `/api/student/...` | Weekly course materials, files |
| Assignments | `/api/teacher/assignments`, `/api/student/...` | Briefs + submissions |
| Timetable | `/api/student/timetable`, `/api/teacher/timetable` | Weekly schedule |
| Staff Schedule | `/api/staff` | Offerings, timetable, rooms, selection approvals |
| Finance | `/finance` | Invoices, payments, holds |
| Notifications | `/notifications` | In-app inbox |
| Announcements | `/communications/announcements` | Staff broadcast |
| Events | `/communications/events` | Campus events + registration |
| Clubs | `/clubs`, `/communications/clubs` | Directory, join, approve |
| Messages | `/messages` | Direct messaging |
| Users (admin) | `/users` | Create, approve pending, reset, disable |
| Semesters | `/semesters` | Academic terms |

Interactive Swagger UI at `http://127.0.0.1:8000/docs` lists everything with payload schemas.

## Architecture Highlights

- **Role-Based Access Control** — every protected route uses `require_roles(...)` against a JWT claim. Role aliases (`teacher`→`instructor`, `staff`→`academic_staff`, `admin`→`system_admin`) are normalized via `canonical_role()`.
- **Faculty scoping** — finance and academic staff only see invoices/students within their assigned faculty (`FinanceFacultyScope`, `StaffFacultyScope`).
- **Auto-create migrations** — `ensure_new_feature_tables` startup hook in `backend/src/main.py` creates new tables on existing databases without manual migration.
- **Communications module** — announcements, campus events, clubs, and direct messaging share a single domain with role-aware endpoints.
- **Type-safe API client** — `frontend/src/lib/api.ts` exposes typed wrappers (`gradesApi`, `financeApi`, etc.) consumed by every page.

## Conventions

- Backend ORM PK/FK columns use `UnsignedInteger` (matches `users.id` INT UNSIGNED) — required for FK type compatibility.
- Albanian grade scale (0–10) applies to course grades; GPA is on a 0–4 scale.
- Frontend pages auto-detect GPA scale via `gpaScale()` in `lib/utils.ts`.

## Further Documentation

- [DEVELOPER_NOTES.md](DEVELOPER_NOTES.md) — run quickstart, gotchas, communications module file map
- [docs/DEMO_LOGIN_CREDENTIALS.txt](docs/DEMO_LOGIN_CREDENTIALS.txt) — all seeded accounts
- [docs/erd_dbdiagram.dbml](docs/erd_dbdiagram.dbml) — entity-relationship diagram (open at [dbdiagram.io](https://dbdiagram.io))
- [CONTRIBUTING.md](CONTRIBUTING.md) — branch, test, and release guidelines
- [CHANGELOG.md](CHANGELOG.md) — versioned changes
