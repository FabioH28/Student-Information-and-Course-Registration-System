# CIS MySQL Schema

Production-style MySQL schema for the Campus Information System project, designed for:

- `Student` users who can only view their own records
- `Instructor` users who can manage grades and attendance for assigned offerings
- `Academic Staff` users who manage scheduling, registrations, records, and academic operations
- `Finance Staff` users who manage invoices, payments, holds, and finance records
- `Communication Staff` users who manage announcements, events, clubs, and public communication
- `System Admin` users who manage users, roles, settings, and system oversight

The authentication model assumes institution-issued accounts are provisioned by System Admins. End users sign in with email/password only, and role-based access is resolved from the account record rather than from separate login buttons.

## Files

- `01_schema.sql`
  Creates the `cis` database and all core tables
- `02_seed_reference.sql`
  Seeds roles, permissions, role-permission mappings, and fee categories
- `03_views.sql`
  Adds reporting views for enrollment, finance, and risk dashboards
- `04_seed_core_data.sql`
  Optional core campus seed data for departments, terms, courses, clubs, news, and events without pre-creating user accounts
- `05_seed_epoka_catalog.sql`
  Optional EPOKA University curriculum seed with real course titles and ECTS values sourced from official program pages, without importing professor or staff names
- `06_seed_umt_msc_catalog.sql`
  Optional University Metropolitan Tirana master-level seed with real course titles and ECTS values sourced from official curriculum material, without importing professor or staff names
- `07_normalize_catalog_identity.sql`
  Optional normalization step that rewrites imported department, program, and course codes into original CIS-style internal catalog codes while keeping the curriculum content and ECTS values
- `08_migrate_rbac_roles.sql`
  Optional migration to map legacy `student` / `teacher` / `admin` role data into the six-role RBAC model
- `09_seed_demo_users.sql`
  Optional demo-user seed covering every final role and core academic, finance, and communications workflows

## Import Order

Use this order in phpMyAdmin or the MySQL CLI:

1. `01_schema.sql`
2. `02_seed_reference.sql`
3. `03_views.sql`
4. `04_seed_core_data.sql` (optional but recommended for a usable first-run workspace)
5. `05_seed_epoka_catalog.sql` (optional but recommended if you want a more realistic academic catalog)
6. `06_seed_umt_msc_catalog.sql` (optional but recommended if you want realistic master's-level catalog data from University Metropolitan Tirana)
7. `07_normalize_catalog_identity.sql` (optional but recommended if you want the visible catalog codes to be original to CIS instead of mirroring source institutions)
8. `08_migrate_rbac_roles.sql` (optional but recommended if you are upgrading an older three-role dataset)
9. `09_seed_demo_users.sql` (optional but recommended if you want ready-made users for each final role)

## MySQL CLI Import

```powershell
mysql -u root -p < backend/database/mysql/01_schema.sql
mysql -u root -p < backend/database/mysql/02_seed_reference.sql
mysql -u root -p < backend/database/mysql/03_views.sql
mysql -u root -p < backend/database/mysql/04_seed_core_data.sql
mysql -u root -p < backend/database/mysql/05_seed_epoka_catalog.sql
mysql -u root -p < backend/database/mysql/06_seed_umt_msc_catalog.sql
mysql -u root -p < backend/database/mysql/07_normalize_catalog_identity.sql
mysql -u root -p < backend/database/mysql/08_migrate_rbac_roles.sql
mysql -u root -p < backend/database/mysql/09_seed_demo_users.sql
```

## phpMyAdmin Import

1. Open phpMyAdmin from XAMPP.
2. Import `01_schema.sql`.
3. Import `02_seed_reference.sql`.
4. Import `03_views.sql`.
5. Import `04_seed_core_data.sql` if you want the academic, finance, communications, and System Admin workspaces to start with academic structure and campus content.
6. Import `05_seed_epoka_catalog.sql` if you want the course catalog to include real EPOKA University program data and ECTS values.
7. Import `06_seed_umt_msc_catalog.sql` if you want the master's catalog to include real University Metropolitan Tirana program data and ECTS values.
8. Import `07_normalize_catalog_identity.sql` if you want the visible catalog codes and program labels to be original to your CIS project.
9. Import `08_migrate_rbac_roles.sql` if you are upgrading an older dataset with legacy role codes.
10. Import `09_seed_demo_users.sql` if you want sample users for every final role.

## What This Covers

- System Admin-provisioned custom email/password auth foundation
- users, roles, permissions, and refresh/reset token storage
- student, instructor, and staff profile tables
- departments, programs, terms, courses, prerequisites, and offerings
- attendance, grade components, grade records, and final grades
- recommendations, risk assessments, and term performance history
- invoices, invoice items, payments, aid awards, allocations, and financial holds
- announcements, audience targeting, campus events, and event registrations
- inbox notifications and recipient read-state tracking
- club categories, clubs, memberships, join requests, and club-linked events
- AI academic assistant chat sessions and messages
- system settings for app-level configuration
- audit logs for sensitive actions

## Notes

- This schema is written to be friendly to XAMPP MySQL/MariaDB.
- It is intentionally normalized so the FastAPI layer can enforce business rules cleanly.
- The frontend now includes dedicated student, instructor, academic staff, finance staff, communication staff, and System Admin workspaces.
- `05_seed_epoka_catalog.sql` adds an `ects_credits` column to `courses` if it is not already present, so official ECTS values can coexist with the app's existing integer credit field.
- `06_seed_umt_msc_catalog.sql` follows the same pattern and currently seeds a documented Metropolitan Tirana MSc catalog without storing any real professor identities.
- `07_normalize_catalog_identity.sql` keeps the imported curriculum content but replaces source-style visible codes with original CIS codes so the catalog feels institution-owned rather than copied verbatim.
