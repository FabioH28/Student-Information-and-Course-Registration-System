# Instructor Role

The Instructor (also called Teacher in code) delivers course content, runs class sessions, evaluates students, and is the primary interface between the academic structure and the student body.

## Responsibilities

- View assigned course offerings and class rosters
- Set the weekly topic per course (drives student materials view)
- Upload weekly materials (files, links, text)
- Create assignments tied to a specific class session and week
- Grade assignment submissions and provide feedback
- Mark attendance per class session (with date-lock enforcement)
- Configure grade components (midterm / final / project / etc.) and weights
- Record component scores and publish final grades
- Read inbox + reply to student / staff messages
- View own profile and change password

## Screens (Frontend Routes)

| Route | Page |
|---|---|
| `/instructor` | Dashboard (assigned courses summary) |
| `/instructor/profile` | Profile |
| `/instructor/courses` | My Courses |
| `/instructor/courses/:offeringId` | Course Detail (materials/assignments/attendance/grades) |
| `/instructor/materials` | Weekly Materials manager |
| `/instructor/assignments` | Assignments manager |
| `/instructor/attendance` | Attendance marking |
| `/instructor/grades` | Grades management |
| `/instructor/student` | Students roster |
| `/instructor/inbox` | Inbox |
| `/instructor/change-password` | Change Password |

## Key API Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/teacher/courses` | Offerings assigned to me |
| `GET /api/teacher/sessions?courseId=` | Class sessions per offering (week + date) |
| `POST /api/teacher/course-offerings/{id}/weeks/{w}/topic` | Set weekly topic |
| `POST /api/teacher/course-offerings/{id}/materials` | Upload material |
| `POST /api/teacher/course-offerings/{id}/assignments` | Create assignment (requires `class_session_id`) |
| `PUT /api/teacher/assignment-submissions/{id}` | Score + feedback |
| `POST /attendance/offering/{id}/sessions` | Create attendance session |
| `POST /attendance/sessions/{sid}/records` | Per-student attendance records |
| `PUT /grades/offering/{o}/registration/{r}` | Upsert grade |
| `POST /grades/publish` | Publish grades (`{registration_ids}`) |
| `GET /messages/inbox` | Inbox |
| `POST /messages` | Send message |

## Permissions Matrix

| Action | Allowed? |
|---|---|
| View own profile / change password | ✅ |
| View own courses' rosters | ✅ |
| View other instructors' courses | ❌ |
| Mark attendance for assigned offerings | ✅ (current-date sessions) |
| Mark attendance for past-dated sessions | ❌ (date-locked) |
| Create assignment for assigned offerings | ✅ (requires real `class_session_id`) |
| Grade submissions | ✅ |
| Publish grades | ✅ |
| Approve registrations | ❌ |
| Create announcements / events | ❌ |
| Issue invoices | ❌ |
| Send direct message | ✅ (to anyone except finance/admin via UI restriction) |

## Business Rules

- **Date-locked attendance**: marking attendance for a past date returns 400 "Attendance for previous dates is locked". Workaround: create a fresh session via `POST /attendance/offering/{id}/sessions` with today's date.
- **Assignment-session link**: `POST .../assignments` requires `class_session_id` whose week matches the form's `week_number`. Get valid sessions+weeks from `GET /api/teacher/sessions?courseId=`.
- **Grade publish**: students only see grades where `is_published = true`.
- **Roster scope**: an instructor only sees students registered in offerings explicitly assigned to them.

## Related Diagrams

- [user-scenarios.md](user-scenarios.md)
- [use-cases.md](use-cases.md)
- [activity-diagrams.md](activity-diagrams.md)
- [sequence-diagrams.md](sequence-diagrams.md)
- [diagrams/](diagrams/) — rendered PNGs of every Mermaid diagram (auto-generated)
