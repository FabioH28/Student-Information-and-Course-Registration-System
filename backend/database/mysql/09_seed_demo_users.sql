USE cis;

START TRANSACTION;

-- Demo login credentials
-- Student (Alex):            student.alex@campus.edu / Student@123
-- Student (Bella):           student.bella@campus.edu / Student@123
-- Instructor:                instructor.imran@campus.edu / Instructor@123
-- Academic Staff:            academic.amina@campus.edu / Academic@123
-- Finance Staff:             finance.farah@campus.edu / Finance@123
-- Communication Staff:       comms.kareem@campus.edu / Comms@123
-- System Admin:              sysadmin.nora@campus.edu / SysAdmin@123
-- System Admin (simple):     admin@gmail.com / admin

INSERT INTO users (
  email,
  password_hash,
  first_name,
  last_name,
  phone,
  status,
  must_change_password,
  account_origin,
  invited_at
)
VALUES
  ('student.alex@campus.edu', '$pbkdf2-sha256$29000$cO4dIySklFLKWYtx7r03Rg$yNmWBgJARJKCg9867vukVJhejm4FFrh.G37BAUDGVSg', 'Alex', 'Morgan', '+1 555 0101', 'active', FALSE, 'api_seed', CURRENT_TIMESTAMP),
  ('student.bella@campus.edu', '$pbkdf2-sha256$29000$cO4dIySklFLKWYtx7r03Rg$yNmWBgJARJKCg9867vukVJhejm4FFrh.G37BAUDGVSg', 'Bella', 'Rahman', '+1 555 0102', 'active', FALSE, 'api_seed', CURRENT_TIMESTAMP),
  ('instructor.imran@campus.edu', '$pbkdf2-sha256$29000$yRmDcI5x7v0/Z4wRgtBayw$tTyZdbKrbZPwMGrezWsZtIev2tmUtl1KIr4eBEiRuag', 'Imran', 'Khan', '+1 555 0201', 'active', FALSE, 'api_seed', CURRENT_TIMESTAMP),
  ('academic.amina@campus.edu', '$pbkdf2-sha256$29000$Y0xJyVlLCYFQCoFwDgFgTA$wy1b8jCRtOHeTB.wLqwewWbXisEiGwcRhiAc7wo94NE', 'Amina', 'Saleh', '+1 555 0301', 'active', FALSE, 'api_seed', CURRENT_TIMESTAMP),
  ('finance.farah@campus.edu', '$pbkdf2-sha256$29000$9f7fu9d67z0HYKw1Rugdgw$c09IAu5JrMpEonA94.tzAHxda7fdwUUD/wwCsNBF.58', 'Farah', 'Yusuf', '+1 555 0401', 'active', FALSE, 'api_seed', CURRENT_TIMESTAMP),
  ('comms.kareem@campus.edu', '$pbkdf2-sha256$29000$nZPynlNqDWEs5dybk/Ieww$3Qoh3dc1c475gEPAIytu9VNlGzuh5HFdaWy6a7tFQ1M', 'Kareem', 'Haddad', '+1 555 0501', 'active', FALSE, 'api_seed', CURRENT_TIMESTAMP),
  ('sysadmin.nora@campus.edu', '$pbkdf2-sha256$29000$TSklhDAmBABgzFmrdQ4hBA$yx0FovUqPJxPKu6l6lTMTalfoZZGLw.wnCYVaHXwSNo', 'Nora', 'Ibrahim', '+1 555 0601', 'active', FALSE, 'api_seed', CURRENT_TIMESTAMP),
  ('admin@gmail.com', '$pbkdf2-sha256$29000$RGgNISSkNCbkPOdcq9U6xw$s0JCWjjfuB39f..xJ6jWEuncclnFc1ktnBbLxUwdUGY', 'Admin', 'User', '+1 555 0602', 'active', FALSE, 'api_seed', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  first_name = VALUES(first_name),
  last_name = VALUES(last_name),
  phone = VALUES(phone),
  status = VALUES(status),
  must_change_password = VALUES(must_change_password),
  account_origin = VALUES(account_origin),
  invited_at = VALUES(invited_at),
  deleted_at = NULL;

SET @alex_user_id = (SELECT id FROM users WHERE email = 'student.alex@campus.edu');
SET @bella_user_id = (SELECT id FROM users WHERE email = 'student.bella@campus.edu');
SET @imran_user_id = (SELECT id FROM users WHERE email = 'instructor.imran@campus.edu');
SET @amina_user_id = (SELECT id FROM users WHERE email = 'academic.amina@campus.edu');
SET @farah_user_id = (SELECT id FROM users WHERE email = 'finance.farah@campus.edu');
SET @kareem_user_id = (SELECT id FROM users WHERE email = 'comms.kareem@campus.edu');
SET @nora_user_id = (SELECT id FROM users WHERE email = 'sysadmin.nora@campus.edu');
SET @admin_gmail_user_id = (SELECT id FROM users WHERE email = 'admin@gmail.com');

DELETE FROM user_roles
WHERE user_id IN (@alex_user_id, @bella_user_id, @imran_user_id, @amina_user_id, @farah_user_id, @kareem_user_id, @nora_user_id, @admin_gmail_user_id);

INSERT INTO user_roles (user_id, role_id, is_primary, assigned_at)
SELECT @alex_user_id, id, TRUE, CURRENT_TIMESTAMP FROM roles WHERE code = 'Student'
UNION ALL
SELECT @bella_user_id, id, TRUE, CURRENT_TIMESTAMP FROM roles WHERE code = 'Student'
UNION ALL
SELECT @imran_user_id, id, TRUE, CURRENT_TIMESTAMP FROM roles WHERE code = 'Instructor'
UNION ALL
SELECT @amina_user_id, id, TRUE, CURRENT_TIMESTAMP FROM roles WHERE code = 'Academic Staff'
UNION ALL
SELECT @farah_user_id, id, TRUE, CURRENT_TIMESTAMP FROM roles WHERE code = 'Finance Staff'
UNION ALL
SELECT @kareem_user_id, id, TRUE, CURRENT_TIMESTAMP FROM roles WHERE code = 'Communication Staff'
UNION ALL
SELECT @nora_user_id, id, TRUE, CURRENT_TIMESTAMP FROM roles WHERE code = 'System Admin'
UNION ALL
SELECT @admin_gmail_user_id, id, TRUE, CURRENT_TIMESTAMP FROM roles WHERE code = 'System Admin';

SET @cs_department_id = (SELECT id FROM departments WHERE code = 'CS' LIMIT 1);
SET @bscs_program_id = (SELECT id FROM programs WHERE code = 'BSCS' LIMIT 1);
SET @spring_term_id = (SELECT id FROM academic_terms WHERE code = '2026-SPRING' LIMIT 1);

INSERT INTO student_profiles (
  user_id,
  student_number,
  department_id,
  program_id,
  admission_date,
  expected_graduation_date,
  current_semester,
  cumulative_gpa,
  earned_credits,
  status,
  address_line_1,
  city,
  state_region,
  postal_code,
  country
)
VALUES
  (@alex_user_id, '2026-STU-0001', @cs_department_id, @bscs_program_id, '2024-09-01', '2028-06-15', 4, 3.62, 54, 'active', '12 Innovation Avenue', 'Berlin', 'Berlin', '10115', 'Germany'),
  (@bella_user_id, '2026-STU-0002', @cs_department_id, @bscs_program_id, '2024-09-01', '2028-06-15', 4, 3.18, 51, 'active', '44 Campus Square', 'Berlin', 'Berlin', '10117', 'Germany')
ON DUPLICATE KEY UPDATE
  student_number = VALUES(student_number),
  department_id = VALUES(department_id),
  program_id = VALUES(program_id),
  admission_date = VALUES(admission_date),
  expected_graduation_date = VALUES(expected_graduation_date),
  current_semester = VALUES(current_semester),
  cumulative_gpa = VALUES(cumulative_gpa),
  earned_credits = VALUES(earned_credits),
  status = VALUES(status),
  address_line_1 = VALUES(address_line_1),
  city = VALUES(city),
  state_region = VALUES(state_region),
  postal_code = VALUES(postal_code),
  country = VALUES(country);

INSERT INTO teacher_profiles (
  user_id,
  employee_number,
  department_id,
  title,
  hire_date,
  employment_status,
  specialization,
  office_location
)
VALUES
  (@imran_user_id, 'INS-0001', @cs_department_id, 'Senior Lecturer', '2022-08-15', 'active', 'Databases and applied software engineering', 'Engineering Hall 3.12')
ON DUPLICATE KEY UPDATE
  employee_number = VALUES(employee_number),
  department_id = VALUES(department_id),
  title = VALUES(title),
  hire_date = VALUES(hire_date),
  employment_status = VALUES(employment_status),
  specialization = VALUES(specialization),
  office_location = VALUES(office_location);

INSERT INTO admin_profiles (
  user_id,
  employee_number,
  title,
  office_location,
  employment_status
)
VALUES
  (@amina_user_id, 'ACS-0001', 'Registrar Officer', 'Administration Block 2.01', 'active'),
  (@farah_user_id, 'FIN-0001', 'Finance Officer', 'Administration Block 1.14', 'active'),
  (@kareem_user_id, 'COM-0001', 'Communications Officer', 'Student Affairs Studio', 'active'),
  (@nora_user_id, 'SYS-0001', 'System Administrator', 'Administration Block 3.02', 'active'),
  (@admin_gmail_user_id, 'SYS-0002', 'System Administrator', 'Administration Block 3.03', 'active')
ON DUPLICATE KEY UPDATE
  employee_number = VALUES(employee_number),
  title = VALUES(title),
  office_location = VALUES(office_location),
  employment_status = VALUES(employment_status);

SET @alex_student_id = (SELECT id FROM student_profiles WHERE user_id = @alex_user_id);
SET @bella_student_id = (SELECT id FROM student_profiles WHERE user_id = @bella_user_id);
SET @imran_teacher_id = (SELECT id FROM teacher_profiles WHERE user_id = @imran_user_id);
SET @amina_admin_id = (SELECT id FROM admin_profiles WHERE user_id = @amina_user_id);
SET @farah_admin_id = (SELECT id FROM admin_profiles WHERE user_id = @farah_user_id);
SET @kareem_admin_id = (SELECT id FROM admin_profiles WHERE user_id = @kareem_user_id);
SET @nora_admin_id = (SELECT id FROM admin_profiles WHERE user_id = @nora_user_id);
SET @admin_gmail_admin_id = (SELECT id FROM admin_profiles WHERE user_id = @admin_gmail_user_id);

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
SET teacher_id = @imran_teacher_id
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
  (@alex_student_id, @cs201_offering_id, 'enrolled', '2026-01-08 10:00:00', '2026-01-08 10:30:00', @amina_user_id),
  (@alex_student_id, @cs220_offering_id, 'enrolled', '2026-01-08 10:05:00', '2026-01-08 10:35:00', @amina_user_id),
  (@alex_student_id, @math301_offering_id, 'enrolled', '2026-01-08 10:10:00', '2026-01-08 10:40:00', @amina_user_id),
  (@bella_student_id, @cs201_offering_id, 'enrolled', '2026-01-08 10:12:00', '2026-01-08 10:42:00', @amina_user_id)
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  registered_at = VALUES(registered_at),
  approved_at = VALUES(approved_at),
  created_by_user_id = VALUES(created_by_user_id),
  dropped_at = NULL,
  completed_at = NULL;

INSERT INTO student_term_records (
  student_id,
  academic_term_id,
  semester_number,
  registered_credits,
  earned_credits,
  term_gpa,
  cumulative_gpa,
  academic_standing
)
VALUES
  (@alex_student_id, @spring_term_id, 4, 10, 0, 3.74, 3.62, 'good'),
  (@bella_student_id, @spring_term_id, 4, 3, 0, 3.12, 3.18, 'good')
ON DUPLICATE KEY UPDATE
  semester_number = VALUES(semester_number),
  registered_credits = VALUES(registered_credits),
  earned_credits = VALUES(earned_credits),
  term_gpa = VALUES(term_gpa),
  cumulative_gpa = VALUES(cumulative_gpa),
  academic_standing = VALUES(academic_standing);

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
SELECT
  @cs201_offering_id,
  (
    SELECT id
    FROM course_meetings
    WHERE course_offering_id = @cs201_offering_id
      AND day_of_week = 'monday'
    ORDER BY id ASC
    LIMIT 1
  ),
  '2026-02-16',
  '09:00:00',
  '10:30:00',
  'Trees and recursion workshop',
  'completed',
  @imran_teacher_id
FROM DUAL
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
  (@cs201_attendance_session_id, @alex_student_id, 'present', 'On time', @imran_teacher_id, '2026-02-16 10:35:00'),
  (@cs201_attendance_session_id, @bella_student_id, 'late', 'Arrived after the warm-up quiz', @imran_teacher_id, '2026-02-16 10:35:00')
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
  (@cs201_midterm_component_id, @alex_student_id, 88.00, 88.00, 'B+', 'Strong performance', @imran_teacher_id, '2026-03-16 12:00:00', '2026-03-16 12:00:00'),
  (@cs201_midterm_component_id, @bella_student_id, 74.00, 74.00, 'C', 'Needs more practice with recursion', @imran_teacher_id, '2026-03-16 12:00:00', '2026-03-16 12:00:00')
ON DUPLICATE KEY UPDATE
  score_awarded = VALUES(score_awarded),
  percentage = VALUES(percentage),
  letter_grade = VALUES(letter_grade),
  remarks = VALUES(remarks),
  graded_by_teacher_id = VALUES(graded_by_teacher_id),
  graded_at = VALUES(graded_at),
  published_at = VALUES(published_at);

SET @alex_cs201_enrollment_id = (
  SELECT id FROM enrollments
  WHERE student_id = @alex_student_id AND course_offering_id = @cs201_offering_id
  LIMIT 1
);
SET @bella_cs201_enrollment_id = (
  SELECT id FROM enrollments
  WHERE student_id = @bella_student_id AND course_offering_id = @cs201_offering_id
  LIMIT 1
);

INSERT INTO final_grades (
  enrollment_id,
  numeric_grade,
  letter_grade,
  grade_points,
  status,
  published_at,
  approved_by_teacher_id
)
VALUES
  (@alex_cs201_enrollment_id, 89.00, 'B+', 3.30, 'published', '2026-03-20 11:00:00', @imran_teacher_id),
  (@bella_cs201_enrollment_id, 76.00, 'C+', 2.30, 'published', '2026-03-20 11:00:00', @imran_teacher_id)
ON DUPLICATE KEY UPDATE
  numeric_grade = VALUES(numeric_grade),
  letter_grade = VALUES(letter_grade),
  grade_points = VALUES(grade_points),
  status = VALUES(status),
  published_at = VALUES(published_at),
  approved_by_teacher_id = VALUES(approved_by_teacher_id);

UPDATE enrollments
SET
  final_numeric_grade = CASE
    WHEN id = @alex_cs201_enrollment_id THEN 89.00
    WHEN id = @bella_cs201_enrollment_id THEN 76.00
    ELSE final_numeric_grade
  END,
  final_letter_grade = CASE
    WHEN id = @alex_cs201_enrollment_id THEN 'B+'
    WHEN id = @bella_cs201_enrollment_id THEN 'C+'
    ELSE final_letter_grade
  END,
  grade_points = CASE
    WHEN id = @alex_cs201_enrollment_id THEN 3.30
    WHEN id = @bella_cs201_enrollment_id THEN 2.30
    ELSE grade_points
  END
WHERE id IN (@alex_cs201_enrollment_id, @bella_cs201_enrollment_id);

DELETE FROM student_risk_assessments
WHERE student_id IN (@alex_student_id, @bella_student_id)
  AND academic_term_id = @spring_term_id;

INSERT INTO student_risk_assessments (
  student_id,
  academic_term_id,
  risk_level,
  risk_score,
  summary,
  generated_by_user_id,
  generated_at
)
VALUES
  (@alex_student_id, @spring_term_id, 'low', 18.00, 'Consistent attendance and strong midterm score.', @amina_user_id, '2026-03-21 09:00:00'),
  (@bella_student_id, @spring_term_id, 'medium', 42.00, 'Attendance and coursework follow-up needed for CS201.', @amina_user_id, '2026-03-21 09:00:00');
DELETE FROM student_recommendations
WHERE student_id = @alex_student_id
  AND academic_term_id = @spring_term_id
  AND recommended_course_id = (SELECT id FROM courses WHERE code = 'CS301' LIMIT 1);

INSERT INTO student_recommendations (
  student_id,
  academic_term_id,
  recommended_course_id,
  reason,
  priority,
  status,
  created_by_user_id
)
SELECT
  @alex_student_id,
  @spring_term_id,
  c.id,
  'Recommended as the next AI-focused course after completing AI Foundations.',
  1,
  'suggested',
  @amina_user_id
FROM courses c
WHERE c.code = 'CS301'
;

INSERT INTO student_invoices (
  student_id,
  academic_term_id,
  invoice_number,
  issue_date,
  due_date,
  currency,
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
  (@alex_student_id, @spring_term_id, 'INV-2026-9001', '2026-01-10', '2026-02-10', 'USD', 1500.00, 0.00, 0.00, 1500.00, 500.00, 'partially_paid', 'Spring tuition demo invoice.', @farah_admin_id)
ON DUPLICATE KEY UPDATE
  issue_date = VALUES(issue_date),
  due_date = VALUES(due_date),
  currency = VALUES(currency),
  subtotal_amount = VALUES(subtotal_amount),
  discount_amount = VALUES(discount_amount),
  tax_amount = VALUES(tax_amount),
  total_amount = VALUES(total_amount),
  balance_amount = VALUES(balance_amount),
  status = VALUES(status),
  notes = VALUES(notes),
  created_by_admin_id = VALUES(created_by_admin_id);

SET @alex_invoice_id = (SELECT id FROM student_invoices WHERE invoice_number = 'INV-2026-9001' LIMIT 1);

DELETE FROM invoice_items
WHERE invoice_id = @alex_invoice_id
  AND description = 'Spring 2026 tuition installment';

INSERT INTO invoice_items (
  invoice_id,
  fee_category_id,
  description,
  quantity,
  unit_amount,
  line_total
)
SELECT
  @alex_invoice_id,
  fc.id,
  'Spring 2026 tuition installment',
  1.00,
  1500.00,
  1500.00
FROM fee_categories fc
WHERE fc.code = 'TUITION';

INSERT INTO payments (
  student_id,
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
  (@alex_student_id, 'PAY-2026-9001', 'bank_transfer', 1000.00, 'USD', '2026-01-28 13:30:00', 'confirmed', @farah_admin_id, 'Partial tuition payment received.')
ON DUPLICATE KEY UPDATE
  payment_method = VALUES(payment_method),
  amount = VALUES(amount),
  currency = VALUES(currency),
  paid_at = VALUES(paid_at),
  status = VALUES(status),
  received_by_admin_id = VALUES(received_by_admin_id),
  notes = VALUES(notes);

SET @alex_payment_id = (SELECT id FROM payments WHERE reference_number = 'PAY-2026-9001' LIMIT 1);

INSERT INTO payment_allocations (payment_id, invoice_id, amount_applied)
VALUES (@alex_payment_id, @alex_invoice_id, 1000.00)
ON DUPLICATE KEY UPDATE
  amount_applied = VALUES(amount_applied);

DELETE FROM financial_holds
WHERE student_id = @bella_student_id
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
  (@bella_student_id, 'finance', 'Payment verification pending for spring balance', 'active', '2026-02-05 09:15:00', @farah_admin_id);

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
  (
    'announcement',
    'Spring registration support desk hours',
    'Academic Staff extended support hours for add-drop, timetable fixes, and registration advice.',
    'The academic office is open weekdays from 09:00 to 17:00 during the add-drop period. Students can visit for registration support, timetable corrections, and course approval follow-up.',
    'important',
    'published',
    TRUE,
    '2026-01-12 08:00:00',
    '2026-02-15 23:59:00',
    '2026-01-12 08:00:00',
    @amina_user_id,
    @amina_user_id
  ),
  (
    'feature',
    'AI Society showcase and innovation forum',
    'Communication Staff published a public event spotlight for the upcoming AI Society showcase.',
    'Join students, instructors, and visitors for project demos, lightning talks, and networking at the AI Society showcase in the Innovation Lounge.',
    'update',
    'published',
    FALSE,
    '2026-04-10 09:00:00',
    '2026-04-30 23:59:00',
    '2026-04-10 09:00:00',
    @kareem_user_id,
    @kareem_user_id
  );

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
  (
    SELECT id FROM clubs WHERE code = 'AI-SOC' LIMIT 1
  ),
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
  @kareem_user_id
);

DELETE nr
FROM notification_recipients nr
JOIN notifications n ON n.id = nr.notification_id
WHERE n.title IN (
  'Academic follow-up on registration',
  'Finance reminder for tuition balance',
  'Teaching assignment confirmed'
);

DELETE FROM notifications
WHERE title IN (
  'Academic follow-up on registration',
  'Finance reminder for tuition balance',
  'Teaching assignment confirmed'
);

INSERT INTO notifications (
  category,
  severity,
  title,
  message,
  action_label,
  action_url,
  source_entity_type,
  source_entity_id,
  created_by_user_id
)
VALUES
  (
    'registration',
    'info',
    'Academic follow-up on registration',
    'Your Spring 2026 registration was approved. Review your timetable and confirm that all required courses appear correctly.',
    'Open registration',
    '/student/registration',
    'enrollment',
    @alex_cs201_enrollment_id,
    @amina_user_id
  ),
  (
    'finance',
    'warning',
    'Finance reminder for tuition balance',
    'A remaining tuition balance of 500.00 USD is due for Spring 2026. Contact Finance Staff if you need a payment plan review.',
    'Open finance',
    '/student/finance',
    'student_invoice',
    @alex_invoice_id,
    @farah_user_id
  ),
  (
    'academic',
    'success',
    'Teaching assignment confirmed',
    'Your instructor workspace is linked to CS201 and CS220 for Spring 2026. Grades and attendance can now be managed from your dashboard.',
    'Open courses',
    '/instructor/courses',
    'course_offering',
    @cs201_offering_id,
    @amina_user_id
  );

SET @registration_notification_id = (
  SELECT id FROM notifications WHERE title = 'Academic follow-up on registration' ORDER BY id DESC LIMIT 1
);
SET @finance_notification_id = (
  SELECT id FROM notifications WHERE title = 'Finance reminder for tuition balance' ORDER BY id DESC LIMIT 1
);
SET @teaching_notification_id = (
  SELECT id FROM notifications WHERE title = 'Teaching assignment confirmed' ORDER BY id DESC LIMIT 1
);

INSERT INTO notification_recipients (notification_id, user_id, delivered_at)
VALUES
  (@registration_notification_id, @alex_user_id, '2026-01-12 09:00:00'),
  (@finance_notification_id, @alex_user_id, '2026-01-28 14:00:00'),
  (@teaching_notification_id, @imran_user_id, '2026-01-09 09:00:00')
ON DUPLICATE KEY UPDATE
  delivered_at = VALUES(delivered_at),
  archived_at = NULL;

COMMIT;
