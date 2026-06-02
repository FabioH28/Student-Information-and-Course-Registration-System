# Student — Sequence Diagrams

System-interaction views of the same flows. Useful when implementing or debugging API contracts.

## S1 — Login + JWT issuance

```mermaid
sequenceDiagram
    actor S as Student
    participant FE as Frontend (Vite/React)
    participant API as Backend (FastAPI)
    participant DB as MySQL

    S->>FE: Enter email + password, click Sign in
    FE->>API: POST /auth/login {email, password}
    API->>DB: SELECT user WHERE email=...
    DB-->>API: user row
    API->>API: verify_password(bcrypt)
    alt invalid
        API-->>FE: 401 Unauthorized
        FE-->>S: Show error
    else valid
        API->>API: jwt.encode({sub, role, exp})
        API->>DB: INSERT audit_log (LOGIN)
        API-->>FE: 200 {access_token, role, require_password_change, user}
        FE->>FE: Save token in memory + localStorage
        alt require_password_change
            FE->>S: Redirect to /change-password
        else
            FE->>S: Redirect to /student dashboard
        end
    end
```

## S2 — Submit course selection

```mermaid
sequenceDiagram
    actor S as Student
    participant FE as Frontend
    participant API as Backend
    participant DB as MySQL
    participant Staff as Academic Staff

    S->>FE: Click Add on offering CS101
    FE->>API: POST /api/student/course-selections {course_offering_id: 1}
    API->>DB: SELECT student WHERE user_id=...
    API->>DB: SELECT offering, prerequisites, semester window
    API->>API: validate program/year, prereq, conflict, hold
    alt invalid
        API-->>FE: 400 reason
        FE-->>S: Show error
    else valid
        API->>DB: INSERT student_course_selection (status=requested)
        API->>DB: INSERT notification (target=staff role)
        API-->>FE: 201 {selection_id, status: requested}
        FE-->>S: Show Pending badge
    end

    Note over Staff,API: Asynchronous review
    Staff->>API: PATCH /api/staff/course-selections/{id} {status: approved}
    API->>DB: UPDATE selection SET status=approved
    API->>DB: INSERT registrations (student_id, offering_id, status=active)
    API->>DB: INSERT notification (target=student)
    API-->>Staff: 200 ok

    S->>FE: Refresh dashboard
    FE->>API: GET /api/student/courses
    API->>DB: SELECT registrations WHERE student_id=...
    DB-->>API: rows incl CS101
    API-->>FE: 200 [{course: "CS101", ...}]
    FE-->>S: CS101 visible in My Courses
```

## S3 — Submit assignment + receive grade

```mermaid
sequenceDiagram
    actor S as Student
    participant FE as Frontend
    participant API as Backend
    participant DB as MySQL
    actor I as Instructor

    S->>FE: Open assignment Lab 3
    FE->>API: GET /api/student/assignments/{id}
    API->>DB: SELECT assignment, my submission if any
    API-->>FE: brief + due + (existing submission)
    S->>FE: Enter content, click Submit
    FE->>API: POST /api/student/assignment-submissions {assignment_id, content, file_url}
    API->>API: validate window (start_at..end_at)
    API->>DB: INSERT submission (is_published=false)
    API-->>FE: 201
    FE-->>S: Submitted

    Note over I,API: Later
    I->>API: PUT /api/teacher/assignment-submissions/{id} {score, feedback}
    API->>DB: UPDATE submission
    I->>API: POST /grades/publish {registration_ids}
    API->>DB: UPDATE grades SET is_published=true

    S->>FE: Open /student/grades
    FE->>API: GET /grades/me
    API->>DB: SELECT grades WHERE student_id=... AND is_published=true
    DB-->>API: rows
    API-->>FE: 200 [{course, total_score, letter}]
    FE-->>S: Lab 3 score + feedback visible
```

## S4 — Send direct message to instructor

```mermaid
sequenceDiagram
    actor S as Student
    participant FE as Frontend
    participant API as Backend
    participant DB as MySQL
    actor I as Instructor

    S->>FE: Click New Message
    FE->>API: GET /messages/contacts
    API->>API: canonical_role(student) → filter to instructor + academic_staff
    API->>DB: SELECT users WHERE role IN (instructor, academic_staff)
    DB-->>API: contacts
    API-->>FE: 200 {contacts}
    FE-->>S: Show recipient dropdown (no students, finance, admin)

    S->>FE: Select Dr. Carter, type subject + body, Send
    FE->>API: POST /messages {recipient_id: 5, subject, body, broadcast: false}
    API->>DB: SELECT recipient WHERE id=5
    API->>API: assert recipient.role ∈ {instructor, academic_staff}
    API->>DB: INSERT messages (sender_id, recipient_id, subject, body)
    API-->>FE: 200 {message: "Message sent to Dr. John Carter."}
    FE-->>S: Show in Sent tab

    Note over I,API: Later
    I->>API: GET /messages/inbox
    API->>DB: SELECT messages WHERE recipient_id=5 OR is_broadcast=true
    DB-->>API: rows incl Alice's message
    API-->>I: 200 {items: [...]}
```

## S5 — Drop course (with deadline check)

```mermaid
sequenceDiagram
    actor S as Student
    participant FE as Frontend
    participant API as Backend
    participant DB as MySQL

    S->>FE: Click Drop, confirm dialog
    FE->>API: POST /registrations/drop {registration_id: 42}
    API->>DB: SELECT registration WHERE id=42
    API->>API: assert reg.student_id == me.student_id
    API->>DB: SELECT semester.drop_deadline WHERE id=reg.semester_id
    alt today > drop_deadline
        API-->>FE: 400 "Drop deadline passed (2026-06-21)"
        FE-->>S: Error inline
    else within deadline
        API->>DB: UPDATE registrations SET status='dropped' WHERE id=42
        API->>DB: INSERT audit_log (DROP_REGISTRATION)
        API-->>FE: 200
        FE->>API: GET /api/student/timetable (refresh)
        API-->>FE: timetable without dropped course
        FE-->>S: Course removed from timetable
    end
```
