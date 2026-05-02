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
USE cis;

-- Lean schema note:
-- Roles, permissions, club categories, and settings are now represented by
-- enum fields plus compatibility views in 03_views.sql. There is no physical
-- reference-data table to seed here.

SELECT 'reference data is supplied by lean schema views' AS status;
USE cis;

-- Compatibility views for names that used to be physical tables.
-- They do not store extra data; the 21 tables in 01_schema.sql remain the
-- only physical tables.

CREATE OR REPLACE VIEW roles AS
SELECT 1 AS id, 'Student' AS code, 'Student' AS name, 'Student workspace access.' AS description, TRUE AS is_system, CURRENT_TIMESTAMP AS created_at, CURRENT_TIMESTAMP AS updated_at
UNION ALL SELECT 2, 'Instructor', 'Instructor', 'Instructor workspace access.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
UNION ALL SELECT 3, 'Academic Staff', 'Academic Staff', 'Academic administration access.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
UNION ALL SELECT 4, 'Finance Staff', 'Finance Staff', 'Finance workspace access.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
UNION ALL SELECT 5, 'Communication Staff', 'Communication Staff', 'Communications workspace access.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
UNION ALL SELECT 6, 'System Admin', 'System Admin', 'System administration access.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP;

CREATE OR REPLACE VIEW user_roles AS
SELECT
  u.id AS user_id,
  r.id AS role_id,
  TRUE AS is_primary,
  u.created_by_user_id AS assigned_by_user_id,
  u.created_at AS assigned_at
FROM users u
JOIN roles r ON r.code = u.role
WHERE u.deleted_at IS NULL;

CREATE OR REPLACE VIEW permissions AS
SELECT 1 AS id, 'profile.view.self' AS code, 'View Own Profile' AS name, 'View own profile.' AS description, 'profile' AS resource, 'view_self' AS action, CURRENT_TIMESTAMP AS created_at
UNION ALL SELECT 2, 'profile.edit.self', 'Edit Own Profile', 'Edit own profile.', 'profile', 'edit_self', CURRENT_TIMESTAMP
UNION ALL SELECT 3, 'students.self_service', 'Student Self-Service Workspace', 'Student self-service.', 'students', 'self_service', CURRENT_TIMESTAMP
UNION ALL SELECT 4, 'instructors.workspace', 'Instructor Workspace', 'Instructor workspace.', 'instructors', 'workspace', CURRENT_TIMESTAMP
UNION ALL SELECT 5, 'instructors.timetable.view', 'View Instructor Timetable', 'Instructor timetable.', 'instructors', 'view_timetable', CURRENT_TIMESTAMP
UNION ALL SELECT 6, 'announcements.manage.instructor', 'Manage Course Announcements', 'Instructor announcements.', 'announcements', 'manage_instructor', CURRENT_TIMESTAMP
UNION ALL SELECT 7, 'academic.dashboard.view', 'View Academic Dashboard', 'Academic dashboard.', 'academic', 'view_dashboard', CURRENT_TIMESTAMP
UNION ALL SELECT 8, 'academic.records.manage', 'Manage Academic Records', 'Academic records.', 'academic_records', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 9, 'academic.grades.manage', 'Manage Grades', 'Academic grades.', 'grades', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 10, 'academic.attendance.manage', 'Manage Attendance', 'Academic attendance.', 'attendance', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 11, 'academic.courses.manage', 'Manage Course Catalog and Offerings', 'Academic courses.', 'courses', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 12, 'academic.terms.manage', 'Manage Terms', 'Academic terms.', 'academic_terms', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 13, 'academic.registrations.manage', 'Manage Registrations', 'Academic registrations.', 'registrations', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 14, 'academic.schedule.manage', 'Manage Scheduling', 'Academic scheduling.', 'scheduling', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 15, 'academic.exams.manage', 'Manage Exam Scheduling', 'Exam scheduling.', 'exams', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 16, 'finance.dashboard.view', 'View Finance Dashboard', 'Finance dashboard.', 'finance', 'view_dashboard', CURRENT_TIMESTAMP
UNION ALL SELECT 17, 'finance.records.manage', 'Manage Finance Records', 'Finance records.', 'finance', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 18, 'communications.dashboard.view', 'View Communications Dashboard', 'Communications dashboard.', 'communications', 'view_dashboard', CURRENT_TIMESTAMP
UNION ALL SELECT 19, 'announcements.manage', 'Manage Announcements', 'Announcements.', 'announcements', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 20, 'events.manage', 'Manage Events', 'Events.', 'events', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 21, 'announcements.media.upload', 'Upload Announcement Media', 'Media uploads.', 'media', 'upload', CURRENT_TIMESTAMP
UNION ALL SELECT 22, 'notifications.send', 'Send Notifications', 'Notifications.', 'notifications', 'send', CURRENT_TIMESTAMP
UNION ALL SELECT 23, 'reports.view', 'View Reports', 'Reports.', 'reports', 'view', CURRENT_TIMESTAMP
UNION ALL SELECT 24, 'users.manage', 'Manage Users', 'Users.', 'users', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 25, 'roles.manage', 'Manage Roles', 'Roles.', 'roles', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 26, 'settings.manage', 'Manage Settings', 'Settings.', 'settings', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 27, 'system.overview.view', 'View System Overview', 'System overview.', 'system', 'view_overview', CURRENT_TIMESTAMP;

CREATE OR REPLACE VIEW role_permissions AS
SELECT r.id AS role_id, p.id AS permission_id, CURRENT_TIMESTAMP AS granted_at
FROM roles r
JOIN permissions p
  ON (
    (r.code = 'Student' AND p.code IN ('profile.view.self','profile.edit.self','students.self_service','reports.view'))
    OR (r.code = 'Instructor' AND p.code IN ('profile.view.self','profile.edit.self','instructors.workspace','instructors.timetable.view','announcements.manage.instructor','notifications.send','reports.view'))
    OR (r.code = 'Academic Staff' AND p.code IN ('profile.view.self','profile.edit.self','academic.dashboard.view','academic.records.manage','academic.grades.manage','academic.attendance.manage','academic.courses.manage','academic.terms.manage','academic.registrations.manage','academic.schedule.manage','academic.exams.manage','communications.dashboard.view','announcements.manage','events.manage','announcements.media.upload','notifications.send','reports.view'))
    OR (r.code = 'Finance Staff' AND p.code IN ('profile.view.self','profile.edit.self','finance.dashboard.view','finance.records.manage','notifications.send','reports.view'))
    OR (r.code = 'Communication Staff' AND p.code IN ('profile.view.self','profile.edit.self','communications.dashboard.view','announcements.manage','events.manage','announcements.media.upload','notifications.send','reports.view'))
    OR (r.code = 'System Admin' AND p.code IN ('profile.view.self','profile.edit.self','system.overview.view','academic.dashboard.view','academic.records.manage','academic.courses.manage','academic.terms.manage','academic.registrations.manage','academic.schedule.manage','academic.exams.manage','finance.dashboard.view','finance.records.manage','communications.dashboard.view','announcements.manage','events.manage','announcements.media.upload','notifications.send','reports.view','users.manage','roles.manage','settings.manage'))
  );

CREATE OR REPLACE VIEW departments AS
SELECT
  p.department_id AS id,
  p.department_code AS code,
  p.department_name AS name,
  CONCAT('Department of ', p.department_name, '.') AS description,
  'active' AS status,
  MIN(p.created_at) AS created_at,
  MAX(p.updated_at) AS updated_at
FROM programs p
GROUP BY p.department_id, p.department_code, p.department_name;

CREATE OR REPLACE VIEW student_profiles AS
SELECT
  u.id,
  u.id AS user_id,
  u.student_number,
  u.department_id,
  u.program_id,
  u.date_of_birth,
  u.gender,
  u.admission_date,
  u.expected_graduation_date,
  u.current_semester,
  u.cumulative_gpa,
  u.earned_credits,
  u.academic_status AS status,
  u.address_line_1,
  u.address_line_2,
  u.city,
  u.state_region,
  u.postal_code,
  u.country,
  u.created_at,
  u.updated_at
FROM users u
WHERE u.role = 'Student' AND u.deleted_at IS NULL;

CREATE OR REPLACE VIEW teacher_profiles AS
SELECT
  u.id,
  u.id AS user_id,
  u.employee_number,
  u.department_id,
  u.title,
  u.hire_date,
  u.employment_status,
  u.specialization,
  u.office_location,
  u.created_at,
  u.updated_at
FROM users u
WHERE u.role = 'Instructor' AND u.deleted_at IS NULL;

CREATE OR REPLACE VIEW admin_profiles AS
SELECT
  u.id,
  u.id AS user_id,
  u.employee_number,
  u.title,
  u.office_location,
  u.employment_status,
  u.created_at,
  u.updated_at
FROM users u
WHERE u.role IN ('Academic Staff','Finance Staff','Communication Staff','System Admin') AND u.deleted_at IS NULL;

CREATE OR REPLACE VIEW buildings AS
SELECT
  co.building_id AS id,
  COALESCE(co.building_code, 'CAMPUS') AS code,
  COALESCE(co.building_name, 'Campus') AS name,
  NULL AS description,
  MIN(co.created_at) AS created_at,
  MAX(co.updated_at) AS updated_at
FROM course_offerings co
WHERE co.building_id IS NOT NULL
GROUP BY co.building_id, co.building_code, co.building_name;

CREATE OR REPLACE VIEW rooms AS
SELECT
  co.room_id AS id,
  COALESCE(co.building_id, 1) AS building_id,
  COALESCE(co.room_code, CONCAT('ROOM-', co.room_id)) AS code,
  COALESCE(co.room_name, co.location_name, co.schedule_notes, 'Campus Room') AS name,
  MAX(co.capacity) AS capacity,
  COALESCE(co.room_type, 'lecture') AS room_type,
  MIN(co.created_at) AS created_at,
  MAX(co.updated_at) AS updated_at
FROM course_offerings co
WHERE co.room_id IS NOT NULL
GROUP BY co.room_id, co.building_id, co.room_code, co.room_name, co.location_name, co.schedule_notes, co.room_type;

CREATE OR REPLACE VIEW course_meetings AS
SELECT
  co.id,
  co.id AS course_offering_id,
  co.room_id,
  co.meeting_day_of_week AS day_of_week,
  co.meeting_start_time AS start_time,
  co.meeting_end_time AS end_time,
  co.meeting_type,
  co.created_at,
  co.updated_at
FROM course_offerings co
WHERE co.meeting_day_of_week IS NOT NULL;

CREATE OR REPLACE VIEW program_courses AS
SELECT
  c.program_id,
  c.id AS course_id,
  c.recommended_term_number,
  c.requirement_type,
  c.is_active,
  c.created_at,
  c.updated_at
FROM courses c
WHERE c.program_id IS NOT NULL;

CREATE OR REPLACE VIEW course_prerequisites AS
SELECT
  c.id AS course_id,
  c.prerequisite_course_id,
  c.minimum_grade_required,
  c.created_at
FROM courses c
WHERE c.prerequisite_course_id IS NOT NULL;

CREATE OR REPLACE VIEW student_term_records AS
SELECT
  u.id,
  u.id AS student_id,
  at.id AS academic_term_id,
  u.current_semester AS semester_number,
  u.earned_credits AS registered_credits,
  u.earned_credits,
  u.cumulative_gpa AS term_gpa,
  u.cumulative_gpa,
  CASE WHEN u.cumulative_gpa < 2.0 THEN 'probation' ELSE 'good' END AS academic_standing,
  u.created_at,
  u.updated_at
FROM users u
JOIN academic_terms at ON at.is_current = TRUE
WHERE u.role = 'Student' AND u.deleted_at IS NULL;

CREATE OR REPLACE VIEW final_grades AS
SELECT
  e.id,
  e.id AS enrollment_id,
  e.final_numeric_grade AS numeric_grade,
  e.final_letter_grade AS letter_grade,
  e.grade_points,
  e.final_grade_status AS status,
  e.final_grade_published_at AS published_at,
  e.final_grade_approved_by_teacher_id AS approved_by_teacher_id,
  e.created_at,
  e.updated_at
FROM enrollments e
WHERE e.final_numeric_grade IS NOT NULL OR e.final_letter_grade IS NOT NULL;

CREATE OR REPLACE VIEW student_risk_assessments AS
SELECT
  u.id,
  u.id AS student_id,
  at.id AS academic_term_id,
  CASE
    WHEN u.cumulative_gpa < 2.0 THEN 'high'
    WHEN u.cumulative_gpa < 2.7 THEN 'medium'
    ELSE 'low'
  END AS risk_level,
  CASE
    WHEN u.cumulative_gpa < 2.0 THEN 78.00
    WHEN u.cumulative_gpa < 2.7 THEN 46.00
    ELSE 18.00
  END AS risk_score,
  CASE
    WHEN u.cumulative_gpa < 2.0 THEN 'GPA requires immediate academic follow-up.'
    WHEN u.cumulative_gpa < 2.7 THEN 'Academic progress should be monitored this term.'
    ELSE 'Academic progress is currently stable.'
  END AS summary,
  NULL AS generated_by_user_id,
  CURRENT_TIMESTAMP AS generated_at
FROM users u
JOIN academic_terms at ON at.is_current = TRUE
WHERE u.role = 'Student' AND u.deleted_at IS NULL;

CREATE OR REPLACE VIEW student_recommendations AS
SELECT
  (u.id * 100000 + c.id) AS id,
  u.id AS student_id,
  at.id AS academic_term_id,
  c.id AS recommended_course_id,
  CONCAT('Recommended from the ', p.name, ' curriculum.') AS reason,
  COALESCE(c.recommended_term_number, 99) AS priority,
  'suggested' AS status,
  NULL AS created_by_user_id,
  CURRENT_TIMESTAMP AS created_at
FROM users u
JOIN programs p ON p.id = u.program_id
JOIN courses c ON c.program_id = p.id AND c.is_active = TRUE
JOIN academic_terms at ON at.is_current = TRUE
WHERE u.role = 'Student'
  AND u.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM enrollments e
    JOIN course_offerings co ON co.id = e.course_offering_id
    WHERE e.student_id = u.id
      AND co.course_id = c.id
      AND e.status IN ('pending','enrolled','waitlisted','completed')
  );

CREATE OR REPLACE VIEW financial_aid_awards AS
SELECT
  CAST(NULL AS UNSIGNED) AS id,
  CAST(NULL AS UNSIGNED) AS student_id,
  CAST(NULL AS UNSIGNED) AS academic_term_id,
  CAST(NULL AS CHAR(100)) AS award_name,
  CAST(NULL AS DECIMAL(10,2)) AS amount,
  CAST(NULL AS CHAR(20)) AS status,
  CAST(NULL AS DATETIME) AS awarded_at
WHERE 1 = 0;

CREATE OR REPLACE VIEW invoice_items AS
SELECT
  si.id,
  si.id AS invoice_id,
  CAST(NULL AS UNSIGNED) AS fee_category_id,
  COALESCE(si.description, si.notes, 'Student charge') AS description,
  1.00 AS quantity,
  si.total_amount AS unit_amount,
  si.total_amount AS line_total,
  si.created_at,
  si.updated_at
FROM student_invoices si;

CREATE OR REPLACE VIEW payment_allocations AS
SELECT
  p.id,
  p.id AS payment_id,
  p.invoice_id,
  p.amount AS amount_applied,
  p.created_at
FROM payments p
WHERE p.invoice_id IS NOT NULL;

CREATE OR REPLACE VIEW club_categories AS
SELECT 1 AS id, 'ACADEMIC' AS code, 'Academic' AS name, 'Academic and professional development organizations.' AS description, TRUE AS is_active, CURRENT_TIMESTAMP AS created_at, CURRENT_TIMESTAMP AS updated_at
UNION ALL SELECT 2, 'ENGINEERING', 'Engineering', 'Engineering and technology organizations.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
UNION ALL SELECT 3, 'ARTS', 'Arts', 'Creative arts, music, and design organizations.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
UNION ALL SELECT 4, 'LEADERSHIP', 'Leadership', 'Leadership and student development clubs.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
UNION ALL SELECT 5, 'SPORTS', 'Sports', 'Sports and recreation clubs.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP;

CREATE OR REPLACE VIEW club_join_requests AS
SELECT
  cm.id,
  cm.club_id,
  cm.student_id,
  cm.member_role AS requested_role,
  cm.status,
  cm.request_message,
  COALESCE(cm.submitted_at, cm.created_at) AS submitted_at,
  cm.reviewed_at,
  cm.reviewed_by_admin_id,
  cm.review_notes,
  cm.created_at,
  cm.updated_at
FROM club_memberships cm
WHERE cm.status IN ('pending','waitlisted','rejected');

CREATE OR REPLACE VIEW news_post_audiences AS
SELECT
  CAST(NULL AS UNSIGNED) AS id,
  CAST(NULL AS UNSIGNED) AS news_post_id,
  CAST(NULL AS UNSIGNED) AS role_id,
  CAST(NULL AS UNSIGNED) AS department_id,
  CAST(NULL AS UNSIGNED) AS program_id,
  CAST(NULL AS UNSIGNED) AS academic_term_id
WHERE 1 = 0;

CREATE OR REPLACE VIEW campus_event_audiences AS
SELECT
  CAST(NULL AS UNSIGNED) AS id,
  CAST(NULL AS UNSIGNED) AS campus_event_id,
  CAST(NULL AS UNSIGNED) AS role_id,
  CAST(NULL AS UNSIGNED) AS department_id,
  CAST(NULL AS UNSIGNED) AS program_id,
  CAST(NULL AS UNSIGNED) AS academic_term_id
WHERE 1 = 0;

CREATE OR REPLACE VIEW notification_recipients AS
SELECT
  n.id,
  n.id AS notification_id,
  n.user_id,
  n.delivered_at,
  n.read_at,
  n.archived_at
FROM notifications n;

CREATE OR REPLACE VIEW ai_chat_sessions AS
SELECT
  m.conversation_id AS id,
  m.student_id,
  MIN(m.title) AS title,
  MIN(m.session_status) AS status,
  MIN(m.started_at) AS started_at,
  MAX(m.last_message_at) AS last_message_at
FROM ai_chat_messages m
GROUP BY m.conversation_id, m.student_id;

CREATE OR REPLACE VIEW auth_refresh_tokens AS
SELECT id, user_id, token_hash, expires_at, revoked_at, created_at
FROM auth_tokens
WHERE token_type = 'refresh';

CREATE OR REPLACE VIEW password_reset_tokens AS
SELECT id, user_id, token_hash, expires_at, used_at, created_at
FROM auth_tokens
WHERE token_type = 'password_reset';

CREATE OR REPLACE VIEW audit_logs AS
SELECT
  n.id,
  n.created_by_user_id AS actor_user_id,
  COALESCE(n.source_entity_type, 'notification') AS entity_type,
  CAST(COALESCE(n.source_entity_id, n.id) AS CHAR(80)) AS entity_id,
  'notify' AS action,
  n.title AS summary,
  n.created_at
FROM notifications n
WHERE n.created_by_user_id IS NOT NULL;

CREATE OR REPLACE VIEW system_settings AS
SELECT 1 AS id, 'auth.email_login_only' AS setting_key, 'Email Login Only' AS setting_label, 'boolean' AS value_type, 'true' AS value_text, 'Only email/password accounts can sign in.' AS description, CURRENT_TIMESTAMP AS updated_at, NULL AS updated_by_user_id
UNION ALL SELECT 2, 'finance.default_currency', 'Default Currency', 'string', 'USD', 'Default finance currency.', CURRENT_TIMESTAMP, NULL
UNION ALL SELECT 3, 'clubs.join_request_review_sla_hours', 'Club Join Review SLA', 'number', '72', 'Expected club request review window.', CURRENT_TIMESTAMP, NULL
UNION ALL SELECT 4, 'news.default_visibility_days', 'News Visibility Window', 'number', '14', 'Default news visibility window.', CURRENT_TIMESTAMP, NULL
UNION ALL SELECT 5, 'chatbot.academic_assistant_enabled', 'Academic Assistant Enabled', 'boolean', 'true', 'Controls whether the student assistant is enabled.', CURRENT_TIMESTAMP, NULL;

-- Reporting views used by dashboards.

CREATE OR REPLACE VIEW vw_course_offering_enrollment_summary AS
SELECT
  co.id AS course_offering_id,
  c.code AS course_code,
  c.title AS course_title,
  at.name AS academic_term_name,
  co.section_code,
  co.capacity,
  SUM(CASE WHEN e.status = 'enrolled' THEN 1 ELSE 0 END) AS enrolled_count,
  SUM(CASE WHEN e.status = 'waitlisted' THEN 1 ELSE 0 END) AS waitlisted_count,
  SUM(CASE WHEN e.status IN ('dropped', 'withdrawn') THEN 1 ELSE 0 END) AS dropped_count,
  (co.capacity - SUM(CASE WHEN e.status = 'enrolled' THEN 1 ELSE 0 END)) AS seats_remaining
FROM course_offerings co
JOIN courses c ON c.id = co.course_id
JOIN academic_terms at ON at.id = co.academic_term_id
LEFT JOIN enrollments e ON e.course_offering_id = co.id
GROUP BY co.id, c.code, c.title, at.name, co.section_code, co.capacity;

CREATE OR REPLACE VIEW vw_student_financial_summary AS
SELECT
  u.id AS student_id,
  u.student_number,
  CONCAT(u.first_name, ' ', u.last_name) AS student_name,
  COUNT(DISTINCT si.id) AS invoice_count,
  COALESCE(SUM(si.total_amount), 0.00) AS total_invoiced,
  COALESCE(SUM(CASE WHEN p.status = 'confirmed' THEN p.amount ELSE 0 END), 0.00) AS total_paid,
  COALESCE(SUM(si.balance_amount), 0.00) AS outstanding_balance
FROM users u
LEFT JOIN student_invoices si ON si.student_id = u.id AND si.status <> 'void'
LEFT JOIN payments p ON p.invoice_id = si.id
WHERE u.role = 'Student'
GROUP BY u.id, u.student_number, u.first_name, u.last_name;

CREATE OR REPLACE VIEW vw_latest_student_risk AS
SELECT
  sra.student_id,
  sp.student_number,
  CONCAT(u.first_name, ' ', u.last_name) AS student_name,
  sra.academic_term_id,
  sra.risk_level,
  sra.risk_score,
  sra.summary,
  sra.generated_at
FROM student_risk_assessments sra
JOIN student_profiles sp ON sp.id = sra.student_id
JOIN users u ON u.id = sp.user_id;

CREATE OR REPLACE VIEW vw_club_summary AS
SELECT
  c.id AS club_id,
  c.code AS club_code,
  c.name AS club_name,
  c.category_name,
  c.status AS club_status,
  c.join_mode,
  COALESCE(SUM(CASE WHEN cm.status = 'active' THEN 1 ELSE 0 END), 0) AS active_members,
  COALESCE(SUM(CASE WHEN cm.status = 'pending' THEN 1 ELSE 0 END), 0) AS pending_requests,
  (
    SELECT COUNT(*)
    FROM campus_events ce
    WHERE ce.club_id = c.id
      AND ce.starts_at >= CURRENT_TIMESTAMP
      AND ce.status IN ('scheduled','open')
  ) AS upcoming_events
FROM clubs c
LEFT JOIN club_memberships cm ON cm.club_id = c.id
GROUP BY c.id, c.code, c.name, c.category_name, c.status, c.join_mode;

CREATE OR REPLACE VIEW vw_user_notification_summary AS
SELECT
  n.user_id,
  COUNT(*) AS total_notifications,
  SUM(CASE WHEN n.read_at IS NULL THEN 1 ELSE 0 END) AS unread_notifications,
  SUM(CASE WHEN n.severity IN ('warning', 'danger') AND n.read_at IS NULL THEN 1 ELSE 0 END) AS unread_action_items,
  MAX(n.created_at) AS latest_notification_at
FROM notifications n
GROUP BY n.user_id;

CREATE OR REPLACE VIEW vw_news_event_activity AS
SELECT
  'news_post' AS activity_type,
  np.id AS activity_id,
  np.title,
  np.status,
  np.priority AS descriptor,
  np.published_at AS activity_at
FROM news_posts np
UNION ALL
SELECT
  'campus_event' AS activity_type,
  ce.id AS activity_id,
  ce.title,
  ce.status,
  ce.event_type AS descriptor,
  ce.starts_at AS activity_at
FROM campus_events ce;
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
USE cis;

-- Optional detailed catalog seed removed with the lean schema.
-- The mandatory demo catalog is seeded by 04_seed_core_data.sql.

SELECT 'undergraduate catalog seed skipped for lean schema' AS status;
USE cis;

-- Optional graduate catalog seed removed with the lean schema.
-- The mandatory demo catalog is seeded by 04_seed_core_data.sql.

SELECT 'graduate catalog seed skipped for lean schema' AS status;
USE cis;

-- No catalog normalization is needed in the lean schema.

SELECT 'catalog normalization skipped for lean schema' AS status;
USE cis;

-- RBAC now lives directly on users.role, so no join-table migration is needed.

SELECT 'rbac migration skipped for lean schema' AS status;
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
