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
DATABASE_URL=mysql+pymysql://root:@127.0.0.1:3306/CampusIS
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
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: `http://localhost:8000/docs`

Health check: `http://localhost:8000/health`

## System Admin Accounts

If you imported the root `database/schema.sql` and `database/seed.sql`, demo accounts are already available. See:

`../docs/DEMO_LOGIN_CREDENTIALS.txt`

Sign in through `POST /auth/login`, then use the route groups that the current frontend calls, including `/students`, `/registrations`, `/grades`, and `/api/teacher/*`.

## Database

The current frontend/backend pair uses the root MySQL files:

```powershell
mysql -u root -p CampusIS < ..\database\schema.sql
mysql -u root -p CampusIS < ..\database\seed.sql
```

The schema covers:

- users with direct role/profile fields and auth token storage
- departments, programs, terms, courses, offerings, and enrollments
- attendance and grades
- staff-maintained invoices, payment records, optional invoice links, and financial holds
- clubs and memberships, including pending join requests
- announcements, events, event registrations, and inbox notifications
- AI assistant chat history

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
- the frontend on `localhost:8088`

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

