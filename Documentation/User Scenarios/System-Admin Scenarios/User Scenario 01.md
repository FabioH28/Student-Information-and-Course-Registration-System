# System Admin — User Scenarios

---

## Scenario 1: Approving a pending account

**Actor:** David Chen (system admin)
**Precondition:** Emily Johnson registered and verified her email; her account is `status = pending_approval`.

**Steps:**
1. David opens `/admin/users`. A warning card shows "1 account awaiting approval".
2. He selects the role **Instructor** in Emily's pending row and clicks **Approve**.
   - `POST /users/{id}/approve { role: 'instructor' }`
3. Backend sets `role = instructor`, `status = active`, `is_active = true`.
4. `send_approval_email` fires (best-effort). Toast shows "User approved · Approval emailed to the user".

**Postcondition:** Emily can log in and is routed to the instructor portal.

**Alternate flow — refuse:** David clicks **Refuse**. `POST /users/{id}/refuse` sets `status = refused`, `is_active = false`, and emails the reason. The response carries `email_sent`.

---

## Scenario 2: Creating an account manually

**Actor:** David Chen
**Precondition:** A new finance officer needs access before self-registration is available.

**Steps:**
1. David clicks **New user** and fills full name, email, a temporary password and role **Finance Staff**.
2. Submits → `POST /users { email, password, role, full_name }`.
3. Backend stores the user as `status = active`, `is_first_login = true`.
4. `send_account_created_email` delivers the credentials.

**Postcondition:** The account appears immediately in the paginated user table; the user must change the password on first login.

---

## Scenario 3: Disabling an account

**Actor:** David Chen
**Precondition:** A student left the university and should lose access.

**Steps:**
1. David flips the **Active** toggle off on the student's row.
   - `PATCH /users/{id} { is_active: false }`
2. Backend deactivates the user and sends an account-update email.

**Postcondition:** The user can no longer authenticate (`get_current_user` rejects inactive users).

**Alternate flow — admin self-protection:** If David toggles an `admin` / `system_admin` row, the backend returns **403 "Admin accounts cannot be deactivated"** and the UI toggle is disabled, so administration can never be locked out.

---

## Scenario 4: Resetting a forgotten password

**Actor:** David Chen
**Precondition:** A user cannot log in and asks for a reset.

**Steps:**
1. David clicks **Reset** on the user's row → `POST /users/{id}/reset-password`.
2. Backend sets a default password hash and `is_first_login = true`.
3. `send_admin_password_reset_email` sends the temporary password.

**Postcondition:** The user logs in with the temporary password and is forced to change it.

---

## Scenario 5: Maintaining the course catalog and semesters

**Actor:** David Chen
**Precondition:** A new course is approved and a new term is starting.

**Steps:**
1. On `/admin/courses` David adds **CS305 — Advanced Algorithms** → `POST /courses`.
2. On `/admin/semesters` he marks **Spring 2026** active; the page first deactivates the previous active term, then activates the new one.

**Postcondition:** The catalog and the single active term stay consistent for every role.

---

## Scenario 6: Reviewing registrations and analytics

**Actor:** David Chen
**Precondition:** Students have submitted subject requests during the term.

**Steps:**
1. David opens `/admin/registrations` to approve or reject subject requests.
2. He opens `/admin/analytics` to review accounts-by-role, average GPA, active offerings, and collection-rate charts.

**Postcondition:** Long lists are paginated (10 rows/page by default), keeping the views responsive.
