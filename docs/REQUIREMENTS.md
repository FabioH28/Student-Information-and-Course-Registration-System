# CIS — Requirements Specification

This document specifies the functional and non-functional requirements of the Campus Information System (CIS). It is the canonical, browsable companion to [docs/requirements/index.html](requirements/index.html).

## 1. System Overview

CIS is a full-stack web platform that manages academic operations, student services, and institutional administration. It supports five user roles (Student, Instructor, Academic Staff, Finance Staff, System Admin) with row-level access control enforced on the backend.

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind + shadcn/ui |
| Backend | FastAPI (Python) + SQLAlchemy |
| Database | MySQL 8 / MariaDB 10.4+ |
| Auth | JWT (HS256) + bcrypt |

## 2. Stakeholders and Actors

| Actor | Role |
|---|---|
| Student | Enrolls in courses, submits assignments, views grades, reads notifications, joins clubs, contacts staff and instructors. |
| Instructor | Manages assigned courses, weekly topics, materials, assignments, attendance, and grades. |
| Academic Staff | Owns the academic catalog: courses, offerings, timetable, buildings/rooms, registration approvals, semester windows. |
| Communications Staff | Publishes announcements, manages events, approves clubs, broadcasts. (Same backend role as academic staff; conceptually separated for governance.) |
| Finance Staff | Issues invoices, records payments, places/releases holds, reviews student balances. |
| System Admin | Provisions users, manages semesters, reviews analytics, configures system settings. |

## 3. Functional Requirements

### 3.1 Access Control & Identity

| ID | Requirement | Priority |
|---|---|---|
| FR-001 | Administrators shall provision Student, Instructor, and staff accounts using institution-issued email addresses. | High |
| FR-002 | The system shall enforce role-based access so that each role only sees functions within its authorization scope. | High |
| FR-003 | First-time users shall be required to change their temporary password before accessing role workspaces. | High |
| FR-004 | The system shall support password reset request and confirmation using short-lived tokens. | High |
| FR-020 | Administrators shall be able to activate, suspend, or reset accounts without direct database intervention. | High |

### 3.2 Academic Structure & Operations

| ID | Requirement | Priority |
|---|---|---|
| FR-005 | The system shall maintain departments, programs, academic terms, courses, and course offerings. | High |
| FR-006 | Administrators / academic staff shall assign instructors to specific course offerings. | High |
| FR-007 | Students shall browse the course catalog and view recommendation cues during registration. | Medium |
| FR-008 | Students shall add or drop eligible course registrations subject to prerequisite, capacity, hold, and deadline rules. | High |
| FR-009 | Students shall view a timetable derived from their confirmed registered offerings. | Medium |
| FR-010 | Instructors shall create attendance sessions and mark attendance for students enrolled in their assigned offerings. | High |
| FR-011 | Instructors shall define grade components, record marks, and publish final grade outcomes for assigned offerings. | High |
| FR-012 | Students shall view their academic profile, attendance-related alerts, and published grades. | High |
| FR-021 | Instructors shall have a workspace presenting assigned courses, rosters, attendance, gradebook, and inbox. | High |

### 3.3 Communications & Campus Services

| ID | Requirement | Priority |
|---|---|---|
| FR-013 | The system shall maintain an inbox aggregating warnings, academic notices, finance reminders, and campus notifications. | High |
| FR-014 | Administrators / academic staff shall publish announcements and events visible to relevant users. | High |
| FR-015 | Students shall browse campus clubs and submit join requests or event participation requests. | Medium |
| FR-016 | Administrators shall create and manage club records and review membership requests. | Medium |

### 3.4 Finance

| ID | Requirement | Priority |
|---|---|---|
| FR-017 | Administrators shall issue student invoices, record payments, and apply or release finance holds. | High |
| FR-018 | Students shall inspect finance statements and submit finance support requests. | Medium |

### 3.5 Platform & Reporting

| ID | Requirement | Priority |
|---|---|---|
| FR-019 | The system shall maintain audit records for security-sensitive actions (login, password reset, provisioning, role changes). | High |
| FR-022 | The system shall provide administrative reporting summaries for academic, finance, user, and engagement modules. | Medium |
| FR-023 | The system shall store AI chat sessions and messages for student support interactions where institutional policy permits. | Planned |
| FR-024 | The system shall expose stable REST API endpoints for frontend consumption across all domains. | High |

## 4. Non-Functional Requirements

| ID | Category | Requirement | Target |
|---|---|---|---|
| NFR-001 | Security | All authenticated API calls shall require verified tokens and enforce server-side authorization. | Mandatory |
| NFR-002 | Security | Passwords shall be stored only as secure hashes, never reversible. | Mandatory |
| NFR-003 | Security | The platform shall provide login throttling or temporary lockout after repeated failed attempts. | Mandatory |
| NFR-004 | Performance | Dashboards and list views shall load under typical user-perceived latency. | Sub-2s for common queries |
| NFR-005 | Availability | The deployment shall support routine backup, restart, and recovery without data corruption. | High priority |
| NFR-006 | Data Integrity | Relational constraints shall prevent duplicate or contradictory academic records. | Mandatory |
| NFR-007 | Auditability | Security-sensitive actions shall be traceable through timestamped audit records. | Mandatory |
| NFR-008 | Usability | The interface shall be role-appropriate, mobile-responsive, and understandable to non-technical users. | Mandatory |
| NFR-009 | Accessibility | The platform should align with accessible semantic structure, readable contrast, and keyboard-operable workflows. | WCAG-aligned |
| NFR-010 | Maintainability | Frontend, backend, and database layers shall be modular enough to evolve independently. | Mandatory |
| NFR-011 | Scalability | The architecture shall permit growth in users, records, and modules using conventional scaling. | Institution-scale |
| NFR-012 | Interoperability | The platform shall use stable REST contracts and environment-driven configuration. | Mandatory |
| NFR-013 | Privacy | Users shall only see personally identifiable or academic data they are explicitly authorized for. | Mandatory |
| NFR-014 | Reliability | Validation failures and operational errors shall return predictable responses without exposing internals. | Mandatory |
| NFR-015 | Deployment | The application shall support containerized or equivalent repeatable deployment. | Preferred baseline |

## 5. Business Rules

- Accounts are created by administrators; self-registration is outside scope.
- Student identifiers and employee identifiers are system-generated.
- Students may only register for offerings in accessible academic structures that satisfy prerequisite / policy rules.
- Students may not message other students; the messaging dropdown restricts students to instructors and academic staff.
- Instructors may only manage attendance and grades for offerings explicitly assigned to them.
- Attendance for past-dated sessions is locked once entered; corrections require fresh sessions.
- Assignment creation requires a real `class_session_id` whose week matches the assignment's `week_number`.
- Published final grades are authoritative unless superseded by approved administrative correction.
- Drop is enforced server-side against `semester.drop_deadline`.
- Required-subject selection enforces the strict program/year/prereq gate; elective offerings bypass program/year (same-faculty only).
- Finance holds may restrict downstream student actions such as registration if institutional policy requires.
- Announcements and events shall be attributable to an authorized publisher with publication metadata.
- Notifications shall be linked to a recipient or recipient group and support unread / read / archived state.
- Password reset and password change actions shall invalidate vulnerable session states.
- Critical user lifecycle operations shall leave auditable evidence.

## 6. Interfaces and Integrations

| Interface | Purpose |
|---|---|
| REST API (FastAPI) | Frontend ↔ backend contract; 80+ endpoints across auth, students, courses, offerings, registrations, grades, attendance, finance, notifications, announcements, events, clubs, messages, users, semesters. |
| MySQL (SQLAlchemy) | Persistent academic, finance, and communications data. |
| SMTP (planned) | Email verification, password reset codes. |
| Ollama (optional) | Local LLM for the AI chatbot; deterministic fallback if unavailable. |

## 7. Data and Reporting

- Albanian grade scale (0-10) for course grades; GPA on a 0-4 scale.
- Total credits and duration per program defined in `programs` table.
- Reporting surfaces: Admin Analytics, Finance Dashboard, Instructor Dashboard, Academic Staff Dashboard.
- Demo seed: ~201 users across 4 faculties and 19 programs.

## 8. Assumptions and Constraints

- Single-institution deployment per instance.
- All times stored in server local time; week numbers reference the active semester's start.
- The AI Chatbot is best-effort and clearly labelled; institutional answers come from the database.
- Frontend assumes modern evergreen browsers (Chromium, Firefox, Safari current versions).

## 9. Acceptance Position

The system is considered acceptance-ready when:

1. All HIGH-priority functional requirements are exercised end-to-end via the live UI.
2. RBAC restrictions in [Section 4 of README.md](../README.md#user-roles--permissions) are enforced on the backend (not only hidden in the UI).
3. The seed-data demo flow (5 demo accounts) reproduces the documented scenarios in [docs/roles/](roles/).
4. Lint, build, and backend test suites are green.

## 10. Related Documents

- [ARCHITECTURE.md](ARCHITECTURE.md) — system architecture and module map
- [ERD.md](ERD.md) — entity relationship diagram + domain notes
- [erd_dbdiagram.dbml](erd_dbdiagram.dbml) — full ERD source (dbdiagram.io)
- [roles/](roles/) — per-role overviews, scenarios, and diagrams
- [DEMO_LOGIN_CREDENTIALS.txt](DEMO_LOGIN_CREDENTIALS.txt) — demo accounts
- [requirements/Requirements Specifications.docx](requirements/Requirements%20Specifications.docx) — original long-form specification (Word document)
