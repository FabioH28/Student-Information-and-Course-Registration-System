# CIS MySQL Schema

This database has been reduced to the mandatory physical tables only.

## Physical Tables

The source of truth is `01_schema.sql`, with **21 physical tables**:

```text
programs
users
auth_tokens
academic_terms
courses
course_offerings
enrollments
attendance_sessions
attendance_records
grade_components
grade_records
student_invoices
payments
financial_holds
clubs
club_memberships
news_posts
campus_events
campus_event_registrations
notifications
ai_chat_messages
```

Former production-normalization tables such as `roles`, `permissions`, profile tables, room/building tables, invoice item tables, notification recipient tables, and AI chat session tables are no longer physical tables. Their data is stored directly on the mandatory tables above.

`03_views.sql` keeps compatibility/reporting views so the existing backend can still read familiar shapes without storing extra duplicated data.

## Import Order

For phpMyAdmin/XAMPP, import into a fresh `cis` database. If an older `cis` database already exists, drop or rename it first so removed physical tables do not remain beside the lean schema.

Import the combined file:

```text
backend/database/mysql/cis.sql
```

Or import the modular scripts in order:

```powershell
mysql -u root -p < backend/database/mysql/01_schema.sql
mysql -u root -p < backend/database/mysql/02_seed_reference.sql
mysql -u root -p < backend/database/mysql/03_views.sql
mysql -u root -p < backend/database/mysql/04_seed_core_data.sql
mysql -u root -p < backend/database/mysql/05_seed_undergraduate_catalog.sql
mysql -u root -p < backend/database/mysql/06_seed_graduate_catalog.sql
mysql -u root -p < backend/database/mysql/07_normalize_catalog_identity.sql
mysql -u root -p < backend/database/mysql/08_migrate_rbac_roles.sql
mysql -u root -p < backend/database/mysql/09_seed_demo_users.sql
```

Files `05` through `08` are intentionally lean-safe no-op scripts now; they remain only so the existing Docker/phpMyAdmin import order keeps working.
