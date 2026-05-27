# Finance Staff Role

Finance Staff manages the student billing and collection workflow: issues invoices, records payments, places and releases holds, and reviews per-student balances. Finance scope is restricted to the staff member's assigned faculty via `FinanceFacultyScope`.

## Responsibilities

- Issue student invoices (tuition, lab fees, late fees, custom charges)
- Record payments against invoices
- Place finance holds on accounts (preventing further registration, transcripts, etc.)
- Release holds once obligations are met
- Review per-student finance accounts (balance, history)
- View finance dashboard (faculty totals, outstanding amounts)
- Receive and reply to messages

## Screens (Frontend Routes)

| Route | Page |
|---|---|
| `/finance-staff` | Dashboard (totals: billed / collected / outstanding) |
| `/finance-staff/profile` | Profile |
| `/finance-staff/students` | Student Accounts (per-student balance + status) |
| `/finance-staff/invoices` | Invoice ledger |
| `/finance-staff/payments` | Payment ledger |
| `/finance-staff/holds` | Active holds + history |
| `/finance-staff/change-password` | Change password |

> Finance Staff does **not** currently have an Inbox screen — messaging in/out from finance staff is intentionally out of scope per the README role matrix.

## Key API Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /finance/dashboard` | Aggregate stats (faculty-scoped) |
| `GET /finance/students` | Student accounts with balance |
| `POST /finance/invoices` | Issue invoice `{student_id, amount, item, due_date}` |
| `GET /finance/invoices` | Invoice ledger |
| `POST /finance/payments` | Record payment `{invoice_id, amount, method, reference}` |
| `GET /finance/payments` | Payment ledger |
| `POST /finance/holds` | Place hold `{student_id, reason}` |
| `PATCH /finance/holds/{id}` | Release hold |

## Permissions Matrix

| Action | Allowed? |
|---|---|
| Issue invoice | ✅ |
| Record payment | ✅ |
| Place hold | ✅ |
| Release hold | ✅ |
| View student finance account | ✅ (faculty-scoped) |
| View student academic grades | ❌ |
| Edit grades | ❌ |
| Approve registrations | ❌ |
| Send / receive direct messages | ❌ (out of scope) |

## Business Rules

- **Faculty scope.** `FinanceFacultyScope` limits visibility — a finance staff member only sees students within their faculty.
- **Currency.** Amounts are stored as DECIMAL; UI displays the configured institutional currency code (currently "ALL").
- **Hold side-effects.** When a hold is active, the registration backend may reject `POST /api/student/course-selections` for that student (configurable policy).
- **Audit.** Every invoice issued, payment recorded, hold placed/released is audit-logged.
- **Balance computation.** `outstanding = sum(invoices.amount) - sum(payments.amount)` for an account, scoped to a semester or all-time.

## Related Diagrams

- [user-scenarios.md](user-scenarios.md)
- [use-cases.md](use-cases.md)
- [activity-diagrams.md](activity-diagrams.md)
- [sequence-diagrams.md](sequence-diagrams.md)
- [diagrams/](diagrams/) — rendered PNGs of every Mermaid diagram (auto-generated)
