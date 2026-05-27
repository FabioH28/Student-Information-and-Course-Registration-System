# Academic Staff — Use Cases

## Use Case Diagram

```mermaid
flowchart LR
    Staff((Academic Staff))

    subgraph Catalog["Catalog"]
      UC1[Create course]
      UC2[Edit course / prereqs]
      UC3[Archive course]
    end

    subgraph Offerings["Offerings"]
      UC4[Create offering]
      UC5[Assign instructor]
      UC6[Edit offering details]
    end

    subgraph Timetable["Timetable & Rooms"]
      UC7[Add timetable entry]
      UC8[Edit timetable entry]
      UC9[Manage buildings]
      UC10[Manage classrooms / labs]
    end

    subgraph Registration["Registrations"]
      UC11[Review pending selection]
      UC12[Approve selection]
      UC13[Reject selection w/ reason]
    end

    subgraph Term["Semester windows"]
      UC14[Adjust registration_open]
      UC15[Adjust drop_deadline]
      UC16[Adjust total_weeks]
    end

    subgraph Records["Records"]
      UC17[View student records]
      UC18[View all grades faculty-scoped]
    end

    subgraph Comm["Communication"]
      UC19[Read inbox]
      UC20[Reply / send message]
    end

    Staff --> UC1
    Staff --> UC2
    Staff --> UC3
    Staff --> UC4
    Staff --> UC5
    Staff --> UC6
    Staff --> UC7
    Staff --> UC8
    Staff --> UC9
    Staff --> UC10
    Staff --> UC11
    Staff --> UC12
    Staff --> UC13
    Staff --> UC14
    Staff --> UC15
    Staff --> UC16
    Staff --> UC17
    Staff --> UC18
    Staff --> UC19
    Staff --> UC20

    UC4 -.include.-> UC1
    UC4 -.include.-> UC7
    UC12 -.creates.-> Reg[registrations row]
    UC8 -.uniqueness.-> Rule[room/weekday/time unique]
```

## Use Case Descriptions

### UC1 — Create course
**Main flow:** `POST /courses { code, title, credits, department_id, prerequisites }`.

### UC4 — Create offering
**Preconditions:** Course exists, semester exists, instructor has teacher role.
**Main flow:** `POST /offerings { course_id, semester_id, program_id, instructor_id, group_name, capacity, schedule, room }`.
**Side effect:** Per-week timetable entries are generated.

### UC7 — Add timetable entry
**Preconditions:** No `(classroom_id, weekday, start_time-end_time)` conflict.
**Main flow:** `POST /api/staff/timetable-entries { offering_id, weekday, start_time, end_time, classroom_id }`.

### UC11 — Review pending selection
**Main flow:** `GET /api/staff/course-selections?status=requested` returns the queue.

### UC12 — Approve selection
**Main flow:** `PATCH /api/staff/course-selections/{id} { status: 'approved' }`.
**Side effect:** Backend creates a `registrations` row.

### UC13 — Reject selection
**Main flow:** `PATCH .../{id} { status: 'rejected', reason: '...' }`.

### UC14 / UC15 / UC16 — Adjust semester windows
**Main flow:** `PATCH /semesters/{id} { registration_open_at, drop_deadline, total_weeks }`.

### UC18 — View all grades (faculty-scoped)
**Main flow:** `GET /grades/all` filters by staff's faculty scope.

### UC19 — Read inbox
**Main flow:** Same as Student / Instructor — `GET /messages/inbox`.

### UC20 — Send / reply
**Main flow:** `POST /messages` (any recipient role; contacts dropdown includes everyone except self).
