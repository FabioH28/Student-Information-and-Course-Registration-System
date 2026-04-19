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

## User Roles & Permissions

| Feature | Student | Instructor | Academic Staff | Finance Staff | Communication Staff | System Admin |
|---|---|---|---|---|---|---|
| View own profile | Yes | Yes | Yes | Yes | Yes | Yes |
| Edit own profile | Yes | Yes | Yes | Yes | Yes | Yes |
| View own timetable | Yes | Yes | Yes | No | No | Yes |
| View grades | Yes (own only) | Yes (own course students) | Yes | No | No | Yes |
| Edit grades | No | Yes | Yes | No | No | No |
| Mark attendance | No | Yes | Yes | No | No | No |
| View attendance records | Yes (own only) | Yes (own course students) | Yes | No | No | Yes |
| Course registration | Yes | No | Yes | No | No | No |
| View enrolled courses | Yes (own only) | Yes (own courses) | Yes | No | No | Yes |
| Manage course catalog | No | No | Yes | No | No | Yes |
| Manage semester offerings | No | No | Yes | No | No | Yes |
| Manage timetable/scheduling | No | No | Yes | No | No | Yes |
| Manage exam schedules | No | No | Yes | No | No | Yes |
| View academic records | Yes (own only) | Yes (own course students) | Yes | No | No | Yes |
| Manage student academic records | No | No | Yes | No | No | Yes |
| View payment status | Yes (own only) | No | No | Yes | No | Yes |
| Record/verify payments | No | No | No | Yes | No | Yes |
| Manage invoices/fees | No | No | No | Yes | No | Yes |
| Create announcements/news | No | Yes | Yes | No | Yes | Yes |
| Manage announcements/news | No | Yes | Yes | No | Yes | Yes |
| Create/manage events | No | No | Yes | No | Yes | Yes |
| Send notifications | No | Yes | Yes | Yes | Yes | Yes |
| Upload public media/files for announcements | No | No | Yes | No | Yes | Yes |
| View reports/dashboard | Yes (own only) | Yes (own courses) | Yes | Yes | Yes | Yes |
| Manage users/roles | No | No | No | No | No | Yes |
| Manage system settings | No | No | No | No | No | Yes |
| Full system access | No | No | No | No | No | Yes |




## Role Definitions

- **Student:** Accesses personal academic and financial information, registers for courses, and views timetable, grades, and attendance.
- **Instructor:** Manages teaching-related activities for assigned courses, including grading, attendance, and course-related communication.
- **Academic Staff:** Handles academic administration such as registration, scheduling, course catalog management, and student academic records.
- **Finance Staff:** Manages tuition, fees, payment verification, and financial records.
- **Communication Staff:** Manages announcements, news, events, and public communication content.
- **System Admin:** Has full control over users, roles, permissions, and system settings.



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
| Fabio Hysa | Team Leader |
| Kleart Adri | Team Member |
| Arbri Gaba | Team Member |
| Helio Myrteza | Team Member |
| Fabjan Lika | Team Member |
| Erli Halilaj | Team Member |
