# Finance Staff — Use Cases

## Use Case Diagram

```mermaid
flowchart LR
    Finance((Finance Staff))

    subgraph Invoice["Invoices"]
      UC1[Issue invoice]
      UC2[Edit invoice]
      UC3[Void invoice]
      UC4[List invoices faculty-scoped]
    end

    subgraph Payment["Payments"]
      UC5[Record payment]
      UC6[Refund payment]
      UC7[List payments faculty-scoped]
    end

    subgraph Hold["Holds"]
      UC8[Place hold]
      UC9[Release hold]
      UC10[List active holds]
    end

    subgraph Account["Accounts"]
      UC11[View student finance account]
      UC12[Review aggregate dashboard]
    end

    subgraph Self["Self-service"]
      UC13[Change password]
      UC14[Update profile]
    end

    Finance --> UC1
    Finance --> UC2
    Finance --> UC3
    Finance --> UC4
    Finance --> UC5
    Finance --> UC6
    Finance --> UC7
    Finance --> UC8
    Finance --> UC9
    Finance --> UC10
    Finance --> UC11
    Finance --> UC12
    Finance --> UC13
    Finance --> UC14

    UC8 -.side effect.-> Block[Blocks future registration]
    UC9 -.audit.-> Audit[audit_log: RELEASE_HOLD]
    UC11 -.scope.-> Scope[FinanceFacultyScope]
```

## Use Case Descriptions

### UC1 — Issue invoice
**Main flow:** `POST /finance/invoices { student_id, amount, item, due_date }`. Validation: student exists, amount > 0.

### UC5 — Record payment
**Main flow:** `POST /finance/payments { invoice_id, amount, method, reference }`. Validation: amount ≤ remaining balance.

### UC8 — Place hold
**Main flow:** `POST /finance/holds { student_id, reason }`. Audit log entry.

### UC9 — Release hold
**Main flow:** `PATCH /finance/holds/{id} { released_at, released_by_user_id }`. Audit log entry.

### UC11 — View student finance account
**Main flow:** `GET /finance/students/{id}` → invoices + payments + balance + active holds. Faculty-scoped.

### UC12 — Review aggregate dashboard
**Main flow:** `GET /finance/dashboard` → faculty totals (billed / collected / outstanding / active holds count).

### UC13 — Change password
**Main flow:** `POST /auth/change-password`.

### UC14 — Update profile
**Main flow:** `PUT /users/me { phone, etc. }`.
