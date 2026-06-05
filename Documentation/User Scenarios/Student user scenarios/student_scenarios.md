# Student User Scenarios

This document describes the main student-side user scenarios for the Campus Information System (CIS).

---

## Scenario S1: Student logs in to the student portal

1. The student opens the CIS login page.
2. The student enters the institutional email and password.
3. The student clicks the **Login** button.
4. The system validates the student account, role, and account status.
5. If the credentials are correct, the student is redirected to the student dashboard.
6. If the credentials are incorrect, an error message is displayed and the student stays on the login page.

---

## Scenario S2: Student resets a forgotten password

1. On the login page, the student clicks **Forgot password?**.
2. The student enters the institutional email and requests a reset.
3. The system sends a 6-digit verification code to the student's email.
4. The student enters the code together with a new password.
5. If the code is valid, the system updates the password and the student can sign in.
6. If the code is invalid or expired, an error is displayed and the student can request a new code.

---

## Scenario S3: Student views the dashboard

1. After logging in, the student lands on the student dashboard.
2. The system loads the student's enrolled courses, GPA, and upcoming items.
3. The dashboard displays summary statistics such as credits, attendance, and alerts.
4. The student selects a module from the sidebar to continue.

---

## Scenario S4: Student views and updates the profile

1. The student opens the **Profile** page.
2. The system displays the student's personal and academic details.
3. The student edits the editable fields, such as phone number, and saves.
4. The system validates and stores the changes and confirms success.
5. The student can view and edit only their own profile.

---

## Scenario S5: Student browses available subjects and requests enrollment

1. The student opens the **Available Subjects** page.
2. The system loads the subjects eligible for the student's faculty, program, and study level.
3. The student selects a subject and submits an enrollment request.
4. The system runs the eligibility policy checks:
   - Study level
   - Selection deadline
   - Capacity
   - Prerequisites
   - Credit limit
   - Already-passed courses
   - Timetable conflict
5. If the subject is eligible, the request is saved with status **requested** and forwarded to academic staff for approval.
6. If the subject is not eligible, the system displays the specific blocked reason and no request is created.

---

## Scenario S6: Student drops a registered course

1. The student opens **My Courses** or the **Course Registration** page.
2. The student selects an enrolled course and chooses to drop it.
3. The system checks the drop deadline for the semester.
4. If the drop is within the deadline, the registration is dropped and the offering's enrolled count is updated.
5. If the drop is past the deadline, the system blocks the action and shows a message.

---

## Scenario S7: Student views the timetable

1. The student opens the **Timetable** page.
2. The system loads the weekly schedule for the student's enrolled offerings.
3. The student views the class days, times, and rooms.

---

## Scenario S8: Student views and downloads course materials

1. The student opens a course and selects the **Materials** section.
2. The system loads only the materials that are published and visible to students.
3. The student opens or downloads a material file or link.

---

## Scenario S9: Student submits an assignment

1. The student opens the **Assignments** page for a course.
2. The system lists the published assignments with their due dates.
3. The student uploads a file or enters text and submits before the due date.
4. The system records the submission with status **submitted**.
5. The student can later view the score and feedback once the instructor publishes them.

---

## Scenario S10: Student views attendance and exam eligibility

1. The student opens the **Attendance** page.
2. The system displays the attendance records per session and the calculated absence percentage.
3. If the absence is within the allowed limit, the student is shown as eligible for the final exam.
4. If the absence exceeds the limit, the system shows that the student is blocked from the final exam.

---

## Scenario S11: Student views published grades and risk warnings

1. The student opens the **Grades** page.
2. The system displays only the grades that the instructor has published.
3. The student views the component scores, total score, and pass/fail status.
4. If the student is at academic risk, the **Risk Warning** page highlights the affected courses.

---

## Scenario S12: Student reads campus news and joins a club

1. The student opens the **News and Clubs** section.
2. The system loads campus news, events, and the club directory.
3. The student requests to join a club.
4. Depending on the club's join mode, the membership becomes active immediately or is set to pending for approval.

---

## Scenario S13: Student sends a message

1. The student opens the **Inbox**.
2. The system shows the student's notifications and received messages.
3. The student composes a message to an instructor or an academic staff member and sends it.
4. The system delivers the message to the recipient's inbox.
5. Students cannot message other students.

---

## Scenario S14: Student uses the AI academic assistant

1. The student opens the **Chatbot** page.
2. The system connects to the local AI assistant using Ollama.
3. The student asks an academic question.
4. If the AI service is available, a response is streamed back.
5. If the AI service is unavailable, the system falls back to built-in rule-based answers.

---

## Scenario S15: Student changes the password

1. The student opens the **Change Password** page.
2. The student enters the current password and a new password.
3. The system verifies the current password.
4. If the current password is correct, the password is updated and the first-login flag is cleared.
5. If the current password is incorrect, an error message is displayed.
