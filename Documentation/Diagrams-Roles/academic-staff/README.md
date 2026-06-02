# Academic Staff Role

Academic Staff owns the academic structure: catalog, offerings, timetable, rooms, registration approvals, and semester windows. They are the operational backbone of every academic term.

> The backend role identifier is `academic_staff`. The Communications Staff (see [../communications-staff/](../communications-staff/)) shares the same backend role but is documented separately for governance and acceptance review.

## Responsibilities

- Maintain the course catalog (create / edit / archive courses, prerequisites)
- Create and edit course offerings (course → program → semester → instructor)
- Manage the timetable (weekly entries, classroom assignment, conflict avoidance)
- Maintain buildings and rooms (classrooms, labs)
- Approve or reject student course selection requests
- Set / adjust semester windows (registration_open_at, drop_deadline, etc.)
- View all student grades (read-only across the faculty)
- View student records within scope (faculty-scoped via `StaffFacultyScope`)
- Receive and reply to messages from students and instructors

## Screens (Frontend Routes — both `/academic-staff` and `/staff` variants)

| Route | Page |
|---|---|
| `/academic-staff` | Dashboard |
| `/academic-staff/profile` | Profile |
| `/academic-staff/courses` | Course Catalog |
| `/academic-staff/offerings` | Manage Offerings (course → program → instructor) |
| `/academic-staff/staff-course-offerings` | Course Offerings listing |
| `/academic-staff/staff-timetable` | Timetable manager |
| `/academic-staff/staff-buildings-rooms` | Buildings & Rooms |
| `/academic-staff/registrations` | Registration approvals |
| `/academic-staff/grades` | Grades view (all faculty grades) |
| `/academic-staff/students` | Student records |
| `/academic-staff/inbox` | Inbox |
| `/academic-staff/change-password` | Change Password |

## Key API Endpoints

| Endpoint | Purpose |
|---|---|
| `GET/POST/PATCH /courses` + `/courses/catalog` | Course CRUD |
| `GET/POST/PATCH /offerings` | Offering CRUD |
| `GET /api/staff/offerings` | Faculty-scoped offerings |
| `GET /api/staff/instructors` | Pickers for assignment |
| `POST /api/staff/timetable-entries` | Schedule a class |
| `PATCH /api/staff/timetable-entries/{id}` | Reassign room / time |
| `POST /campus-resources/buildings` + `/classrooms` | Room inventory |
| `GET /api/staff/course-selections?status=requested` | Pending selections |
| `PATCH /api/staff/course-selections/{id}` | Approve / reject |
| `PATCH /semesters/{id}` | Adjust dates |
| `GET /grades/all` (faculty-scoped) | All grades within faculty |

## Permissions Matrix

| Action | Allowed? |
|---|---|
| Create / edit course | ✅ |
| Create / edit offering | ✅ |
| Assign instructor to offering | ✅ |
| Edit timetable | ✅ (no double-book of room/group) |
| Approve / reject registration requests | ✅ |
| Edit / publish grades | ✅ (corrective) |
| Place finance hold | ❌ (Finance Staff) |
| Issue invoice | ❌ |
| Send direct message | ✅ |
| Create announcement / event | ✅ (separated to Communications Staff docs) |

## Business Rules

- **Faculty scope.** Staff with `StaffFacultyScope` only see students, offerings, and selections within their assigned faculty.
- **Timetable integrity.** A `(classroom_id, weekday, start_time-end_time)` tuple is unique — no two offerings share a room/time. The UI surfaces conflicts before save.
- **Required vs elective selection.** Required-subject selection enforces strict program/year/prerequisite gating. Elective offerings bypass program/year (same-faculty only).
- **Drop deadline.** Set per semester via `PATCH /semesters/{id} { drop_deadline }`. Backend enforces against student drop attempts.
- **Approval gate.** Student selections enter as `requested`. Until staff updates to `approved`, no `registration` row exists.

## Related Diagrams

- [user-scenarios.md](user-scenarios.md)
- [use-cases.md](use-cases.md)
- [activity-diagrams.md](activity-diagrams.md)
- [sequence-diagrams.md](sequence-diagrams.md)
- [diagrams/](diagrams/) — rendered PNGs of every Mermaid diagram (auto-generated)
