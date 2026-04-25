# CIS Backend

FastAPI backend for the Campus Information System frontend.

## Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Optional env file:

```powershell
Copy-Item .env.example .env
```

Default local database setting for XAMPP:

```env
DATABASE_URL=mysql+pymysql://root:@127.0.0.1:3307/cis
```

Additional auth-related defaults:

```env
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES=30
LOGIN_LOCKOUT_THRESHOLD=5
LOGIN_LOCKOUT_MINUTES=15
APP_ENV=development
ENABLE_DEV_RESET_TOKEN_PREVIEW=true
CHATBOT_PROVIDER=ollama
CHATBOT_MODEL=llama3.2:3b
CHATBOT_OLLAMA_BASE_URL=http://127.0.0.1:11434
CHATBOT_REQUEST_TIMEOUT_SECONDS=45
CHATBOT_MAX_HISTORY_MESSAGES=8
CHATBOT_TEMPERATURE=0.2
CHATBOT_FALLBACK_TO_RULES=true
```

## Local AI assistant with Llama 3.2 3B

The student chatbot can now call a local Ollama instance using `llama3.2:3b`.

Typical local setup:

```powershell
ollama serve
ollama pull llama3.2:3b
```

If Ollama is not available, the backend can fall back to the built-in rules-based student assistant when `CHATBOT_FALLBACK_TO_RULES=true`.

## Run

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: `http://localhost:8000/docs`

Health check: `http://localhost:8000/api/v1/health`

## System Admin Accounts

If you imported `09_seed_demo_users.sql`, demo System Admin accounts are already available. See:

`../docs/DEMO_LOGIN_CREDENTIALS.txt`

If you build a clean database without demo users, create the first System Admin once with:

`POST /api/v1/auth/bootstrap-admin`

You can check whether setup is still required with:

`GET /api/v1/auth/bootstrap-status`

After that, sign in through `POST /api/v1/auth/login`, then use:

- `POST /api/v1/system-admin/users` to create Student, Instructor, Academic Staff, Finance Staff, Communication Staff, or System Admin accounts
- `GET /api/v1/auth/me` to inspect the current session
- the `students/me/*`, `instructors/me/*`, `academic/*`, `finance/*`, `communications/*`, and `system-admin/*` routes for the RBAC-enabled backend modules

## Database

The project now includes a production-style MySQL schema for XAMPP in:

- `backend/database/mysql/01_schema.sql`
- `backend/database/mysql/02_seed_reference.sql`
- `backend/database/mysql/03_views.sql`
- `backend/database/mysql/04_seed_core_data.sql`
- `backend/database/mysql/05_seed_undergraduate_catalog.sql`
- `backend/database/mysql/06_seed_graduate_catalog.sql`
- `backend/database/mysql/07_normalize_catalog_identity.sql`
- `backend/database/mysql/08_migrate_rbac_roles.sql`
- `backend/database/mysql/09_seed_demo_users.sql`

Import order:

```powershell
mysql -u root -p < backend/database/mysql/01_schema.sql
mysql -u root -p < backend/database/mysql/02_seed_reference.sql
mysql -u root -p < backend/database/mysql/03_views.sql
mysql -u root -p < backend/database/mysql/04_seed_core_data.sql
mysql -u root -p < backend/database/mysql/05_seed_undergraduate_catalog.sql
mysql -u root -p < backend/database/mysql/06_seed_graduate_catalog.sql
mysql -u root -p < backend/database/mysql/07_normalize_catalog_identity.sql
mysql -u root -p < backend/database/mysql/08_migrate_rbac_roles.sql
mysql -u root -p < backend/database/mysql/09_seed_demo_users.sql
```

`04_seed_core_data.sql` is optional but recommended. It seeds departments, programs, terms, courses, clubs, announcements, and events while leaving user accounts under System Admin control. `09_seed_demo_users.sql` adds fake login accounts for development and demos.

The schema covers:

- users, roles, permissions, and auth token tables
- student, instructor, and staff profile tables
- departments, programs, terms, courses, offerings, and enrollments
- attendance and grades
- recommendations and risk assessments
- staff-maintained invoices, aid awards, payment records, optional invoice links, and financial holds
- clubs, memberships, and join requests
- announcements, events, and inbox notifications
- AI assistant chat history and system settings

## Docker

The repository now includes:

- `backend/Dockerfile`
- root `Dockerfile` for the frontend
- root `docker-compose.yml`

Run the full application stack with:

```powershell
docker compose up --build
```

That will start:

- MySQL on `localhost:3306`
- FastAPI on `localhost:8000`
- the frontend on `localhost:8080`

## Backend tests

A small backend test scaffold now lives in:

- `backend/tests/test_app.py`
- `backend/tests/test_security.py`

Install dev dependencies and run:

```powershell
cd backend
pip install -r requirements-dev.txt
pytest
```

