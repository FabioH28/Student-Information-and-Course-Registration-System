# System Admin — Sequence Diagrams

## S1 — Provision new user

```mermaid
sequenceDiagram
    actor A as Admin
    participant FE as Frontend
    participant API as Backend
    participant DB as MySQL
    participant SMTP as SMTP (optional)

    A->>FE: Fill Create User form, Submit
    FE->>API: POST /users {email, full_name, role:student, program_id, ...}
    API->>API: require_roles([system_admin])
    API->>DB: SELECT users WHERE email=...
    alt taken
        API-->>FE: 409 email taken
    else free
        API->>API: generate temp_pw, bcrypt hash
        API->>DB: BEGIN TX
        API->>DB: INSERT users (is_first_login=true)
        API->>DB: INSERT students (user_id, program_id, ...)
        API->>DB: INSERT audit_log (CREATE_USER)
        API->>DB: COMMIT
        opt SMTP configured
            API->>SMTP: send welcome email w/ temp pw
        end
        API-->>FE: 201 {user_id, temp_password}
        FE-->>A: Display temp pw (admin shares securely)
    end
```

## S2 — Reset password

```mermaid
sequenceDiagram
    actor A as Admin
    participant FE as Frontend
    participant API as Backend
    participant DB as MySQL
    actor U as Target User

    A->>FE: Click Reset Password on user 10
    FE->>API: POST /users/10/reset-password
    API->>API: require_roles([system_admin])
    API->>API: generate temp_pw + hash
    API->>DB: UPDATE users SET password_hash=..., is_first_login=true WHERE id=10
    API->>DB: INSERT audit_log (RESET_PASSWORD, actor=admin, target=10)
    API-->>FE: 200 {temp_password}
    FE-->>A: Show pw once

    Note over U,API: User signs in
    U->>API: POST /auth/login with temp_pw
    API-->>U: 200 {require_password_change:true}
    U->>API: POST /auth/change-password {current=temp_pw, new}
    API->>DB: UPDATE password_hash, is_first_login=false
    API-->>U: 200 ok
```

## S3 — Suspend (with effect on existing token)

```mermaid
sequenceDiagram
    actor A as Admin
    participant API as Backend
    participant DB as MySQL
    actor U as Target User

    Note over U: User has valid JWT
    U->>API: GET /api/student/courses
    API->>DB: SELECT user WHERE id=10 AND is_active=true
    DB-->>API: row
    API-->>U: 200 courses

    A->>API: PATCH /users/10 {is_active:false, status:suspended}
    API->>DB: UPDATE users
    API->>DB: INSERT audit_log (SUSPEND_USER)
    API-->>A: 200

    Note over U: User retries with same JWT
    U->>API: GET /api/student/courses
    API->>DB: SELECT user WHERE id=10 AND is_active=true
    DB-->>API: (none — is_active=false)
    API-->>U: 401 Unauthorized
```

## S4 — Edit semester windows

```mermaid
sequenceDiagram
    actor A as Admin
    participant API as Backend
    participant DB as MySQL

    A->>API: PATCH /semesters/2 {drop_deadline:'2026-06-21', registration_open_at:'2026-02-01'}
    API->>API: require_roles([academic_staff, system_admin])
    API->>API: validate dates (start < end, drop ≤ end, ...)
    API->>DB: UPDATE semesters
    API->>DB: INSERT audit_log (UPDATE_SEMESTER)
    API-->>A: 200
```

## S5 — Analytics snapshot

```mermaid
sequenceDiagram
    actor A as Admin
    participant FE as Frontend
    participant API as Backend
    participant DB as MySQL

    A->>FE: Open /admin/analytics
    FE->>API: GET /admin/analytics
    API->>DB: SELECT count(users) GROUP BY role, status
    API->>DB: SELECT count(students) GROUP BY faculty
    API->>DB: SELECT sum(invoice.amount), sum(payment.amount)
    API->>DB: SELECT count(logins) WHERE created_at > now-30d
    API->>DB: SELECT count(messages) WHERE sent_at > now-30d
    DB-->>API: aggregates
    API-->>FE: {users, students_by_faculty, finance, engagement}
    FE-->>A: Render charts
```
