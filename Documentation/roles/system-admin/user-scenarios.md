# System Admin — User Scenarios

---

## Scenario 1: Provisioning a new student account

**Actor:** System Administrator (`admin@cis.edu`)
**Precondition:** New student admitted to BSE program, ready for Spring 2026.

**Steps:**
1. Admin opens `/admin/users` → clicks **Create User**.
2. Form: email = `new.student@cis.edu`, full_name = "Jane Walker", role = "student", program_id = BSE, faculty_id = FCSIT, degree_level = "Bachelor".
3. Optional: temporary password (auto-generated if blank).
4. Submits → `POST /users { ... }`.
5. Backend:
   - Hashes the temp password with bcrypt
   - Creates `users` + `students` rows
   - Sets `is_first_login = true`
   - Sends notification + email (if SMTP configured)
   - Audit log entry `CREATE_USER`
6. Admin receives the temp password to share securely with the student.

**Postcondition:** Jane can log in with the temp password and will be redirected to `/change-password` immediately. Once she changes it, she gets normal access.

---

## Scenario 2: Resetting a user's password

**Actor:** Admin
**Precondition:** Student forgot her password and the email-based reset isn't reaching her institutional inbox.

**Steps:**
1. Admin opens `/admin/users` → searches "Alice Smith" → clicks her row.
2. Clicks **Reset Password**.
3. Confirmation dialog with new temporary password displayed.
4. `POST /users/{id}/reset-password`.
5. Backend:
   - Generates new temp password
   - Re-hashes user.password_hash
   - Sets `is_first_login = true`
   - Audit log `RESET_PASSWORD`
6. Admin securely shares the temp password with Alice.

**Postcondition:** Alice's next login forces a password change.

---

## Scenario 3: Suspending a user

**Actor:** Admin
**Precondition:** Account compromised; need to immediately block access.

**Steps:**
1. Opens user detail page → clicks **Suspend**.
2. Enters reason "Compromised credentials — pending investigation".
3. `PATCH /users/{id} { is_active: false, status: 'suspended' }`.
4. Backend:
   - Sets `is_active = false`, `status = 'suspended'`
   - Invalidates existing sessions (token still valid until expiry; can be paired with JWT secret rotation for hard kill)
   - Audit log `SUSPEND_USER`

**Postcondition:** Subsequent logins return 401. Any existing JWTs return 401 because routes recheck `user.is_active` on every request.

---

## Scenario 4: Creating a new semester

**Actor:** Admin
**Precondition:** Spring 2026 ending; Fall 2026 needs to be set up.

**Steps:**
1. Opens `/admin/semesters` → **New Semester**.
2. Fills: name = "Fall 2026", code = "F26", start_date = 2026-09-01, end_date = 2026-12-22, total_weeks = 14, registration_open_at = 2026-07-15, drop_deadline = 2026-10-10.
3. Submits → `POST /semesters { ... }`.

**Postcondition:** Fall 2026 visible in pickers. Academic staff can begin creating offerings for the new term.

---

## Scenario 5: Reviewing system analytics

**Actor:** Admin
**Steps:**
1. Opens `/admin/analytics`.
2. Page renders tiles:
   - Total users (active, pending, suspended)
   - Total students by faculty
   - Active semesters
   - Total billed / collected (finance summary across all faculties)
   - Engagement (logins last 30 days, message volume, club activity)
3. Drills into anomalies (e.g. spike in failed logins → security review).

**Postcondition:** Admin has institutional KPIs at a glance. Identified anomalies trigger further action (e.g. user investigation, support ticket).

---

## Scenario 6: Adjusting system settings

**Actor:** Admin
**Precondition:** Need to extend JWT expiry from 8h to 12h for a workshop event where staff stay logged in.

**Steps:**
1. Opens `/admin/settings`.
2. Edits **JWT expiry minutes** from 480 → 720.
3. Validates against safe range (60..1440).
4. Saves → `PATCH /admin/settings { JWT_EXPIRE_MINUTES: 720 }`.
5. Audit log entry.

**Postcondition:** New tokens issued after this change live 12h. Existing tokens are unaffected.
