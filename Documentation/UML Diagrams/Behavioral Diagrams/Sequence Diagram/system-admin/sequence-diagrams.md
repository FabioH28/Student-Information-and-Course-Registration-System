# System Admin — Sequence Diagrams

## S1 — Approve a pending account

```mermaid
sequenceDiagram
    actor Admin as System Admin
    participant FE as Frontend
    participant API as Backend
    participant Sec as require_roles
    participant DB as MySQL
    participant Mail as EmailUtils
    actor U as User

    Admin->>FE: Open /admin/users
    FE->>API: GET /users/pending
    API->>DB: SELECT users WHERE status='pending_approval'
    DB-->>API: queue
    API-->>FE: list
    FE-->>Admin: Render 'awaiting approval' card

    Admin->>FE: Click Approve (role=instructor)
    FE->>API: POST /users/12/approve {role:'instructor'}
    API->>Sec: validate JWT + role
    Sec-->>API: current_user (admin)
    API->>DB: UPDATE role, status=active, is_active=true
    DB-->>API: ok
    API->>Mail: send_approval_email (best-effort)
    Mail-->>API: sent / failed
    API-->>FE: 200 {..., email_sent}
    FE-->>Admin: Toast 'User approved'

    Note over U: Later
    U->>API: POST /auth/login
    API-->>U: JWT -> instructor portal
```

## S2 — Create a user

```mermaid
sequenceDiagram
    actor Admin as System Admin
    participant FE as Frontend
    participant API as Backend
    participant Sec as require_roles
    participant DB as MySQL
    participant Mail as EmailUtils

    Admin->>FE: Fill New User form, click Save
    FE->>API: POST /users {email, password, role, full_name}
    API->>Sec: require_roles(system_admin)
    alt not admin
        Sec-->>API: deny
        API-->>FE: 403 Insufficient permissions
        FE-->>Admin: Error toast
    else admin
        Sec-->>API: current_user
        API->>DB: INSERT user (status=active, is_first_login=true)
        DB-->>API: user
        API->>Mail: send_account_created_email (best-effort)
        Mail-->>API: email_sent
        API-->>FE: 201 {..., email_sent}
        FE-->>Admin: Toast 'User created' + refetch
    end
```

## S3 — Disable an account (admin guard rejects)

```mermaid
sequenceDiagram
    actor Admin as System Admin
    participant FE as Frontend
    participant API as Backend
    participant DB as MySQL

    Admin->>FE: Toggle off an admin row
    FE->>API: PATCH /users/3 {is_active:false}
    API->>DB: SELECT user
    DB-->>API: user(role=system_admin)
    API-->>FE: 403 'Admin accounts cannot be deactivated'
    FE-->>Admin: Error toast (toggle stays on)
```

## S4 — Reset a user's password

```mermaid
sequenceDiagram
    actor Admin as System Admin
    participant FE as Frontend
    participant API as Backend
    participant DB as MySQL
    participant Mail as EmailUtils

    Admin->>FE: Click Reset on a user row
    FE->>API: POST /users/42/reset-password
    API->>DB: UPDATE password_hash, is_first_login=true
    DB-->>API: ok
    API->>Mail: send_admin_password_reset_email (best-effort)
    Mail-->>API: email_sent
    API-->>FE: 200 {message, email_sent}
    FE-->>Admin: Toast 'New password emailed / not sent'
```

## S5 — Activate a semester

```mermaid
sequenceDiagram
    actor Admin as System Admin
    participant FE as Frontend
    participant API as Backend
    participant DB as MySQL

    Admin->>FE: Click Make active on Spring 2026
    loop each currently active term
        FE->>API: PATCH /semesters/{id} {is_active:false}
        API->>DB: UPDATE semesters SET is_active=false
    end
    FE->>API: PATCH /semesters/2 {is_active:true}
    API->>DB: UPDATE semesters SET is_active=true WHERE id=2
    API-->>FE: 200
    FE-->>Admin: Active term updated
```
