USE cis;

INSERT INTO departments (code, name, description, status)
VALUES
  ('CS', 'Computer Science', 'Department of Computer Science.', 'active'),
  ('DS', 'Data Science', 'Department of Data Science and Analytics.', 'active'),
  ('IS', 'Information Systems', 'Department of Information Systems.', 'active'),
  ('MATH', 'Mathematics', 'Department of Mathematics.', 'active')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  status = VALUES(status);

INSERT INTO programs (department_id, code, name, degree_level, duration_semesters, total_credits_required, status)
SELECT d.id, payload.code, payload.name, payload.degree_level, payload.duration_semesters, payload.total_credits_required, payload.status
FROM (
  SELECT 'CS' AS department_code, 'BSCS' AS code, 'B.Sc. Computer Science' AS name, 'bachelor' AS degree_level, 8 AS duration_semesters, 130 AS total_credits_required, 'active' AS status
  UNION ALL SELECT 'DS', 'BSDS', 'B.Sc. Data Science', 'bachelor', 8, 128, 'active'
  UNION ALL SELECT 'IS', 'BSIS', 'B.Sc. Information Systems', 'bachelor', 8, 126, 'active'
  UNION ALL SELECT 'MATH', 'BSMATH', 'B.Sc. Mathematics', 'bachelor', 8, 128, 'active'
) AS payload
JOIN departments d ON d.code = payload.department_code
ON DUPLICATE KEY UPDATE
  department_id = VALUES(department_id),
  name = VALUES(name),
  degree_level = VALUES(degree_level),
  duration_semesters = VALUES(duration_semesters),
  total_credits_required = VALUES(total_credits_required),
  status = VALUES(status);

INSERT INTO buildings (code, name, description)
VALUES
  ('ENG', 'Engineering Hall', 'Engineering classrooms and laboratories.'),
  ('SCI', 'Science Center', 'Lecture rooms and science laboratories.'),
  ('ADM', 'Administration Block', 'Administrative services and meeting rooms.')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description);

INSERT INTO rooms (building_id, code, name, capacity, room_type)
SELECT b.id, payload.code, payload.name, payload.capacity, payload.room_type
FROM (
  SELECT 'ENG' AS building_code, 'A-201' AS code, 'Hall A-201' AS name, 60 AS capacity, 'lecture' AS room_type
  UNION ALL SELECT 'ENG', 'LAB-C302', 'AI Lab C-302', 32, 'lab'
  UNION ALL SELECT 'SCI', 'B-105', 'Hall B-105', 55, 'lecture'
  UNION ALL SELECT 'SCI', 'C-110', 'Seminar C-110', 40, 'seminar'
  UNION ALL SELECT 'SCI', 'D-201', 'Writing Room D-201', 35, 'seminar'
  UNION ALL SELECT 'ADM', 'ONLINE', 'Online Delivery', 999, 'online'
) AS payload
JOIN buildings b ON b.code = payload.building_code
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  capacity = VALUES(capacity),
  room_type = VALUES(room_type);

UPDATE academic_terms SET is_current = FALSE;

INSERT INTO academic_terms (
  code,
  name,
  academic_year_start,
  academic_year_end,
  term_number,
  start_date,
  end_date,
  registration_start_at,
  registration_end_at,
  status,
  is_current
)
VALUES
  ('2025-FALL', 'Fall 2025', 2025, 2026, 1, '2025-08-20', '2025-12-15', '2025-07-01 09:00:00', '2025-08-25 17:00:00', 'completed', FALSE),
  ('2026-SPRING', 'Spring 2026', 2025, 2026, 2, '2026-01-15', '2026-05-30', '2025-12-01 09:00:00', '2026-01-20 17:00:00', 'active', TRUE),
  ('2026-SUMMER', 'Summer 2026', 2026, 2027, 3, '2026-06-10', '2026-08-05', '2026-05-05 09:00:00', '2026-06-05 17:00:00', 'planning', FALSE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  academic_year_start = VALUES(academic_year_start),
  academic_year_end = VALUES(academic_year_end),
  term_number = VALUES(term_number),
  start_date = VALUES(start_date),
  end_date = VALUES(end_date),
  registration_start_at = VALUES(registration_start_at),
  registration_end_at = VALUES(registration_end_at),
  status = VALUES(status),
  is_current = VALUES(is_current);

INSERT INTO courses (department_id, code, title, description, credit_hours, level_number, course_type, grading_scheme, is_active)
SELECT d.id, payload.code, payload.title, payload.description, payload.credit_hours, payload.level_number, payload.course_type, payload.grading_scheme, TRUE
FROM (
  SELECT 'CS' AS department_code, 'CS201' AS code, 'Data Structures' AS title, 'Core data structures and algorithmic problem solving.' AS description, 3 AS credit_hours, 200 AS level_number, 'core' AS course_type, 'letter' AS grading_scheme
  UNION ALL SELECT 'CS', 'CS220', 'Database Systems', 'Relational modeling, SQL, and database application design.', 3, 200, 'core', 'letter'
  UNION ALL SELECT 'CS', 'CS250', 'AI Foundations', 'Introductory artificial intelligence concepts and applications.', 3, 200, 'core', 'letter'
  UNION ALL SELECT 'CS', 'CS301', 'Machine Learning Intro', 'Foundations of supervised and unsupervised machine learning.', 3, 300, 'elective', 'letter'
  UNION ALL SELECT 'CS', 'CS302', 'Software Engineering', 'Software lifecycle, teamwork, and delivery practices.', 3, 300, 'core', 'letter'
  UNION ALL SELECT 'CS', 'CS303', 'Computer Networks', 'Network architecture, routing, and systems connectivity.', 3, 300, 'elective', 'letter'
  UNION ALL SELECT 'MATH', 'MATH301', 'Linear Algebra', 'Vector spaces, matrices, and eigenvalue methods.', 4, 300, 'core', 'letter'
  UNION ALL SELECT 'IS', 'ENG101', 'Technical Writing', 'Professional and academic writing for technical disciplines.', 2, 100, 'core', 'letter'
) AS payload
JOIN departments d ON d.code = payload.department_code
ON DUPLICATE KEY UPDATE
  department_id = VALUES(department_id),
  title = VALUES(title),
  description = VALUES(description),
  credit_hours = VALUES(credit_hours),
  level_number = VALUES(level_number),
  course_type = VALUES(course_type),
  grading_scheme = VALUES(grading_scheme),
  is_active = VALUES(is_active);

INSERT INTO program_courses (program_id, course_id, recommended_term_number, requirement_type, is_active)
SELECT p.id, c.id, payload.recommended_term_number, payload.requirement_type, TRUE
FROM (
  SELECT 'BSCS' AS program_code, 'CS201' AS course_code, 3 AS recommended_term_number, 'core' AS requirement_type
  UNION ALL SELECT 'BSCS', 'CS220', 4, 'core'
  UNION ALL SELECT 'BSCS', 'CS250', 4, 'core'
  UNION ALL SELECT 'BSCS', 'CS301', 6, 'elective'
  UNION ALL SELECT 'BSCS', 'CS302', 6, 'core'
  UNION ALL SELECT 'BSCS', 'CS303', 6, 'elective'
  UNION ALL SELECT 'BSCS', 'MATH301', 4, 'core'
  UNION ALL SELECT 'BSCS', 'ENG101', 2, 'core'
) AS payload
JOIN programs p ON p.code = payload.program_code
JOIN courses c ON c.code = payload.course_code
ON DUPLICATE KEY UPDATE
  recommended_term_number = VALUES(recommended_term_number),
  requirement_type = VALUES(requirement_type),
  is_active = VALUES(is_active);

INSERT INTO course_prerequisites (course_id, prerequisite_course_id, minimum_grade_required)
SELECT c.id, prereq.id, payload.minimum_grade_required
FROM (
  SELECT 'CS301' AS course_code, 'CS250' AS prerequisite_code, 'C' AS minimum_grade_required
  UNION ALL SELECT 'CS303', 'CS201', 'C'
) AS payload
JOIN courses c ON c.code = payload.course_code
JOIN courses prereq ON prereq.code = payload.prerequisite_code
ON DUPLICATE KEY UPDATE
  minimum_grade_required = VALUES(minimum_grade_required);

INSERT INTO course_offerings (
  course_id,
  academic_term_id,
  teacher_id,
  room_id,
  section_code,
  delivery_mode,
  capacity,
  waitlist_capacity,
  status,
  registration_opens_at,
  registration_closes_at,
  schedule_notes,
  created_by_user_id
)
SELECT
  c.id,
  t.id,
  NULL,
  r.id,
  payload.section_code,
  payload.delivery_mode,
  payload.capacity,
  payload.waitlist_capacity,
  payload.status,
  payload.registration_opens_at,
  payload.registration_closes_at,
  payload.schedule_notes,
  NULL
FROM (
  SELECT 'CS201' AS course_code, '2026-SPRING' AS term_code, 'A' AS section_code, 'onsite' AS delivery_mode, 60 AS capacity, 10 AS waitlist_capacity, 'open' AS status, '2025-12-01 09:00:00' AS registration_opens_at, '2026-01-20 17:00:00' AS registration_closes_at, 'Structured around two weekly meetings.' AS schedule_notes, 'A-201' AS room_code
  UNION ALL SELECT 'MATH301', '2026-SPRING', 'A', 'onsite', 55, 8, 'open', '2025-12-01 09:00:00', '2026-01-20 17:00:00', 'Linear algebra lecture block.', 'B-105'
  UNION ALL SELECT 'CS250', '2026-SPRING', 'A', 'hybrid', 40, 8, 'open', '2025-12-01 09:00:00', '2026-01-20 17:00:00', 'Includes lab-supported sessions.', 'LAB-C302'
  UNION ALL SELECT 'CS220', '2026-SPRING', 'A', 'onsite', 40, 6, 'open', '2025-12-01 09:00:00', '2026-01-20 17:00:00', 'Database lab and lecture pairing.', 'C-110'
  UNION ALL SELECT 'ENG101', '2026-SPRING', 'A', 'onsite', 35, 4, 'open', '2025-12-01 09:00:00', '2026-01-20 17:00:00', 'Writing intensive seminar.', 'D-201'
  UNION ALL SELECT 'CS301', '2026-SPRING', 'A', 'onsite', 32, 8, 'open', '2025-12-01 09:00:00', '2026-01-20 17:00:00', 'Elective focused on applied ML.', 'LAB-C302'
) AS payload
JOIN courses c ON c.code = payload.course_code
JOIN academic_terms t ON t.code = payload.term_code
LEFT JOIN rooms r ON r.code = payload.room_code
ON DUPLICATE KEY UPDATE
  room_id = VALUES(room_id),
  delivery_mode = VALUES(delivery_mode),
  capacity = VALUES(capacity),
  waitlist_capacity = VALUES(waitlist_capacity),
  status = VALUES(status),
  registration_opens_at = VALUES(registration_opens_at),
  registration_closes_at = VALUES(registration_closes_at),
  schedule_notes = VALUES(schedule_notes);

INSERT INTO course_meetings (course_offering_id, room_id, day_of_week, start_time, end_time, meeting_type)
SELECT
  co.id,
  r.id,
  payload.day_of_week,
  payload.start_time,
  payload.end_time,
  payload.meeting_type
FROM (
  SELECT 'CS201' AS course_code, '2026-SPRING' AS term_code, 'A' AS section_code, 'A-201' AS room_code, 'monday' AS day_of_week, '09:00:00' AS start_time, '10:30:00' AS end_time, 'lecture' AS meeting_type
  UNION ALL SELECT 'CS201', '2026-SPRING', 'A', 'A-201', 'wednesday', '09:00:00', '10:30:00', 'lecture'
  UNION ALL SELECT 'MATH301', '2026-SPRING', 'A', 'B-105', 'monday', '11:00:00', '12:30:00', 'lecture'
  UNION ALL SELECT 'MATH301', '2026-SPRING', 'A', 'B-105', 'wednesday', '11:00:00', '12:30:00', 'lecture'
  UNION ALL SELECT 'CS220', '2026-SPRING', 'A', 'C-110', 'tuesday', '09:00:00', '10:30:00', 'lecture'
  UNION ALL SELECT 'CS220', '2026-SPRING', 'A', 'C-110', 'thursday', '09:00:00', '10:30:00', 'lecture'
  UNION ALL SELECT 'CS250', '2026-SPRING', 'A', 'LAB-C302', 'tuesday', '14:00:00', '15:30:00', 'lab'
  UNION ALL SELECT 'CS250', '2026-SPRING', 'A', 'LAB-C302', 'thursday', '14:00:00', '15:30:00', 'lecture'
  UNION ALL SELECT 'ENG101', '2026-SPRING', 'A', 'D-201', 'friday', '10:00:00', '12:00:00', 'seminar'
  UNION ALL SELECT 'CS301', '2026-SPRING', 'A', 'LAB-C302', 'friday', '13:00:00', '15:00:00', 'lab'
) AS payload
JOIN courses c ON c.code = payload.course_code
JOIN academic_terms t ON t.code = payload.term_code
JOIN course_offerings co ON co.course_id = c.id AND co.academic_term_id = t.id AND co.section_code = payload.section_code
LEFT JOIN rooms r ON r.code = payload.room_code
ON DUPLICATE KEY UPDATE
  room_id = VALUES(room_id),
  day_of_week = VALUES(day_of_week),
  start_time = VALUES(start_time),
  end_time = VALUES(end_time),
  meeting_type = VALUES(meeting_type);

INSERT INTO clubs (
  category_id,
  code,
  name,
  slug,
  description,
  advisor_teacher_id,
  managed_by_admin_id,
  join_mode,
  status,
  capacity,
  meeting_day_of_week,
  meeting_start_time,
  meeting_end_time,
  meeting_location,
  contact_email
)
SELECT
  cc.id,
  payload.code,
  payload.name,
  payload.slug,
  payload.description,
  NULL,
  NULL,
  payload.join_mode,
  payload.status,
  payload.capacity,
  payload.meeting_day_of_week,
  payload.meeting_start_time,
  payload.meeting_end_time,
  payload.meeting_location,
  payload.contact_email
FROM (
  SELECT 'ACADEMIC' AS category_code, 'AI-SOC' AS code, 'AI Society' AS name, 'ai-society' AS slug, 'Talks, student-led experiments, and career sessions around AI and machine learning.' AS description, 'open' AS join_mode, 'recruiting' AS status, 80 AS capacity, 'tuesday' AS meeting_day_of_week, '18:00:00' AS meeting_start_time, '19:30:00' AS meeting_end_time, 'Innovation Lounge' AS meeting_location, 'ai-society@campus.edu' AS contact_email
  UNION ALL SELECT 'ENGINEERING', 'ROBO', 'Robotics Society', 'robotics-society', 'Hands-on robotics builds, demos, and competition prep.', 'request', 'active', 60, 'wednesday', '17:00:00', '18:30:00', 'Engineering Lab Atrium', 'robotics@campus.edu'
  UNION ALL SELECT 'LEADERSHIP', 'DEBATE', 'Debate Union', 'debate-union', 'Public speaking practice, debate tournaments, and leadership workshops.', 'open', 'active', 40, 'thursday', '17:30:00', '19:00:00', 'Seminar Hall 2', 'debate@campus.edu'
  UNION ALL SELECT 'ARTS', 'MUSIC', 'Music Circle', 'music-circle', 'Performance nights, rehearsal groups, and collaborative campus arts projects.', 'waitlist', 'recruiting', 50, 'monday', '16:00:00', '18:00:00', 'Performing Arts Studio', 'music@campus.edu'
) AS payload
JOIN club_categories cc ON cc.code = payload.category_code
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  slug = VALUES(slug),
  description = VALUES(description),
  join_mode = VALUES(join_mode),
  status = VALUES(status),
  capacity = VALUES(capacity),
  meeting_day_of_week = VALUES(meeting_day_of_week),
  meeting_start_time = VALUES(meeting_start_time),
  meeting_end_time = VALUES(meeting_end_time),
  meeting_location = VALUES(meeting_location),
  contact_email = VALUES(contact_email);

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
  ('announcement', 'Registration period extended for Spring electives', 'Course registration for elective offerings now remains open through April 18 due to strong demand.', 'Students can continue reviewing and selecting open elective offerings through the extended registration window.', 'important', 'published', TRUE, '2026-04-01 00:00:00', '2026-05-01 23:59:59', '2026-04-05 08:00:00', NULL, NULL),
  ('update', 'Library support hours updated during exam season', 'The central library will stay open until 11 PM on weekdays starting April 15.', 'Expanded hours also include extended tutoring-support access in the study commons.', 'update', 'published', FALSE, '2026-04-10 00:00:00', '2026-05-20 23:59:59', '2026-04-10 09:00:00', NULL, NULL),
  ('notice', 'Midterm grading window opens Monday', 'Faculty begin publishing midterm grades across active offerings next week.', 'Students should monitor their grades workspace and inbox for newly published assessment results.', 'notice', 'published', FALSE, '2026-04-08 00:00:00', '2026-04-30 23:59:59', '2026-04-09 12:00:00', NULL, NULL)
ON DUPLICATE KEY UPDATE
  summary = VALUES(summary),
  body = VALUES(body),
  priority = VALUES(priority),
  status = VALUES(status),
  featured = VALUES(featured),
  visible_from = VALUES(visible_from),
  visible_until = VALUES(visible_until),
  published_at = VALUES(published_at);

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
SELECT
  c.id,
  payload.title,
  payload.description,
  payload.organizer_name,
  payload.event_type,
  payload.location_name,
  payload.delivery_mode,
  payload.starts_at,
  payload.ends_at,
  payload.registration_required,
  payload.capacity,
  payload.expected_attendees,
  payload.status,
  NULL
FROM (
  SELECT 'AI Society' AS club_name, 'AI Career Panel' AS title, 'Career panel featuring alumni and industry guests from AI product and research teams.' AS description, 'Career Center x AI Society' AS organizer_name, 'networking' AS event_type, 'Innovation Hall' AS location_name, 'onsite' AS delivery_mode, '2026-04-24 16:00:00' AS starts_at, '2026-04-24 18:00:00' AS ends_at, TRUE AS registration_required, 180 AS capacity, 126 AS expected_attendees, 'open' AS status
  UNION ALL SELECT 'Robotics Society', 'Robotics Demo Night', 'Live demos of current robotics builds and open project showcases.', 'Robotics Society', 'showcase', 'Engineering Atrium', 'onsite', '2026-04-18 18:00:00', '2026-04-18 20:00:00', FALSE, 120, 90, 'scheduled'
  UNION ALL SELECT NULL, 'Financial Aid Q&A Session', 'Finance office Q&A covering scholarships, balances, and payment timelines.', 'Finance Office', 'info_session', 'Online', 'online', '2026-04-29 14:30:00', '2026-04-29 15:30:00', TRUE, 250, 140, 'open'
  UNION ALL SELECT NULL, 'Open Day for Student Clubs', 'Campus-wide fair introducing active student clubs and societies.', 'Student Affairs', 'campus_event', 'Central Courtyard', 'onsite', '2026-04-26 11:00:00', '2026-04-26 15:00:00', FALSE, 500, 220, 'open'
) AS payload
LEFT JOIN clubs c ON c.name = payload.club_name
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  organizer_name = VALUES(organizer_name),
  event_type = VALUES(event_type),
  location_name = VALUES(location_name),
  delivery_mode = VALUES(delivery_mode),
  starts_at = VALUES(starts_at),
  ends_at = VALUES(ends_at),
  registration_required = VALUES(registration_required),
  capacity = VALUES(capacity),
  expected_attendees = VALUES(expected_attendees),
  status = VALUES(status);
