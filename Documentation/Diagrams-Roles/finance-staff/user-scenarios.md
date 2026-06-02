# Finance Staff — User Scenarios

---

## Scenario 1: Issuing a tuition invoice

**Actor:** FCSIT Finance Officer (`finance.csit@cis.edu`)
**Precondition:** Alice Smith is enrolled for Spring 2026. Tuition due is ALL 80,000.

**Steps:**
1. Officer opens `/finance-staff/invoices` → **New Invoice**.
2. Picks student Alice Smith (search by name or student code).
3. Enters: item = "Spring 2026 Tuition", amount = 80,000.00, due_date = 2026-06-30.
4. Submits → `POST /finance/invoices { student_id, amount, item, due_date }`.
5. Backend creates invoice with `status = 'unpaid'`.

**Postcondition:** Alice sees the invoice on her student finance summary.

---

## Scenario 2: Recording a payment

**Actor:** FCSIT Finance Officer
**Precondition:** Alice paid ALL 40,000 by bank transfer; reference number provided.

**Steps:**
1. Officer opens `/finance-staff/payments` → **Record Payment**.
2. Picks Alice's invoice (or by reference).
3. Enters: amount = 40,000, method = "bank_transfer", reference = "TXN-5429".
4. Submits → `POST /finance/payments { invoice_id, amount, method, reference }`.
5. Backend inserts payment; invoice `balance` recomputed.

**Postcondition:** Invoice shows partially paid; outstanding = 40,000.

---

## Scenario 3: Placing a hold for overdue balance

**Actor:** FCSIT Finance Officer
**Precondition:** Student Brian Taylor has an invoice 30+ days overdue.

**Steps:**
1. Officer opens `/finance-staff/students` → finds Brian → clicks his row.
2. Account detail shows outstanding ALL 60,000, last payment 45 days ago.
3. Clicks **Place Hold** → enters reason = "Overdue balance (>30 days)".
4. `POST /finance/holds { student_id, reason }`.

**Postcondition:** Brian sees a "Finance hold active" banner on his dashboard. Backend rejects new course-selection requests from Brian with 400 "Finance hold active".

---

## Scenario 4: Releasing a hold after payment

**Actor:** FCSIT Finance Officer
**Precondition:** Brian paid in full. Hold is still active.

**Steps:**
1. Officer records the payment (Scenario 2).
2. Opens `/finance-staff/holds` → finds Brian's active hold.
3. Clicks **Release** → confirmation.
4. `PATCH /finance/holds/{id} { released_at: now, released_by_user_id: me }`.
5. Audit log entry recorded.

**Postcondition:** Brian's hold banner clears. He can register for courses again.

---

## Scenario 5: Reviewing faculty dashboard

**Actor:** FCSIT Finance Officer (start of month)
**Steps:**
1. Officer opens `/finance-staff` dashboard.
2. Tiles show:
   - Total billed (faculty-scoped)
   - Total collected
   - Outstanding (billed − collected)
   - Number of active holds
3. Officer drills into outstanding to identify top debtors → opens each account.

**Postcondition:** Operational data informs collection prioritisation.
