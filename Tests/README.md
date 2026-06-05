# Tests

This folder contains the project's backend and frontend automated test code.

## Backend

Run the backend test suite with:

```powershell
backend\.venv\Scripts\python.exe -m pytest "Tests/backend"
```

The backend suite uses pytest and FastAPI TestClient. The admin integration tests
run against an isolated in-memory SQLite database, so they do not touch the real
application database.

Student access coverage is concentrated in `backend/test_student_access.py`.
It seeds a realistic CIS student environment and verifies profile management,
my courses, course detail access, timetable, attendance, exam eligibility,
published grades, progression, invoices, notifications, visible course
materials, assignments, assignment submission, available subjects, course
selection/drop requests, clubs, and student messaging rules.

## Frontend

Run the frontend test suite with:

```powershell
npm.cmd run test
```

The frontend suite uses Vitest, jsdom, React Testing Library, and route-level
checks for authentication and role redirects.

Student UI coverage is concentrated in `frontend/studentAccessPages.test.tsx`.
It renders the student dashboard, my courses page, and profile page with mocked
student API data to confirm key academic summary information appears correctly.
