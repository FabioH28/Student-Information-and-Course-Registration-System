# Instructor — User Scenarios

---

## Scenario 1: Setting up Week 12 of CS101

**Actor:** Dr. John Carter (instructor of CS101 — Intro to Programming)
**Precondition:** Spring 2026 semester active. CS101 is offering ID 1 assigned to John. Week 12 of the semester is the current week.

**Steps:**
1. John logs in; dashboard shows CS101.
2. Opens `/instructor/courses/1` (Course Detail).
3. Switches to **Week 12** tab.
4. Clicks **Edit Topic**, enters "Recursion and Tail Calls", saves.
   - `POST /api/teacher/course-offerings/1/weeks/12/topic { title, description }`
5. Uploads two materials: lecture slides PDF and example code link.
   - `POST /api/teacher/course-offerings/1/materials { week_number: 12, file_url, link_url, status: published }`
6. Creates assignment "Lab 3 — Recursion":
   - Selects class_session 22 (week 12) from the picker (loaded via `GET /api/teacher/sessions?courseId=1`).
   - Sets `start_at = now`, `end_at = now + 5 days`.
   - Submits → `POST /api/teacher/course-offerings/1/assignments { class_session_id: 22, week_number: 12, ... }`.

**Postcondition:** Week 12 topic, materials, and Lab 3 are visible to enrolled students at `/student/courses/1/weeks/12`.

---

## Scenario 2: Marking attendance for today's class

**Actor:** Dr. John Carter
**Precondition:** CS101 has a class session scheduled today.

**Steps:**
1. John opens `/instructor/attendance`.
2. Picks CS101 → today's session is listed.
3. Clicks **Mark Attendance** → roster appears with toggle (Present/Absent/Late) per student.
4. Marks Alice = Present, Brian = Absent, Daniel = Late.
5. Clicks **Save**.
   - `POST /attendance/sessions/{sid}/records [{student_id, status}, ...]`
6. Backend writes attendance_records; each student's absence-percentage is recomputed.

**Postcondition:** Students see their attendance status on `/student/attendance`. Brian's absence count increases — if ≥ 25% he sees a risk warning.

**Alternate flow — past date:** If John tries to mark a session from yesterday or earlier (e.g. someone forgot), bulk-save returns 400 "Attendance for previous dates is locked". He must create a fresh session via `POST /attendance/offering/1/sessions` with today's date.

---

## Scenario 3: Grading submitted assignments

**Actor:** Dr. John Carter
**Precondition:** 18 students submitted Lab 3.

**Steps:**
1. John opens `/instructor/courses/1` → **Assignments** tab → **Lab 3** → **Submissions**.
2. Sees list of 18 submissions sorted by submitted_at.
3. Clicks Alice's submission → reads content, enters score = 95, feedback = "Excellent recursion clarity".
4. Clicks **Save**.
   - `PUT /api/teacher/assignment-submissions/{id} { score: 95, feedback: "..." }`
5. Repeats for all 18 submissions.
6. When ready to publish: opens **Grades** tab, picks Lab 3 grade column, clicks **Publish**.
   - `POST /grades/publish { registration_ids: [...] }`

**Postcondition:** Alice sees her Lab 3 score on `/student/grades`. Component score contributes to her cumulative grade per the configured weights.

---

## Scenario 4: Configuring grade components for CS101

**Actor:** Dr. John Carter
**Precondition:** No grade configuration exists yet for CS101's Spring 2026 offering.

**Steps:**
1. John opens `/instructor/grades` → picks CS101.
2. Default configuration row exists (auto-created on first visit). John adjusts:
   - midterm = 25, final_exam = 35, project = 20, assignment = 10, quiz = 5, attendance = 5, participation = 0, lab = 0.
3. Total = 100 — system validates.
4. Saves.
   - `PUT /grades/config/offering/1 { ... }`

**Postcondition:** All grade entries use these weights. Component score validation rejects entries that exceed configured maxima.

---

## Scenario 5: Replying to a student message

**Actor:** Dr. John Carter
**Precondition:** Alice sent John a message "Question about Lab 3 recursion limit".

**Steps:**
1. John opens `/instructor/inbox` — sees Alice's message with **Unread** badge.
2. Clicks the message; content opens.
3. Clicks **Reply** → compose modal pre-fills Alice's name in **To** and `Re: Question about Lab 3 recursion limit` in subject.
4. Types his answer, clicks **Send**.
   - `POST /messages { recipient_id: 10, subject, body, broadcast: false }`
5. Marks Alice's original message as read.
   - `PUT /messages/{id}/read`

**Postcondition:** Alice sees John's reply in her inbox.

---

## Scenario 6: Locked attendance and recovery

**Actor:** Dr. John Carter
**Precondition:** John forgot to mark attendance for last Tuesday's class.

**Steps:**
1. John opens `/instructor/attendance` and selects last Tuesday's session.
2. He attempts to mark students — bulk-save returns "Attendance for previous dates is locked".
3. John reads the inline help text explaining the date lock.
4. He creates a fresh ad-hoc session for today:
   - `POST /attendance/offering/1/sessions { session_date: today, ... }`
5. Marks the (still missing) absences in this new session.

**Postcondition:** Absence record is corrected through a new audit-trailed session, preserving the historical record of the original session.
