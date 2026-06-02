# Student Role

The Student is the primary end-user of CIS. Each student is enrolled in one program at a faculty, and progresses through semesters by registering for course offerings, attending classes, submitting work, and receiving grades.

## Responsibilities

- View personal academic profile, GPA, and progression status
- Browse the course catalog and view available subjects each semester
- Submit course-selection requests (academic-staff approves)
- Add and drop registrations within open enrollment / drop windows
- View weekly timetable derived from registered offerings
- Access weekly materials uploaded by instructors
- Submit assignments and review feedback / grades
- View personal attendance and absence percentage
- View published grades and risk warnings
- Receive notifications and messages (inbox)
- Send direct messages to instructors and academic staff
- Join campus clubs and register for campus events
- View finance statement (invoices, balance, holds)

## Screens (Frontend Routes)

| Route | Page |
|---|---|
| `/student` | Dashboard |
| `/student/profile` | Profile |
| `/student/courses` | My Courses |
| `/student/courses/:offeringId` | Course Detail (materials, assignments, attendance, grades per course) |
| `/student/registration` | Course Registration |
| `/student/available-subjects` | Available Subjects (per semester) |
| `/student/course-selections` | Selected Subjects (pending / approved selections) |
| `/student/timetable` | Weekly Timetable |
| `/student/materials` | Course Materials |
| `/student/assignments` | Assignments |
| `/student/attendance` | Attendance Summary |
| `/student/grades` | Grades + GPA |
| `/student/news` | Announcements & Events |
| `/student/clubs` | Clubs Directory |
| `/student/inbox` | Notifications + Direct Messages |
| `/student/risk` | Risk Warnings (failing grades / high absence) |
| `/student/chatbot` | AI Assistant |
| `/student/change-password` | Change Password |

## Key API Endpoints

| Endpoint | Purpose |
|---|---|
| `POST /auth/login` | Sign in |
| `POST /auth/change-password` | Change own password |
| `GET /api/student/timetable` | Weekly schedule |
| `GET /api/student/courses` | Registered courses |
| `GET /api/student/courses/{offering}/weeks/{w}/materials` | Week-scoped topic, materials, tasks |
| `POST /api/student/course-selections` | Submit selection request |
| `POST /registrations/drop` | Drop a registration (within deadline) |
| `GET /grades/me` | Published grades |
| `GET /messages/inbox` | Inbox |
| `POST /messages` | Send direct message (to instructor or academic staff only) |
| `GET /messages/contacts` | List of valid recipients |
| `GET /notifications` | Notification list |

## Permissions Matrix

| Action | Allowed? |
|---|---|
| View / edit own profile | ✅ |
| Change own password | ✅ |
| View own grades | ✅ (published only) |
| View other students' grades | ❌ |
| Self-register for offerings | ✅ (subject to rules) |
| Approve registrations | ❌ |
| Edit / publish grades | ❌ |
| Send direct message to instructor / academic staff | ✅ |
| Send direct message to other student | ❌ |
| Send direct message to finance / admin | ❌ |
| Create announcement / event | ❌ |
| View finance balance (own) | ✅ |
| Issue invoices | ❌ |

## Related Diagrams

- [user-scenarios.md](user-scenarios.md) — task-oriented walkthroughs
- [use-cases.md](use-cases.md) — use case diagram
- [activity-diagrams.md](activity-diagrams.md) — workflow diagrams
- [sequence-diagrams.md](sequence-diagrams.md) — system interaction diagrams
- [diagrams/](diagrams/) — rendered PNGs of every Mermaid diagram (auto-generated)
