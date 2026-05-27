# Instructor — Sequence Diagrams

## S1 — Create assignment (with class_session linkage)

```mermaid
sequenceDiagram
    actor I as Instructor
    participant FE as Frontend
    participant API as Backend
    participant DB as MySQL

    I->>FE: Open Assignments tab for CS101 (offering 1)
    FE->>API: GET /api/teacher/sessions?courseId=1
    API->>DB: SELECT class_sessions WHERE offering_id=1
    DB-->>API: [{id:22, week_id:12, ...}, {id:1001, week_id:13, ...}]
    API-->>FE: 200 sessions
    FE-->>I: Show picker

    I->>FE: Pick session id 22 (week 12), fill title/desc/dates, Submit
    FE->>API: POST /api/teacher/course-offerings/1/assignments<br/>{class_session_id:22, week_number:12, ...}
    API->>DB: SELECT class_session WHERE id=22
    API->>API: assert session.week_id == 12
    alt mismatch
        API-->>FE: 400 "week mismatch"
        FE-->>I: Error inline
    else match
        API->>DB: INSERT assignment
        API-->>FE: 201 {assignment_id}
        FE-->>I: Visible on assignments list
    end
```

## S2 — Attendance bulk save with date-lock

```mermaid
sequenceDiagram
    actor I as Instructor
    participant FE as Frontend
    participant API as Backend
    participant DB as MySQL

    I->>FE: Open attendance page, pick session 99 (yesterday)
    FE->>API: GET roster for session 99
    API-->>FE: Students
    I->>FE: Mark statuses, Save
    FE->>API: POST /attendance/sessions/99/records [...]
    API->>DB: SELECT session WHERE id=99
    API->>API: assert session.session_date == today
    API-->>FE: 400 "Attendance for previous dates is locked"
    FE-->>I: Show inline error + suggestion

    Note over I,API: Recovery flow
    I->>FE: Create fresh session for today
    FE->>API: POST /attendance/offering/1/sessions {session_date: today}
    API->>DB: INSERT class_session, attendance_session
    API-->>FE: 201 {session_id: 250}
    FE->>API: POST /attendance/sessions/250/records [...]
    API->>DB: INSERT attendance_records
    API->>DB: Recompute absence_percentage per student
    API-->>FE: 200
    FE-->>I: Saved
```

## S3 — Grade configuration + publish

```mermaid
sequenceDiagram
    actor I as Instructor
    participant FE as Frontend
    participant API as Backend
    participant DB as MySQL
    actor S as Student

    I->>FE: Open /instructor/grades for CS101
    FE->>API: GET /grades/config/offering/1
    API->>DB: SELECT config
    alt none
        API->>DB: INSERT default config
    end
    DB-->>API: config row
    API-->>FE: weights
    I->>FE: Adjust weights, Save
    FE->>API: PUT /grades/config/offering/1 {midterm:25, final:35, ...}
    API->>API: assert sum == 100
    API->>DB: UPDATE config
    API-->>FE: 200

    I->>FE: Enter scores for Alice (reg 9)
    FE->>API: PUT /grades/offering/1/registration/9 {midterm:90, final:88, ...}
    API->>DB: UPSERT grade row (is_published=false)
    API-->>FE: 200

    I->>FE: Click Publish for selected registrations
    FE->>API: POST /grades/publish {registration_ids:[9, 11, ...]}
    API->>DB: UPDATE grades SET is_published=true WHERE registration_id IN (...)
    API-->>FE: 200

    Note over S,API: Student reads
    S->>API: GET /grades/me
    API->>DB: SELECT grades WHERE student_id=10 AND is_published=true
    API-->>S: Published scores
```

## S4 — Grade assignment submission

```mermaid
sequenceDiagram
    actor I as Instructor
    participant FE as Frontend
    participant API as Backend
    participant DB as MySQL

    I->>FE: Open Lab 3 submissions
    FE->>API: GET /api/teacher/assignments/{id}/submissions
    API->>DB: SELECT submissions WHERE assignment_id=...
    DB-->>API: list
    API-->>FE: rows
    FE-->>I: Show 18 submissions

    I->>FE: Click Alice's submission, score=95, feedback="..."
    FE->>API: PUT /api/teacher/assignment-submissions/42<br/>{score:95, feedback:"..."}
    API->>DB: UPDATE submission
    API->>DB: Recompute assignment component score for registration 9
    API-->>FE: 200
    FE-->>I: Moved to Graded tab
```
