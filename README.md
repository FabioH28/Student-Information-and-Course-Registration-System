# CIS - Campus Information System

CIS is a full-stack campus information system for a university-style environment. It includes a Vite + React + TypeScript frontend, a FastAPI backend, and a MySQL/MariaDB schema with demo data for local development.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, PyMySQL
- Database: MySQL 8 or XAMPP MariaDB 10.4+
- Tooling: Vitest, ESLint, Docker Compose

## Project Structure

```text
src/                       React frontend
backend/app/               FastAPI backend
backend/database/mysql/    Schema, views, and seed SQL
backend/tests/             Backend tests
docs/                      Requirements, diagrams, demo credentials
scripts/                   Windows helper scripts
```

## Prerequisites

- Node.js 20+ and npm
- Python 3.11+
- MySQL 8 or XAMPP MariaDB
- Optional: Docker Desktop
- Optional: Ollama if you want the local AI assistant provider

## Environment Setup

Frontend:

```powershell
Copy-Item .env.example .env
npm install
```

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

The default backend database URL is:

```env
DATABASE_URL=mysql+pymysql://root:@127.0.0.1:3307/cis
```

For a standard MySQL install on port `3306`, change `backend/.env` to:

```env
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@127.0.0.1:3306/cis
```

## Database Setup

Import these SQL files in order. The files create the `cis` database, schema, views, reference data, catalog data, RBAC roles, and demo users.

For the easiest XAMPP/phpMyAdmin import, use the combined file:

```text
backend/database/mysql/cis.sql
```

Or import the modular scripts manually:

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

For XAMPP on this machine, the configured local port is `3307`. If your coworker uses phpMyAdmin, set phpMyAdmin to the same port as their local MySQL/MariaDB server.

Demo credentials are documented in:

```text
docs/DEMO_LOGIN_CREDENTIALS.txt
```

These accounts are fake development accounts only. Do not use the demo passwords in production.

## Run Locally

Start the backend:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Start the frontend in another terminal:

```powershell
npm run dev -- --host 127.0.0.1 --port 8080
```

Open:

- Frontend: `http://127.0.0.1:8080`
- Backend docs: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/api/v1/health`

Windows helper scripts are also available:

```powershell
.\scripts\run-cis.ps1
```

## Docker Option

Docker Compose starts MySQL, the backend, and the frontend:

```powershell
docker compose up --build
```

Services:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:8000`
- MySQL: `localhost:3306`

The Docker database is initialized from the same ordered SQL files in `backend/database/mysql`.

## Tests and Checks

Frontend:

```powershell
npm run build
npm run test
npm run lint
```

Backend:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
pytest
```

## GitHub Notes

The repository should include schema and seed scripts, not local database dumps. The `.gitignore` excludes:

- `.env` files
- Python virtual environments and bytecode
- frontend build output
- log files
- local XAMPP/database backups
- raw database backup dumps named `backup-*.sql`

Before pushing, verify with:

```powershell
git status --short --ignored
```

