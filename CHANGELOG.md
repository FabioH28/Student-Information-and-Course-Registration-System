# Changelog

All notable project updates should be recorded here.

This project follows semantic versioning:

- `MAJOR` for incompatible workflow, API, or database changes
- `MINOR` for new backwards-compatible features
- `PATCH` for backwards-compatible fixes and documentation updates

## 0.1.0 - 2026-05-07

### Added

- Full-stack CIS handoff baseline with React, TypeScript, Vite, FastAPI, and MySQL/MariaDB support.
- Docker Compose setup for frontend, backend, and MySQL.
- Ordered SQL schema and seed scripts, plus a combined `cis.sql` import for local setup.
- Demo credentials documentation for development and review.
- Frontend build, test, and lint scripts.
- Backend pytest scaffold for health, routing, and security helpers.
- Contributor workflow documentation for coworkers.

### Verified

- `npm run build`
- `npm run test`
- `npm run lint` with warnings only
- `cd backend; .\.venv\Scripts\python.exe -m pytest tests`

### Notes

- No production secrets are included. Coworkers must create local `.env` files from `.env.example`.
- Database dumps and local generated folders remain ignored by Git.
