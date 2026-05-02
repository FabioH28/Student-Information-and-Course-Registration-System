USE cis;

INSERT INTO programs (
  department_id,
  department_code,
  department_name,
  code,
  name,
  degree_level,
  duration_semesters,
  total_credits_required,
  status
)
VALUES
  (1, 'CS', 'Computer Science', 'BSCS', 'B.Sc. Computer Science', 'bachelor', 8, 130, 'active'),
  (2, 'DS', 'Data Science', 'BSDS', 'B.Sc. Data Science', 'bachelor', 8, 128, 'active'),
  (3, 'IS', 'Information Systems', 'BSIS', 'B.Sc. Information Systems', 'bachelor', 8, 126, 'active'),
  (4, 'MATH', 'Mathematics', 'BSMATH', 'B.Sc. Mathematics', 'bachelor', 8, 128, 'active')
ON DUPLICATE KEY UPDATE
  department_id = VALUES(department_id),
  department_code = VALUES(department_code),
  department_name = VALUES(department_name),
  name = VALUES(name),
  degree_level = VALUES(degree_level),
  duration_semesters = VALUES(duration_semesters),
  total_credits_required = VALUES(total_credits_required),
  status = VALUES(status);

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

INSERT INTO courses (
  program_id,
  department_id,
  department_code,
  department_name,
  code,
  title,
  description,
  credit_hours,
  ects_credits,
  recommended_term_number,
  level_number,
  course_type,
  requirement_type,
  grading_scheme,
  is_active
)
SELECT
  p.id,
  p.department_id,
  p.department_code,
  p.department_name,
  payload.code,
  payload.title,
  payload.description,
  payload.credit_hours,
  payload.ects_credits,
  payload.recommended_term_number,
  payload.level_number,
  payload.course_type,
  payload.requirement_type,
  payload.grading_scheme,
  TRUE
FROM (
  SELECT 'BSCS' AS program_code, 'CS201' AS code, 'Data Structures' AS title, 'Core data structures and algorithmic problem solving.' AS description, 3 AS credit_hours, 5.0 AS ects_credits, 3 AS recommended_term_number, 200 AS level_number, 'core' AS course_type, 'core' AS requirement_type, 'letter' AS grading_scheme
  UNION ALL SELECT 'BSCS', 'CS220', 'Database Systems', 'Relational modeling, SQL, and database application design.', 3, 5.0, 4, 200, 'core', 'core', 'letter'
  UNION ALL SELECT 'BSCS', 'CS250', 'AI Foundations', 'Introductory artificial intelligence concepts and applications.', 3, 5.0, 4, 200, 'core', 'core', 'letter'
  UNION ALL SELECT 'BSCS', 'CS301', 'Machine Learning Intro', 'Foundations of supervised and unsupervised machine learning.', 3, 5.0, 6, 300, 'elective', 'elective', 'letter'
  UNION ALL SELECT 'BSCS', 'CS302', 'Software Engineering', 'Software lifecycle, teamwork, and delivery practices.', 3, 5.0, 6, 300, 'core', 'core', 'letter'
  UNION ALL SELECT 'BSCS', 'CS303', 'Computer Networks', 'Network architecture, routing, and systems connectivity.', 3, 5.0, 6, 300, 'elective', 'elective', 'letter'
  UNION ALL SELECT 'BSCS', 'MATH301', 'Linear Algebra', 'Vector spaces, matrices, and eigenvalue methods.', 4, 7.0, 4, 300, 'core', 'core', 'letter'
  UNION ALL SELECT 'BSCS', 'ENG101', 'Technical Writing', 'Professional and academic writing for technical disciplines.', 2, 4.0, 2, 100, 'core', 'core', 'letter'
) AS payload
JOIN programs p ON p.code = payload.program_code
ON DUPLICATE KEY UPDATE
  program_id = VALUES(program_id),
  department_id = VALUES(department_id),
  department_code = VALUES(department_code),
  department_name = VALUES(department_name),
  title = VALUES(title),
  description = VALUES(description),
  credit_hours = VALUES(credit_hours),
  ects_credits = VALUES(ects_credits),
  recommended_term_number = VALUES(recommended_term_number),
  level_number = VALUES(level_number),
  course_type = VALUES(course_type),
  requirement_type = VALUES(requirement_type),
  grading_scheme = VALUES(grading_scheme),
  is_active = VALUES(is_active);

UPDATE courses c
JOIN courses prereq ON prereq.code = 'CS250'
SET c.prerequisite_course_id = prereq.id,
    c.minimum_grade_required = 'C'
WHERE c.code = 'CS301';

UPDATE courses c
JOIN courses prereq ON prereq.code = 'CS201'
SET c.prerequisite_course_id = prereq.id,
    c.minimum_grade_required = 'C'
WHERE c.code = 'CS303';

INSERT INTO course_offerings (
  course_id,
  academic_term_id,
  teacher_id,
  room_id,
  room_code,
  room_name,
  room_type,
  building_id,
  building_code,
  building_name,
  location_name,
  section_code,
  delivery_mode,
  capacity,
  waitlist_capacity,
  status,
  registration_opens_at,
  registration_closes_at,
  schedule_notes,
  meeting_day_of_week,
  meeting_start_time,
  meeting_end_time,
  meeting_type
)
SELECT
  c.id,
  t.id,
  NULL,
  payload.room_id,
  payload.room_code,
  payload.room_name,
  payload.room_type,
  payload.building_id,
  payload.building_code,
  payload.building_name,
  payload.room_name,
  payload.section_code,
  payload.delivery_mode,
  payload.capacity,
  payload.waitlist_capacity,
  payload.status,
  payload.registration_opens_at,
  payload.registration_closes_at,
  payload.schedule_notes,
  payload.meeting_day_of_week,
  payload.meeting_start_time,
  payload.meeting_end_time,
  payload.meeting_type
FROM (
  SELECT 'CS201' AS course_code, '2026-SPRING' AS term_code, 'A' AS section_code, 'onsite' AS delivery_mode, 60 AS capacity, 10 AS waitlist_capacity, 'open' AS status, '2025-12-01 09:00:00' AS registration_opens_at, '2026-01-20 17:00:00' AS registration_closes_at, 'Structured around two weekly meetings.' AS schedule_notes, 1 AS room_id, 'A-201' AS room_code, 'Hall A-201' AS room_name, 'lecture' AS room_type, 1 AS building_id, 'ENG' AS building_code, 'Engineering Hall' AS building_name, 'monday' AS meeting_day_of_week, '09:00:00' AS meeting_start_time, '10:30:00' AS meeting_end_time, 'lecture' AS meeting_type
  UNION ALL SELECT 'MATH301', '2026-SPRING', 'A', 'onsite', 55, 8, 'open', '2025-12-01 09:00:00', '2026-01-20 17:00:00', 'Linear algebra lecture block.', 2, 'B-105', 'Hall B-105', 'lecture', 2, 'SCI', 'Science Center', 'monday', '11:00:00', '12:30:00', 'lecture'
  UNION ALL SELECT 'CS250', '2026-SPRING', 'A', 'hybrid', 40, 8, 'open', '2025-12-01 09:00:00', '2026-01-20 17:00:00', 'Includes lab-supported sessions.', 3, 'LAB-C302', 'AI Lab C-302', 'lab', 1, 'ENG', 'Engineering Hall', 'tuesday', '14:00:00', '15:30:00', 'lab'
  UNION ALL SELECT 'CS220', '2026-SPRING', 'A', 'onsite', 40, 6, 'open', '2025-12-01 09:00:00', '2026-01-20 17:00:00', 'Database lab and lecture pairing.', 4, 'C-110', 'Seminar C-110', 'seminar', 2, 'SCI', 'Science Center', 'tuesday', '09:00:00', '10:30:00', 'lecture'
  UNION ALL SELECT 'ENG101', '2026-SPRING', 'A', 'onsite', 35, 4, 'open', '2025-12-01 09:00:00', '2026-01-20 17:00:00', 'Writing intensive seminar.', 5, 'D-201', 'Writing Room D-201', 'seminar', 2, 'SCI', 'Science Center', 'friday', '10:00:00', '12:00:00', 'seminar'
  UNION ALL SELECT 'CS301', '2026-SPRING', 'A', 'onsite', 32, 8, 'open', '2025-12-01 09:00:00', '2026-01-20 17:00:00', 'Elective focused on applied ML.', 3, 'LAB-C302', 'AI Lab C-302', 'lab', 1, 'ENG', 'Engineering Hall', 'friday', '13:00:00', '15:00:00', 'lab'
) AS payload
JOIN courses c ON c.code = payload.course_code
JOIN academic_terms t ON t.code = payload.term_code
ON DUPLICATE KEY UPDATE
  room_id = VALUES(room_id),
  room_code = VALUES(room_code),
  room_name = VALUES(room_name),
  room_type = VALUES(room_type),
  building_id = VALUES(building_id),
  building_code = VALUES(building_code),
  building_name = VALUES(building_name),
  location_name = VALUES(location_name),
  delivery_mode = VALUES(delivery_mode),
  capacity = VALUES(capacity),
  waitlist_capacity = VALUES(waitlist_capacity),
  status = VALUES(status),
  registration_opens_at = VALUES(registration_opens_at),
  registration_closes_at = VALUES(registration_closes_at),
  schedule_notes = VALUES(schedule_notes),
  meeting_day_of_week = VALUES(meeting_day_of_week),
  meeting_start_time = VALUES(meeting_start_time),
  meeting_end_time = VALUES(meeting_end_time),
  meeting_type = VALUES(meeting_type);

INSERT INTO clubs (
  category_id,
  category_code,
  category_name,
  code,
  name,
  slug,
  description,
  join_mode,
  status,
  capacity,
  meeting_day_of_week,
  meeting_start_time,
  meeting_end_time,
  meeting_location,
  contact_email
)
VALUES
  (1, 'ACADEMIC', 'Academic', 'AI-SOC', 'AI Society', 'ai-society', 'Talks, student-led experiments, and career sessions around AI and machine learning.', 'open', 'recruiting', 80, 'tuesday', '18:00:00', '19:30:00', 'Innovation Lounge', 'ai-society@campus.edu'),
  (2, 'ENGINEERING', 'Engineering', 'ROBO', 'Robotics Society', 'robotics-society', 'Hands-on robotics builds, demos, and competition prep.', 'request', 'active', 60, 'wednesday', '17:00:00', '18:30:00', 'Engineering Lab Atrium', 'robotics@campus.edu'),
  (4, 'LEADERSHIP', 'Leadership', 'DEBATE', 'Debate Union', 'debate-union', 'Public speaking practice, debate tournaments, and leadership workshops.', 'open', 'active', 40, 'thursday', '17:30:00', '19:00:00', 'Seminar Hall 2', 'debate@campus.edu'),
  (3, 'ARTS', 'Arts', 'MUSIC', 'Music Circle', 'music-circle', 'Performance nights, rehearsal groups, and collaborative campus arts projects.', 'waitlist', 'recruiting', 50, 'monday', '16:00:00', '18:00:00', 'Performing Arts Studio', 'music@campus.edu')
ON DUPLICATE KEY UPDATE
  category_id = VALUES(category_id),
  category_code = VALUES(category_code),
  category_name = VALUES(category_name),
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
  published_at
)
VALUES
  ('announcement', 'Registration period extended for Spring electives', 'Course registration for elective offerings now remains open through April 18 due to strong demand.', 'Students can continue reviewing and selecting open elective offerings through the extended registration window.', 'important', 'published', TRUE, '2026-04-01 00:00:00', '2026-05-01 23:59:59', '2026-04-05 08:00:00'),
  ('update', 'Library support hours updated during exam season', 'The central library will stay open until 11 PM on weekdays starting April 15.', 'Expanded hours also include extended tutoring-support access in the study commons.', 'update', 'published', FALSE, '2026-04-10 00:00:00', '2026-05-20 23:59:59', '2026-04-10 09:00:00'),
  ('notice', 'Midterm grading window opens Monday', 'Faculty begin publishing midterm grades across active offerings next week.', 'Students should monitor their grades workspace and inbox for newly published assessment results.', 'notice', 'published', FALSE, '2026-04-08 00:00:00', '2026-04-30 23:59:59', '2026-04-09 12:00:00')
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
  status
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
  payload.status
FROM (
  SELECT 'AI-SOC' AS club_code, 'AI Career Panel' AS title, 'Career panel featuring alumni and industry guests from AI product and research teams.' AS description, 'Career Center x AI Society' AS organizer_name, 'networking' AS event_type, 'Innovation Hall' AS location_name, 'onsite' AS delivery_mode, '2026-04-24 16:00:00' AS starts_at, '2026-04-24 18:00:00' AS ends_at, TRUE AS registration_required, 180 AS capacity, 126 AS expected_attendees, 'open' AS status
  UNION ALL SELECT 'ROBO', 'Robotics Demo Night', 'Live demos of current robotics builds and open project showcases.', 'Robotics Society', 'showcase', 'Engineering Atrium', 'onsite', '2026-04-18 18:00:00', '2026-04-18 20:00:00', FALSE, 120, 90, 'scheduled'
  UNION ALL SELECT NULL, 'Financial Aid Q&A Session', 'Finance office Q&A covering scholarships, balances, and payment timelines.', 'Finance Office', 'info_session', 'Online', 'online', '2026-04-29 14:30:00', '2026-04-29 15:30:00', TRUE, 250, 140, 'open'
  UNION ALL SELECT NULL, 'Open Day for Student Clubs', 'Campus-wide fair introducing active student clubs and societies.', 'Student Affairs', 'campus_event', 'Central Courtyard', 'onsite', '2026-04-26 11:00:00', '2026-04-26 15:00:00', FALSE, 500, 220, 'open'
) AS payload
LEFT JOIN clubs c ON c.code = payload.club_code
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
