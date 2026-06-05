# Student Access Level Module Comments

These comments describe what each copied module does in the student access level. The copied code is for presentation only; the real app uses the original files outside this folder.

## Frontend Access And Layout

`frontend/src/components/RequireAuth.tsx`
- Protects route groups by checking whether a user and token exist.
- Compares the signed-in user's canonical role with the required role.
- Redirects unauthenticated users to login and wrong-role users to their own home page.

`frontend/src/lib/authRoles.ts`
- Central frontend helper for role aliases and home routes.
- Converts aliases such as `teacher`, `staff`, and `admin` into canonical role names.
- Gives each role its correct landing page.

`frontend/src/layouts/StudentLayout.tsx`
- Defines the student workspace shell.
- Renders the student sidebar, top bar, page title, and nested page content.
- Gives all student pages a consistent layout without repeating structure.

`frontend/src/components/layout/AppSidebar.tsx`
- Contains the `studentNav` navigation object used by the student sidebar.
- Maps student features to paths and icons.
- Also contains other role navigation, but the student section is the part used by `StudentLayout`.

`frontend/src/lib/api.ts`
- Provides typed API wrapper objects used by student pages.
- Student-related wrappers include `studentsApi`, `offeringsApi`, `registrationsApi`, `gradesApi`, `progressionApi`, `attendanceApi`, `materialApi`, `assignmentsApi`, `courseSelectionApi`, `financeApi`, and `notificationsApi`.
- Keeps pages from manually building every HTTP request.

## Frontend Student Pages

`frontend/src/pages/student/StudentDashboard.tsx`
- Main student home page.
- Shows academic overview data such as GPA, active courses, timetable, notifications, attendance risk, and recent grades.
- Links students to common actions like registration, materials, assignments, and risk assessment.

`frontend/src/pages/student/StudentProfile.tsx`
- Lets students view their profile and limited personal information.
- Allows self-service updates for editable fields only.
- Displays student code, program/academic details, and progression summary.

`frontend/src/pages/student/StudentMyCoursesPage.tsx`
- Lists the student's enrolled courses.
- Links each course to the course detail page.
- Gives quick access to materials and grades for each course.

`frontend/src/pages/student/StudentCourseDetailPage.tsx`
- Shows one enrolled course in detail.
- Provides tabs for materials, assignments, attendance, and grades.
- Uses student-specific backend endpoints so the page only shows content for enrolled courses.

`frontend/src/pages/student/CourseRegistration.tsx`
- Shows active registrations and semester/drop deadline information.
- Lets students drop eligible registered courses.
- Guides students toward the available-subjects request workflow.

`frontend/src/pages/student/AvailableSubjectsPage.tsx`
- Shows subjects available for the student's program/year context.
- Displays whether each subject can be selected.
- Shows blocked reasons when the backend policy says a course is not eligible.

`frontend/src/pages/student/CourseSelectionPage.tsx`
- Shows the student's submitted course selection requests.
- Lets students drop/cancel their own selected subject requests.
- Reflects staff approval/rejection state.

`frontend/src/pages/student/Timetable.tsx`
- Shows the student's weekly schedule from registered offerings.
- Uses timetable entries returned from the student-specific API.
- Deduplicates and lays out class blocks for easier scanning.

`frontend/src/pages/student/CourseMaterialsPage.tsx`
- Shows weekly materials for the student's selected/enrolled course.
- Only uses student material endpoints that return published, visible material.
- Supports viewing and downloading allowed course files.

`frontend/src/pages/student/StudentAssignmentsPage.tsx`
- Shows published assignments for the student's enrolled courses.
- Lets students submit assignment text and/or files.
- Refreshes assignment data after submission.

`frontend/src/pages/student/AttendanceViewPage.tsx`
- Shows the student's attendance records.
- Displays absence status and exam eligibility context.
- Uses only the current student's attendance data.

`frontend/src/pages/student/GradesPage.tsx`
- Shows the student's published grades.
- Displays grade totals, GPA/progression data, and pass/fail status.
- Does not show unpublished grades.

`frontend/src/pages/student/RiskWarning.tsx`
- Builds a risk view from student grades, attendance, courses, and progression data.
- Highlights absence risk, low GPA, failed grades, and borderline scores.
- Helps explain academic standing to the student.

`frontend/src/pages/student/StudentNews.tsx`
- Shows announcements and campus events visible to the student.
- Lets students register for eligible events.
- Uses communication feed endpoints.

`frontend/src/pages/student/StudentClubs.tsx`
- Shows club directory, current memberships, events, and join requests.
- Lets students submit club join requests.
- Uses student-only club routes.

`frontend/src/pages/student/StudentInbox.tsx`
- Shows notifications, inbox messages, sent messages, and contacts.
- Lets students mark items as read and send direct messages.
- Student contacts are limited by backend policy to instructors and academic staff.

`frontend/src/pages/student/Chatbot.tsx`
- Builds a student support assistant context from live student academic data.
- Uses profile, grades, courses, timetable, attendance, registrations, notifications, and progression.
- Acts as a support feature, not as an authorization boundary.

`frontend/src/pages/student/ChangePasswordPage.tsx`
- Lets a signed-in student change their password.
- Validates password length and confirmation before sending the request.
- Reused by other roles too, but it appears in the student navigation.

## Backend Security And Student Routes

`backend/src/utils/security.py`
- Handles password hashing, JWT creation/decoding, current-user lookup, role canonicalization, and role guards.
- `require_roles("student")` is the main backend gate for student-only endpoints.

`backend/src/routes/students.py`
- Provides `/students/me` for student profile self-service.
- Students can view their own profile and update limited personal fields.
- Staff/admin-only student management is separated from student self-service.

`backend/src/routes/registrations.py`
- Provides student registration read/drop behavior.
- `/registrations/me` returns only the current student's registrations.
- Direct registration creation is disabled in favor of staff-approved course selection.

`backend/src/routes/course_selections.py`
- Implements the student subject request workflow.
- Checks academic structure, study level, deadlines, capacity, prerequisites, credit limits, already-passed courses, and timetable conflicts.
- Stores each student's selection/request state.

`backend/src/routes/course_offerings.py`
- Provides several `/api/student/...` endpoints for my courses, timetable, course details, attendance, exam eligibility, grades, and progression.
- Student-specific endpoints filter by the authenticated student's active registrations.
- Also contains non-student offering logic because the original module is shared.

`backend/src/routes/materials.py`
- Provides student material and assignment endpoints.
- Students can only access materials and assignments for enrolled offerings.
- Content must be published and visible to students.
- Also handles assignment submission behavior.

`backend/src/routes/grades.py`
- Provides student grade viewing endpoints.
- Students see only their own published grades.
- Instructor/staff grading behavior is separate and role-protected.

`backend/src/routes/attendance.py`
- Provides student attendance viewing endpoints.
- Students see only their own attendance records.
- Instructor attendance marking is protected separately.

`backend/src/routes/finance.py`
- Provides `/finance/invoices/me` for a student to see only their own invoices.
- Finance staff/admin invoice and hold management is protected separately.

`backend/src/routes/messages.py`
- Provides inbox, sent messages, contacts, send message, and mark-read behavior.
- Students can message only instructors and academic staff.
- Broadcast messaging is blocked for students.

`backend/src/routes/clubs.py`
- Provides student club directory and join request behavior.
- Requires the current user to be a student.
- Prevents duplicate active/pending memberships.

`backend/src/routes/communications.py`
- Provides student-visible announcements/events feed behavior.
- Staff/admin manage announcements and events.
- Students consume the feed and can register for eligible events through communication routes.

`backend/src/routes/offerings.py`
- Provides offering list/detail behavior used by some frontend pages.
- Student-specific access is stronger in `/api/student/...`; this shared module is included because student pages can reference offerings.

`backend/src/routes/notifications.py`
- Provides notification listing and read-state behavior.
- Student inbox/dashboard use notifications tied to the current user.

## Backend Models

`backend/src/models/user.py`
- Account identity object.
- Stores email, password hash, role, account status, and relationships to student/instructor profiles and notifications.

`backend/src/models/student.py`
- Core student profile object.
- Stores student code, personal details, program, degree level, semester, GPA, and status.
- Connects to registrations, invoices, holds, and attendance records.

`backend/src/models/registration.py`
- Links a student to a course offering.
- Stores registration status and creates the path to grades.

`backend/src/models/course_selection.py`
- Stores student course selection requests and prerequisites.
- Supports the staff-approved enrollment workflow.

`backend/src/models/course.py`
- Course catalog object.
- Stores course code/name/credits and prerequisite relationship.

`backend/src/models/offering.py`
- Scheduled course instance.
- Connects a course to instructor, semester, program/faculty, capacity, timetable, registrations, materials, and tasks.

`backend/src/models/timetable.py`
- Stores scheduled class meeting entries.
- Student timetable endpoints return entries for active student offerings.

`backend/src/models/course_material.py`
- Stores materials, weekly tasks, weekly topics, assignments, and assignment submissions.
- Student access depends on enrollment plus published/visible flags.

`backend/src/models/attendance.py`
- Stores attendance sessions and attendance records.
- Student views are filtered to the current student's records.

`backend/src/models/grade.py`
- Stores grade records and grade configuration.
- Student grade access depends on the grade being published.

`backend/src/models/finance.py`
- Stores invoices, payments, holds, and finance staff faculty scope.
- Student invoice access is limited to the current student.

`backend/src/models/notification.py`
- Stores user notifications.
- Student dashboard and inbox use these records.

`backend/src/models/message.py`
- Stores direct messages and broadcasts.
- Student messaging permissions are enforced in the route layer.

`backend/src/models/club.py`
- Stores clubs, categories, and memberships.
- Student club page uses this data for directory, membership, and join requests.

`backend/src/models/campus_event.py`
- Stores campus events and event registrations.
- Student news/club pages show eligible events.

`backend/src/models/ai_chat.py`
- Stores AI chat sessions and messages.
- Related to the student chatbot feature.

## Backend Schemas

`backend/src/schemas/student.py`
- Defines student profile API output and allowed student/admin update shapes.

`backend/src/schemas/registration.py`
- Defines registration request/response data.

`backend/src/schemas/grade.py`
- Defines grade response and grade input/configuration data.

`backend/src/schemas/attendance.py`
- Defines attendance session and attendance record response data.

`backend/src/schemas/finance.py`
- Defines invoice, payment, and hold API data shapes.

`backend/src/schemas/course_material.py`
- Defines material, weekly topic, task, assignment, and submission API data shapes.

