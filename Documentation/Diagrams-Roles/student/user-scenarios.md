# Student — User Scenarios

Each scenario is a narrative walk-through of a real student task. Used both as acceptance fixtures and as training material.

---

## Scenario 1: First-time login and password change

**Actor:** Alice Smith (new student, account just provisioned by admin)
**Precondition:** Admin has created Alice's account with a temporary password. `is_first_login = true`.

**Steps:**
1. Alice opens `http://campus-portal/` in her browser.
2. Enters `alice.smith@cis.edu` and her temporary password.
3. Login succeeds. Backend returns `require_password_change: true`.
4. Frontend redirects Alice to `/student/change-password`.
5. Alice enters her current temporary password, a new password (≥8 chars), and confirms.
6. System hashes the new password (bcrypt), clears `is_first_login`, audit-logs `CHANGE_PASSWORD`.
7. Frontend redirects to `/student` (dashboard).

**Postcondition:** Alice has a personal password; she sees the student dashboard.

---

## Scenario 2: Registering for a required course

**Actor:** Alice Smith (Bachelor Year 1, Software Engineering, Spring 2026)
**Precondition:** Spring 2026 registration window is open. Alice has no finance hold. Prerequisite is satisfied.

**Steps:**
1. Alice goes to `/student/registration`.
2. The page shows offerings for her active semester (Spring 2026). The system filters to her program/year for required subjects.
3. Alice clicks **Add** on `CS101 – Introduction to Programming`.
4. Frontend posts `POST /api/student/course-selections { course_offering_id: 1 }`.
5. Backend validates: same semester, program/year match (for required), no prerequisite gap, no timetable conflict with already-approved registrations, no finance hold.
6. Selection row is created with `status = 'requested'`. Academic staff is notified.
7. UI shows the selection on `/student/course-selections` with **Pending** badge.

**Postcondition:** A pending selection awaits academic-staff approval. After approval, a `registration` row is created and CS101 appears on Alice's timetable.

**Alternate flow — rejection:** If a prerequisite is missing or capacity is full, the backend returns 400 with a human-readable reason; the UI shows the reason inline.

---

## Scenario 3: Dropping a course before the drop deadline

**Actor:** Alice Smith
**Precondition:** Alice has an active registration for `BIO110`. Drop deadline is 2026-06-21 (open).

**Steps:**
1. Alice goes to `/student/courses` and clicks **Drop** on BIO110.
2. Confirmation dialog ("Are you sure?") appears.
3. Alice confirms. Frontend posts `POST /registrations/drop { registration_id }`.
4. Backend validates: registration belongs to Alice, current date is on or before `semester.drop_deadline`.
5. Registration `status` is updated to `dropped`. Timetable entries for BIO110 disappear from Alice's view.
6. Audit log entry recorded.

**Postcondition:** BIO110 no longer counts toward Alice's load. GPA / progression recalculate accordingly.

**Alternate flow — after deadline:** Backend returns 400 "Drop deadline passed (2026-06-21)". UI surfaces the error without removing the row.

---

## Scenario 4: Submitting an assignment

**Actor:** Alice Smith
**Precondition:** Instructor John Carter has published assignment "Lab 3 — Recursion" for CS101 with due-date in 5 days.

**Steps:**
1. Alice goes to `/student/assignments` → sees Lab 3 in **Open** tab.
2. Clicks the row → assignment detail panel opens.
3. Pastes her submission text (or uploads a file) and clicks **Submit**.
4. Frontend posts to `POST /api/student/assignment-submissions { assignment_id, content, file_url }`.
5. Backend stores submission with `is_published = false` (instructor must grade first).
6. UI moves Lab 3 to **Submitted** tab.

**Postcondition:** Instructor sees the submission in their roster. When the instructor grades and publishes, Alice's grade view updates.

---

## Scenario 5: Sending a direct message to an instructor

**Actor:** Alice Smith
**Precondition:** Alice has a question about a lab.

**Steps:**
1. Alice clicks **Inbox** → **New Message**.
2. Compose modal opens; the **To** dropdown lists only instructors and academic staff (students excluded; finance and admin excluded — per backend `messages.py:96-102`).
3. Alice selects "Dr. John Carter", types subject and body, clicks **Send**.
4. Frontend posts `POST /messages { recipient_id, subject, body, broadcast: false }`.
5. Backend writes a row with `recipient_id = John's user_id`.
6. Confirmation: "Message sent to Dr. John Carter."

**Postcondition:** Message appears in Alice's **Sent** tab and in Dr. Carter's inbox (with unread badge).

---

## Scenario 6: Viewing risk warnings

**Actor:** Alice Smith
**Precondition:** Alice has 30%+ absence in one offering and one published grade below 60.

**Steps:**
1. Alice opens `/student/risk`.
2. System composes the page client-side from `progressionApi.me + gradesApi.my + attendance + available-subjects`.
3. Risk page renders two sections:
   - **Attendance risk**: courses with absence ≥ 25% (exam-blocking threshold) or already exam-blocked.
   - **Grades at risk**: published grades below the pass mark.
4. Each card links to the relevant course detail page.

**Postcondition:** Alice is informed of remediation paths (retake, attendance recovery).

---

## Scenario 7: Joining a campus club

**Actor:** Alice Smith
**Precondition:** Robotics Club is open for membership.

**Steps:**
1. Alice goes to `/student/clubs` and clicks **Join** on Robotics Club.
2. Frontend posts `POST /clubs/{id}/join`.
3. Backend creates a `club_membership` row with `status = 'requested'`.
4. Communications staff is notified and approves/rejects from `/staff/communications`.
5. On approval, Alice's club card shows **Member**.

**Postcondition:** Alice is a member; she can register for club events.
