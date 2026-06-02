# System Admin Role

System Admin has full operational control of the platform: provisions users, configures semesters, manages global settings, monitors analytics, and acts as break-glass authority for any role-restricted operation.

## Responsibilities

- Provision and lifecycle accounts (create / suspend / reactivate / reset password)
- Create and configure semesters (start / end / total_weeks / windows)
- Manage course catalog (parallel authority with academic staff)
- View system-wide analytics (users, academic, finance, engagement)
- Configure system settings (institutional currency, JWT expiry, etc.)
- View all student records and grades (no faculty scope)
- Override any audit-trailed action when institutionally justified

## Screens (Frontend Routes)

| Route | Page |
|---|---|
| `/admin` | Dashboard |
| `/admin/profile` | Profile |
| `/admin/users` | Users Manager (search, filter, create, edit, reset) |
| `/admin/students` | Students roster (global) |
| `/admin/courses` | Course Catalog manager |
| `/admin/semesters` | Semesters (create, dates, windows) |
| `/admin/registrations` | Registrations (read across faculties) |
| `/admin/analytics` | System Analytics (totals, KPIs, charts) |
| `/admin/settings` | Global settings |
| `/admin/change-password` | Change password |

## Key API Endpoints

| Endpoint | Purpose |
|---|---|
| `POST /users` | Create user `{email, full_name, role, faculty_id, ...}` |
| `PATCH /users/{id}` | Activate, suspend, edit |
| `POST /users/{id}/reset-password` | Generate new temporary password |
| `GET /users` | List with filters |
| `POST /semesters` | Create semester |
| `PATCH /semesters/{id}` | Adjust windows |
| `GET /admin/analytics` | Aggregate stats |
| `GET /admin/settings` + `PATCH /admin/settings` | Read / write system settings |

## Permissions Matrix

| Action | Allowed? |
|---|---|
| Provision user | ✅ |
| Suspend / reset / reactivate user | ✅ |
| View / edit ANY user's profile | ✅ |
| Create semester | ✅ |
| Edit semester windows | ✅ |
| Edit course catalog | ✅ |
| Approve registrations | ✅ (parallel with academic staff) |
| Issue invoices / record payments | ❌ (Finance role; admin would create a finance staff account instead) |
| View all grades (no faculty scope) | ✅ |
| Publish / edit grades | ✅ (corrective) |
| Send broadcast message | ✅ |
| Send / receive direct messages | ❌ (out of scope per role matrix) |

## Business Rules

- **Lifecycle audit.** Every user lifecycle action (CREATE_USER, SUSPEND_USER, RESET_PASSWORD, REACTIVATE_USER) writes to `audit_log` with actor, target, timestamp, and IP.
- **Token rotation.** Password reset issues a new temporary password and forces `is_first_login = true`.
- **Role assignment.** Setting a user's role is admin-only. Demotions are audit-logged with reason.
- **System settings**. Changes to `JWT_EXPIRE_MINUTES`, allowed origins, etc. are validated against safe ranges.
- **Semester windows.** Admin can edit any semester; academic staff can only edit windows of the current/upcoming term.

## Related Diagrams

- [user-scenarios.md](user-scenarios.md)
- [use-cases.md](use-cases.md)
- [activity-diagrams.md](activity-diagrams.md)
- [sequence-diagrams.md](sequence-diagrams.md)
- [diagrams/](diagrams/) — rendered PNGs of every Mermaid diagram (auto-generated)
