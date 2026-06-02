# Academic Staff — User Scenarios

---

## Scenario 1: Approving a student's course selection

**Actor:** Rebecca Morgan (academic staff, FCSIT)
**Precondition:** Alice Smith submitted a selection request for CS220 (elective, same faculty).

**Steps:**
1. Rebecca opens `/academic-staff/registrations`.
2. Filters to **Pending** + Spring 2026 → sees Alice's request.
3. Reviews student transcript inline (current GPA, semester load, prereqs).
4. No conflicts found. Clicks **Approve**.
   - `PATCH /api/staff/course-selections/{id} { status: 'approved' }`
5. Backend updates the selection and creates a `registrations` row with `status = 'active'`.
6. Alice gets a notification.

**Postcondition:** CS220 appears on Alice's timetable and on her **My Courses** page.

**Alternate flow — reject:** Rebecca sees Alice already at 30 credits (overload). She clicks **Reject** and enters reason "Exceeds maximum credit load". Selection moves to `status = 'rejected'`.

---

## Scenario 2: Creating a new offering for Spring 2026

**Actor:** Rebecca Morgan
**Precondition:** New course "CS305 — Advanced Algorithms" exists in catalog (created previously). Spring 2026 semester exists. Dr. John Carter teaches algorithms.

**Steps:**
1. Rebecca opens `/academic-staff/offerings`.
2. Clicks **New Offering**.
3. Form: Course = CS305, Semester = Spring 2026, Program = BSE (Software Engineering), Instructor = John Carter, Group = "Group A", Capacity = 30, Schedule = Tuesday 09:00–11:50 in Room A2.
4. Submits → `POST /offerings`.
5. Backend validates: course exists, semester active, instructor role = teacher, no timetable conflict for (room A2, Tue 09:00).
6. Offering created. Timetable entries auto-generated for each week of Spring 2026.

**Postcondition:** CS305 appears in the catalog browse for eligible students. Instructor sees it on `/instructor/courses`.

---

## Scenario 3: Adjusting the drop deadline

**Actor:** Rebecca Morgan
**Precondition:** Many students requested an extension; original `drop_deadline` was 2026-05-30.

**Steps:**
1. Rebecca opens `/staff/semester-windows` (or the equivalent `/academic-staff/semester-windows`).
2. Selects Spring 2026 → sees current windows.
3. Edits **Drop deadline** from 2026-05-30 → 2026-06-21.
4. Submits → `PATCH /semesters/2 { drop_deadline: '2026-06-21' }`.
5. Backend updates the row.

**Postcondition:** Until 2026-06-21, the backend will accept `POST /registrations/drop` requests. Past that date, drops return 400.

---

## Scenario 4: Resolving a timetable conflict

**Actor:** Rebecca Morgan
**Precondition:** New offering for IT201 was scheduled Tuesday 10:00 in Room B3, conflicting with existing CS101 in the same room/time.

**Steps:**
1. Rebecca opens `/academic-staff/staff-timetable`.
2. UI shows IT201 entry with a red conflict banner.
3. Rebecca clicks the entry → edit dialog.
4. Picks a different room (Room B4) → submits.
   - `PATCH /api/staff/timetable-entries/{id} { classroom_id: ... }`
5. Backend re-validates uniqueness, accepts.

**Postcondition:** No room/time double-booking. Both offerings remain scheduled. Affected students see the updated room on their timetable.

---

## Scenario 5: Creating a new course in the catalog

**Actor:** Rebecca Morgan
**Precondition:** Faculty board approved adding "DS210 — Statistics for Data Science" to the BDS program.

**Steps:**
1. Rebecca opens `/academic-staff/courses`.
2. Clicks **New Course**.
3. Enters: code = DS210, title = Statistics for Data Science, credits = 6, department = Data Science, prereqs = [DS110].
4. Submits → `POST /courses { ... }`.
5. Backend stores course. UI lists it under the Data Science department.
6. Course is now available for offering creation.

**Postcondition:** DS210 exists in catalog. No offerings yet — those are created separately for each term.

---

## Scenario 6: Adding a new classroom

**Actor:** Rebecca Morgan
**Precondition:** Facilities team added a new lab room.

**Steps:**
1. Rebecca opens `/staff/buildings-rooms`.
2. Picks Building 3 → clicks **New Room**.
3. Enters: code = "Lab 3-205", type = "lab", capacity = 24.
4. Submits → `POST /campus-resources/classrooms { ... }`.

**Postcondition:** Room 3-205 appears in pickers when creating new timetable entries / offerings.
