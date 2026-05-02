USE cis;

START TRANSACTION;

-- Demo login credentials
-- Student One:                student.one@campus.example / Student@123
-- Student Two:                student.two@campus.example / Student@123
-- Instructor:                 instructor.demo@campus.example / Instructor@123
-- Academic Staff:             academic.staff@campus.example / Academic@123
-- Finance Staff:              finance.staff@campus.example / Finance@123
-- Communication Staff:        communications.staff@campus.example / Comms@123
-- System Admin Primary:       sysadmin.primary@campus.example / SysAdmin@123
-- System Admin Backup:        sysadmin.backup@campus.example / SysAdmin@123

SET @cs_department_id = 1;
SET @bscs_program_id = (SELECT id FROM programs WHERE code = 'BSCS' LIMIT 1);
SET @spring_term_id = (SELECT id FROM academic_terms WHERE code = '2026-SPRING' LIMIT 1);

INSERT INTO users (
  email,
  password_hash,
  first_name,
  last_name,
  phone,
  role,
  status,
  must_change_password,
  account_origin,
  invited_at,
  student_number,
  department_id,
  program_id,
  admission_date,
  expected_graduation_date,
  current_semester,
  cumulative_gpa,
  earned_credits,
  academic_status,
  address_line_1,
  city,
  state_region,
  postal_code,
  country,
  employee_number,
  title,
  hire_date,
  employment_status,
  specialization,
  office_location
)
VALUES
  ('student.one@campus.example', '$pbkdf2-sha256$29000$cO4dIySklFLKWYtx7r03Rg$yNmWBgJARJKCg9867vukVJhejm4FFrh.G37BAUDGVSg', 'Student', 'One', '+1 555 0101', 'Student', 'active', FALSE, 'api_seed', CURRENT_TIMESTAMP, '2026-STU-0001', @cs_department_id, @bscs_program_id, '2024-09-01', '2028-06-15', 4, 3.62, 54, 'active', '12 Innovation Avenue', 'Berlin', 'Berlin', '10115', 'Germany', NULL, NULL, NULL, 'active', NULL, NULL),
  ('student.two@campus.example', '$pbkdf2-sha256$29000$cO4dIySklFLKWYtx7r03Rg$yNmWBgJARJKCg9867vukVJhejm4FFrh.G37BAUDGVSg', 'Student', 'Two', '+1 555 0102', 'Student', 'active', FALSE, 'api_seed', CURRENT_TIMESTAMP, '2026-STU-0002', @cs_department_id, @bscs_program_id, '2024-09-01', '2028-06-15', 4, 3.18, 51, 'active', '44 Campus Square', 'Berlin', 'Berlin', '10117', 'Germany', NULL, NULL, NULL, 'active', NULL, NULL),
  ('instructor.demo@campus.example', '$pbkdf2-sha256$29000$yRmDcI5x7v0/Z4wRgtBayw$tTyZdbKrbZPwMGrezWsZtIev2tmUtl1KIr4eBEiRuag', 'Instructor', 'Demo', '+1 555 0201', 'Instructor', 'active', FALSE, 'api_seed', CURRENT_TIMESTAMP, NULL, @cs_department_id, NULL, NULL, NULL, 1, 0.00, 0, 'active', NULL, NULL, NULL, NULL, NULL, 'INS-0001', 'Senior Lecturer', '2022-08-15', 'active', 'Databases and applied software engineering', 'Engineering Hall 3.12'),
  ('academic.staff@campus.example', '$pbkdf2-sha256$29000$Y0xJyVlLCYFQCoFwDgFgTA$wy1b8jCRtOHeTB.wLqwewWbXisEiGwcRhiAc7wo94NE', 'Academic', 'Staff', '+1 555 0301', 'Academic Staff', 'active', FALSE, 'api_seed', CURRENT_TIMESTAMP, NULL, NULL, NULL, NULL, NULL, 1, 0.00, 0, 'active', NULL, NULL, NULL, NULL, NULL, 'ACS-0001', 'Registrar Officer', NULL, 'active', NULL, 'Administration Block 2.01'),
  ('finance.staff@campus.example', '$pbkdf2-sha256$29000$9f7fu9d67z0HYKw1Rugdgw$c09IAu5JrMpEonA94.tzAHxda7fdwUUD/wwCsNBF.58', 'Finance', 'Staff', '+1 555 0401', 'Finance Staff', 'active', FALSE, 'api_seed', CURRENT_TIMESTAMP, NULL, NULL, NULL, NULL, NULL, 1, 0.00, 0, 'active', NULL, NULL, NULL, NULL, NULL, 'FIN-0001', 'Finance Officer', NULL, 'active', NULL, 'Administration Block 1.14'),
  ('communications.staff@campus.example', '$pbkdf2-sha256$29000$nZPynlNqDWEs5dybk/Ieww$3Qoh3dc1c475gEPAIytu9VNlGzuh5HFdaWy6a7tFQ1M', 'Communication', 'Staff', '+1 555 0501', 'Communication Staff', 'active', FALSE, 'api_seed', CURRENT_TIMESTAMP, NULL, NULL, NULL, NULL, NULL, 1, 0.00, 0, 'active', NULL, NULL, NULL, NULL, NULL, 'COM-0001', 'Communications Officer', NULL, 'active', NULL, 'Student Affairs Studio'),
  ('sysadmin.primary@campus.example', '$pbkdf2-sha256$29000$TSklhDAmBABgzFmrdQ4hBA$yx0FovUqPJxPKu6l6lTMTalfoZZGLw.wnCYVaHXwSNo', 'System', 'Admin', '+1 555 0601', 'System Admin', 'active', FALSE, 'api_seed', CURRENT_TIMESTAMP, NULL, NULL, NULL, NULL, NULL, 1, 0.00, 0, 'active', NULL, NULL, NULL, NULL, NULL, 'SYS-0001', 'System Administrator', NULL, 'active', NULL, 'Administration Block 3.02'),
  ('sysadmin.backup@campus.example', '$pbkdf2-sha256$29000$TSklhDAmBABgzFmrdQ4hBA$yx0FovUqPJxPKu6l6lTMTalfoZZGLw.wnCYVaHXwSNo', 'System', 'Admin', '+1 555 0602', 'System Admin', 'active', FALSE, 'api_seed', CURRENT_TIMESTAMP, NULL, NULL, NULL, NULL, NULL, 1, 0.00, 0, 'active', NULL, NULL, NULL, NULL, NULL, 'SYS-0002', 'System Administrator', NULL, 'active', NULL, 'Administration Block 3.03')
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  first_name = VALUES(first_name),
  last_name = VALUES(last_name),
  phone = VALUES(phone),
  role = VALUES(role),
  status = VALUES(status),
  must_change_password = VALUES(must_change_password),
  account_origin = VALUES(account_origin),
  invited_at = VALUES(invited_at),
  student_number = VALUES(student_number),
  department_id = VALUES(department_id),
  program_id = VALUES(program_id),
  admission_date = VALUES(admission_date),
  expected_graduation_date = VALUES(expected_graduation_date),
  current_semester = VALUES(current_semester),
  cumulative_gpa = VALUES(cumulative_gpa),
  earned_credits = VALUES(earned_credits),
  academic_status = VALUES(academic_status),
  address_line_1 = VALUES(address_line_1),
  city = VALUES(city),
  state_region = VALUES(state_region),
  postal_code = VALUES(postal_code),
  country = VALUES(country),
  employee_number = VALUES(employee_number),
  title = VALUES(title),
  hire_date = VALUES(hire_date),
  employment_status = VALUES(employment_status),
  specialization = VALUES(specialization),
  office_location = VALUES(office_location),
  deleted_at = NULL;

SET @student_one_user_id = (SELECT id FROM users WHERE email = 'student.one@campus.example');
SET @student_two_user_id = (SELECT id FROM users WHERE email = 'student.two@campus.example');
SET @instructor_user_id = (SELECT id FROM users WHERE email = 'instructor.demo@campus.example');
SET @academic_staff_user_id = (SELECT id FROM users WHERE email = 'academic.staff@campus.example');
SET @finance_staff_user_id = (SELECT id FROM users WHERE email = 'finance.staff@campus.example');
SET @communications_staff_user_id = (SELECT id FROM users WHERE email = 'communications.staff@campus.example');

SET @cs201_offering_id = (
  SELECT co.id
  FROM course_offerings co
  JOIN courses c ON c.id = co.course_id
  JOIN academic_terms at ON at.id = co.academic_term_id
  WHERE c.code = 'CS201' AND at.code = '2026-SPRING' AND co.section_code = 'A'
  LIMIT 1
);
SET @cs220_offering_id = (
  SELECT co.id
  FROM course_offerings co
  JOIN courses c ON c.id = co.course_id
  JOIN academic_terms at ON at.id = co.academic_term_id
  WHERE c.code = 'CS220' AND at.code = '2026-SPRING' AND co.section_code = 'A'
  LIMIT 1
);
SET @math301_offering_id = (
  SELECT co.id
  FROM course_offerings co
  JOIN courses c ON c.id = co.course_id
  JOIN academic_terms at ON at.id = co.academic_term_id
  WHERE c.code = 'MATH301' AND at.code = '2026-SPRING' AND co.section_code = 'A'
  LIMIT 1
);

UPDATE course_offerings
SET teacher_id = @instructor_user_id
WHERE id IN (@cs201_offering_id, @cs220_offering_id);

INSERT INTO enrollments (
  student_id,
  course_offering_id,
  status,
  registered_at,
  approved_at,
  created_by_user_id
)
VALUES
  (@student_one_user_id, @cs201_offering_id, 'enrolled', '2026-01-08 10:00:00', '2026-01-08 10:30:00', @academic_staff_user_id),
  (@student_one_user_id, @cs220_offering_id, 'enrolled', '2026-01-08 10:05:00', '2026-01-08 10:35:00', @academic_staff_user_id),
  (@student_one_user_id, @math301_offering_id, 'enrolled', '2026-01-08 10:10:00', '2026-01-08 10:40:00', @academic_staff_user_id),
  (@student_two_user_id, @cs201_offering_id, 'enrolled', '2026-01-08 10:12:00', '2026-01-08 10:42:00', @academic_staff_user_id)
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  registered_at = VALUES(registered_at),
  approved_at = VALUES(approved_at),
  created_by_user_id = VALUES(created_by_user_id),
  dropped_at = NULL,
  completed_at = NULL;

INSERT INTO attendance_sessions (
  course_offering_id,
  course_meeting_id,
  session_date,
  start_time,
  end_time,
  topic,
  status,
  created_by_teacher_id
)
VALUES (
  @cs201_offering_id,
  @cs201_offering_id,
  '2026-02-16',
  '09:00:00',
  '10:30:00',
  'Trees and recursion workshop',
  'completed',
  @instructor_user_id
)
ON DUPLICATE KEY UPDATE
  topic = VALUES(topic),
  status = VALUES(status),
  created_by_teacher_id = VALUES(created_by_teacher_id);

SET @cs201_attendance_session_id = (
  SELECT id
  FROM attendance_sessions
  WHERE course_offering_id = @cs201_offering_id
    AND session_date = '2026-02-16'
    AND start_time = '09:00:00'
  LIMIT 1
);

INSERT INTO attendance_records (
  attendance_session_id,
  student_id,
  status,
  remarks,
  recorded_by_teacher_id,
  recorded_at
)
VALUES
  (@cs201_attendance_session_id, @student_one_user_id, 'present', 'On time', @instructor_user_id, '2026-02-16 10:35:00'),
  (@cs201_attendance_session_id, @student_two_user_id, 'late', 'Arrived after the warm-up quiz', @instructor_user_id, '2026-02-16 10:35:00')
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  remarks = VALUES(remarks),
  recorded_by_teacher_id = VALUES(recorded_by_teacher_id),
  recorded_at = VALUES(recorded_at);

DELETE FROM grade_components
WHERE course_offering_id = @cs201_offering_id
  AND name = 'Midterm Assessment';

INSERT INTO grade_components (
  course_offering_id,
  name,
  component_type,
  max_points,
  weight_percentage,
  due_at,
  sort_order,
  is_published
)
VALUES
  (@cs201_offering_id, 'Midterm Assessment', 'midterm', 100.00, 30.00, '2026-03-15 23:59:00', 1, TRUE);

SET @cs201_midterm_component_id = (
  SELECT id
  FROM grade_components
  WHERE course_offering_id = @cs201_offering_id
    AND name = 'Midterm Assessment'
  ORDER BY id DESC
  LIMIT 1
);

INSERT INTO grade_records (
  grade_component_id,
  student_id,
  score_awarded,
  percentage,
  letter_grade,
  remarks,
  graded_by_teacher_id,
  graded_at,
  published_at
)
VALUES
  (@cs201_midterm_component_id, @student_one_user_id, 88.00, 88.00, 'B+', 'Strong performance', @instructor_user_id, '2026-03-16 12:00:00', '2026-03-16 12:00:00'),
  (@cs201_midterm_component_id, @student_two_user_id, 74.00, 74.00, 'C', 'Needs more practice with recursion', @instructor_user_id, '2026-03-16 12:00:00', '2026-03-16 12:00:00')
ON DUPLICATE KEY UPDATE
  score_awarded = VALUES(score_awarded),
  percentage = VALUES(percentage),
  letter_grade = VALUES(letter_grade),
  remarks = VALUES(remarks),
  graded_by_teacher_id = VALUES(graded_by_teacher_id),
  graded_at = VALUES(graded_at),
  published_at = VALUES(published_at);

UPDATE enrollments
SET
  final_numeric_grade = CASE
    WHEN student_id = @student_one_user_id THEN 89.00
    WHEN student_id = @student_two_user_id THEN 76.00
    ELSE final_numeric_grade
  END,
  final_letter_grade = CASE
    WHEN student_id = @student_one_user_id THEN 'B+'
    WHEN student_id = @student_two_user_id THEN 'C+'
    ELSE final_letter_grade
  END,
  grade_points = CASE
    WHEN student_id = @student_one_user_id THEN 3.30
    WHEN student_id = @student_two_user_id THEN 2.30
    ELSE grade_points
  END,
  final_grade_status = 'published',
  final_grade_published_at = '2026-03-20 11:00:00',
  final_grade_approved_by_teacher_id = @instructor_user_id
WHERE course_offering_id = @cs201_offering_id
  AND student_id IN (@student_one_user_id, @student_two_user_id);

INSERT INTO student_invoices (
  student_id,
  academic_term_id,
  invoice_number,
  issue_date,
  due_date,
  currency,
  description,
  subtotal_amount,
  discount_amount,
  tax_amount,
  total_amount,
  balance_amount,
  status,
  notes,
  created_by_admin_id
)
VALUES
  (@student_one_user_id, @spring_term_id, 'INV-2026-9001', '2026-01-10', '2026-02-10', 'USD', 'Spring 2026 tuition installment', 1500.00, 0.00, 0.00, 1500.00, 500.00, 'partially_paid', 'Spring tuition demo invoice.', @finance_staff_user_id)
ON DUPLICATE KEY UPDATE
  issue_date = VALUES(issue_date),
  due_date = VALUES(due_date),
  currency = VALUES(currency),
  description = VALUES(description),
  subtotal_amount = VALUES(subtotal_amount),
  discount_amount = VALUES(discount_amount),
  tax_amount = VALUES(tax_amount),
  total_amount = VALUES(total_amount),
  balance_amount = VALUES(balance_amount),
  status = VALUES(status),
  notes = VALUES(notes),
  created_by_admin_id = VALUES(created_by_admin_id);

SET @student_one_invoice_id = (SELECT id FROM student_invoices WHERE invoice_number = 'INV-2026-9001' LIMIT 1);

INSERT INTO payments (
  student_id,
  invoice_id,
  reference_number,
  payment_method,
  amount,
  currency,
  paid_at,
  status,
  received_by_admin_id,
  notes
)
VALUES
  (@student_one_user_id, @student_one_invoice_id, 'PAY-2026-9001', 'bank_transfer', 1000.00, 'USD', '2026-01-28 13:30:00', 'confirmed', @finance_staff_user_id, 'Partial tuition payment received.')
ON DUPLICATE KEY UPDATE
  student_id = VALUES(student_id),
  invoice_id = VALUES(invoice_id),
  payment_method = VALUES(payment_method),
  amount = VALUES(amount),
  currency = VALUES(currency),
  paid_at = VALUES(paid_at),
  status = VALUES(status),
  received_by_admin_id = VALUES(received_by_admin_id),
  notes = VALUES(notes);

DELETE FROM financial_holds
WHERE student_id = @student_two_user_id
  AND reason = 'Payment verification pending for spring balance';

INSERT INTO financial_holds (
  student_id,
  hold_type,
  reason,
  status,
  placed_at,
  placed_by_admin_id
)
VALUES
  (@student_two_user_id, 'finance', 'Payment verification pending for spring balance', 'active', '2026-02-05 09:15:00', @finance_staff_user_id);

INSERT INTO club_memberships (
  club_id,
  student_id,
  member_role,
  status,
  joined_at,
  approved_by_admin_id
)
SELECT id, @student_one_user_id, 'member', 'active', '2026-01-20 12:00:00', @communications_staff_user_id
FROM clubs
WHERE code = 'AI-SOC'
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  joined_at = VALUES(joined_at),
  approved_by_admin_id = VALUES(approved_by_admin_id);

INSERT INTO club_memberships (
  club_id,
  student_id,
  member_role,
  status,
  submitted_at,
  request_message
)
SELECT id, @student_two_user_id, 'member', 'pending', '2026-04-10 10:00:00', 'Interested in robotics project nights.'
FROM clubs
WHERE code = 'ROBO'
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  submitted_at = VALUES(submitted_at),
  request_message = VALUES(request_message);

DELETE FROM news_posts
WHERE title IN (
  'Spring registration support desk hours',
  'AI Society showcase and innovation forum'
);

INSERT INTO news_posts (
  post_type,
  title,
  summary,
  body,
  priority,
  status,
  featured,
  visible_from,
  visible_until,
  published_at,
  created_by_user_id,
  updated_by_user_id
)
VALUES
  ('announcement', 'Spring registration support desk hours', 'Academic Staff extended support hours for add-drop, timetable fixes, and registration advice.', 'The academic office is open weekdays from 09:00 to 17:00 during the add-drop period.', 'important', 'published', TRUE, '2026-01-12 08:00:00', '2026-02-15 23:59:00', '2026-01-12 08:00:00', @academic_staff_user_id, @academic_staff_user_id),
  ('feature', 'AI Society showcase and innovation forum', 'Communication Staff published a public event spotlight for the upcoming AI Society showcase.', 'Join students, instructors, and visitors for project demos, lightning talks, and networking at the AI Society showcase in the Innovation Lounge.', 'update', 'published', FALSE, '2026-04-10 09:00:00', '2026-04-30 23:59:00', '2026-04-10 09:00:00', @communications_staff_user_id, @communications_staff_user_id);

DELETE FROM campus_events
WHERE title = 'Campus Innovation Week Launch';

INSERT INTO campus_events (
  club_id,
  title,
  description,
  organizer_name,
  event_type,
  location_name,
  delivery_mode,
  starts_at,
  ends_at,
  registration_required,
  capacity,
  expected_attendees,
  status,
  managed_by_user_id
)
VALUES (
  (SELECT id FROM clubs WHERE code = 'AI-SOC' LIMIT 1),
  'Campus Innovation Week Launch',
  'Kick-off session for innovation week with student project demos, guest remarks, and networking.',
  'Communications Office',
  'Launch Event',
  'Innovation Lounge',
  'onsite',
  '2026-04-24 15:00:00',
  '2026-04-24 17:30:00',
  TRUE,
  160,
  140,
  'open',
  @communications_staff_user_id
);

DELETE FROM notifications
WHERE title IN (
  'Academic follow-up on registration',
  'Finance reminder for tuition balance',
  'Teaching assignment confirmed'
);

SET @student_one_cs201_enrollment_id = (
  SELECT id FROM enrollments
  WHERE student_id = @student_one_user_id AND course_offering_id = @cs201_offering_id
  LIMIT 1
);

INSERT INTO notifications (
  user_id,
  category,
  severity,
  title,
  message,
  action_label,
  action_url,
  source_entity_type,
  source_entity_id,
  created_by_user_id,
  delivered_at
)
VALUES
  (@student_one_user_id, 'registration', 'info', 'Academic follow-up on registration', 'Your Spring 2026 registration was approved. Review your timetable and confirm that all required courses appear correctly.', 'Open registration', '/student/registration', 'enrollment', @student_one_cs201_enrollment_id, @academic_staff_user_id, '2026-01-12 09:00:00'),
  (@student_one_user_id, 'finance', 'warning', 'Finance reminder for tuition balance', 'A remaining tuition balance of 500.00 USD is due for Spring 2026. Contact Finance Staff if you need a payment plan review.', 'Open finance', '/student/finance', 'student_invoice', @student_one_invoice_id, @finance_staff_user_id, '2026-01-28 14:00:00'),
  (@instructor_user_id, 'academic', 'success', 'Teaching assignment confirmed', 'Your instructor workspace is linked to CS201 and CS220 for Spring 2026. Grades and attendance can now be managed from your dashboard.', 'Open courses', '/instructor/courses', 'course_offering', @cs201_offering_id, @academic_staff_user_id, '2026-01-09 09:00:00');

COMMIT;
