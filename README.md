# Student Information and Course Registration System (CIS)

A web-based Campus Information System for managing academic operations, student services, and institutional administration in a university environment.

## Status

> Frontend prototype in progress. Backend and database not yet implemented.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui (Radix UI) |
| Routing | React Router v6 |
| Data Fetching | TanStack Query |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Backend (planned) | FastAPI (Python) |
| Database (planned) | Relational SQL |

## User Roles & Permissions

| Feature | Student | Instructor | Academic Staff | Finance Staff | System Admin |
|---|---|---|---|---|---|
| View own timetable | Yes | Yes | Yes | No | Yes |
| View grades | Own only | Own course students | Yes | No | Optional |
| Edit grades | No | Yes (own courses) | Optional | No | No |
| Mark attendance | No | Yes (own courses) | Optional | No | No |
| Course registration | Yes | No | Yes | No | No |
| Manage course catalog | No | No | Yes | No | No |
| View payment status | Own only | No | Optional | Yes | Optional |
| Record payments | No | No | No | Yes | No |
| Manage users/roles | No | No | No | No | Yes |

> "Optional" = permission flag configurable per user account.

## Repository Structure

```
├── docs/                  # Requirements, diagrams, meeting notes, API docs
├── prototypes/            # Wireframes and UI mockups
├── database/              # Schema, seed data, migrations
├── backend/               # FastAPI backend (planned)
├── frontend/              # React frontend (active)
└── reports/               # Project reports and presentations
```

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:8080`

### Backend

> Not yet implemented.

## Team

| Name | Role |
|---|---|
| Fabio Hysa | Team Member |
| Kleart Adri | Team Member |
| Arbri Gaba | Team Member |
| Helio Myrteza | Team Member |
| Fabjan Lika | Team Member |
| Erli Halilaj | Team Member |
