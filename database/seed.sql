-- =============================================================
-- Campus Information System — Seed Data
-- All passwords are bcrypt hashes of "Password123!"
-- =============================================================

USE CampusIS;

-- -------------------------------------------------------------
-- DEPARTMENTS
-- -------------------------------------------------------------
INSERT INTO departments (name, code) VALUES
('Computer Science',    'CS'),
('Mathematics',         'MATH'),
('Information Systems', 'IS'),
('Data Science',        'DS'),
('English',             'ENG');

-- -------------------------------------------------------------
-- PROGRAMS
-- -------------------------------------------------------------
INSERT INTO programs (name, code, department_id, total_credits, duration_semesters) VALUES
('Bachelor of Computer Science',    'BCS',  1, 130, 8),
('Bachelor of Mathematics',         'BMAT', 2, 120, 8),
('Bachelor of Information Systems', 'BIS',  3, 125, 8),
('Bachelor of Data Science',        'BDS',  4, 128, 8);

-- -------------------------------------------------------------
-- USERS (password = "Password123!")
-- -------------------------------------------------------------
INSERT INTO users (email, password_hash, role, is_first_login, is_active) VALUES
('alex.johnson@university.edu',   '$2b$12$MonOw7KszIkkUqKsEa8fl.DcY7eNDkz/ZcUBkLR2zXlk3JcFBo2We', 'student',        0, 1),
('sarah.kim@university.edu',      '$2b$12$MonOw7KszIkkUqKsEa8fl.DcY7eNDkz/ZcUBkLR2zXlk3JcFBo2We', 'student',        0, 1),
('james.williams@university.edu', '$2b$12$MonOw7KszIkkUqKsEa8fl.DcY7eNDkz/ZcUBkLR2zXlk3JcFBo2We', 'student',        0, 1),
('maria.garcia@university.edu',   '$2b$12$MonOw7KszIkkUqKsEa8fl.DcY7eNDkz/ZcUBkLR2zXlk3JcFBo2We', 'student',        0, 1),
('david.brown@university.edu',    '$2b$12$MonOw7KszIkkUqKsEa8fl.DcY7eNDkz/ZcUBkLR2zXlk3JcFBo2We', 'student',        0, 1),
('emma.davis@university.edu',     '$2b$12$MonOw7KszIkkUqKsEa8fl.DcY7eNDkz/ZcUBkLR2zXlk3JcFBo2We', 'student',        0, 1),
('dr.smith@university.edu',       '$2b$12$MonOw7KszIkkUqKsEa8fl.DcY7eNDkz/ZcUBkLR2zXlk3JcFBo2We', 'instructor',     0, 1),
('dr.johnson@university.edu',     '$2b$12$MonOw7KszIkkUqKsEa8fl.DcY7eNDkz/ZcUBkLR2zXlk3JcFBo2We', 'instructor',     0, 1),
('dr.lee@university.edu',         '$2b$12$MonOw7KszIkkUqKsEa8fl.DcY7eNDkz/ZcUBkLR2zXlk3JcFBo2We', 'instructor',     0, 1),
('prof.adams@university.edu',     '$2b$12$MonOw7KszIkkUqKsEa8fl.DcY7eNDkz/ZcUBkLR2zXlk3JcFBo2We', 'instructor',     0, 1),
('academic.staff@university.edu', '$2b$12$MonOw7KszIkkUqKsEa8fl.DcY7eNDkz/ZcUBkLR2zXlk3JcFBo2We', 'academic_staff', 0, 1),
('finance.staff@university.edu',  '$2b$12$MonOw7KszIkkUqKsEa8fl.DcY7eNDkz/ZcUBkLR2zXlk3JcFBo2We', 'finance_staff',  0, 1),
('admin@university.edu',          '$2b$12$MonOw7KszIkkUqKsEa8fl.DcY7eNDkz/ZcUBkLR2zXlk3JcFBo2We', 'system_admin',   0, 1);

-- -------------------------------------------------------------
-- STUDENTS
-- -------------------------------------------------------------
INSERT INTO students (user_id, student_code, first_name, last_name, phone, date_of_birth, program_id, current_semester, gpa, status) VALUES
(1,  'STU-2024-0847', 'Alex',  'Johnson',  '+355691234567', '2002-03-15', 1, 6, 3.72, 'active'),
(2,  'STU-2024-0912', 'Sarah', 'Kim',      '+355692345678', '2003-07-22', 1, 4, 3.45, 'active'),
(3,  'STU-2023-0234', 'James', 'Williams', '+355693456789', '2001-11-08', 2, 5, 2.85, 'active'),
(4,  'STU-2024-1001', 'Maria', 'Garcia',   '+355694567890', '2003-01-30', 3, 3, 3.90, 'active'),
(5,  'STU-2023-0567', 'David', 'Brown',    '+355695678901', '2000-09-12', 1, 7, 2.10, 'probation'),
(6,  'STU-2024-0789', 'Emma',  'Davis',    '+355696789012', '2003-05-19', 4, 2, 3.55, 'active');

-- -------------------------------------------------------------
-- INSTRUCTORS
-- -------------------------------------------------------------
INSERT INTO instructors (user_id, first_name, last_name, title, department_id) VALUES
(7,  'John',   'Smith',   'Dr.',   1),
(8,  'Lisa',   'Johnson', 'Dr.',   1),
(9,  'Kevin',  'Lee',     'Dr.',   2),
(10, 'Robert', 'Adams',   'Prof.', 3);

-- -------------------------------------------------------------
-- SEMESTERS
-- -------------------------------------------------------------
INSERT INTO semesters (name, start_date, end_date, is_active, registration_deadline, drop_deadline) VALUES
('Fall 2024',   '2024-09-01', '2024-12-20', 0, '2024-09-15', '2024-10-15'),
('Spring 2025', '2025-02-01', '2025-06-15', 1, '2026-12-31', '2026-12-31');

-- -------------------------------------------------------------
-- COURSES
-- -------------------------------------------------------------
INSERT INTO courses (code, name, description, credits, department_id) VALUES
('CS101',  'Introduction to Programming',   'Fundamentals of programming using Python.',          3, 1),
('CS201',  'Data Structures',               'Arrays, linked lists, trees, graphs.',               3, 1),
('CS301',  'Algorithms',                    'Algorithm design and complexity analysis.',           3, 1),
('CS401',  'Database Systems',              'Relational databases and SQL.',                      3, 1),
('CS501',  'Software Engineering',          'SDLC, design patterns, and agile methods.',          3, 1),
('MATH101','Calculus I',                    'Limits, derivatives, and integrals.',                3, 2),
('MATH201','Linear Algebra',               'Vectors, matrices, and transformations.',             3, 2),
('IS101',  'Information Systems Basics',    'Introduction to information systems.',               3, 3),
('DS101',  'Introduction to Data Science',  'Data analysis and visualization.',                   3, 4),
('DS201',  'Machine Learning',              'Supervised and unsupervised learning.',              3, 4);

-- Courses with prerequisites
INSERT INTO courses (code, name, description, credits, department_id, prerequisite_course_id) VALUES
('CS202',  'Advanced Data Structures', 'Advanced topics in data structures.', 3, 1, 2),
('CS302',  'Advanced Algorithms',      'Advanced algorithm techniques.',      3, 1, 3);

-- -------------------------------------------------------------
-- OFFERINGS (Spring 2025 — semester_id = 2)
-- -------------------------------------------------------------
INSERT INTO offerings (course_id, instructor_id, semester_id, room, schedule, capacity, enrolled, status) VALUES
(1,  1, 2, 'Room A101', 'Mon/Wed 09:00-10:30', 30, 3, 'active'),
(2,  1, 2, 'Room A102', 'Tue/Thu 09:00-10:30', 25, 2, 'active'),
(3,  2, 2, 'Room B201', 'Mon/Wed 11:00-12:30', 25, 1, 'active'),
(4,  2, 2, 'Room B202', 'Tue/Thu 11:00-12:30', 30, 2, 'active'),
(6,  3, 2, 'Room C101', 'Mon/Wed 14:00-15:30', 35, 2, 'active'),
(7,  3, 2, 'Room C102', 'Tue/Thu 14:00-15:30', 30, 1, 'active'),
(9,  4, 2, 'Room D101', 'Mon/Wed/Fri 10:00-11:00', 40, 2, 'active'),
(10, 4, 2, 'Room D102', 'Tue/Thu 16:00-17:30', 30, 1, 'active');

-- -------------------------------------------------------------
-- REGISTRATIONS
-- -------------------------------------------------------------
INSERT INTO registrations (student_id, offering_id, status) VALUES
(1, 1, 'active'), (1, 4, 'active'), (1, 7, 'active'),
(2, 1, 'active'), (2, 5, 'active'),
(3, 2, 'active'), (3, 6, 'active'),
(4, 3, 'active'), (4, 8, 'active'),
(5, 1, 'active'),
(6, 7, 'active');

-- -------------------------------------------------------------
-- ANNOUNCEMENTS
-- -------------------------------------------------------------
INSERT INTO announcements (created_by, title, content, target_role) VALUES
(11, 'Spring 2025 Registration Open',    'Course registration for Spring 2025 is now open.', 'all'),
(11, 'Grade Submission Deadline',        'Instructors must submit grades by June 30.',        'instructor'),
(13, 'System Maintenance Saturday',      'The system will be down Saturday 2-4 AM.',          'all');

-- -------------------------------------------------------------
-- NOTIFICATIONS
-- -------------------------------------------------------------
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
(1, 'Registration Confirmed', 'You have successfully registered for CS101.', 'success', 0),
(1, 'Grade Posted',           'Your CS401 grade has been posted.',           'info',    0),
(2, 'Registration Confirmed', 'You have successfully registered for CS101.', 'success', 1),
(5, 'Academic Hold Placed',   'A hold has been placed on your account.',     'warning', 0);
