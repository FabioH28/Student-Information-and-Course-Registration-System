# CIS — Role Documentation

Each subfolder documents one user role with overview, user scenarios, use case diagrams, activity diagrams, and sequence diagrams.

| Role | Folder | Primary Responsibilities |
|---|---|---|
| Student | [student/](student/) | Course registration, timetable, materials, assignments, grades, messaging, clubs |
| Instructor | [instructor/](instructor/) | Course delivery, weekly materials, assignments, attendance, grading |
| Academic Staff | [academic-staff/](academic-staff/) | Course catalog, offerings, timetable, buildings/rooms, registration approvals |
| Communications Staff | [communications-staff/](communications-staff/) | Announcements, events, clubs, broadcast messages |
| Finance Staff | [finance-staff/](finance-staff/) | Invoices, payments, holds, student balances |
| System Admin | [system-admin/](system-admin/) | Users, semesters, analytics, settings |

> **Note on Academic Staff vs Communications Staff.** In the codebase these are the same backend role (`academic_staff`). They are separated in this documentation because the institutional responsibilities and screens differ enough to be treated as distinct roles for governance, training, and acceptance review.

Each role folder contains:

| File | Purpose |
|---|---|
| `README.md` | Role overview, responsibilities, screens, key endpoints, permissions matrix |
| `user-scenarios.md` | Narrative scenarios walking through real tasks step by step |
| `use-cases.md` | Use case diagram (Mermaid) + use case descriptions |
| `activity-diagrams.md` | Activity diagrams (Mermaid) for the role's key workflows |
| `sequence-diagrams.md` | Sequence diagrams (Mermaid) showing system interactions |
| `diagrams/` | Pre-rendered PNG images of every diagram in this role (no Mermaid renderer needed) |

All diagrams are written in [Mermaid](https://mermaid.js.org/) and render natively in GitHub-flavored markdown — no external tooling required to view them.

## Demo accounts (password `password123`)

| Role | Email |
|---|---|
| Student | `alice.smith@cis.edu` |
| Instructor | `john.carter@cis.edu` |
| Academic Staff | `rebecca.morgan@cis.edu` |
| Finance Staff | `finance.csit@cis.edu` |
| System Admin | `admin@cis.edu` |

See [DEMO_LOGIN_CREDENTIALS.txt](../DEMO_LOGIN_CREDENTIALS.txt) for all seeded accounts.
