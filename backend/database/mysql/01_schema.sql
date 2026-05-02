-- CIS lean mandatory MySQL schema
-- Target: MySQL 8+ / MariaDB 10.6+ (XAMPP-compatible)
--
-- Physical table count: 21.
-- Removed production-normalization tables are represented by fields on these
-- mandatory tables, with read-only compatibility views in 03_views.sql.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE DATABASE IF NOT EXISTS cis
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cis;

CREATE TABLE programs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  department_id BIGINT UNSIGNED NOT NULL,
  department_code VARCHAR(20) NOT NULL DEFAULT '',
  department_name VARCHAR(150) NOT NULL DEFAULT '',
  code VARCHAR(20) NOT NULL,
  name VARCHAR(150) NOT NULL,
  degree_level ENUM('certificate','diploma','bachelor','master','phd') NOT NULL DEFAULT 'bachelor',
  duration_semesters SMALLINT UNSIGNED NOT NULL DEFAULT 8,
  total_credits_required SMALLINT UNSIGNED NOT NULL DEFAULT 120,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_programs_code (code),
  KEY idx_programs_department (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NULL,
  role ENUM('Student','Instructor','Academic Staff','Finance Staff','Communication Staff','System Admin') NOT NULL,
  status ENUM('pending','active','suspended','disabled') NOT NULL DEFAULT 'active',
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at DATETIME NULL,
  password_changed_at DATETIME NULL,
  email_verified_at DATETIME NULL,
  failed_login_count INT UNSIGNED NOT NULL DEFAULT 0,
  last_failed_login_at DATETIME NULL,
  deleted_at DATETIME NULL,
  account_origin ENUM('admin_provisioned','migration','api_seed') NOT NULL DEFAULT 'admin_provisioned',
  created_by_user_id BIGINT UNSIGNED NULL,
  invited_at DATETIME NULL,

  student_number VARCHAR(30) NULL,
  program_id BIGINT UNSIGNED NULL,
  department_id BIGINT UNSIGNED NULL,
  date_of_birth DATE NULL,
  gender ENUM('male','female','other','prefer_not_to_say') NULL,
  admission_date DATE NULL,
  expected_graduation_date DATE NULL,
  current_semester SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  cumulative_gpa DECIMAL(4,2) NOT NULL DEFAULT 0.00,
  earned_credits SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  academic_status ENUM('active','on_leave','graduated','suspended','withdrawn','probation') NOT NULL DEFAULT 'active',
  address_line_1 VARCHAR(150) NULL,
  address_line_2 VARCHAR(150) NULL,
  city VARCHAR(100) NULL,
  state_region VARCHAR(100) NULL,
  postal_code VARCHAR(20) NULL,
  country VARCHAR(100) NULL,

  employee_number VARCHAR(30) NULL,
  title VARCHAR(100) NULL,
  hire_date DATE NULL,
  employment_status ENUM('active','on_leave','terminated','retired') NOT NULL DEFAULT 'active',
  specialization VARCHAR(255) NULL,
  office_location VARCHAR(100) NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_student_number (student_number),
  UNIQUE KEY uq_users_employee_number (employee_number),
  KEY idx_users_role (role),
  KEY idx_users_status (status),
  KEY idx_users_program (program_id),
  KEY idx_users_department (department_id),
  KEY idx_users_deleted_at (deleted_at),
  KEY idx_users_created_by (created_by_user_id),
  CONSTRAINT fk_users_program
    FOREIGN KEY (program_id) REFERENCES programs (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_users_created_by
    FOREIGN KEY (created_by_user_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auth_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_type ENUM('refresh','password_reset') NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_auth_tokens_hash (token_hash),
  KEY idx_auth_tokens_user_type (user_id, token_type),
  KEY idx_auth_tokens_expires (expires_at),
  CONSTRAINT fk_auth_tokens_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE academic_terms (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(30) NOT NULL,
  name VARCHAR(100) NOT NULL,
  academic_year_start YEAR NOT NULL,
  academic_year_end YEAR NOT NULL,
  term_number TINYINT UNSIGNED NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  registration_start_at DATETIME NOT NULL,
  registration_end_at DATETIME NOT NULL,
  status ENUM('planning','registration','active','completed','archived') NOT NULL DEFAULT 'planning',
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_academic_terms_code (code),
  KEY idx_academic_terms_status (status),
  KEY idx_academic_terms_current (is_current)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE courses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  program_id BIGINT UNSIGNED NULL,
  department_id BIGINT UNSIGNED NOT NULL,
  department_code VARCHAR(20) NOT NULL DEFAULT '',
  department_name VARCHAR(150) NOT NULL DEFAULT '',
  code VARCHAR(30) NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NULL,
  credit_hours TINYINT UNSIGNED NOT NULL,
  ects_credits DECIMAL(4,1) NULL,
  recommended_term_number TINYINT UNSIGNED NULL,
  level_number SMALLINT UNSIGNED NOT NULL,
  course_type ENUM('core','elective','lab','seminar','project') NOT NULL DEFAULT 'core',
  requirement_type ENUM('core','elective','optional') NOT NULL DEFAULT 'core',
  grading_scheme ENUM('letter','pass_fail') NOT NULL DEFAULT 'letter',
  prerequisite_course_id BIGINT UNSIGNED NULL,
  minimum_grade_required VARCHAR(5) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_courses_code (code),
  KEY idx_courses_program (program_id),
  KEY idx_courses_department (department_id),
  KEY idx_courses_prerequisite (prerequisite_course_id),
  KEY idx_courses_active (is_active),
  CONSTRAINT fk_courses_program
    FOREIGN KEY (program_id) REFERENCES programs (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_courses_prerequisite
    FOREIGN KEY (prerequisite_course_id) REFERENCES courses (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE course_offerings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id BIGINT UNSIGNED NOT NULL,
  academic_term_id BIGINT UNSIGNED NOT NULL,
  teacher_id BIGINT UNSIGNED NULL,
  room_id BIGINT UNSIGNED NULL,
  room_code VARCHAR(30) NULL,
  room_name VARCHAR(100) NULL,
  room_type ENUM('lecture','lab','seminar','office','online') NULL,
  building_id BIGINT UNSIGNED NULL,
  building_code VARCHAR(20) NULL,
  building_name VARCHAR(100) NULL,
  location_name VARCHAR(150) NULL,
  section_code VARCHAR(10) NOT NULL,
  delivery_mode ENUM('onsite','online','hybrid') NOT NULL DEFAULT 'onsite',
  capacity SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  waitlist_capacity SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('draft','open','closed','in_progress','completed','cancelled') NOT NULL DEFAULT 'draft',
  registration_opens_at DATETIME NULL,
  registration_closes_at DATETIME NULL,
  schedule_notes VARCHAR(255) NULL,
  meeting_day_of_week ENUM('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NULL,
  meeting_start_time TIME NULL,
  meeting_end_time TIME NULL,
  meeting_type ENUM('lecture','lab','tutorial','exam','office_hour') NOT NULL DEFAULT 'lecture',
  created_by_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_course_offerings_course_term_section (course_id, academic_term_id, section_code),
  KEY idx_course_offerings_term (academic_term_id),
  KEY idx_course_offerings_teacher (teacher_id),
  KEY idx_course_offerings_status (status),
  CONSTRAINT fk_course_offerings_course
    FOREIGN KEY (course_id) REFERENCES courses (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_course_offerings_term
    FOREIGN KEY (academic_term_id) REFERENCES academic_terms (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_course_offerings_teacher
    FOREIGN KEY (teacher_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_course_offerings_created_by
    FOREIGN KEY (created_by_user_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE enrollments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id BIGINT UNSIGNED NOT NULL,
  course_offering_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending','enrolled','waitlisted','dropped','withdrawn','completed','failed') NOT NULL DEFAULT 'pending',
  registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME NULL,
  waitlisted_at DATETIME NULL,
  dropped_at DATETIME NULL,
  completed_at DATETIME NULL,
  final_numeric_grade DECIMAL(5,2) NULL,
  final_letter_grade VARCHAR(5) NULL,
  grade_points DECIMAL(3,2) NULL,
  final_grade_status ENUM('draft','published','revised') NOT NULL DEFAULT 'draft',
  final_grade_published_at DATETIME NULL,
  final_grade_approved_by_teacher_id BIGINT UNSIGNED NULL,
  created_by_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_enrollments_student_offering (student_id, course_offering_id),
  KEY idx_enrollments_offering (course_offering_id),
  KEY idx_enrollments_status (status),
  CONSTRAINT fk_enrollments_student
    FOREIGN KEY (student_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_enrollments_offering
    FOREIGN KEY (course_offering_id) REFERENCES course_offerings (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_enrollments_approved_by
    FOREIGN KEY (final_grade_approved_by_teacher_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_enrollments_created_by
    FOREIGN KEY (created_by_user_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attendance_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_offering_id BIGINT UNSIGNED NOT NULL,
  course_meeting_id BIGINT UNSIGNED NULL,
  session_date DATE NOT NULL,
  start_time TIME NULL,
  end_time TIME NULL,
  topic VARCHAR(150) NULL,
  status ENUM('scheduled','completed','cancelled') NOT NULL DEFAULT 'completed',
  created_by_teacher_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_attendance_sessions_offering_date_time (course_offering_id, session_date, start_time),
  KEY idx_attendance_sessions_teacher (created_by_teacher_id),
  CONSTRAINT fk_attendance_sessions_offering
    FOREIGN KEY (course_offering_id) REFERENCES course_offerings (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_attendance_sessions_teacher
    FOREIGN KEY (created_by_teacher_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attendance_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  attendance_session_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  status ENUM('present','absent','late','excused') NOT NULL,
  remarks VARCHAR(255) NULL,
  recorded_by_teacher_id BIGINT UNSIGNED NULL,
  recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_attendance_records_session_student (attendance_session_id, student_id),
  KEY idx_attendance_records_student (student_id),
  CONSTRAINT fk_attendance_records_session
    FOREIGN KEY (attendance_session_id) REFERENCES attendance_sessions (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_attendance_records_student
    FOREIGN KEY (student_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_attendance_records_teacher
    FOREIGN KEY (recorded_by_teacher_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE grade_components (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_offering_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  component_type ENUM('assignment','quiz','midterm','final','project','lab','participation','attendance','custom') NOT NULL DEFAULT 'assignment',
  max_points DECIMAL(8,2) NOT NULL DEFAULT 100.00,
  weight_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  due_at DATETIME NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_grade_components_offering_name (course_offering_id, name),
  CONSTRAINT fk_grade_components_offering
    FOREIGN KEY (course_offering_id) REFERENCES course_offerings (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE grade_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  grade_component_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  score_awarded DECIMAL(8,2) NULL,
  percentage DECIMAL(5,2) NULL,
  letter_grade VARCHAR(5) NULL,
  remarks VARCHAR(255) NULL,
  graded_by_teacher_id BIGINT UNSIGNED NULL,
  graded_at DATETIME NULL,
  published_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_grade_records_component_student (grade_component_id, student_id),
  KEY idx_grade_records_student (student_id),
  CONSTRAINT fk_grade_records_component
    FOREIGN KEY (grade_component_id) REFERENCES grade_components (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_grade_records_student
    FOREIGN KEY (student_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_grade_records_teacher
    FOREIGN KEY (graded_by_teacher_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_invoices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id BIGINT UNSIGNED NOT NULL,
  academic_term_id BIGINT UNSIGNED NULL,
  invoice_number VARCHAR(40) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  description VARCHAR(255) NULL,
  subtotal_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  balance_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status ENUM('draft','issued','partially_paid','paid','overdue','void') NOT NULL DEFAULT 'issued',
  notes VARCHAR(255) NULL,
  created_by_admin_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_student_invoices_number (invoice_number),
  KEY idx_student_invoices_student (student_id),
  KEY idx_student_invoices_term (academic_term_id),
  KEY idx_student_invoices_status (status),
  CONSTRAINT fk_student_invoices_student
    FOREIGN KEY (student_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_student_invoices_term
    FOREIGN KEY (academic_term_id) REFERENCES academic_terms (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_student_invoices_created_by
    FOREIGN KEY (created_by_admin_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id BIGINT UNSIGNED NOT NULL,
  invoice_id BIGINT UNSIGNED NULL,
  reference_number VARCHAR(60) NOT NULL,
  payment_method ENUM('cash','card','bank_transfer','online') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  paid_at DATETIME NOT NULL,
  status ENUM('pending','confirmed','failed','refunded') NOT NULL DEFAULT 'confirmed',
  received_by_admin_id BIGINT UNSIGNED NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_reference (reference_number),
  KEY idx_payments_student (student_id),
  KEY idx_payments_invoice (invoice_id),
  KEY idx_payments_status (status),
  CONSTRAINT fk_payments_student
    FOREIGN KEY (student_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_payments_invoice
    FOREIGN KEY (invoice_id) REFERENCES student_invoices (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_payments_received_by
    FOREIGN KEY (received_by_admin_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE financial_holds (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id BIGINT UNSIGNED NOT NULL,
  hold_type ENUM('finance','disciplinary','academic','administrative') NOT NULL DEFAULT 'finance',
  reason VARCHAR(255) NOT NULL,
  status ENUM('active','released') NOT NULL DEFAULT 'active',
  placed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  released_at DATETIME NULL,
  placed_by_admin_id BIGINT UNSIGNED NULL,
  released_by_admin_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_financial_holds_student (student_id),
  KEY idx_financial_holds_status (status),
  CONSTRAINT fk_financial_holds_student
    FOREIGN KEY (student_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_financial_holds_placed_by
    FOREIGN KEY (placed_by_admin_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_financial_holds_released_by
    FOREIGN KEY (released_by_admin_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE clubs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
  category_code VARCHAR(30) NOT NULL DEFAULT 'ACADEMIC',
  category_name VARCHAR(100) NOT NULL DEFAULT 'Academic',
  code VARCHAR(30) NOT NULL,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  description TEXT NULL,
  advisor_teacher_id BIGINT UNSIGNED NULL,
  managed_by_admin_id BIGINT UNSIGNED NULL,
  join_mode ENUM('open','request','invite_only','waitlist') NOT NULL DEFAULT 'open',
  status ENUM('draft','active','recruiting','inactive','archived') NOT NULL DEFAULT 'active',
  capacity INT UNSIGNED NULL,
  meeting_day_of_week ENUM('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NULL,
  meeting_start_time TIME NULL,
  meeting_end_time TIME NULL,
  meeting_location VARCHAR(150) NULL,
  contact_email VARCHAR(254) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_clubs_code (code),
  UNIQUE KEY uq_clubs_slug (slug),
  KEY idx_clubs_status (status),
  KEY idx_clubs_advisor (advisor_teacher_id),
  CONSTRAINT fk_clubs_advisor
    FOREIGN KEY (advisor_teacher_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_clubs_managed_by
    FOREIGN KEY (managed_by_admin_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE club_memberships (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  club_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  member_role VARCHAR(50) NOT NULL DEFAULT 'member',
  status ENUM('active','pending','waitlisted','rejected','inactive') NOT NULL DEFAULT 'active',
  request_message VARCHAR(255) NULL,
  submitted_at DATETIME NULL,
  joined_at DATETIME NULL,
  left_at DATETIME NULL,
  approved_at DATETIME NULL,
  approved_by_admin_id BIGINT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  reviewed_by_admin_id BIGINT UNSIGNED NULL,
  review_notes VARCHAR(255) NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_club_memberships_club_student (club_id, student_id),
  KEY idx_club_memberships_student (student_id),
  KEY idx_club_memberships_status (status),
  CONSTRAINT fk_club_memberships_club
    FOREIGN KEY (club_id) REFERENCES clubs (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_club_memberships_student
    FOREIGN KEY (student_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_club_memberships_approved_by
    FOREIGN KEY (approved_by_admin_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_club_memberships_reviewed_by
    FOREIGN KEY (reviewed_by_admin_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE news_posts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_type ENUM('announcement','notice','update','feature') NOT NULL DEFAULT 'announcement',
  title VARCHAR(180) NOT NULL,
  summary VARCHAR(500) NOT NULL,
  body TEXT NULL,
  priority ENUM('notice','update','important','urgent') NOT NULL DEFAULT 'notice',
  status ENUM('draft','scheduled','published','archived') NOT NULL DEFAULT 'draft',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  audience_scope VARCHAR(100) NOT NULL DEFAULT 'all',
  visible_from DATETIME NULL,
  visible_until DATETIME NULL,
  published_at DATETIME NULL,
  created_by_user_id BIGINT UNSIGNED NULL,
  updated_by_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_news_posts_title (title),
  KEY idx_news_posts_status (status),
  KEY idx_news_posts_visible (visible_from, visible_until),
  KEY idx_news_posts_priority (priority),
  CONSTRAINT fk_news_posts_created_by
    FOREIGN KEY (created_by_user_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_news_posts_updated_by
    FOREIGN KEY (updated_by_user_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE campus_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  club_id BIGINT UNSIGNED NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NULL,
  organizer_name VARCHAR(150) NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  location_name VARCHAR(150) NOT NULL,
  delivery_mode ENUM('onsite','online','hybrid') NOT NULL DEFAULT 'onsite',
  audience_scope VARCHAR(100) NOT NULL DEFAULT 'all',
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  registration_required BOOLEAN NOT NULL DEFAULT FALSE,
  capacity INT UNSIGNED NULL,
  expected_attendees INT UNSIGNED NULL,
  status ENUM('draft','scheduled','open','internal','cancelled','completed') NOT NULL DEFAULT 'draft',
  managed_by_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_campus_events_title (title),
  KEY idx_campus_events_club (club_id),
  KEY idx_campus_events_starts (starts_at),
  KEY idx_campus_events_status (status),
  CONSTRAINT fk_campus_events_club
    FOREIGN KEY (club_id) REFERENCES clubs (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_campus_events_managed_by
    FOREIGN KEY (managed_by_user_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE campus_event_registrations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  campus_event_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  status ENUM('registered','cancelled','attended','no_show') NOT NULL DEFAULT 'registered',
  notes VARCHAR(255) NULL,
  registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_event_registrations_event_user (campus_event_id, user_id),
  KEY idx_event_registrations_user (user_id),
  CONSTRAINT fk_event_registrations_event
    FOREIGN KEY (campus_event_id) REFERENCES campus_events (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_event_registrations_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  category VARCHAR(50) NOT NULL,
  severity ENUM('info','success','warning','danger') NOT NULL DEFAULT 'info',
  title VARCHAR(150) NOT NULL,
  message VARCHAR(600) NOT NULL,
  action_label VARCHAR(80) NULL,
  action_url VARCHAR(255) NULL,
  source_entity_type VARCHAR(80) NULL,
  source_entity_id BIGINT UNSIGNED NULL,
  created_by_user_id BIGINT UNSIGNED NULL,
  delivered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME NULL,
  archived_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user_read (user_id, read_at),
  KEY idx_notifications_category (category),
  KEY idx_notifications_created_at (created_at),
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_notifications_created_by
    FOREIGN KEY (created_by_user_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ai_chat_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  conversation_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(120) NOT NULL DEFAULT 'Academic assistant',
  session_status ENUM('active','archived') NOT NULL DEFAULT 'active',
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_message_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sender_type ENUM('student','assistant','system') NOT NULL,
  message_text TEXT NOT NULL,
  metadata_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ai_chat_messages_conversation (conversation_id),
  KEY idx_ai_chat_messages_student (student_id),
  CONSTRAINT fk_ai_chat_messages_student
    FOREIGN KEY (student_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
