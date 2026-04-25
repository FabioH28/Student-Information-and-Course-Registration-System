USE cis;

-- Source data adapted from sample graduate catalog data.
-- Only program, curriculum, course, and ECTS data are imported here. No professor or staff names are copied.
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS ects_credits DECIMAL(4,1) NULL AFTER credit_hours;

UPDATE courses
SET ects_credits = credit_hours
WHERE ects_credits IS NULL;

INSERT INTO departments (code, name, description, status)
VALUES
  (
    'GRADCSIT',
    'Graduate Faculty of Computer Science and IT',
    'Academic catalog seeded from sample graduate catalog master-level curricula.',
    'active'
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  status = VALUES(status);

INSERT INTO programs (
  department_id,
  code,
  name,
  degree_level,
  duration_semesters,
  total_credits_required,
  status
)
SELECT
  d.id,
  'GRAD-MSSE',
  'Master of Science in Software Engineering',
  'master',
  4,
  120,
  'active'
FROM departments d
WHERE d.code = 'GRADCSIT'
ON DUPLICATE KEY UPDATE
  department_id = VALUES(department_id),
  name = VALUES(name),
  degree_level = VALUES(degree_level),
  duration_semesters = VALUES(duration_semesters),
  total_credits_required = VALUES(total_credits_required),
  status = VALUES(status);

INSERT INTO courses (
  department_id,
  code,
  title,
  description,
  credit_hours,
  ects_credits,
  level_number,
  course_type,
  grading_scheme,
  is_active
)
SELECT
  d.id,
  payload.code,
  payload.title,
  payload.description,
  payload.credit_hours,
  payload.ects_credits,
  payload.level_number,
  payload.course_type,
  payload.grading_scheme,
  TRUE
FROM (
  SELECT 'INF401' AS code, 'Advanced Object Oriented Programming' AS title, 'Imported from the sample Master of Science in Software Engineering curriculum, first year semester I.', 9 AS credit_hours, 9.0 AS ects_credits, 400 AS level_number, 'core' AS course_type, 'letter' AS grading_scheme, 'Research-oriented advanced programming course for object-oriented software development.' AS description
  UNION ALL SELECT 'MTH401', 'Advanced Numerical Methods', 'Imported from the sample Master of Science in Software Engineering curriculum, first year semester I.', 9, 9.0, 400, 'core', 'letter', 'Advanced numerical and computational techniques for scientific and software engineering problems.'
  UNION ALL SELECT 'INF402', 'Advanced Database Systems', 'Imported from the sample Master of Science in Software Engineering curriculum, first year semester I.', 6, 6.0, 400, 'core', 'letter', 'Advanced database system concepts, architectures, and data management techniques.'
  UNION ALL SELECT 'AI401', 'Advanced Machine Learning', 'Imported from the sample Master of Science in Software Engineering curriculum, first year semester I.', 6, 6.0, 400, 'elective', 'letter', 'Advanced machine learning methods and applied model development.'
  UNION ALL SELECT 'INF403', 'Advanced Data Structure', 'Imported from the sample Master of Science in Software Engineering curriculum, first year semester II.', 6, 6.0, 400, 'core', 'letter', 'Advanced data structures and performance-oriented implementation strategies.'
  UNION ALL SELECT 'SWE401', 'Software Testing and Verification', 'Imported from the sample Master of Science in Software Engineering curriculum, first year semester II.', 9, 9.0, 400, 'core', 'letter', 'Advanced testing, verification, and quality assurance techniques for software systems.'
  UNION ALL SELECT 'INF404', 'Mobile Programming', 'Imported from the sample Master of Science in Software Engineering curriculum, first year semester II.', 6, 6.0, 400, 'core', 'letter', 'Design and implementation of mobile applications and related software architecture patterns.'
  UNION ALL SELECT 'SWE402', 'Advanced Software Engineering', 'Imported from the sample Master of Science in Software Engineering curriculum, first year semester II.', 9, 9.0, 400, 'core', 'letter', 'Advanced methods for software engineering process, architecture, and evolution.'
  UNION ALL SELECT 'COM502', 'Informatics System Security', 'Imported from the sample Master of Science in Software Engineering curriculum, second year semester I.', 6, 6.0, 500, 'core', 'letter', 'Security foundations and controls for information systems and digital infrastructure.'
  UNION ALL SELECT 'BUS561', 'Engineering Project Management', 'Imported from the sample Master of Science in Software Engineering curriculum, second year semester I.', 6, 6.0, 500, 'core', 'letter', 'Project management methods tailored to engineering and software delivery contexts.'
  UNION ALL SELECT 'COM402', 'Research methods', 'Imported from the sample Master of Science in Software Engineering curriculum, second year semester I.', 9, 9.0, 500, 'core', 'letter', 'Research design, methodology, evaluation, and scientific communication for advanced studies.'
  UNION ALL SELECT 'AI404', 'Natural Language Processing', 'Imported from the sample Master of Science in Software Engineering elective list.', 9, 9.0, 500, 'elective', 'letter', 'Natural language processing methods and intelligent language applications.'
  UNION ALL SELECT 'COM403', 'Distributed Systems', 'Imported from the sample Master of Science in Software Engineering elective list.', 9, 9.0, 500, 'elective', 'letter', 'Architectures and coordination models for distributed computing systems.'
  UNION ALL SELECT 'COM401', 'Advanced Computer Networks', 'Imported from the sample Master of Science in Software Engineering elective list.', 9, 9.0, 500, 'elective', 'letter', 'Advanced network architectures, protocols, and performance concerns.'
  UNION ALL SELECT 'INF406', 'Advanced Web Programming', 'Imported from the sample Master of Science in Software Engineering elective list.', 9, 9.0, 500, 'elective', 'letter', 'Modern advanced web application design and implementation techniques.'
  UNION ALL SELECT 'INF407', 'Information Retrieval', 'Imported from the sample Master of Science in Software Engineering elective list.', 9, 9.0, 500, 'elective', 'letter', 'Search, indexing, ranking, and retrieval methods for information systems.'
  UNION ALL SELECT 'INF408', 'Visual Programming Languages', 'Imported from the sample Master of Science in Software Engineering elective list.', 9, 9.0, 500, 'elective', 'letter', 'Advanced study of visual programming approaches and related language paradigms.'
  UNION ALL SELECT 'SWE590', 'Diploma Thesis', 'Imported from the sample Master of Science in Software Engineering curriculum, second year semester II.', 18, 18.0, 500, 'project', 'pass_fail', 'Master-level thesis or capstone research deliverable.'
  UNION ALL SELECT 'SWE591', 'Practice', 'Imported from the sample Master of Science in Software Engineering curriculum, second year semester II.', 12, 12.0, 500, 'project', 'pass_fail', 'Supervised practice or internship component of the master program.'
) AS payload
JOIN departments d ON d.code = 'GRADCSIT'
ON DUPLICATE KEY UPDATE
  department_id = VALUES(department_id),
  title = VALUES(title),
  description = VALUES(description),
  credit_hours = VALUES(credit_hours),
  ects_credits = VALUES(ects_credits),
  level_number = VALUES(level_number),
  course_type = VALUES(course_type),
  grading_scheme = VALUES(grading_scheme),
  is_active = VALUES(is_active);

INSERT INTO program_courses (
  program_id,
  course_id,
  recommended_term_number,
  requirement_type,
  is_active
)
SELECT
  p.id,
  c.id,
  payload.recommended_term_number,
  payload.requirement_type,
  TRUE
FROM (
  SELECT 'INF401' AS course_code, 1 AS recommended_term_number, 'core' AS requirement_type
  UNION ALL SELECT 'MTH401', 1, 'core'
  UNION ALL SELECT 'INF402', 1, 'core'
  UNION ALL SELECT 'AI401', 1, 'elective'
  UNION ALL SELECT 'INF403', 2, 'core'
  UNION ALL SELECT 'SWE401', 2, 'core'
  UNION ALL SELECT 'INF404', 2, 'core'
  UNION ALL SELECT 'SWE402', 2, 'core'
  UNION ALL SELECT 'COM502', 3, 'core'
  UNION ALL SELECT 'BUS561', 3, 'core'
  UNION ALL SELECT 'COM402', 3, 'core'
  UNION ALL SELECT 'AI404', 3, 'elective'
  UNION ALL SELECT 'COM403', 3, 'elective'
  UNION ALL SELECT 'COM401', 3, 'elective'
  UNION ALL SELECT 'INF406', 3, 'elective'
  UNION ALL SELECT 'INF407', 3, 'elective'
  UNION ALL SELECT 'INF408', 3, 'elective'
  UNION ALL SELECT 'SWE590', 4, 'core'
  UNION ALL SELECT 'SWE591', 4, 'core'
) AS payload
JOIN programs p ON p.code = 'GRAD-MSSE'
JOIN courses c ON c.code = payload.course_code
ON DUPLICATE KEY UPDATE
  recommended_term_number = VALUES(recommended_term_number),
  requirement_type = VALUES(requirement_type),
  is_active = VALUES(is_active);

INSERT INTO course_prerequisites (course_id, prerequisite_course_id, minimum_grade_required)
SELECT c.id, prereq.id, payload.minimum_grade_required
FROM (
  SELECT 'INF403' AS course_code, 'INF401' AS prerequisite_code, 'C' AS minimum_grade_required
  UNION ALL SELECT 'SWE402', 'SWE401', 'C'
  UNION ALL SELECT 'COM502', 'INF402', 'C'
  UNION ALL SELECT 'SWE590', 'COM402', 'C'
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
  SELECT 'INF401' AS course_code, '2026-SPRING' AS term_code, 'M1' AS section_code, 'onsite' AS delivery_mode, 28 AS capacity, 4 AS waitlist_capacity, 'open' AS status, '2025-12-01 09:00:00' AS registration_opens_at, '2026-01-20 17:00:00' AS registration_closes_at, 'Graduate MSc Software Engineering sample cohort offering for semester 1.' AS schedule_notes, 'C-110' AS room_code
  UNION ALL SELECT 'INF402', '2026-SPRING', 'M1', 'hybrid', 24, 4, 'open', '2025-12-01 09:00:00', '2026-01-20 17:00:00', 'Graduate MSc Software Engineering sample cohort offering for semester 1.', 'LAB-C302'
  UNION ALL SELECT 'SWE401', '2026-SPRING', 'M1', 'onsite', 24, 3, 'open', '2025-12-01 09:00:00', '2026-01-20 17:00:00', 'Graduate MSc Software Engineering sample cohort offering for semester 2.', 'A-201'
  UNION ALL SELECT 'COM502', '2026-SPRING', 'M1', 'onsite', 22, 3, 'open', '2025-12-01 09:00:00', '2026-01-20 17:00:00', 'Graduate MSc Software Engineering sample cohort offering for semester 3.', 'B-105'
  UNION ALL SELECT 'AI404', '2026-SPRING', 'M1', 'online', 20, 5, 'open', '2025-12-01 09:00:00', '2026-01-20 17:00:00', 'Graduate MSc Software Engineering elective sample offering.', 'ONLINE'
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

INSERT INTO course_meetings (
  course_offering_id,
  room_id,
  day_of_week,
  start_time,
  end_time,
  meeting_type
)
SELECT
  co.id,
  r.id,
  payload.day_of_week,
  payload.start_time,
  payload.end_time,
  payload.meeting_type
FROM (
  SELECT 'INF401' AS course_code, '2026-SPRING' AS term_code, 'M1' AS section_code, 'C-110' AS room_code, 'monday' AS day_of_week, '17:00:00' AS start_time, '19:30:00' AS end_time, 'lecture' AS meeting_type
  UNION ALL SELECT 'INF401', '2026-SPRING', 'M1', 'C-110', 'wednesday', '17:00:00', '19:30:00', 'lecture'
  UNION ALL SELECT 'INF402', '2026-SPRING', 'M1', 'LAB-C302', 'tuesday', '17:30:00', '19:30:00', 'lab'
  UNION ALL SELECT 'SWE401', '2026-SPRING', 'M1', 'A-201', 'thursday', '17:00:00', '20:00:00', 'lecture'
  UNION ALL SELECT 'COM502', '2026-SPRING', 'M1', 'B-105', 'friday', '17:00:00', '19:00:00', 'lecture'
  UNION ALL SELECT 'AI404', '2026-SPRING', 'M1', 'ONLINE', 'saturday', '10:00:00', '13:00:00', 'lecture'
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


