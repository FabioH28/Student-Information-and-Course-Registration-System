-- =============================================================
-- Campus Information System (CIS) Demo Seed Data
-- Import order:
--   1. database/schema.sql
--   2. database/seed.sql
--   3. Restart backend
-- Demo password for all seeded users: password123
-- All passwords are bcrypt hashes of "password123"
-- =============================================================

USE CampusIS;
SET FOREIGN_KEY_CHECKS = 0;

INSERT IGNORE INTO faculties (id, name, code) VALUES
(1, 'Faculty of Computer Science and IT', 'FCSIT'),
(2, 'Faculty of Engineering and Architecture', 'FEA'),
(3, 'Faculty of Economics', 'FECO'),
(4, 'Faculty of Law and Social Sciences', 'FLSS');

INSERT IGNORE INTO departments (id, name, code, faculty_id, degree_level) VALUES
(1, 'Software Engineering', 'SE', 1, 'Bachelor'),
(2, 'Computer Engineering', 'CE', 1, 'Bachelor'),
(3, 'Artificial Intelligence', 'AI', 1, 'Master'),
(4, 'Informatics Engineering', 'IE', 1, 'Bachelor'),
(5, 'Data Science', 'DS', 1, 'Master'),
(6, 'Cybersecurity', 'CYB', 1, 'Master'),
(7, 'Civil Engineering', 'CIV', 2, 'Bachelor'),
(8, 'Architecture', 'ARCH', 2, 'Bachelor'),
(9, 'Structural Engineering', 'STR', 2, 'Master'),
(10, 'Infrastructure and Transportation Engineering', 'ITE', 2, 'Master'),
(11, 'Interior Architecture', 'IARCH', 2, 'Bachelor'),
(12, 'Economics', 'ECON', 3, 'Bachelor'),
(13, 'Business Administration', 'BA', 3, 'Bachelor'),
(14, 'Business Analytics and Artificial Intelligence', 'BAAI', 3, 'Master'),
(15, 'Financial Engineering and Risk Management', 'FERM', 3, 'Master'),
(16, 'Digital Marketing', 'DM', 3, 'Bachelor'),
(17, 'Management Engineering', 'ME', 3, 'Bachelor'),
(18, 'Law', 'LAW', 4, 'Bachelor'),
(19, 'International Relations', 'IR', 4, 'Bachelor');

INSERT IGNORE INTO programs (id, name, code, department_id, total_credits, duration_semesters) VALUES
(1, 'Software Engineering', 'BSE', 1, 180, 6),
(2, 'Computer Engineering', 'BCE', 2, 180, 6),
(3, 'Artificial Intelligence', 'MAI', 3, 120, 4),
(4, 'Informatics Engineering', 'BIE', 4, 180, 6),
(5, 'Data Science', 'MDS', 5, 120, 4),
(6, 'Cybersecurity', 'MCYB', 6, 120, 4),
(7, 'Civil Engineering', 'BCIV', 7, 180, 6),
(8, 'Architecture', 'BARCH', 8, 180, 6),
(9, 'Structural Engineering', 'MSTR', 9, 120, 4),
(10, 'Infrastructure and Transportation Engineering', 'MITE', 10, 120, 4),
(11, 'Interior Architecture', 'BIARCH', 11, 180, 6),
(12, 'Economics', 'BECON', 12, 180, 6),
(13, 'Business Administration', 'BBA', 13, 180, 6),
(14, 'Business Analytics and Artificial Intelligence', 'MBAAI', 14, 120, 4),
(15, 'Finance and Accounting', 'MFA', 15, 120, 4),
(16, 'Digital Marketing', 'BDM', 16, 180, 6),
(17, 'Management Engineering', 'BME', 17, 180, 6),
(18, 'Law', 'BLAW', 18, 180, 6),
(19, 'International Relations', 'BIR', 19, 180, 6);

INSERT IGNORE INTO users (id, email, full_name, password_hash, role, is_first_login, is_active, status) VALUES
(1, 'admin@cis.edu', 'System Administrator', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'admin', 0, 1, 'active'),
(2, 'staff.cs@cis.edu', 'Computer Science Staff', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'staff', 0, 1, 'active'),
(3, 'staff.engineering@cis.edu', 'Engineering Staff', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'staff', 0, 1, 'active'),
(4, 'staff.economics@cis.edu', 'Economics Staff', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'staff', 0, 1, 'active'),
(5, 'john.carter@cis.edu', 'Dr. John Carter', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'teacher', 0, 1, 'active'),
(6, 'emily.johnson@cis.edu', 'Dr. Emily Johnson', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'teacher', 0, 1, 'active'),
(7, 'michael.brown@cis.edu', 'Prof. Michael Brown', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'teacher', 0, 1, 'active'),
(8, 'sarah.wilson@cis.edu', 'Dr. Sarah Wilson', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'teacher', 0, 1, 'active'),
(9, 'david.miller@cis.edu', 'Prof. David Miller', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'teacher', 0, 1, 'active'),
(10, 'alice.smith@cis.edu', 'Alice Smith', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(11, 'brian.taylor@cis.edu', 'Brian Taylor', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(12, 'daniel.harris@cis.edu', 'Daniel Harris', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(13, 'emma.clark@cis.edu', 'Emma Clark', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(14, 'olivia.walker@cis.edu', 'Olivia Walker', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(15, 'james.anderson@cis.edu', 'James Anderson', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(16, 'sophia.martin@cis.edu', 'Sophia Martin', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(17, 'ethan.thompson@cis.edu', 'Ethan Thompson', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(18, 'mia.robinson@cis.edu', 'Mia Robinson', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(19, 'lucas.white@cis.edu', 'Lucas White', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(20, 'grace.hall@cis.edu', 'Grace Hall', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(21, 'henry.young@cis.edu', 'Henry Young', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(22, 'ava.king@cis.edu', 'Ava King', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(23, 'noah.scott@cis.edu', 'Noah Scott', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(24, 'lily.green@cis.edu', 'Lily Green', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(25, 'william.adams@cis.edu', 'William Adams', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(26, 'charlotte.baker@cis.edu', 'Charlotte Baker', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(27, 'logan.campbell@cis.edu', 'Logan Campbell', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(28, 'amelia.evans@cis.edu', 'Amelia Evans', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(29, 'liam.turner@cis.edu', 'Liam Turner', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(30, 'ella.parker@cis.edu', 'Ella Parker', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(31, 'jack.mitchell@cis.edu', 'Jack Mitchell', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(32, 'ruby.phillips@cis.edu', 'Ruby Phillips', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(33, 'mason.reed@cis.edu', 'Mason Reed', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(34, 'zoe.cooper@cis.edu', 'Zoe Cooper', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'student', 0, 1, 'active'),
(35, 'rebecca.morgan@cis.edu', 'Rebecca Morgan', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'staff', 0, 1, 'active'),
(36, 'thomas.bennett@cis.edu', 'Thomas Bennett', '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu', 'staff', 0, 1, 'active');

INSERT IGNORE INTO staff_profiles (id, user_id, faculty_id, position) VALUES
(1, 2, 1, 'Faculty Schedule Coordinator'),
(2, 3, 2, 'Faculty Schedule Coordinator'),
(3, 4, 3, 'Faculty Schedule Coordinator');

INSERT IGNORE INTO staff_profiles (id, user_id, faculty_id, scope, position) VALUES
(35,35,1,'multi_faculty','Senior Academic Operations Coordinator'),
(36,36,NULL,'university','University Registrar');

INSERT IGNORE INTO staff_faculty_scopes (user_id, faculty_id) VALUES
(35,1),(35,2),(35,3);

INSERT IGNORE INTO instructors (id, user_id, first_name, last_name, title, department_id) VALUES
(1, 5, 'John', 'Carter', 'Dr.', 1),
(2, 6, 'Emily', 'Johnson', 'Dr.', 2),
(3, 7, 'Michael', 'Brown', 'Prof.', 5),
(4, 8, 'Sarah', 'Wilson', 'Dr.', 3),
(5, 9, 'David', 'Miller', 'Prof.', 6);

INSERT IGNORE INTO teacher_faculty_assignments (teacher_id, faculty_id, program_id) VALUES
(1,1,1),(1,3,14),(2,1,2),(3,1,5),(3,3,14),(4,1,3),(5,1,6),(5,2,9);

INSERT IGNORE INTO students (id, user_id, student_code, first_name, last_name, phone, date_of_birth, program_id, degree_level, academic_year, current_semester, gpa, status) VALUES
(1,10,'CIS-2026-001','Alice','Smith','+355681000001','2004-02-10',1,'Bachelor','Bachelor Year 1',2,3.60,'active'),
(2,11,'CIS-2026-002','Brian','Taylor','+355681000002','2004-03-12',1,'Bachelor','Bachelor Year 1',2,3.20,'active'),
(3,12,'CIS-2026-003','Daniel','Harris','+355681000003','2003-05-18',1,'Bachelor','Bachelor Year 1',2,2.70,'active'),
(4,13,'CIS-2026-004','Emma','Clark','+355681000004','2003-06-22',1,'Bachelor','Bachelor Year 1',2,3.05,'active'),
(5,14,'CIS-2026-005','Olivia','Walker','+355681000005','2003-07-09',1,'Bachelor','Bachelor Year 1',2,3.42,'active'),
(6,15,'CIS-2026-006','James','Anderson','+355681000006','2002-01-17',1,'Bachelor','Bachelor Year 2',4,3.10,'active'),
(7,16,'CIS-2026-007','Sophia','Martin','+355681000007','2002-11-30',1,'Bachelor','Bachelor Year 2',4,3.75,'active'),
(8,17,'CIS-2026-008','Ethan','Thompson','+355681000008','2001-08-14',1,'Bachelor','Bachelor Year 3',6,3.90,'active'),
(9,18,'CIS-2026-009','Mia','Robinson','+355681000009','2001-09-08',1,'Bachelor','Bachelor Year 3',6,3.35,'active'),
(10,19,'CIS-2026-010','Lucas','White','+355681000010','2004-12-19',2,'Bachelor','Bachelor Year 1',2,2.95,'active'),
(11,20,'CIS-2026-011','Grace','Hall','+355681000011','2002-04-02',2,'Bachelor','Bachelor Year 2',4,3.52,'active'),
(12,21,'CIS-2026-012','Henry','Young','+355681000012','2001-10-01',2,'Bachelor','Bachelor Year 3',6,3.18,'active'),
(13,22,'CIS-2026-013','Ava','King','+355681000013','2000-03-27',3,'Master','Master Year 1',8,3.80,'active'),
(14,23,'CIS-2026-014','Noah','Scott','+355681000014','1999-06-11',3,'Master','Master Year 1',8,3.15,'active'),
(15,24,'CIS-2026-015','Lily','Green','+355681000015','1998-09-21',6,'Master','Master Year 2',10,3.92,'active'),
(16,25,'CIS-2026-016','William','Adams','+355681000016','2004-01-05',7,'Bachelor','Bachelor Year 1',2,2.88,'active'),
(17,26,'CIS-2026-017','Charlotte','Baker','+355681000017','2003-02-28',8,'Bachelor','Bachelor Year 2',4,3.01,'active'),
(18,27,'CIS-2026-018','Logan','Campbell','+355681000018','2002-05-12',12,'Bachelor','Bachelor Year 3',6,3.44,'active'),
(19,28,'CIS-2026-019','Amelia','Evans','+355681000019','2003-07-17',13,'Bachelor','Bachelor Year 2',4,3.25,'active'),
(20,29,'CIS-2026-020','Liam','Turner','+355681000020','2001-12-03',14,'Master','Master Year 2',10,3.66,'active'),
(21,30,'CIS-2026-021','Ella','Parker','+355681000021','2004-10-10',4,'Bachelor','Bachelor Year 1',2,3.21,'active'),
(22,31,'CIS-2026-022','Jack','Mitchell','+355681000022','2002-08-08',4,'Bachelor','Bachelor Year 2',4,2.91,'active'),
(23,32,'CIS-2026-023','Ruby','Phillips','+355681000023','2001-04-19',5,'Master','Master Year 1',8,3.71,'active'),
(24,33,'CIS-2026-024','Mason','Reed','+355681000024','2000-06-06',15,'Master','Master Year 1',8,3.11,'active'),
(25,34,'CIS-2026-025','Zoe','Cooper','+355681000025','1999-02-14',15,'Master','Master Year 2',10,3.83,'active');

INSERT IGNORE INTO semesters (id, name, start_date, end_date, total_weeks, is_active, registration_deadline, drop_deadline) VALUES
(1, 'Winter 2025', '2025-09-15', '2026-01-25', 14, 0, '2025-09-22', '2025-10-10'),
(2, 'Spring 2026', '2026-02-16', '2026-06-21', 14, 1, '2026-02-23', '2026-03-13');

INSERT IGNORE INTO courses (id, code, name, description, credits, department_id) VALUES
(1,'CS101','Introduction to Programming','Programming fundamentals using Python.',3,1),
(2,'CS102','Discrete Mathematics','Logic, sets, combinatorics, and proofs.',3,2),
(3,'CS201','Data Structures','Linear and nonlinear data structures.',3,1),
(4,'CS202','Databases','Relational databases, SQL, and normalization.',3,1),
(5,'CS301','Algorithms','Algorithm design and complexity.',3,2),
(6,'CS302','Software Engineering','Software lifecycle, architecture, and quality.',3,1),
(7,'CS303','Web Development','Modern full-stack web development.',4,1),
(8,'MSC101','Advanced Software Engineering','Advanced engineering practices and architecture.',6,1),
(9,'MSC102','Artificial Intelligence','Search, reasoning, and machine learning foundations.',6,3),
(10,'MSC201','Distributed Systems and Cloud Computing','Distributed architectures and cloud platforms.',6,1),
(11,'MSC202','Big Data','Large-scale data processing.',6,5),
(12,'MSC203','Network Security','Secure networks, cryptography, and defense.',6,6);

INSERT IGNORE INTO course_prerequisites (course_id, prerequisite_course_id) VALUES
(3,1),(4,1),(5,3),(6,3),(7,1),(8,6),(9,5),(10,8),(11,4),(12,4);

INSERT IGNORE INTO buildings (id, code, name) VALUES
(1,'G1','G1 Academic Building'),(2,'G2','G2 Technology Building'),(3,'G3','G3 Lecture Building');

INSERT IGNORE INTO classrooms (id, building_id, name, room_type, capacity) VALUES
(1,1,'A1','classroom',35),(2,1,'A2','classroom',35),(3,1,'A3','classroom',35),
(4,2,'B1','classroom',40),(5,2,'B2','classroom',40),(6,3,'C1','classroom',45),(7,3,'C2','classroom',45),
(8,1,'Lab 1','lab',24),(9,1,'Lab 2','lab',24),(10,2,'Computer Lab 1','lab',28),(11,2,'Computer Lab 2','lab',28),
(12,3,'Auditorium 1','auditorium',120),(13,3,'Auditorium 2','auditorium',140);

INSERT IGNORE INTO `groups` (id, name, program_id, department_id, academic_year) VALUES
(1,'SE-B1',1,1,'2025-2026'),(2,'SE-B2',1,1,'2025-2026'),(3,'CE-B1',2,2,'2025-2026'),(4,'AI-M1',3,3,'2025-2026'),(5,'CYB-M2',6,6,'2025-2026');

INSERT IGNORE INTO offerings (id, course_id, instructor_id, semester_id, program_id, faculty_id, created_by_staff_id, academic_year, group_name, academic_period, room, schedule, capacity, enrolled, enrollment_open, selection_deadline, status) VALUES
(1,1,1,2,1,1,1,'Bachelor Year 1','SE-B1','2025-2026','Auditorium 1','Thu 12:00-13:50',80,8,1,'2026-06-01','active'),
(2,2,2,2,1,1,1,'Bachelor Year 1','SE-B1','2025-2026','A2','Tue 10:00-11:50',45,8,1,'2026-06-01','active'),
(3,3,1,2,1,1,1,'Bachelor Year 2','SE-B2','2025-2026','B1','Wed 14:00-15:50',45,6,1,'2026-06-01','active'),
(4,4,1,2,1,1,1,'Bachelor Year 1','SE-B1','2025-2026','A1','Thu 08:00-11:50',45,8,1,'2026-06-01','active'),
(5,5,1,2,1,1,1,'Bachelor Year 3','SE-B2','2025-2026','C1','Mon 13:00-14:50',45,4,1,'2026-06-01','active'),
(6,6,3,2,1,1,1,'Bachelor Year 3','SE-B2','2025-2026','B2','Tue 15:00-16:50',45,4,1,'2026-06-01','active'),
(7,7,1,2,1,1,1,'Bachelor Year 2','SE-B2','2025-2026','Computer Lab 1','Thu 10:00-11:50',28,6,1,'2026-06-01','active'),
(8,8,3,2,3,1,1,'Master Year 1','AI-M1','2025-2026','C2','Fri 09:00-10:50',40,2,1,'2026-06-01','active'),
(9,9,4,2,3,1,1,'Master Year 1','AI-M1','2025-2026','Computer Lab 1','Wed 16:00-17:50',28,2,1,'2026-06-01','active'),
(10,10,1,2,3,1,1,'Master Year 2','AI-M1','2025-2026','Computer Lab 1','Fri 16:00-18:50',80,1,1,'2026-06-01','active'),
(11,11,2,2,5,1,1,'Master Year 1','AI-M1','2025-2026','Computer Lab 2','Fri 11:00-12:50',1,1,1,'2026-06-01','full'),
(12,12,5,2,6,1,1,'Master Year 2','CYB-M2','2025-2026','Lab 2','Thu 12:00-13:50',24,1,1,'2026-06-01','active'),
(13,8,4,2,14,3,3,'Master Year 1','BAAI-M1','2025-2026','A3','Friday 15:00-16:50',30,0,1,'2026-06-01','active');

-- Block-style timetable rows. CS202 is one continuous 4-hour 08:00-11:50 card, not split hourly.
INSERT IGNORE INTO timetable_entries (id, course_offering_id, group_id, building_id, classroom_id, room_id, room_type, lab_id, day_of_week, timetable_date, start_time, end_time, teaching_hours, created_by_staff_id, is_published, room) VALUES
(1,4,1,1,1,1,'classroom',NULL,'Thursday','2026-02-19','08:00','11:50',4,1,1,'A1'),
(2,4,1,1,1,1,'classroom',NULL,'Thursday','2026-02-26','08:00','11:50',4,1,1,'A1'),
(3,4,1,1,1,1,'classroom',NULL,'Thursday','2026-03-05','08:00','11:50',4,1,1,'A1'),
(4,4,1,1,1,1,'classroom',NULL,'Thursday','2026-03-12','08:00','11:50',4,1,1,'A1'),
(5,4,1,1,1,1,'classroom',NULL,'Thursday','2026-03-19','08:00','11:50',4,1,1,'A1'),
(6,4,1,1,1,1,'classroom',NULL,'Thursday','2026-03-26','08:00','11:50',4,1,1,'A1'),
(7,4,1,1,1,1,'classroom',NULL,'Thursday','2026-04-02','08:00','11:50',4,1,1,'A1'),
(8,4,1,1,1,1,'classroom',NULL,'Thursday','2026-04-09','08:00','11:50',4,1,1,'A1'),
(9,4,1,1,1,1,'classroom',NULL,'Thursday','2026-04-16','08:00','11:50',4,1,1,'A1'),
(10,4,1,1,1,1,'classroom',NULL,'Thursday','2026-04-23','08:00','11:50',4,1,1,'A1'),
(11,4,1,1,1,1,'classroom',NULL,'Tuesday','2026-04-28','08:00','11:50',4,1,1,'A1'),
(12,4,1,1,1,1,'classroom',NULL,'Thursday','2026-05-07','08:00','11:50',4,1,1,'A1'),
(13,4,1,1,1,1,'classroom',NULL,'Thursday','2026-05-14','08:00','11:50',4,1,1,'A1'),
(14,4,1,1,1,1,'classroom',NULL,'Thursday','2026-05-21','08:00','11:50',4,1,1,'A1'),
(15,4,1,1,1,1,'classroom',NULL,'Thursday','2026-05-28','08:00','11:50',4,1,1,'A1'),
(16,4,1,1,1,1,'classroom',NULL,'Thursday','2026-06-04','08:00','11:50',4,1,1,'A1'),
(17,4,1,1,1,1,'classroom',NULL,'Thursday','2026-06-11','08:00','11:50',4,1,1,'A1'),
(18,4,1,1,1,1,'classroom',NULL,'Thursday','2026-06-18','08:00','11:50',4,1,1,'A1'),
(19,4,1,1,1,1,'classroom',NULL,'Thursday','2026-06-25','08:00','11:50',4,1,1,'A1'),
(20,4,1,1,1,1,'classroom',NULL,'Thursday','2026-07-02','08:00','11:50',4,1,1,'A1'),
(21,7,2,2,NULL,10,'lab',10,'Friday','2026-05-08','10:00','11:50',2,1,1,'Computer Lab 1'),
(22,1,1,3,NULL,12,'auditorium',NULL,'Saturday','2026-05-09','12:00','13:50',2,1,1,'Auditorium 1'),
(23,3,2,2,4,4,'classroom',NULL,'Wednesday','2026-05-13','14:00','15:50',2,1,1,'B1'),
(24,5,2,3,6,6,'classroom',NULL,'Monday','2026-05-11','13:00','14:50',2,1,1,'C1'),
(25,8,4,3,7,7,'classroom',NULL,'Friday','2026-05-15','09:00','10:50',2,1,1,'C2'),
(26,12,5,1,NULL,9,'lab',9,'Friday','2026-05-22','12:00','13:50',2,1,1,'Lab 2'),
-- Hourly-style rows to demonstrate backend grouping into one 16:00-19:50 teaching block.
(27,10,4,2,NULL,10,'lab',10,'Sunday','2026-05-10','16:00','16:50',1,1,1,'Computer Lab 1'),
(28,10,4,2,NULL,10,'lab',10,'Sunday','2026-05-10','17:00','17:50',1,1,1,'Computer Lab 1'),
(29,10,4,2,NULL,10,'lab',10,'Sunday','2026-05-10','18:00','18:50',1,1,1,'Computer Lab 1'),
(30,10,4,2,NULL,10,'lab',10,'Sunday','2026-05-10','19:00','19:50',1,1,1,'Computer Lab 1');

INSERT IGNORE INTO registrations (id, student_id, offering_id, status) VALUES
(1,1,4,'active'),(2,2,4,'active'),(3,3,4,'active'),(4,4,4,'active'),(5,5,4,'active'),(6,6,4,'active'),(7,7,4,'active'),(8,8,4,'active'),
(9,1,1,'active'),(10,2,1,'active'),(11,3,1,'active'),(12,4,1,'active'),(13,5,1,'active'),(14,10,1,'active'),
(15,6,3,'active'),(16,7,3,'active'),(17,8,3,'active'),(18,9,3,'active'),(19,11,3,'active'),(20,12,3,'active'),
(21,6,7,'active'),(22,7,7,'active'),(23,8,7,'active'),(24,9,7,'active'),(25,11,7,'active'),(26,12,7,'active'),
(27,13,8,'active'),(28,14,8,'active'),(29,13,9,'active'),(30,14,9,'active'),(31,15,12,'active'),
(32,23,11,'active'),(33,20,13,'active');

INSERT IGNORE INTO student_course_selections (id, student_id, course_offering_id, status, reason, approved_by_staff_id, approved_at) VALUES
(1,1,4,'enrolled',NULL,1,CURRENT_TIMESTAMP),
(2,1,7,'approved',NULL,1,CURRENT_TIMESTAMP),
(3,2,5,'rejected','prerequisite not passed',NULL,NULL),
(4,4,5,'requested',NULL,NULL,NULL),
(5,23,11,'rejected','course is full',NULL,NULL),
(6,3,4,'retake_requested','Retake allowed next academic year after absence failure',NULL,NULL),
(7,1,2,'rejected','timetable conflict',NULL,NULL);

INSERT IGNORE INTO weekly_topics (course_offering_id, course_id, teacher_id, week_number, topic_title, topic_description) VALUES
(4,4,1,1,'Relational Model','Tables, keys, relationships, and constraints.'),
(4,4,1,2,'SQL Basics','SELECT, WHERE, joins, and aggregation.'),
(4,4,1,3,'Normalization','Functional dependencies and normal forms.'),
(4,4,1,4,'Transactions','ACID properties and isolation.'),
(4,4,1,5,'Indexing','Indexes and query planning.'),
(4,4,1,11,'SQL joins and aggregation practice','Single weekly four-hour Databases teaching block.'),
(1,1,1,1,'Programming Foundations','Variables, input/output, and expressions.'),
(1,1,1,2,'Control Flow','Conditionals and loops.'),
(7,7,1,1,'HTML and CSS','Document structure and styling.'),
(7,7,1,2,'React Components','Props, state, and events.');

INSERT IGNORE INTO course_materials (offering_id, course_id, teacher_id, week_number, title, description, classwork_description, homework_description, material_kind, external_url, status, published_at, is_visible_to_students) VALUES
(4,4,1,1,'Relational Model Notes','Core database concepts.','Design an enrollment schema.','Normalize the library example.','link','https://dev.mysql.com/doc/refman/8.4/en/tutorial.html','published',CURRENT_TIMESTAMP,1),
(4,4,1,2,'SQL Query Guide','Joins and grouping.','Practice join queries.','Complete SQL worksheet 2.','link','https://dev.mysql.com/doc/refman/8.4/en/select.html','published',CURRENT_TIMESTAMP,1),
(4,4,1,3,'Normalization Slides','1NF, 2NF, and 3NF.','Identify dependencies.','Normalize the clinic schema.','link','https://www.postgresql.org/docs/current/ddl-constraints.html','published',CURRENT_TIMESTAMP,1),
(1,1,1,1,'Python Setup','First programming lab.','Install Python and write scripts.','Submit exercise set 1.','link','https://www.python.org/about/gettingstarted/','published',CURRENT_TIMESTAMP,1),
(7,7,1,1,'Web Foundations','HTML, CSS, and browser tools.','Build a profile page.','Style the course card layout.','link','https://developer.mozilla.org/en-US/docs/Learn','published',CURRENT_TIMESTAMP,1);

INSERT IGNORE INTO assignments (course_offering_id, course_id, teacher_id, week_number, title, description, instructions, start_at, end_at, due_date, due_time, max_points, status, is_visible_to_students, published_at) VALUES
(4,4,1,1,'Database Design Worksheet','Model entities and relationships.','Submit a PDF diagram.','2026-03-08 08:00:00','2026-03-15 23:59:00','2026-03-15','23:59:00',100,'published',1,CURRENT_TIMESTAMP),
(4,4,1,2,'SQL Query Set','Write SELECT and JOIN queries.','Submit one SQL file.','2026-03-15 08:00:00','2026-03-22 23:59:00','2026-03-22','23:59:00',100,'published',1,CURRENT_TIMESTAMP),
(4,4,1,3,'Normalization Case','Normalize a reporting schema.','Include dependency notes.','2026-03-22 08:00:00','2026-03-29 23:59:00','2026-03-29','23:59:00',100,'published',1,CURRENT_TIMESTAMP),
(1,1,1,1,'Programming Worksheet','Variables and expressions.','Submit source files.','2026-02-23 08:00:00','2026-03-01 23:59:00','2026-03-01','23:59:00',100,'published',1,CURRENT_TIMESTAMP),
(7,7,1,1,'Responsive Page','Build a responsive page.','Submit repository link.','2026-03-01 08:00:00','2026-03-08 23:59:00','2026-03-08','23:59:00',100,'published',1,CURRENT_TIMESTAMP);

INSERT IGNORE INTO attendance_sessions (id, offering_id, session_date, week_number, topic)
SELECT id, course_offering_id, timetable_date, GREATEST(1, FLOOR(DATEDIFF(timetable_date, '2026-02-16') / 7) + 1), CONCAT('Timetable session ', id)
FROM timetable_entries
WHERE id BETWEEN 1 AND 22;

INSERT IGNORE INTO attendance_records (session_id, course_offering_id, timetable_entry_id, course_id, teacher_id, student_id, week_number, attendance_date, start_time, end_time, status, notes)
SELECT s.id, 4, s.id, 4, 1, st.id, s.week_number, s.session_date, te.start_time, te.end_time,
       CASE
         WHEN st.id = 1 AND s.id = 5 THEN 'absent'
         WHEN st.id = 2 AND s.id IN (4,10,16) THEN 'absent'
         WHEN st.id = 3 AND s.id IN (3,8,13,18) THEN 'absent'
         WHEN st.id = 4 AND s.id IN (2,9) THEN 'late'
         WHEN st.id = 5 AND s.id IN (6,11) THEN 'excused'
         ELSE 'present'
       END,
       CASE
         WHEN st.id = 3 AND s.id IN (3,8,13,18) THEN 'Absence limit test case'
         WHEN st.id = 2 AND s.id IN (4,10,16) THEN 'Exactly 15 percent absence test case'
         WHEN st.id = 1 AND s.id = 5 THEN 'Low absence test case'
         WHEN st.id = 4 AND s.id IN (2,9) THEN 'Arrived after attendance call'
         WHEN st.id = 5 AND s.id IN (6,11) THEN 'Approved excused absence'
         ELSE NULL
       END
FROM attendance_sessions s
JOIN timetable_entries te ON te.id = s.id
JOIN students st ON st.id BETWEEN 1 AND 8
WHERE s.id BETWEEN 1 AND 20;

INSERT IGNORE INTO attendance_records (session_id, course_offering_id, timetable_entry_id, course_id, teacher_id, student_id, week_number, attendance_date, start_time, end_time, status, notes) VALUES
(21,7,21,7,1,6,13,'2026-05-14','10:00','11:50','present',NULL),
(21,7,21,7,1,7,13,'2026-05-14','10:00','11:50','late','Traffic delay'),
(22,1,22,1,1,1,13,'2026-05-14','12:00','13:50','present',NULL),
(22,1,22,1,1,2,13,'2026-05-14','12:00','13:50','excused','Approved academic event');

INSERT IGNORE INTO grades (registration_id, course_offering_id, course_id, teacher_id, student_id, midterm_score, project_score, quiz_score, final_exam_score, total_score, letter_grade, final_grade, pass_status, exam_blocked_due_to_absence, absence_percentage, failure_reason, retake_allowed_next_academic_year, feedback, is_published) VALUES
(1,4,4,1,1,12,12,9,50,83,'8',8,'passed',0,5.00,NULL,0,'Low absences; grade allowed.',1),
(2,4,4,1,2,10,10,8,45,73,'7',7,'passed',0,15.00,NULL,0,'Exactly 15 percent absences; grade allowed.',1),
(3,4,4,1,3,0,0,0,NULL,4,'F',4,'failed',1,20.00,'Absences over 15%',1,'Exam blocked due to absences.',1),
(4,4,4,1,4,10,10,8,30,58,'6',6,'passed',0,0.00,NULL,0,'Late records do not count as absences.',1),
(5,4,4,1,5,11,10,8,35,64,'6',6,'passed',0,0.00,NULL,0,'Excused absences do not count.',1),
(9,1,1,1,1,8,8,6,22,44,'F',4,'failed',0,0.00,NULL,0,'Boundary: 44 failed.',1),
(10,1,1,1,2,8,8,7,22,45,'5',5,'passed',0,0.00,NULL,0,'Boundary: 45 passed.',1),
(11,1,1,1,3,9,9,6,30,54,'5',5,'passed',0,0.00,NULL,0,'Boundary: 54 grade 5.',1),
(12,1,1,1,4,10,10,7,28,55,'6',6,'passed',0,0.00,NULL,0,'Boundary: 55 grade 6.',1),
(13,1,1,1,5,10,10,8,36,64,'6',6,'passed',0,0.00,NULL,0,'Boundary: 64 grade 6.',1),
(15,3,3,1,6,11,11,8,35,65,'7',7,'passed',0,0.00,NULL,0,'Boundary: 65 grade 7.',1),
(16,3,3,1,7,12,12,9,41,74,'7',7,'passed',0,0.00,NULL,0,'Boundary: 74 grade 7.',1),
(17,3,3,1,8,12,12,9,42,75,'8',8,'passed',0,0.00,NULL,0,'Boundary: 75 grade 8.',1),
(18,3,3,1,9,12,12,10,50,84,'8',8,'passed',0,0.00,NULL,0,'Boundary: 84 grade 8.',1),
(21,7,7,1,6,13,13,9,50,85,'9',9,'passed',0,0.00,NULL,0,'Boundary: 85 grade 9.',1),
(22,7,7,1,7,14,14,10,56,94,'9',9,'passed',0,0.00,NULL,0,'Boundary: 94 grade 9.',1),
(23,7,7,1,8,15,15,10,55,95,'10',10,'passed',0,0.00,NULL,0,'Boundary: 95 grade 10.',1);

INSERT IGNORE INTO student_course_status (student_id, course_offering_id, academic_year, status, absence_percentage, can_take_exam, can_retake_next_year) VALUES
(1,4,'2025-2026','active',5.00,1,0),
(2,4,'2025-2026','active',15.00,1,0),
(3,4,'2025-2026','failed_absence',20.00,0,1);

-- Progression fixtures: passed credits are represented by published passing grades.
INSERT IGNORE INTO registrations (id, student_id, offering_id, status) VALUES
(100,4,1,'completed'),(101,4,2,'completed'),(102,4,3,'completed'),(103,4,4,'completed'),(104,4,5,'completed'),(105,4,6,'completed'),(106,4,7,'completed'),(107,4,8,'completed'),(108,4,9,'completed'),(109,4,10,'completed'),
(110,5,1,'completed'),(111,5,2,'completed'),(112,5,3,'completed'),(113,5,4,'completed'),(114,5,5,'completed'),(115,5,6,'completed'),(116,5,7,'completed'),(117,5,8,'completed'),(118,5,9,'completed'),(119,5,10,'completed'),(120,5,11,'completed'),
(130,6,1,'completed'),(131,6,2,'completed'),(132,6,3,'completed'),(133,6,4,'completed'),(134,6,5,'completed'),(135,6,6,'completed'),(136,6,7,'completed'),(137,6,8,'completed'),(138,6,9,'completed'),(139,6,10,'completed'),(140,6,11,'completed'),(141,6,12,'completed'),
(150,8,1,'completed'),(151,8,2,'completed'),(152,8,3,'completed'),(153,8,4,'completed'),(154,8,5,'completed'),(155,8,6,'completed'),(156,8,7,'completed'),(157,8,8,'completed'),(158,8,9,'completed'),(159,8,10,'completed'),(160,8,11,'completed'),(161,8,12,'completed'),
(170,13,8,'completed'),(171,13,9,'completed'),(172,13,10,'completed'),(173,13,11,'completed'),(174,13,12,'completed'),(175,13,1,'completed'),(176,14,8,'completed'),(177,14,9,'completed'),(178,14,10,'completed'),(179,14,11,'completed'),(180,14,12,'completed'),(181,14,1,'completed'),(182,15,8,'completed'),(183,15,9,'completed'),(184,15,10,'completed'),(185,15,11,'completed'),(186,15,12,'completed'),(187,15,1,'completed'),(188,15,2,'completed'),(189,15,3,'completed');

INSERT IGNORE INTO grades (registration_id, course_offering_id, course_id, teacher_id, student_id, midterm_score, project_score, quiz_score, final_exam_score, total_score, letter_grade, final_grade, pass_status, is_published)
SELECT r.id, r.offering_id, o.course_id, o.instructor_id, r.student_id, 10, 10, 8, 35, 63, '6', 6, 'passed', 1
FROM registrations r
JOIN offerings o ON o.id = r.offering_id
WHERE r.id BETWEEN 100 AND 189;

INSERT IGNORE INTO invoices (id, student_id, semester_id, description, amount, amount_paid, due_date, status) VALUES
(1,1,2,'Spring 2026 tuition installment',1200,1200,'2026-03-01','paid'),
(2,2,2,'Spring 2026 tuition installment',1200,600,'2026-03-01','partial'),
(3,3,2,'Spring 2026 tuition installment',1200,0,'2026-03-01','overdue');

INSERT IGNORE INTO announcements (created_by, title, content, target_role) VALUES
(2,'Spring 2026 Timetable Published','Staff-managed timetable entries are available for teacher and student portals.','student'),
(2,'Attendance Lock Policy','Previous timetable dates are read-only for attendance.','teacher');

INSERT IGNORE INTO notifications (user_id, title, message, type, is_read) VALUES
(10,'Attendance Recorded','Your CS202 attendance for Week 13 is visible.','info',0),
(12,'Exam Eligibility Warning','CS202 exam eligibility is blocked due to absences over 15%.','warning',0);

-- =============================================================
-- Rich integration fixtures for Teacher, Student, Staff, Finance
-- Uses existing tables/enums and is safe to rerun.
-- =============================================================

INSERT INTO faculties (id, name, code) VALUES
(1, 'Faculty of Computer Science and IT', 'FCSIT'),
(2, 'Faculty of Engineering', 'FENG'),
(3, 'Faculty of Economics', 'FECO'),
(4, 'Faculty of Law', 'FLAW'),
(5, 'Faculty of Medicine', 'FMED'),
(6, 'Faculty of Architecture and Design', 'FAD'),
(7, 'Faculty of Education', 'FEDU'),
(8, 'Faculty of Business Administration', 'FBA')
ON DUPLICATE KEY UPDATE name = VALUES(name), code = VALUES(code);

INSERT IGNORE INTO departments (id, name, code, faculty_id, degree_level) VALUES
(20,'Cyber Security','CYS',1,'Bachelor'),
(21,'Applied Data Science','ADS',1,'Master'),
(22,'Mechanical Engineering','MEC',2,'Bachelor'),
(23,'Electrical Engineering','ELE',2,'Master'),
(24,'Construction Management','CONM',2,'Master'),
(25,'Finance and Accounting','FINA',3,'Bachelor'),
(26,'Banking and Finance','BANK',3,'Master'),
(27,'Criminal Law','CLAW',4,'Master'),
(28,'General Medicine','GMED',5,'Bachelor'),
(29,'Nursing','NURS',5,'Bachelor'),
(30,'Pharmacy','PHAR',5,'Master'),
(31,'Urban Planning','URBP',6,'Master'),
(32,'Interior Design','IDES',6,'Bachelor'),
(33,'Teaching and Learning','TEAL',7,'Bachelor'),
(34,'Educational Leadership','EDL',7,'Master'),
(35,'Business Administration','BADM',8,'Bachelor'),
(36,'International Business','IBUS',8,'Master');

INSERT IGNORE INTO programs (id, name, code, department_id, total_credits, duration_semesters) VALUES
(20,'Cyber Security','BCYB',20,180,6),
(21,'Data Science','MDS2',21,120,4),
(22,'Mechanical Engineering','BMECH',22,180,6),
(23,'Electrical Engineering','MEE',23,120,4),
(24,'Construction Management','MCM',24,120,4),
(25,'Finance and Accounting','BFA',25,180,6),
(26,'Banking and Finance','MBF',26,120,4),
(27,'Criminal Law','MCL',27,120,4),
(28,'General Medicine','BMED',28,360,12),
(29,'Nursing','BNUR',29,180,6),
(30,'Pharmacy','MPH',30,120,4),
(31,'Urban Planning','MUP',31,120,4),
(32,'Interior Design','BID',32,180,6),
(33,'Education','BED',33,180,6),
(34,'Educational Leadership','MEL',34,120,4),
(35,'Business Administration','BBA2',35,180,6),
(36,'International Business','MIB',36,120,4);

INSERT IGNORE INTO semesters (id, name, start_date, end_date, total_weeks, is_active, registration_deadline, drop_deadline) VALUES
(10, 'Winter 2024', '2024-09-16', '2025-01-26', 14, 0, '2024-09-23', '2024-10-11'),
(11, 'Spring 2025', '2025-02-17', '2025-06-22', 14, 0, '2025-02-24', '2025-03-14'),
(12, 'Winter 2025', '2025-09-15', '2026-01-25', 14, 0, '2025-09-22', '2025-10-10');

UPDATE semesters SET total_weeks = 14 WHERE name LIKE 'Winter%' OR name LIKE 'Spring%';

INSERT IGNORE INTO users (id, email, full_name, password_hash, role, is_first_login, is_active, status) VALUES
(40,'finance.csit@cis.edu','FCSIT Finance Officer','$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu','finance_staff',0,1,'active'),
(41,'finance.engineering@cis.edu','Engineering Finance Officer','$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu','finance_staff',0,1,'active'),
(42,'finance.economics@cis.edu','Economics Finance Officer','$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu','finance_staff',0,1,'active'),
(43,'finance.law@cis.edu','Law Finance Officer','$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu','finance_staff',0,1,'active'),
(44,'finance.medicine@cis.edu','Medicine Finance Officer','$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu','finance_staff',0,1,'active'),
(45,'finance.architecture@cis.edu','Architecture Finance Officer','$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu','finance_staff',0,1,'active'),
(46,'finance.education@cis.edu','Education Finance Officer','$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu','finance_staff',0,1,'active'),
(47,'finance.business@cis.edu','Business Finance Officer','$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu','finance_staff',0,1,'active'),
(50,'anna.nguyen@cis.edu','Dr. Anna Nguyen','$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu','teacher',0,1,'active'),
(51,'peter.schmidt@cis.edu','Prof. Peter Schmidt','$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu','teacher',0,1,'active'),
(52,'maria.rossi@cis.edu','Dr. Maria Rossi','$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu','teacher',0,1,'active'),
(53,'omar.haddad@cis.edu','Prof. Omar Haddad','$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu','teacher',0,1,'active'),
(54,'elena.garcia@cis.edu','Dr. Elena Garcia','$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu','teacher',0,1,'active'),
(55,'natalie.price@cis.edu','Natalie Price','$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu','finance_staff',0,1,'active'),
(56,'victor.hughes@cis.edu','Victor Hughes','$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu','finance_staff',0,1,'active');

INSERT IGNORE INTO staff_profiles (id, user_id, faculty_id, position) VALUES
(40,40,1,'Finance Officer'),(41,41,2,'Finance Officer'),(42,42,3,'Finance Officer'),(43,43,4,'Finance Officer'),
(44,44,5,'Finance Officer'),(45,45,6,'Finance Officer'),(46,46,7,'Finance Officer'),(47,47,8,'Finance Officer');

INSERT IGNORE INTO staff_profiles (id, user_id, faculty_id, scope, position) VALUES
(55,55,1,'multi_faculty','Regional Finance Coordinator'),
(56,56,NULL,'university','University Finance Director');

INSERT IGNORE INTO finance_faculty_scopes (user_id, faculty_id, scope) VALUES
(40,1,'faculty'),(41,2,'faculty'),(42,3,'faculty'),(43,4,'faculty'),(44,5,'faculty'),(45,6,'faculty'),(46,7,'faculty'),(47,8,'faculty'),
(55,1,'multi_faculty'),(55,2,'multi_faculty'),(55,3,'multi_faculty'),
(56,1,'university'),(56,2,'university'),(56,3,'university'),(56,4,'university'),(56,5,'university'),(56,6,'university'),(56,7,'university'),(56,8,'university');

INSERT IGNORE INTO instructors (id, user_id, first_name, last_name, title, department_id) VALUES
(10,50,'Anna','Nguyen','Dr.',21),
(11,51,'Peter','Schmidt','Prof.',22),
(12,52,'Maria','Rossi','Dr.',25),
(13,53,'Omar','Haddad','Prof.',28),
(14,54,'Elena','Garcia','Dr.',31);

INSERT IGNORE INTO teacher_faculty_assignments (teacher_id, faculty_id, program_id) VALUES
(1,1,20),(1,1,21),(10,1,21),(11,2,22),(11,2,23),(12,3,25),(12,8,35),(13,5,28),(13,5,29),(14,6,31),(14,7,33);

INSERT IGNORE INTO courses (id, code, name, description, credits, department_id) VALUES
(101,'CS205','Database Systems','Relational models, SQL, normalization, transactions, and indexing.',3,1),
(102,'AI501','Machine Learning','Supervised and unsupervised learning methods.',6,3),
(103,'AI502','Deep Learning','Neural network architectures and training.',6,3),
(104,'CYB301','Network Security','Network defense, cryptography, and incident response.',4,20),
(105,'DS401','Data Mining','Pattern discovery, clustering, and data pipelines.',4,21),
(106,'CE101','Engineering Drawing','Technical drawing and CAD fundamentals.',3,7),
(107,'CE202','Structural Mechanics','Forces, stress, strain, and structural analysis.',4,9),
(108,'ME201','Thermodynamics','Energy, heat transfer, and thermodynamic cycles.',4,22),
(109,'EE301','Power Systems','Electrical power generation and distribution.',4,23),
(110,'ECO101','Principles of Economics','Markets, incentives, and macroeconomic indicators.',3,12),
(111,'FIN201','Corporate Finance','Capital budgeting and financial decision making.',3,25),
(112,'ACC202','Financial Accounting','Accounting principles and reporting.',3,25),
(113,'LAW101','Introduction to Law','Legal systems and foundational concepts.',3,18),
(114,'LAW502','Criminal Law Seminar','Advanced criminal law and case analysis.',6,27),
(115,'MED101','Anatomy','Human anatomy foundations.',6,28),
(116,'NUR101','Nursing Basics','Clinical care, ethics, and patient safety.',4,29),
(117,'PHR501','Clinical Pharmacy','Pharmaceutical care and medication safety.',6,30),
(118,'ARC101','Architectural Design Studio','Design thinking, drawing, and studio critique.',6,8),
(119,'URP501','Urban Planning Studio','Spatial planning and urban systems.',6,31),
(120,'ID201','Interior Design Methods','Materials, lighting, and spatial experience.',3,32),
(121,'EDU101','Foundations of Education','Learning theories and school systems.',3,33),
(122,'EDL501','Educational Leadership','Leadership, policy, and school improvement.',6,34),
(123,'BUS101','Management Principles','Organizations, leadership, and strategy.',3,35),
(124,'IB501','International Business','Global markets and cross-border strategy.',6,36),
(125,'CS350','Operating Systems','Processes, memory, filesystems, and concurrency.',4,2),
(126,'CS360','Computer Networks','Protocols, routing, transport, and applications.',4,2),
(127,'CS370','Human Computer Interaction','Usability, prototyping, and evaluation.',3,1),
(128,'AI503','Natural Language Processing','Language models and text analytics.',6,3),
(129,'DS402','Big Data Engineering','Distributed data processing and storage.',6,21),
(130,'CYB302','Ethical Hacking','Penetration testing and vulnerability assessment.',4,20),
(131,'CE303','Hydraulics','Fluid mechanics for civil engineering.',4,7),
(132,'ME302','Manufacturing Systems','Production systems and process planning.',4,22),
(133,'EE302','Control Systems','Signals, feedback, and control design.',4,23),
(134,'ECO202','Econometrics','Regression and economic data analysis.',4,12),
(135,'FIN301','Investment Analysis','Portfolio theory and financial instruments.',4,25),
(136,'ACC303','Auditing','Audit methods, controls, and assurance.',4,25),
(137,'MED202','Physiology','Human physiology and organ systems.',6,28),
(138,'NUR202','Clinical Practice','Practical nursing care and documentation.',4,29),
(139,'ARC202','Building Technology','Construction systems and building materials.',4,8),
(140,'BUS302','Business Analytics','Analytical methods for business decisions.',4,35);

INSERT IGNORE INTO buildings (id, code, name) VALUES
(4,'MED','Medicine Simulation Center'),(5,'BUS','Business School Building'),(6,'DES','Design Studio Building'),(7,'EDU','Education Building');

INSERT IGNORE INTO classrooms (id, building_id, name, room_type, capacity) VALUES
(20,4,'Anatomy Lab','lab',32),(21,4,'Clinical Lab','lab',28),(22,5,'Business Hall 1','classroom',60),(23,5,'Trading Lab','lab',32),
(24,6,'Design Studio A','classroom',30),(25,6,'Urban Lab','lab',26),(26,7,'Education Room 1','classroom',40),(27,7,'Teaching Lab','lab',30);

INSERT IGNORE INTO offerings (id, course_id, instructor_id, semester_id, program_id, faculty_id, created_by_staff_id, academic_year, group_name, academic_period, room, schedule, capacity, enrolled, enrollment_open, selection_deadline, status) VALUES
(101,101,1,2,1,1,1,'Bachelor Year 1','SE-B1','2025-2026','A2','Thu 10:00-11:50',80,0,1,'2026-06-01','active'),
(102,102,10,2,3,1,1,'Master Year 1','AI-M1','2025-2026','Computer Lab 2','Mon 09:00-10:50',40,0,1,'2026-06-01','active'),
(103,103,10,2,3,1,1,'Master Year 1','AI-M1','2025-2026','Computer Lab 2','Tue 11:00-12:50',40,0,1,'2026-06-01','active'),
(104,104,5,2,20,1,1,'Bachelor Year 2','CYB-B2','2025-2026','Lab 2','Wed 09:00-10:50',40,0,1,'2026-06-01','active'),
(105,105,3,2,21,1,1,'Master Year 1','DS-M1','2025-2026','Computer Lab 1','Fri 13:00-14:50',40,0,1,'2026-06-01','active'),
(106,106,11,2,7,2,2,'Bachelor Year 1','CIV-B1','2025-2026','A3','Mon 11:00-12:50',60,0,1,'2026-06-01','active'),
(107,107,11,2,9,2,2,'Master Year 1','STR-M1','2025-2026','A3','Tue 13:00-14:50',40,0,1,'2026-06-01','active'),
(108,108,11,2,22,2,2,'Bachelor Year 2','MECH-B2','2025-2026','G2-B1','Wed 15:00-16:50',60,0,1,'2026-06-01','active'),
(109,109,11,2,23,2,2,'Master Year 1','EE-M1','2025-2026','G2-B2','Thu 09:00-10:50',40,0,1,'2026-06-01','active'),
(110,110,12,2,12,3,3,'Bachelor Year 1','ECO-B1','2025-2026','C1','Mon 14:00-15:50',70,0,1,'2026-06-01','active'),
(111,111,12,2,25,3,3,'Bachelor Year 2','FIN-B2','2025-2026','C2','Tue 09:00-10:50',70,0,1,'2026-06-01','active'),
(112,112,12,2,25,3,3,'Bachelor Year 2','FIN-B2','2025-2026','C2','Wed 11:00-12:50',70,0,1,'2026-06-01','active'),
(113,113,12,2,18,4,3,'Bachelor Year 1','LAW-B1','2025-2026','Auditorium 2','Thu 11:00-12:50',90,0,1,'2026-06-01','active'),
(114,114,12,2,27,4,3,'Master Year 1','CLAW-M1','2025-2026','Auditorium 2','Fri 09:00-10:50',40,0,1,'2026-06-01','active'),
(115,115,13,2,28,5,1,'Bachelor Year 1','MED-B1','2025-2026','Anatomy Lab','Mon 08:00-10:50',60,0,1,'2026-06-01','active'),
(116,116,13,2,29,5,1,'Bachelor Year 1','NUR-B1','2025-2026','Clinical Lab','Tue 08:00-09:50',50,0,1,'2026-06-01','active'),
(117,117,13,2,30,5,1,'Master Year 1','PHR-M1','2025-2026','Clinical Lab','Wed 08:00-09:50',40,0,1,'2026-06-01','active'),
(118,118,14,2,8,6,2,'Bachelor Year 1','ARCH-B1','2025-2026','Design Studio A','Mon 13:00-15:50',30,0,1,'2026-06-01','active'),
(119,119,14,2,31,6,2,'Master Year 1','URP-M1','2025-2026','Urban Lab','Tue 15:00-16:50',30,0,1,'2026-06-01','active'),
(120,120,14,2,32,6,2,'Bachelor Year 2','ID-B2','2025-2026','Design Studio A','Wed 13:00-14:50',30,0,1,'2026-06-01','active'),
(121,121,14,2,33,7,2,'Bachelor Year 1','EDU-B1','2025-2026','Education Room 1','Thu 13:00-14:50',50,0,1,'2026-06-01','active'),
(122,122,14,2,34,7,2,'Master Year 1','EDL-M1','2025-2026','Teaching Lab','Fri 11:00-12:50',30,0,1,'2026-06-01','active'),
(123,123,12,2,35,8,3,'Bachelor Year 1','BUS-B1','2025-2026','Business Hall 1','Mon 16:00-17:50',80,0,1,'2026-06-01','active'),
(124,124,12,2,36,8,3,'Master Year 1','IB-M1','2025-2026','Trading Lab','Tue 16:00-17:50',40,0,1,'2026-06-01','active');

-- Exact multi-session same-day fixture for Dr. John Carter.
INSERT IGNORE INTO timetable_entries (id, course_offering_id, group_id, building_id, classroom_id, room_id, room_type, lab_id, day_of_week, timetable_date, start_time, end_time, teaching_hours, created_by_staff_id, is_published, room) VALUES
(1001,1,1,3,NULL,12,'auditorium',NULL,'Thursday','2026-05-14','08:00','11:50',4,1,1,'Auditorium 1'),
(1002,1,1,3,NULL,12,'auditorium',NULL,'Thursday','2026-05-21','08:00','11:50',4,1,1,'Auditorium 1'),
(1003,101,1,1,2,2,'classroom',NULL,'Thursday','2026-05-14','08:00','11:50',4,1,1,'A2'),
(1004,101,1,1,2,2,'classroom',NULL,'Thursday','2026-05-21','08:00','11:50',4,1,1,'A2'),
(1005,10,4,2,NULL,10,'lab',10,'Friday','2026-05-15','16:00','19:50',4,1,1,'Computer Lab 1'),
(1006,10,4,2,NULL,10,'lab',10,'Friday','2026-05-22','16:00','19:50',4,1,1,'Computer Lab 1'),
(1007,10,4,2,NULL,10,'lab',10,'Friday','2026-05-29','16:00','19:50',4,1,1,'Computer Lab 1');

DELIMITER //
DROP PROCEDURE IF EXISTS seed_rich_cis//
CREATE PROCEDURE seed_rich_cis()
BEGIN
  DECLARE i INT DEFAULT 1;
  DECLARE j INT DEFAULT 1;
  DECLARE sid INT;
  DECLARE uid INT;
  DECLARE pid INT;
  DECLARE offid INT;
  DECLARE regid INT;
  DECLARE inv_status VARCHAR(20);
  DECLARE paid_amount DECIMAL(10,2);

  WHILE i <= 150 DO
    SET uid = 1000 + i;
    SET sid = 1000 + i;
    SET pid = ELT(1 + MOD(i - 1, 25), 1,2,3,4,5,6,7,8,12,13,14,15,18,20,21,22,23,25,27,28,29,30,31,33,35);
    INSERT IGNORE INTO users (id, email, full_name, password_hash, role, is_first_login, is_active, status)
    VALUES (
      uid,
      CONCAT(LOWER(ELT(1 + MOD(i - 1, 20), 'Oliver','Hannah','Caleb','Sophie','Isaac','Chloe','Jacob','Madison','Owen','Lucy','Riley','Hazel','Ryan','Layla','Adam','Zara','Eli','Naomi','Connor','Penny')), '.', LOWER(ELT(1 + MOD(i + 6, 20), 'Foster','Hayes','Murphy','Bell','Ward','Cox','Bailey','Howard','Ross','Bryant','Hunter','Russell','Griffin','Stevens','Lawson','Powell','Webb','Watson','Murray','Fletcher')), LPAD(i,3,'0'), '@cis.edu'),
      CONCAT(ELT(1 + MOD(i - 1, 20), 'Oliver','Hannah','Caleb','Sophie','Isaac','Chloe','Jacob','Madison','Owen','Lucy','Riley','Hazel','Ryan','Layla','Adam','Zara','Eli','Naomi','Connor','Penny'), ' ', ELT(1 + MOD(i + 6, 20), 'Foster','Hayes','Murphy','Bell','Ward','Cox','Bailey','Howard','Ross','Bryant','Hunter','Russell','Griffin','Stevens','Lawson','Powell','Webb','Watson','Murray','Fletcher')),
      '$2b$12$ArSjr5kl4WLllxTlXXuTyuJ4fdc9RuF1BU5CLoy.w0MCSXr/CMxRu',
      'student',
      0,
      1,
      'active'
    );
    INSERT IGNORE INTO students (id, user_id, student_code, first_name, last_name, phone, date_of_birth, program_id, degree_level, academic_year, current_semester, gpa, status)
    VALUES (
      sid,
      uid,
      CONCAT('CIS-2026-', LPAD(100 + i, 3, '0')),
      ELT(1 + MOD(i - 1, 20), 'Oliver','Hannah','Caleb','Sophie','Isaac','Chloe','Jacob','Madison','Owen','Lucy','Riley','Hazel','Ryan','Layla','Adam','Zara','Eli','Naomi','Connor','Penny'),
      ELT(1 + MOD(i + 6, 20), 'Foster','Hayes','Murphy','Bell','Ward','Cox','Bailey','Howard','Ross','Bryant','Hunter','Russell','Griffin','Stevens','Lawson','Powell','Webb','Watson','Murray','Fletcher'),
      CONCAT('+355682', LPAD(i,6,'0')),
      DATE_ADD('1999-01-01', INTERVAL MOD(i, 1800) DAY),
      pid,
      IF(pid IN (3,5,6,14,15,21,23,24,26,27,30,31,34,36), 'Master', 'Bachelor'),
      IF(pid IN (3,5,6,14,15,21,23,24,26,27,30,31,34,36), 'Master Year 1', 'Bachelor Year 1'),
      2 + MOD(i, 5),
      ROUND(2.40 + (MOD(i, 160) / 100), 2),
      IF(MOD(i, 37)=0, 'probation', 'active')
    );
    SET i = i + 1;
  END WHILE;

  SET i = 1;
  WHILE i <= 150 DO
    SET sid = 1000 + i;
    SET offid = ELT(1 + MOD(i - 1, 12), 1,10,101,102,103,104,105,110,111,115,118,123);
    SET regid = 10000 + i;
    INSERT IGNORE INTO registrations (id, student_id, offering_id, status) VALUES (regid, sid, offid, 'active');
    INSERT IGNORE INTO registrations (id, student_id, offering_id, status) VALUES (regid + 1000, sid, ELT(1 + MOD(i, 12), 1,10,101,102,103,104,105,110,111,115,118,123), 'active');
    INSERT IGNORE INTO student_course_selections (id, student_id, course_offering_id, status, reason, approved_by_staff_id, approved_at)
    VALUES (20000 + i, sid, offid, 'approved', NULL, 1, CURRENT_TIMESTAMP);
    IF MOD(i, 5) = 0 THEN
      INSERT IGNORE INTO student_course_selections (id, student_id, course_offering_id, status, reason)
      VALUES (21000 + i, sid, 101, 'requested', 'Pending advisor review');
    ELSEIF MOD(i, 7) = 0 THEN
      INSERT IGNORE INTO student_course_selections (id, student_id, course_offering_id, status, reason)
      VALUES (21000 + i, sid, 10, 'rejected', 'Timetable conflict');
    ELSEIF MOD(i, 11) = 0 THEN
      INSERT IGNORE INTO student_course_selections (id, student_id, course_offering_id, status, reason)
      VALUES (21000 + i, sid, 105, 'dropped', 'Student withdrew from selection');
    END IF;
    SET i = i + 1;
  END WHILE;

  SET i = 1;
  WHILE i <= 14 DO
    INSERT IGNORE INTO timetable_entries (id, course_offering_id, group_id, building_id, classroom_id, room_id, room_type, lab_id, day_of_week, timetable_date, start_time, end_time, teaching_hours, created_by_staff_id, is_published, room)
    VALUES (2000 + i, 102, 4, 2, NULL, 11, 'lab', 11, ELT(1 + MOD(i,5),'Monday','Tuesday','Wednesday','Thursday','Friday'), DATE_ADD('2026-02-16', INTERVAL ((i - 1) * 7) DAY), '08:00', '11:50', 4, 1, 1, 'Computer Lab 2');
    INSERT IGNORE INTO timetable_entries (id, course_offering_id, group_id, building_id, classroom_id, room_id, room_type, lab_id, day_of_week, timetable_date, start_time, end_time, teaching_hours, created_by_staff_id, is_published, room)
    VALUES (2100 + i, 101, 1, 1, 2, 2, 'classroom', NULL, 'Wednesday', DATE_ADD('2026-02-18', INTERVAL ((i - 1) * 7) DAY), '08:00', '11:50', 4, 1, 1, 'A2');
    INSERT IGNORE INTO timetable_entries (id, course_offering_id, group_id, building_id, classroom_id, room_id, room_type, lab_id, day_of_week, timetable_date, start_time, end_time, teaching_hours, created_by_staff_id, is_published, room)
    VALUES (2200 + i, 110, NULL, 3, 6, 6, 'classroom', NULL, 'Monday', DATE_ADD('2026-02-16', INTERVAL ((i - 1) * 7) DAY), '08:00', '11:50', 4, 3, 1, 'C1');
    INSERT IGNORE INTO timetable_entries (id, course_offering_id, group_id, building_id, classroom_id, room_id, room_type, lab_id, day_of_week, timetable_date, start_time, end_time, teaching_hours, created_by_staff_id, is_published, room)
    VALUES (2300 + i, 115, NULL, 4, NULL, 20, 'lab', 20, 'Monday', DATE_ADD('2026-02-16', INTERVAL ((i - 1) * 7) DAY), '08:00', '11:50', 4, 1, 1, 'Anatomy Lab');
    INSERT IGNORE INTO timetable_entries (id, course_offering_id, group_id, building_id, classroom_id, room_id, room_type, lab_id, day_of_week, timetable_date, start_time, end_time, teaching_hours, created_by_staff_id, is_published, room)
    VALUES (2400 + i, 118, NULL, 6, 24, 24, 'classroom', NULL, 'Monday', DATE_ADD('2026-02-16', INTERVAL ((i - 1) * 7) DAY), '08:00', '11:50', 4, 2, 1, 'Design Studio A');
    SET i = i + 1;
  END WHILE;

  SET offid = 101;
  WHILE offid <= 124 DO
    SET i = 1;
    WHILE i <= 14 DO
      INSERT IGNORE INTO timetable_entries (id, course_offering_id, group_id, building_id, classroom_id, room_id, room_type, lab_id, day_of_week, timetable_date, start_time, end_time, teaching_hours, created_by_staff_id, is_published, room)
      VALUES (
        800000 + (offid * 100) + i,
        offid,
        NULL,
        ELT(1 + MOD(offid, 7), 1,2,3,4,5,6,7),
        NULL,
        ELT(1 + MOD(offid, 8), 1,4,6,10,20,22,24,26),
        IF(MOD(offid, 5) = 0, 'lab', 'classroom'),
        IF(MOD(offid, 5) = 0, ELT(1 + MOD(offid, 5), 8,9,10,20,25), NULL),
        DATE_FORMAT(DATE_ADD('2026-02-16', INTERVAL (((i - 1) * 7) + MOD(offid, 5)) DAY), '%W'),
        DATE_ADD('2026-02-16', INTERVAL (((i - 1) * 7) + MOD(offid, 5)) DAY),
        '08:00',
        '11:50',
        4,
        1,
        1,
        CONCAT('Seed Room ', offid)
      );
      SET i = i + 1;
    END WHILE;
    SET offid = offid + 1;
  END WHILE;

  INSERT IGNORE INTO class_sessions (id, timetable_entry_id, course_offering_id, teacher_id, course_id, faculty_id, program_id, semester_id, week_id, session_date, day_of_week, start_time, end_time, building_id, room_id, room_type, lab_id, room, session_order, topic_title, topic_description, status, created_by_teacher)
  SELECT te.id, te.id, te.course_offering_id, o.instructor_id, o.course_id, o.faculty_id, o.program_id, o.semester_id,
         GREATEST(1, FLOOR(DATEDIFF(te.timetable_date, s.start_date) / 7) + 1),
         te.timetable_date, te.day_of_week, te.start_time, te.end_time, te.building_id, COALESCE(te.room_id, te.classroom_id, te.lab_id), te.room_type, te.lab_id, te.room,
         (SELECT COUNT(*) FROM timetable_entries te2 WHERE te2.course_offering_id = te.course_offering_id AND te2.timetable_date = te.timetable_date AND te2.start_time <= te.start_time),
         CASE te.id
           WHEN 1001 THEN 'Programming Foundations'
           WHEN 1002 THEN 'Variables, Input and Output'
           WHEN 1003 THEN 'Relational Database Models'
           WHEN 1004 THEN 'SQL Joins'
           WHEN 1005 THEN 'Distributed Systems Introduction'
           WHEN 1006 THEN 'Cloud Service Models'
           WHEN 1007 THEN 'Replication and Consistency'
           WHEN 12 THEN 'Database normalization and ERD review'
           WHEN 13 THEN 'SQL joins and aggregation practice'
           WHEN 14 THEN 'Transactions, constraints, and indexes'
           ELSE CONCAT(c.code, ' ', te.day_of_week, ' Session')
         END,
         CASE te.id
           WHEN 1007 THEN 'Consistency tradeoffs, replication patterns, and failure handling.'
           ELSE CONCAT('Real scheduled class session seeded from timetable row ', te.id, '.')
         END,
         IF(te.timetable_date = '2026-05-14', 'planned', 'completed'),
         0
  FROM timetable_entries te
  JOIN offerings o ON o.id = te.course_offering_id
  JOIN courses c ON c.id = o.course_id
  JOIN semesters s ON s.id = o.semester_id
  WHERE te.timetable_date IS NOT NULL;

INSERT IGNORE INTO attendance_sessions (id, offering_id, session_date, week_number, topic)
SELECT id, course_offering_id, session_date, week_id, COALESCE(topic_title, CONCAT('Class session ', id))
FROM class_sessions;

INSERT IGNORE INTO course_grade_configurations (course_offering_id, course_id, teacher_id, semester_id, academic_year, midterm_points, final_exam_points, project_points, assignment_points, quiz_points, attendance_points, participation_points, lab_work_points, is_active)
SELECT id, course_id, instructor_id, semester_id, academic_period,
       CASE WHEN id = 4 THEN 15 WHEN id IN (101, 102) THEN 0 WHEN id IN (10, 115) THEN 0 ELSE 30 END,
       CASE WHEN id = 4 THEN 60 WHEN id IN (101, 102) THEN 0 WHEN id IN (10, 115) THEN 60 ELSE 40 END,
       CASE WHEN id = 4 THEN 15 WHEN id IN (101, 102) THEN 50 WHEN id IN (10, 115) THEN 0 ELSE 20 END,
       CASE WHEN id = 4 THEN 0 WHEN id IN (101, 102) THEN 30 WHEN id IN (10, 115) THEN 20 ELSE 10 END,
       CASE WHEN id = 4 THEN 10 WHEN id IN (10, 115) THEN 20 ELSE 0 END,
       CASE WHEN id IN (101, 102) THEN 20 ELSE 0 END,
       0,
       0,
       1
FROM offerings;

  INSERT IGNORE INTO course_materials (id, offering_id, course_id, teacher_id, week_number, class_session_id, title, description, material_kind, file_path, file_url, external_url, link_url, video_url, text_content, original_file_name, file_mime_type, file_size, status, published_at, is_visible_to_students)
  SELECT 300000 + cs.id, cs.course_offering_id, cs.course_id, cs.teacher_id, cs.week_id, cs.id,
         CONCAT('Lecture Slides - ', COALESCE(cs.topic_title, 'Class Session')), 'Seeded PDF material for view/download testing.', 'file',
         'uploads/course-materials/seed/sample.pdf', '/api/materials/seed/sample.pdf', NULL, NULL, NULL, NULL, 'sample.pdf', 'application/pdf', 639, 'published', CURRENT_TIMESTAMP, 1
  FROM (SELECT id FROM class_sessions ORDER BY id LIMIT 30) pick
  JOIN class_sessions cs ON cs.id = pick.id;

  INSERT IGNORE INTO course_materials (id, offering_id, course_id, teacher_id, week_number, class_session_id, title, description, material_kind, external_url, link_url, status, published_at, is_visible_to_students)
  SELECT 310000 + cs.id, cs.course_offering_id, cs.course_id, cs.teacher_id, cs.week_id, cs.id,
         CONCAT('Reading Link - ', COALESCE(cs.topic_title, 'Class Session')), 'External reading link.', 'link', 'https://www.postgresql.org/docs/current/tutorial.html', 'https://www.postgresql.org/docs/current/tutorial.html', 'published', CURRENT_TIMESTAMP, 1
  FROM (SELECT id FROM class_sessions ORDER BY id LIMIT 30) pick
  JOIN class_sessions cs ON cs.id = pick.id;

  INSERT IGNORE INTO course_materials (id, offering_id, course_id, teacher_id, week_number, class_session_id, title, description, material_kind, external_url, video_url, status, published_at, is_visible_to_students)
  SELECT 320000 + cs.id, cs.course_offering_id, cs.course_id, cs.teacher_id, cs.week_id, cs.id,
         CONCAT('Video - ', COALESCE(cs.topic_title, 'Class Session')), 'Video walkthrough.', 'video', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'published', CURRENT_TIMESTAMP, 1
  FROM (SELECT id FROM class_sessions ORDER BY id LIMIT 25) pick
  JOIN class_sessions cs ON cs.id = pick.id;

  INSERT IGNORE INTO course_materials (id, offering_id, course_id, teacher_id, week_number, class_session_id, title, description, material_kind, text_content, status, published_at, is_visible_to_students)
  SELECT 330000 + cs.id, cs.course_offering_id, cs.course_id, cs.teacher_id, cs.week_id, cs.id,
         CONCAT('Instructor Notes - ', COALESCE(cs.topic_title, 'Class Session')), 'Text notes.', 'text', CONCAT('Key points for ', COALESCE(cs.topic_title, 'this class'), ': objectives, examples, and discussion questions.'), 'published', CURRENT_TIMESTAMP, 1
  FROM (SELECT id FROM class_sessions ORDER BY id LIMIT 25) pick
  JOIN class_sessions cs ON cs.id = pick.id;

  INSERT IGNORE INTO assignments (id, course_offering_id, course_id, teacher_id, week_number, class_session_id, title, description, instructions, start_at, end_at, due_date, due_time, max_points, status, is_visible_to_students, published_at)
  SELECT 400000 + cs.id, cs.course_offering_id, cs.course_id, cs.teacher_id, cs.week_id, cs.id,
         CASE cs.course_id
           WHEN 1 THEN 'CS101 Programming Exercise 1'
           WHEN 101 THEN 'CS205 SQL Joins Practice'
           WHEN 10 THEN 'MSC201 Distributed Systems Case Study'
           WHEN 102 THEN 'AI501 Machine Learning Lab'
           ELSE CONCAT('Applied Assignment - ', COALESCE(cs.topic_title, 'Session'))
         END,
         'Seeded assignment linked to a real class session.',
         'Submit your work through the student portal before the deadline.',
         TIMESTAMP(cs.session_date, cs.start_time),
         TIMESTAMP(DATE_ADD(cs.session_date, INTERVAL 10 DAY), '23:59:00'),
         DATE_ADD(cs.session_date, INTERVAL 10 DAY),
         '23:59:00',
         100,
         'published',
         1,
         CURRENT_TIMESTAMP
  FROM (
    SELECT MIN(id) AS id
    FROM class_sessions
    GROUP BY course_offering_id, teacher_id, course_id, week_id
    ORDER BY MIN(id)
    LIMIT 80
  ) pick
  JOIN class_sessions cs ON cs.id = pick.id;

  INSERT IGNORE INTO assignment_submissions (id, assignment_id, student_id, submitted_text, submitted_file_path, submitted_file_original_name, submitted_at, score, feedback, status, is_published)
  SELECT 600000 + (a.id * 1000) + r.student_id,
         a.id,
         r.student_id,
         CASE MOD(r.student_id, 3)
           WHEN 0 THEN 'https://student-work.cis.edu/submissions/research-note'
           WHEN 1 THEN 'Submitted a concise implementation summary in the portal.'
           ELSE NULL
         END,
         CASE WHEN MOD(r.student_id, 3) = 2 THEN 'uploads/course-materials/seed/sample.pdf' ELSE NULL END,
         CASE WHEN MOD(r.student_id, 3) = 2 THEN 'assignment-submission.pdf' ELSE NULL END,
         DATE_ADD(a.created_at, INTERVAL 2 DAY),
         CASE WHEN MOD(r.student_id, 4) = 0 THEN 88 ELSE NULL END,
         CASE WHEN MOD(r.student_id, 4) = 0 THEN 'Good work. Review the final reflection for more precision.' ELSE NULL END,
         CASE WHEN MOD(r.student_id, 4) = 0 THEN 'graded' ELSE 'submitted' END,
         CASE WHEN MOD(r.student_id, 4) = 0 THEN 1 ELSE 0 END
  FROM (SELECT id, course_offering_id, created_at FROM assignments ORDER BY id LIMIT 30) a
  JOIN registrations r ON r.offering_id = a.course_offering_id AND r.status = 'active'
  WHERE MOD(r.student_id, 5) <> 0;

  INSERT IGNORE INTO attendance_records (session_id, course_offering_id, timetable_entry_id, class_session_id, course_id, teacher_id, student_id, week_number, attendance_date, start_time, end_time, status, notes)
  SELECT cs.id, cs.course_offering_id, cs.timetable_entry_id, cs.id, cs.course_id, cs.teacher_id, r.student_id, cs.week_id, cs.session_date, cs.start_time, cs.end_time,
         ELT(1 + MOD(r.student_id + cs.id, 4), 'present', 'late', 'excused', 'absent'),
         IF(MOD(r.student_id + cs.id, 4) = 3, 'Seeded attendance edge case', NULL)
  FROM (SELECT id FROM class_sessions ORDER BY id LIMIT 140) pick
  JOIN class_sessions cs ON cs.id = pick.id
  JOIN registrations r ON r.offering_id = cs.course_offering_id AND r.status = 'active'
  WHERE r.student_id >= 1001
  LIMIT 700;

  INSERT IGNORE INTO grades (registration_id, course_offering_id, course_id, teacher_id, student_id, midterm_score, project_score, quiz_score, final_exam_score, total_score, letter_grade, final_grade, pass_status, exam_blocked_due_to_absence, absence_percentage, failure_reason, retake_allowed_next_academic_year, feedback, is_published)
  SELECT r.id, r.offering_id, o.course_id, o.instructor_id, r.student_id,
         8 + MOD(r.id, 8), 7 + MOD(r.id, 9), 5 + MOD(r.id, 6), 25 + MOD(r.id, 31),
         (8 + MOD(r.id, 8)) + (7 + MOD(r.id, 9)) + (5 + MOD(r.id, 6)) + (25 + MOD(r.id, 31)),
         IF(((8 + MOD(r.id, 8)) + (7 + MOD(r.id, 9)) + (5 + MOD(r.id, 6)) + (25 + MOD(r.id, 31))) < 45, 'F', '7'),
         IF(((8 + MOD(r.id, 8)) + (7 + MOD(r.id, 9)) + (5 + MOD(r.id, 6)) + (25 + MOD(r.id, 31))) < 45, 4, 7),
         IF(((8 + MOD(r.id, 8)) + (7 + MOD(r.id, 9)) + (5 + MOD(r.id, 6)) + (25 + MOD(r.id, 31))) < 45, 'failed', 'passed'),
         0, 5.00, NULL, 0, 'Seeded grade for approved active enrollment.', 1
  FROM registrations r
  JOIN offerings o ON o.id = r.offering_id
  WHERE r.status = 'active' AND r.student_id >= 1001
  ORDER BY r.id
  LIMIT 320;

  SET i = 1;
  WHILE i <= 120 DO
    SET sid = 1000 + i;
    SET inv_status = ELT(1 + MOD(i, 6), 'pending', 'partial', 'paid', 'overdue', 'partial', 'paid');
    SET paid_amount = CASE inv_status WHEN 'paid' THEN 1400 WHEN 'partial' THEN 700 ELSE 0 END;
    INSERT IGNORE INTO invoices (id, student_id, semester_id, description, amount, amount_paid, due_date, status)
    VALUES (50000 + i, sid, 2, CONCAT('Spring 2026 tuition invoice ', LPAD(i,3,'0')), 1400, paid_amount, DATE_ADD('2026-03-01', INTERVAL MOD(i, 30) DAY), inv_status);
    IF inv_status IN ('paid', 'partial') THEN
      INSERT IGNORE INTO payments (id, invoice_id, recorded_by, amount, method, reference, paid_at)
      VALUES (60000 + i, 50000 + i, 40 + MOD(i, 8), paid_amount, ELT(1 + MOD(i, 4), 'cash', 'card', 'bank_transfer', 'online'), CONCAT('PAY-SEED-', LPAD(i,4,'0')), DATE_ADD('2026-03-02', INTERVAL MOD(i, 35) DAY));
    END IF;
    IF inv_status = 'overdue' AND i <= 100 THEN
      INSERT IGNORE INTO holds (id, student_id, invoice_id, reason, effect, is_active, created_by)
      VALUES (70000 + i, sid, 50000 + i, 'Overdue tuition invoice', 'Registration and transcript services are blocked.', 1, 40 + MOD(i, 8));
    END IF;
    SET i = i + 1;
  END WHILE;
END//
CALL seed_rich_cis()//
DROP PROCEDURE seed_rich_cis//
DELIMITER ;

UPDATE offerings o
SET enrolled = (SELECT COUNT(*) FROM registrations r WHERE r.offering_id = o.id AND r.status = 'active');

-- -------------------------------------------------------------
-- MEMBER 5 DEMO DATA: clubs, events, messages
-- -------------------------------------------------------------
INSERT INTO club_categories (name) VALUES ('Technology'),('Arts & Culture'),('Academic'),('Sports');

INSERT INTO clubs (code,name,category_id,description,status,join_mode,meeting_day_of_week,meeting_start_time,meeting_location) VALUES
 ('AI-SOC','Artificial Intelligence Society',(SELECT id FROM club_categories WHERE name='Technology'),'Talks, workshops and projects on AI and machine learning.','active','open','Tuesday','17:00:00','Lab B2'),
 ('ROBO','Robotics Society',(SELECT id FROM club_categories WHERE name='Technology'),'Hands-on robotics builds, demos and competition prep.','active','request','Wednesday','17:00:00','Engineering Atrium'),
 ('MUSIC','Music Circle',(SELECT id FROM club_categories WHERE name='Arts & Culture'),'Jam sessions, rehearsals and campus performances.','recruiting','waitlist','Friday','18:00:00','Arts Hall'),
 ('DEBATE','Debate Union',(SELECT id FROM club_categories WHERE name='Academic'),'Weekly debates and inter-university competitions.','active','open','Thursday','16:00:00','Room 204');

SET @alice_s := (SELECT s.id FROM students s JOIN users u ON u.id=s.user_id WHERE u.email='alice.smith@cis.edu' LIMIT 1);
INSERT INTO club_memberships (club_id,student_id,member_role,status,joined_at) VALUES
 ((SELECT id FROM clubs WHERE code='AI-SOC'),@alice_s,'member','active',NOW());
INSERT INTO club_memberships (club_id,student_id,member_role,status,submitted_at) VALUES
 ((SELECT id FROM clubs WHERE code='MUSIC'),@alice_s,'member','waitlisted',NOW());

INSERT INTO campus_events (club_id,title,description,organizer_name,event_type,location_name,delivery_mode,starts_at,ends_at,status,registration_required,capacity) VALUES
 ((SELECT id FROM clubs WHERE code='AI-SOC'),'AI & Career Panel','Industry guests discuss careers in AI.','Career Center x AI Society','networking','Innovation Hall','onsite',TIMESTAMP(DATE_ADD(CURDATE(),INTERVAL 5 DAY),'16:00:00'),TIMESTAMP(DATE_ADD(CURDATE(),INTERVAL 5 DAY),'18:00:00'),'open',1,100),
 ((SELECT id FROM clubs WHERE code='ROBO'),'Robotics Demo Night','Live robot demos and project showcase.','Robotics Society','showcase','Engineering Atrium','onsite',TIMESTAMP(DATE_ADD(CURDATE(),INTERVAL 8 DAY),'18:00:00'),TIMESTAMP(DATE_ADD(CURDATE(),INTERVAL 8 DAY),'20:00:00'),'scheduled',0,NULL),
 ((SELECT id FROM clubs WHERE code='MUSIC'),'Spring Music Night','Student performances and open mic.','Music Circle','performance','Arts Hall','onsite',TIMESTAMP(DATE_ADD(CURDATE(),INTERVAL 12 DAY),'19:00:00'),TIMESTAMP(DATE_ADD(CURDATE(),INTERVAL 12 DAY),'21:00:00'),'open',0,NULL),
 (NULL,'Open Campus Day','Campus-wide fair and club showcase.','Student Affairs','campus_event','Central Courtyard','onsite',TIMESTAMP(DATE_ADD(CURDATE(),INTERVAL 15 DAY),'11:00:00'),TIMESTAMP(DATE_ADD(CURDATE(),INTERVAL 15 DAY),'15:00:00'),'open',0,NULL),
 (NULL,'Tech Talk: Large Language Models','A deep dive into modern LLMs.','Computer Science Dept','talk','Auditorium A','onsite',TIMESTAMP(DATE_ADD(CURDATE(),INTERVAL 3 DAY),'15:00:00'),TIMESTAMP(DATE_ADD(CURDATE(),INTERVAL 3 DAY),'16:30:00'),'open',1,60);

SET @alice_u := (SELECT id FROM users WHERE email='alice.smith@cis.edu');
SET @staff_u := (SELECT id FROM users WHERE role IN ('staff','academic_staff') ORDER BY id LIMIT 1);
SET @teacher_u := (SELECT id FROM users WHERE role IN ('teacher','instructor') ORDER BY id LIMIT 1);
SET @admin_u := (SELECT id FROM users WHERE role IN ('admin','system_admin') ORDER BY id LIMIT 1);
INSERT INTO messages (sender_id,recipient_id,subject,body,is_broadcast) VALUES
 (@staff_u,@alice_u,'Welcome to the Spring term','Hi, your registration is confirmed. Reach out if you need help with your timetable.',0),
 (@teacher_u,@alice_u,'Office hours update','My office hours move to Thursdays 14:00-16:00 starting this week.',0),
 (@admin_u,NULL,'Scheduled portal maintenance','The campus portal will be down Saturday 22:00-23:30 for maintenance.',1);

SET FOREIGN_KEY_CHECKS = 1;
