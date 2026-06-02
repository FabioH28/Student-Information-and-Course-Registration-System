# Communications Staff — User Scenarios

---

## Scenario 1: Publishing a semester-start announcement

**Actor:** Rebecca Morgan (academic_staff role, communications duties)
**Precondition:** Spring 2026 semester starts in 5 days. Faculty deans approved the announcement text.

**Steps:**
1. Rebecca opens `/academic-staff/communications` → **Announcements** tab.
2. Clicks **New Announcement**.
3. Fills:
   - Title = "Spring 2026 starts Monday — schedule live now"
   - Body = "..."
   - Scope = "All students"
   - Publish at = now (or schedule for tomorrow 08:00)
4. Saves draft → `POST /communications/announcements { title, body, scope, publish_at }`.
5. Clicks **Publish** → `POST /communications/announcements/{id}/publish`.
6. `is_published` flips, `published_at = now()`.

**Postcondition:** Every student sees the announcement at `/student/news`.

---

## Scenario 2: Creating a campus event

**Actor:** Rebecca Morgan
**Precondition:** Career Fair scheduled for 2026-06-15.

**Steps:**
1. Opens `/academic-staff/communications` → **Events** tab → **New Event**.
2. Fills: Title = "2026 Career Fair", Date = 2026-06-15, Time = 10:00–16:00, Location = "Hall A", Capacity = 300, Registration window = open until 2026-06-13.
3. Submits → `POST /communications/events { ... }`.
4. Event appears in the **Events** list and on student `/student/news`.

**Postcondition:** Students can register. Backend rejects new registrations once `count >= capacity` or after `registration_close_at`.

---

## Scenario 3: Approving a club join request

**Actor:** Rebecca Morgan
**Precondition:** Alice submitted a join request for Robotics Club.

**Steps:**
1. Opens `/academic-staff/communications` → **Clubs** tab → **Membership requests**.
2. Sees Alice's request with **Pending** badge.
3. Reviews her profile (program, year). Clicks **Approve**.
   - `PATCH /communications/club-memberships/{id} { status: 'active' }`.
4. Alice gets a notification.

**Postcondition:** Alice's club card on `/student/clubs` switches from **Pending** to **Member**.

**Alternate flow — reject:** Rebecca picks **Reject** and enters reason "Club at capacity". Membership flips to `rejected`.

---

## Scenario 4: Broadcasting a system-wide message

**Actor:** Rebecca Morgan
**Precondition:** Library hours are changing temporarily; needs urgent broadcast.

**Steps:**
1. Opens Inbox → **New Message** → toggles **Broadcast** option.
2. Subject = "Library hours change — read by Friday".
3. Body = "..."
4. Sends → `POST /messages { broadcast: true, subject, body }`.
5. Backend permits because Rebecca's role ∈ `{academic_staff, system_admin}`.
6. Message row stored with `is_broadcast = true`, no recipient_id.

**Postcondition:** Every active user sees the broadcast in their inbox with a **Broadcast** badge.

---

## Scenario 5: Withdrawing a published announcement

**Actor:** Rebecca Morgan
**Precondition:** Announcement contained incorrect date.

**Steps:**
1. Opens **Announcements** tab → finds the published row.
2. Clicks **Withdraw** → confirmation.
3. `PATCH /communications/announcements/{id} { is_published: false, withdrawn_at: now }`.

**Postcondition:** Announcement disappears from `/student/news`. Audit log entry records who withdrew it and when. A revised version can be created and published separately.
