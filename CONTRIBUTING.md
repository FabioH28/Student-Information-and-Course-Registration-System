# Contributing

This guide is for coworkers continuing development on the CIS project.

## Local Setup

1. Install Node.js 20+, Python 3.11+, and MySQL 8 or XAMPP MariaDB.
2. Create local environment files from the examples:

```powershell
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
```

3. Install frontend dependencies:

```powershell
npm install
```

4. Install backend dependencies:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
```

5. Import the database using `backend/database/mysql/cis.sql`, or run Docker Compose from the repo root:

```powershell
docker compose up --build
```

## Development Workflow

Create a branch for every meaningful change:

```powershell
git checkout -b feature/short-description
```

Keep commits focused and use clear messages, for example:

```text
Add instructor attendance filters
Fix student finance payment state
Update database seed data for spring term
```

Before opening a pull request, run:

```powershell
npm run build
npm run test
npm run lint
cd backend
.\.venv\Scripts\python.exe -m pytest tests
```

## Database Changes

- Keep schema changes in ordered SQL files under `backend/database/mysql`.
- Update `cis.sql` when modular SQL files change.
- Do not commit local database dumps, XAMPP backups, or `.env` files.
- Add or update seed data only when it helps development, demos, or tests.

## Pull Requests

Each pull request should include:

- What changed
- How it was tested
- Any database setup or migration notes
- Screenshots for user-facing UI changes

## Release Checklist

Use this checklist when preparing a new GitHub version:

1. Update `package.json` and `package-lock.json` with the new semantic version.
2. Add a `CHANGELOG.md` entry with the date, changes, and verification commands.
3. Run all frontend and backend checks.
4. Confirm `git status --short --ignored` only shows expected ignored generated files.
5. Commit the release prep.
6. Push the branch to GitHub.
7. Create a Git tag, for example:

```powershell
git tag v0.1.0
git push origin v0.1.0
```

8. Create a GitHub release from the tag and paste the changelog entry into the release notes.
