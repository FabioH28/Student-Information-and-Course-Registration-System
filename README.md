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
| Backend | FastAPI (Python) |
| Database | MySQL 8 |
| Auth | JWT + bcrypt |

## User Roles & Permissions

| Feature | Student | Instructor | Academic Staff | Finance Staff | System Admin |
|---|---|---|---|---|---|
| View own profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit own profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| View grades | Own only | Own courses | All | ❌ | ✅ |
| Edit / publish grades | ❌ | ✅ | ✅ | ❌ | ✅ |
| Mark attendance | ❌ | ✅ | ✅ | ❌ | ✅ |
| Course registration | ✅ | ❌ | ✅ | ❌ | ✅ |
| Manage course catalog | ❌ | ❌ | ✅ | ❌ | ✅ |
| View payment status | Own only | ❌ | ❌ | ✅ | ✅ |
| Record payments | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage invoices & holds | ❌ | ❌ | ❌ | ✅ | ✅ |
| Create announcements | ❌ | ✅ | ✅ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ❌ | ✅ |
| Full system access | ❌ | ❌ | ❌ | ❌ | ✅ |

## Repository Structure

```
├── backend/               # FastAPI backend
│   ├── src/
│   │   ├── config/        # Database & settings
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── routes/        # API endpoints
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   └── utils/         # Auth, security, audit helpers
│   ├── .env.example       # Environment variable template
│   └── requirements.txt   # Python dependencies
├── database/
│   ├── schema.sql         # MySQL table definitions
│   └── seed.sql           # Sample data for development
├── frontend/              # React + TypeScript frontend
│   └── src/
│       ├── contexts/      # Auth context
│       ├── layouts/       # Role-based layouts
│       ├── lib/           # API client
│       └── pages/         # All role dashboards and pages
└── docs/                  # Diagrams, meeting notes, reports
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- MySQL 8.0+

### 1. Database Setup

Create the database and run the schema:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p CampusIS < database/seed.sql
```

Or open `database/schema.sql` and `database/seed.sql` in MySQL Workbench and execute them in order.

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env       # Windows
cp .env.example .env         # Mac/Linux
# Then edit .env with your MySQL credentials

# Start the server
uvicorn src.main:app --reload --port 8000
```

API runs at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:8080`

### 4. Login Credentials (development)

All accounts use password: **`Password123!`**

| Role | Email |
|---|---|
| Student | `alex.johnson@university.edu` |
| Instructor | `dr.smith@university.edu` |
| Academic Staff | `academic.staff@university.edu` |
| Finance Staff | `finance.staff@university.edu` |
| System Admin | `admin@university.edu` |

## API Overview

The backend exposes 50 REST endpoints across these areas:

| Area | Prefix |
|---|---|
| Authentication | `/auth` |
| Students | `/students` |
| Courses | `/courses` |
| Offerings | `/offerings` |
| Registrations | `/registrations` |
| Grades | `/grades` |
| Attendance | `/attendance` |
| Finance | `/finance` |
| Notifications | `/notifications` |
| Announcements | `/announcements` |

## Team

| Name | Role |
|---|---|
| Fabio Hysa | Team Leader |
| Kleart Adri | Team Member |
| Arbri Gaba | Team Member |
| Helio Myrteza | Team Member |
| Fabjan Lika | Team Member |
| Erli Halilaj | Team Member |
