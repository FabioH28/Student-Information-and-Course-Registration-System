USE cis;

-- Source data adapted from sample undergraduate catalog curriculum data.
-- Only course, program, and ECTS data are imported here. No lecturer or staff names are copied.
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS ects_credits DECIMAL(4,1) NULL AFTER credit_hours;

UPDATE courses
SET ects_credits = credit_hours
WHERE ects_credits IS NULL;

INSERT INTO departments (code, name, description, status)
VALUES
  ('CEN', 'Department of Computer Engineering', 'Academic catalog seeded from sample undergraduate catalog curricula.', 'active'),
  ('BUSA', 'Department of Business Administration', 'Academic catalog seeded from sample undergraduate catalog curricula.', 'active')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  status = VALUES(status);

INSERT INTO programs (department_id, code, name, degree_level, duration_semesters, total_credits_required, status)
SELECT d.id, payload.code, payload.name, 'bachelor', 6, 180, 'active'
FROM (
  SELECT 'CEN' AS department_code, 'BSWE' AS code, 'Bachelor in Software Engineering (3 years)' AS name
  UNION ALL
  SELECT 'BUSA', 'BBINF', 'Bachelor in Business Informatics (3 years)'
) AS payload
JOIN departments d ON d.code = payload.department_code
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
  'letter',
  TRUE
FROM (
  SELECT 'CEN' AS department_code, 'CEN 105' AS code, 'LINEAR ALGEBRA' AS title, 'Imported from the sample 2025-2026 Bachelor in Software Engineering curriculum (Semester 1).' AS description, 3 AS credit_hours, 5.0 AS ects_credits, 100 AS level_number, 'core' AS course_type
  UNION ALL SELECT 'CEN', 'CEN 109', 'INTRODUCTION TO ALGORITHMS & PROGRAMMING', 'Imported from the sample 2025-2026 Bachelor in Software Engineering curriculum (Semester 1).', 4, 7.0, 100, 'core'
  UNION ALL SELECT 'CEN', 'ENG 103', 'DEVELOPMENT OF READING AND WRITING SKILLS IN ENGLISH I', 'Imported from the sample 2025-2026 Bachelor in Software Engineering curriculum (Semester 1).', 3, 4.0, 100, 'seminar'
  UNION ALL SELECT 'CEN', 'MTH 101', 'CALCULUS I', 'Imported from the sample 2025-2026 Bachelor in Software Engineering curriculum (Semester 1).', 4, 7.0, 100, 'core'
  UNION ALL SELECT 'CEN', 'PHY 101', 'GENERAL PHYSICS I', 'Imported from the sample 2025-2026 Bachelor in Software Engineering curriculum (Semester 1).', 4, 7.0, 100, 'core'
  UNION ALL SELECT 'CEN', 'CEN 110', 'C PROGRAMMING', 'Imported from the sample 2025-2026 Bachelor in Software Engineering curriculum (Semester 2).', 4, 7.0, 100, 'core'
  UNION ALL SELECT 'CEN', 'ENG 104', 'DEVELOPMENT OF READING AND WRITING SKILLS IN ENGLISH II', 'Imported from the sample 2025-2026 Bachelor in Software Engineering curriculum (Semester 2).', 3, 4.0, 100, 'seminar'
  UNION ALL SELECT 'CEN', 'MTH 102', 'CALCULUS II', 'Imported from the sample 2025-2026 Bachelor in Software Engineering curriculum (Semester 2).', 4, 7.0, 100, 'core'
  UNION ALL SELECT 'CEN', 'MTH 106', 'DISCRETE MATHEMATICS', 'Imported from the sample 2025-2026 Bachelor in Software Engineering curriculum (Semester 2).', 3, 5.0, 100, 'core'
  UNION ALL SELECT 'CEN', 'SWE 101', 'INTRODUCTION TO SOFTWARE ENGINEERING', 'Imported from the sample 2025-2026 Bachelor in Software Engineering curriculum (Semester 2).', 4, 7.0, 100, 'core'
  UNION ALL SELECT 'CEN', 'CEN 203', 'DATABASE MANAGEMENT SYSTEMS', 'Imported from the sample 2025-2026 Bachelor in Software Engineering curriculum (Semester 3).', 4, 7.0, 200, 'core'
  UNION ALL SELECT 'CEN', 'CEN 215', 'OBJECT ORIENTED PROGRAMMING', 'Imported from the sample 2025-2026 Bachelor in Software Engineering curriculum (Semester 3).', 4, 7.0, 200, 'core'
  UNION ALL SELECT 'CEN', 'CEN 219', 'COMPUTER ORGANIZATION', 'Imported from the sample 2025-2026 Bachelor in Software Engineering curriculum (Semester 3) and Business Informatics curriculum (Semester 3).', 3, 6.0, 200, 'core'
  UNION ALL SELECT 'CEN', 'MTH 207', 'FUNDAMENTALS OF PROBABILITY', 'Imported from the sample 2025-2026 Bachelor in Software Engineering curriculum (Semester 3).', 3, 6.0, 200, 'core'
  UNION ALL SELECT 'CEN', 'CEN 206', 'DATA STRUCTURES', 'Imported from the sample 2025-2026 Bachelor in Software Engineering curriculum (Semester 4).', 4, 7.0, 200, 'core'
  UNION ALL SELECT 'CEN', 'CEN 311', 'WEB TECHNOLOGIES AND PROGRAMMING', 'Imported from the sample 2025-2026 Software Engineering curriculum (Semester 4) and Business Informatics curriculum (Semester 5).', 3, 6.0, 200, 'core'
  UNION ALL SELECT 'CEN', 'SWE 202', 'SOFTWARE MODELING AND DESIGN', 'Imported from the sample 2025-2026 Bachelor in Software Engineering curriculum (Semester 4).', 3, 6.0, 200, 'core'
  UNION ALL SELECT 'CEN', 'SWE 211', 'PROGRAMMING LANGUAGE PARADIGMS', 'Imported from the sample 2025-2026 Bachelor in Software Engineering curriculum (Semester 4).', 4, 7.0, 200, 'core'
  UNION ALL SELECT 'CEN', 'CEN 307', 'COMPUTER NETWORKS', 'Imported from the sample 2025-2026 Bachelor in Software Engineering curriculum (Semester 5).', 4, 6.0, 300, 'core'
  UNION ALL SELECT 'CEN', 'SWE 303', 'SOFTWARE TESTING AND QUALITY ASSURANCE', 'Imported from the sample 2025-2026 Bachelor in Software Engineering curriculum (Semester 5).', 3, 6.0, 300, 'core'
  UNION ALL SELECT 'CEN', 'CEN 308', 'OPERATING SYSTEMS', 'Imported from the sample 2025-2026 Bachelor in Software Engineering curriculum (Semester 6).', 4, 6.0, 300, 'core'
  UNION ALL SELECT 'CEN', 'CEN 390', 'GRADUATION PROJECT / FINAL EXAM', 'Imported from the sample 2025-2026 Bachelor in Software Engineering curriculum (Semester 6).', 3, 6.0, 300, 'project'
  UNION ALL SELECT 'CEN', 'SWE 302', 'SOFTWARE PROJECT MANAGEMENT', 'Imported from the sample 2025-2026 Bachelor in Software Engineering curriculum (Semester 6).', 3, 6.0, 300, 'core'
  UNION ALL SELECT 'CEN', 'CEN 352', 'ARTIFICIAL INTELLIGENCE', 'Imported from the sample 2025-2026 Bachelor in Software Engineering elective list.', 3, 6.0, 300, 'elective'
  UNION ALL SELECT 'CEN', 'CEN 380', 'MACHINE LEARNING', 'Imported from the sample 2025-2026 Bachelor in Software Engineering elective list and Business Informatics elective list.', 3, 6.0, 300, 'elective'
  UNION ALL SELECT 'BUSA', 'BINF 101', 'FUNDAMENTALS OF INFORMATION SYSTEMS', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 1).', 3, 5.0, 100, 'core'
  UNION ALL SELECT 'BUSA', 'BUS 101', 'MATH. FOR ECONOMICS AND BUSINESS I', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 1).', 3, 5.0, 100, 'core'
  UNION ALL SELECT 'BUSA', 'BUS 103', 'INTRODUCTION TO BUSINESS', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 1). Official local credits are fractional; application-compatible credit_hours are rounded.', 3, 5.0, 100, 'core'
  UNION ALL SELECT 'BUSA', 'CEN 111', 'INTRODUCTION TO ALGORITHMS AND PROGRAMMING I', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 1).', 3, 5.0, 100, 'core'
  UNION ALL SELECT 'BUSA', 'ECO 101', 'INTRODUCTION TO ECONOMICS I', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 1).', 3, 5.0, 100, 'core'
  UNION ALL SELECT 'BUSA', 'ENG 109', 'DEVELOPING READING AND WRITING SKILLS', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 1).', 3, 5.0, 100, 'seminar'
  UNION ALL SELECT 'BUSA', 'BUS 102', 'MATH. FOR ECONOMICS AND BUSINESS II', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 2).', 3, 5.0, 100, 'core'
  UNION ALL SELECT 'BUSA', 'BUS 108', 'BUSINESS ENGLISH', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 2).', 3, 5.0, 100, 'seminar'
  UNION ALL SELECT 'BUSA', 'BUS 112', 'MANAGEMENT AND ORGANIZATION', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 2).', 3, 5.0, 100, 'core'
  UNION ALL SELECT 'BUSA', 'BUS 132', 'INTRODUCTION TO ACCOUNTING', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 2). Official local credits are fractional; application-compatible credit_hours are rounded.', 3, 5.0, 100, 'core'
  UNION ALL SELECT 'BUSA', 'CEN 114', 'INTRODUCTION TO ALGORITHMS AND PROGRAMMING II', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 2).', 3, 5.0, 100, 'core'
  UNION ALL SELECT 'BUSA', 'ECO 102', 'INTRODUCTION TO ECONOMICS II', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 2).', 3, 5.0, 100, 'core'
  UNION ALL SELECT 'BUSA', 'BINF 251', 'DATABASE MANAGEMENT SYSTEMS', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 3).', 3, 5.0, 200, 'core'
  UNION ALL SELECT 'BUSA', 'BUS 201', 'STATISTICS I', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 3).', 3, 5.0, 200, 'core'
  UNION ALL SELECT 'BUSA', 'BUS 205', 'PRINCIPLES OF MARKETING', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 3).', 3, 5.0, 200, 'core'
  UNION ALL SELECT 'BUSA', 'CEN 213', 'OBJECT ORIENTED PROGRAMMING', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 3).', 4, 5.0, 200, 'core'
  UNION ALL SELECT 'BUSA', 'BUS 202', 'STATISTICS II', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 4).', 3, 5.0, 200, 'core'
  UNION ALL SELECT 'BUSA', 'BUS 226', 'MANAGEMENT INFORMATION SYSTEMS', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 4).', 3, 5.0, 200, 'core'
  UNION ALL SELECT 'BUSA', 'CEN 254', 'DATA STRUCTURES', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 4).', 4, 5.0, 200, 'core'
  UNION ALL SELECT 'BUSA', 'CEN 361', 'COMPUTER NETWORKS', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 4).', 3, 5.0, 200, 'core'
  UNION ALL SELECT 'BUSA', 'BINF 202', 'ENTERPRISE RESOURCE PLANNING', 'Imported from the sample 2025-2026 Bachelor in Business Informatics Semester 4 elective list.', 3, 5.0, 200, 'elective'
  UNION ALL SELECT 'BUSA', 'BAF 233', 'FUNDAMENTALS OF CORPORATE FINANCE', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 5).', 3, 5.0, 300, 'core'
  UNION ALL SELECT 'BUSA', 'BUS 309', 'PROFESSIONAL PRACTICE', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 5).', 3, 5.0, 300, 'project'
  UNION ALL SELECT 'BUSA', 'BUS 321', 'OPERATIONS MANAGEMENT', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 5).', 3, 5.0, 300, 'core'
  UNION ALL SELECT 'BUSA', 'BINF 303', 'ENTERPRISE ARCHITECTURE', 'Imported from the sample 2025-2026 Bachelor in Business Informatics Semester 5 elective list.', 3, 5.0, 300, 'elective'
  UNION ALL SELECT 'BUSA', 'BINF 311', 'DATA ANALYTICS AND VISUALIZATION', 'Imported from the sample 2025-2026 Bachelor in Business Informatics Semester 5 elective list.', 3, 5.0, 300, 'elective'
  UNION ALL SELECT 'BUSA', 'BUS 324', 'OPERATIONS RESEARCH', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 6).', 3, 6.0, 300, 'core'
  UNION ALL SELECT 'BUSA', 'CEN 302', 'SOFTWARE ENGINEERING', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 6).', 3, 6.0, 300, 'core'
  UNION ALL SELECT 'BUSA', 'CEN 318', 'OPERATING SYSTEMS', 'Imported from the sample 2025-2026 Bachelor in Business Informatics curriculum (Semester 6).', 4, 6.0, 300, 'core'
  UNION ALL SELECT 'BUSA', 'BINF 312', 'DATA SCIENCE FOR BUSINESS', 'Imported from the sample 2025-2026 Bachelor in Business Informatics Semester 6 elective list.', 3, 6.0, 300, 'elective'
) AS payload
JOIN departments d ON d.code = payload.department_code
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
  SELECT 'BSWE' AS program_code, 'CEN 105' AS course_code, 1 AS recommended_term_number, 'core' AS requirement_type
  UNION ALL SELECT 'BSWE', 'CEN 109', 1, 'core'
  UNION ALL SELECT 'BSWE', 'ENG 103', 1, 'core'
  UNION ALL SELECT 'BSWE', 'MTH 101', 1, 'core'
  UNION ALL SELECT 'BSWE', 'PHY 101', 1, 'core'
  UNION ALL SELECT 'BSWE', 'CEN 110', 2, 'core'
  UNION ALL SELECT 'BSWE', 'ENG 104', 2, 'core'
  UNION ALL SELECT 'BSWE', 'MTH 102', 2, 'core'
  UNION ALL SELECT 'BSWE', 'MTH 106', 2, 'core'
  UNION ALL SELECT 'BSWE', 'SWE 101', 2, 'core'
  UNION ALL SELECT 'BSWE', 'CEN 203', 3, 'core'
  UNION ALL SELECT 'BSWE', 'CEN 215', 3, 'core'
  UNION ALL SELECT 'BSWE', 'CEN 219', 3, 'core'
  UNION ALL SELECT 'BSWE', 'MTH 207', 3, 'core'
  UNION ALL SELECT 'BSWE', 'CEN 206', 4, 'core'
  UNION ALL SELECT 'BSWE', 'CEN 311', 4, 'core'
  UNION ALL SELECT 'BSWE', 'SWE 202', 4, 'core'
  UNION ALL SELECT 'BSWE', 'SWE 211', 4, 'core'
  UNION ALL SELECT 'BSWE', 'CEN 307', 5, 'core'
  UNION ALL SELECT 'BSWE', 'SWE 303', 5, 'core'
  UNION ALL SELECT 'BSWE', 'CEN 308', 6, 'core'
  UNION ALL SELECT 'BSWE', 'CEN 390', 6, 'core'
  UNION ALL SELECT 'BSWE', 'SWE 302', 6, 'core'
  UNION ALL SELECT 'BSWE', 'CEN 352', 6, 'elective'
  UNION ALL SELECT 'BSWE', 'CEN 380', 6, 'elective'
  UNION ALL SELECT 'BBINF', 'BINF 101', 1, 'core'
  UNION ALL SELECT 'BBINF', 'BUS 101', 1, 'core'
  UNION ALL SELECT 'BBINF', 'BUS 103', 1, 'core'
  UNION ALL SELECT 'BBINF', 'CEN 111', 1, 'core'
  UNION ALL SELECT 'BBINF', 'ECO 101', 1, 'core'
  UNION ALL SELECT 'BBINF', 'ENG 109', 1, 'core'
  UNION ALL SELECT 'BBINF', 'BUS 102', 2, 'core'
  UNION ALL SELECT 'BBINF', 'BUS 108', 2, 'core'
  UNION ALL SELECT 'BBINF', 'BUS 112', 2, 'core'
  UNION ALL SELECT 'BBINF', 'BUS 132', 2, 'core'
  UNION ALL SELECT 'BBINF', 'CEN 114', 2, 'core'
  UNION ALL SELECT 'BBINF', 'ECO 102', 2, 'core'
  UNION ALL SELECT 'BBINF', 'BINF 251', 3, 'core'
  UNION ALL SELECT 'BBINF', 'BUS 201', 3, 'core'
  UNION ALL SELECT 'BBINF', 'BUS 205', 3, 'core'
  UNION ALL SELECT 'BBINF', 'CEN 213', 3, 'core'
  UNION ALL SELECT 'BBINF', 'BUS 202', 4, 'core'
  UNION ALL SELECT 'BBINF', 'BUS 226', 4, 'core'
  UNION ALL SELECT 'BBINF', 'CEN 254', 4, 'core'
  UNION ALL SELECT 'BBINF', 'CEN 361', 4, 'core'
  UNION ALL SELECT 'BBINF', 'BINF 202', 4, 'elective'
  UNION ALL SELECT 'BBINF', 'BAF 233', 5, 'core'
  UNION ALL SELECT 'BBINF', 'BUS 309', 5, 'core'
  UNION ALL SELECT 'BBINF', 'BUS 321', 5, 'core'
  UNION ALL SELECT 'BBINF', 'BINF 303', 5, 'elective'
  UNION ALL SELECT 'BBINF', 'BINF 311', 5, 'elective'
  UNION ALL SELECT 'BBINF', 'BUS 324', 6, 'core'
  UNION ALL SELECT 'BBINF', 'CEN 302', 6, 'core'
  UNION ALL SELECT 'BBINF', 'CEN 318', 6, 'core'
  UNION ALL SELECT 'BBINF', 'BINF 312', 6, 'elective'
) AS payload
JOIN programs p ON p.code = payload.program_code
JOIN courses c ON c.code = payload.course_code
ON DUPLICATE KEY UPDATE
  recommended_term_number = VALUES(recommended_term_number),
  requirement_type = VALUES(requirement_type),
  is_active = VALUES(is_active);

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
  SELECT 'CEN 110' AS course_code, '2026-SPRING' AS term_code, 'E1' AS section_code, 'onsite' AS delivery_mode, 48 AS capacity, 8 AS waitlist_capacity, 'open' AS status, '2025-12-01 09:00:00' AS registration_opens_at, '2026-01-20 17:00:00' AS registration_closes_at, 'Epoka Software Engineering semester 2 sample offering.' AS schedule_notes, 'A-201' AS room_code
  UNION ALL SELECT 'MTH 106', '2026-SPRING', 'E1', 'onsite', 45, 5, 'open', '2025-12-01 09:00:00', '2026-01-20 17:00:00', 'Epoka Software Engineering semester 2 sample offering.', 'B-105'
  UNION ALL SELECT 'SWE 202', '2026-SPRING', 'E1', 'onsite', 40, 5, 'open', '2025-12-01 09:00:00', '2026-01-20 17:00:00', 'Epoka Software Engineering semester 4 sample offering.', 'C-110'
  UNION ALL SELECT 'CEN 308', '2026-SPRING', 'E1', 'hybrid', 36, 6, 'open', '2025-12-01 09:00:00', '2026-01-20 17:00:00', 'Epoka Software Engineering semester 6 sample offering.', 'LAB-C302'
  UNION ALL SELECT 'CEN 352', '2026-SPRING', 'E1', 'onsite', 30, 8, 'open', '2025-12-01 09:00:00', '2026-01-20 17:00:00', 'Epoka Software Engineering elective sample offering.', 'LAB-C302'
  UNION ALL SELECT 'BUS 112', '2026-SPRING', 'E1', 'onsite', 50, 6, 'open', '2025-12-01 09:00:00', '2026-01-20 17:00:00', 'Epoka Business Informatics semester 2 sample offering.', 'D-201'
  UNION ALL SELECT 'BUS 226', '2026-SPRING', 'E1', 'onsite', 42, 5, 'open', '2025-12-01 09:00:00', '2026-01-20 17:00:00', 'Epoka Business Informatics semester 4 sample offering.', 'C-110'
  UNION ALL SELECT 'CEN 254', '2026-SPRING', 'E1', 'onsite', 40, 6, 'open', '2025-12-01 09:00:00', '2026-01-20 17:00:00', 'Epoka Business Informatics semester 4 sample offering.', 'LAB-C302'
  UNION ALL SELECT 'BINF 202', '2026-SPRING', 'E1', 'onsite', 35, 5, 'open', '2025-12-01 09:00:00', '2026-01-20 17:00:00', 'Epoka Business Informatics elective sample offering.', 'D-201'
  UNION ALL SELECT 'BINF 312', '2026-SPRING', 'E1', 'hybrid', 35, 5, 'open', '2025-12-01 09:00:00', '2026-01-20 17:00:00', 'Epoka Business Informatics semester 6 elective sample offering.', 'ONLINE'
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
  SELECT 'CEN 110' AS course_code, '2026-SPRING' AS term_code, 'E1' AS section_code, 'A-201' AS room_code, 'monday' AS day_of_week, '09:00:00' AS start_time, '10:30:00' AS end_time, 'lecture' AS meeting_type
  UNION ALL SELECT 'CEN 110', '2026-SPRING', 'E1', 'A-201', 'wednesday', '09:00:00', '10:30:00', 'lecture'
  UNION ALL SELECT 'MTH 106', '2026-SPRING', 'E1', 'B-105', 'monday', '11:00:00', '12:30:00', 'lecture'
  UNION ALL SELECT 'MTH 106', '2026-SPRING', 'E1', 'B-105', 'thursday', '11:00:00', '12:30:00', 'lecture'
  UNION ALL SELECT 'SWE 202', '2026-SPRING', 'E1', 'C-110', 'tuesday', '13:00:00', '14:30:00', 'lecture'
  UNION ALL SELECT 'SWE 202', '2026-SPRING', 'E1', 'C-110', 'friday', '13:00:00', '14:30:00', 'lecture'
  UNION ALL SELECT 'CEN 308', '2026-SPRING', 'E1', 'LAB-C302', 'tuesday', '15:00:00', '16:30:00', 'lab'
  UNION ALL SELECT 'CEN 308', '2026-SPRING', 'E1', 'LAB-C302', 'thursday', '15:00:00', '16:30:00', 'lecture'
  UNION ALL SELECT 'CEN 352', '2026-SPRING', 'E1', 'LAB-C302', 'friday', '10:00:00', '12:00:00', 'lecture'
  UNION ALL SELECT 'BUS 112', '2026-SPRING', 'E1', 'D-201', 'monday', '14:00:00', '15:30:00', 'lecture'
  UNION ALL SELECT 'BUS 112', '2026-SPRING', 'E1', 'D-201', 'wednesday', '14:00:00', '15:30:00', 'lecture'
  UNION ALL SELECT 'BUS 226', '2026-SPRING', 'E1', 'C-110', 'tuesday', '10:00:00', '11:30:00', 'lecture'
  UNION ALL SELECT 'BUS 226', '2026-SPRING', 'E1', 'C-110', 'thursday', '10:00:00', '11:30:00', 'lecture'
  UNION ALL SELECT 'CEN 254', '2026-SPRING', 'E1', 'LAB-C302', 'wednesday', '16:00:00', '17:30:00', 'lab'
  UNION ALL SELECT 'CEN 254', '2026-SPRING', 'E1', 'LAB-C302', 'friday', '16:00:00', '17:30:00', 'lecture'
  UNION ALL SELECT 'BINF 202', '2026-SPRING', 'E1', 'D-201', 'tuesday', '12:00:00', '13:30:00', 'lecture'
  UNION ALL SELECT 'BINF 312', '2026-SPRING', 'E1', 'ONLINE', 'saturday', '10:00:00', '12:00:00', 'lecture'
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


