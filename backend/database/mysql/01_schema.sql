-- CIS production-style MySQL schema
-- Target: MySQL 8+ / MariaDB 10.6+ (XAMPP-compatible)

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE DATABASE IF NOT EXISTS cis
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cis;

CREATE TABLE roles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permissions_code (code),
  KEY idx_permissions_resource_action (resource, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NULL,
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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_status (status),
  KEY idx_users_deleted_at (deleted_at),
  KEY idx_users_created_by (created_by_user_id),
  CONSTRAINT fk_users_created_by
    FOREIGN KEY (created_by_user_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_roles (
  user_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_by_user_id BIGINT UNSIGNED NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  KEY idx_user_roles_role (role_id),
  KEY idx_user_roles_assigned_by (assigned_by_user_id),
  CONSTRAINT fk_user_roles_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_user_roles_role
    FOREIGN KEY (role_id) REFERENCES roles (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_user_roles_assigned_by
    FOREIGN KEY (assigned_by_user_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
  role_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  KEY idx_role_permissions_permission (permission_id),
  CONSTRAINT fk_role_permissions_role
    FOREIGN KEY (role_id) REFERENCES roles (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_role_permissions_permission
    FOREIGN KEY (permission_id) REFERENCES permissions (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE departments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_departments_code (code),
  UNIQUE KEY uq_departments_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE programs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  department_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(150) NOT NULL,
  degree_level ENUM('certificate','diploma','bachelor','master','phd') NOT NULL DEFAULT 'bachelor',
  duration_semesters SMALLINT UNSIGNED NOT NULL,
  total_credits_required SMALLINT UNSIGNED NOT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_programs_code (code),
  KEY idx_programs_department (department_id),
  CONSTRAINT fk_programs_department
    FOREIGN KEY (department_id) REFERENCES departments (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE buildings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_buildings_code (code),
  UNIQUE KEY uq_buildings_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rooms (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  building_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NULL,
  capacity SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  room_type ENUM('lecture','lab','seminar','office','online') NOT NULL DEFAULT 'lecture',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rooms_building_code (building_id, code),
  KEY idx_rooms_type (room_type),
  CONSTRAINT fk_rooms_building
    FOREIGN KEY (building_id) REFERENCES buildings (id)
    ON DELETE RESTRICT
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

CREATE TABLE student_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  student_number VARCHAR(30) NOT NULL,
  department_id BIGINT UNSIGNED NOT NULL,
  program_id BIGINT UNSIGNED NOT NULL,
  date_of_birth DATE NULL,
  gender ENUM('male','female','other','prefer_not_to_say') NULL,
  admission_date DATE NOT NULL,
  expected_graduation_date DATE NULL,
  current_semester SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  cumulative_gpa DECIMAL(4,2) NOT NULL DEFAULT 0.00,
  earned_credits SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('active','on_leave','graduated','suspended','withdrawn','probation') NOT NULL DEFAULT 'active',
  address_line_1 VARCHAR(150) NULL,
  address_line_2 VARCHAR(150) NULL,
  city VARCHAR(100) NULL,
  state_region VARCHAR(100) NULL,
  postal_code VARCHAR(20) NULL,
  country VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_student_profiles_user (user_id),
  UNIQUE KEY uq_student_profiles_number (student_number),
  KEY idx_student_profiles_department (department_id),
  KEY idx_student_profiles_program (program_id),
  KEY idx_student_profiles_status (status),
  CONSTRAINT fk_student_profiles_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_student_profiles_department
    FOREIGN KEY (department_id) REFERENCES departments (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_student_profiles_program
    FOREIGN KEY (program_id) REFERENCES programs (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE teacher_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  employee_number VARCHAR(30) NOT NULL,
  department_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(100) NULL,
  hire_date DATE NULL,
  employment_status ENUM('active','inactive','on_leave','terminated') NOT NULL DEFAULT 'active',
  specialization VARCHAR(150) NULL,
  office_location VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_teacher_profiles_user (user_id),
  UNIQUE KEY uq_teacher_profiles_employee_number (employee_number),
  KEY idx_teacher_profiles_department (department_id),
  CONSTRAINT fk_teacher_profiles_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_teacher_profiles_department
    FOREIGN KEY (department_id) REFERENCES departments (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  employee_number VARCHAR(30) NOT NULL,
  title VARCHAR(100) NULL,
  office_location VARCHAR(100) NULL,
  employment_status ENUM('active','inactive','on_leave','terminated') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_profiles_user (user_id),
  UNIQUE KEY uq_admin_profiles_employee_number (employee_number),
  CONSTRAINT fk_admin_profiles_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE courses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  department_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(20) NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NULL,
  credit_hours TINYINT UNSIGNED NOT NULL,
  ects_credits DECIMAL(4,1) NULL,
  level_number SMALLINT UNSIGNED NOT NULL,
  course_type ENUM('core','elective','lab','seminar','project') NOT NULL DEFAULT 'core',
  grading_scheme ENUM('letter','pass_fail') NOT NULL DEFAULT 'letter',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_courses_code (code),
  KEY idx_courses_department (department_id),
  KEY idx_courses_active (is_active),
  CONSTRAINT fk_courses_department
    FOREIGN KEY (department_id) REFERENCES departments (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE program_courses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  program_id BIGINT UNSIGNED NOT NULL,
  course_id BIGINT UNSIGNED NOT NULL,
  recommended_term_number TINYINT UNSIGNED NULL,
  requirement_type ENUM('core','elective','optional') NOT NULL DEFAULT 'core',
  minimum_grade_required VARCHAR(5) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_program_courses_program_course (program_id, course_id),
  KEY idx_program_courses_course (course_id),
  CONSTRAINT fk_program_courses_program
    FOREIGN KEY (program_id) REFERENCES programs (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_program_courses_course
    FOREIGN KEY (course_id) REFERENCES courses (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE course_prerequisites (
  course_id BIGINT UNSIGNED NOT NULL,
  prerequisite_course_id BIGINT UNSIGNED NOT NULL,
  minimum_grade_required VARCHAR(5) NULL,
  PRIMARY KEY (course_id, prerequisite_course_id),
  KEY idx_course_prerequisites_prerequisite (prerequisite_course_id),
  CONSTRAINT fk_course_prerequisites_course
    FOREIGN KEY (course_id) REFERENCES courses (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_course_prerequisites_prerequisite
    FOREIGN KEY (prerequisite_course_id) REFERENCES courses (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE course_offerings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id BIGINT UNSIGNED NOT NULL,
  academic_term_id BIGINT UNSIGNED NOT NULL,
  teacher_id BIGINT UNSIGNED NULL,
  room_id BIGINT UNSIGNED NULL,
  section_code VARCHAR(10) NOT NULL,
  delivery_mode ENUM('onsite','online','hybrid') NOT NULL DEFAULT 'onsite',
  capacity SMALLINT UNSIGNED NOT NULL,
  waitlist_capacity SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('draft','open','closed','in_progress','completed','cancelled') NOT NULL DEFAULT 'draft',
  registration_opens_at DATETIME NULL,
  registration_closes_at DATETIME NULL,
  schedule_notes VARCHAR(255) NULL,
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
    FOREIGN KEY (teacher_id) REFERENCES teacher_profiles (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_course_offerings_room
    FOREIGN KEY (room_id) REFERENCES rooms (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_course_offerings_created_by
    FOREIGN KEY (created_by_user_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE course_meetings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_offering_id BIGINT UNSIGNED NOT NULL,
  room_id BIGINT UNSIGNED NULL,
  day_of_week ENUM('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  meeting_type ENUM('lecture','lab','tutorial','exam','office_hour') NOT NULL DEFAULT 'lecture',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_course_meetings_offering (course_offering_id),
  KEY idx_course_meetings_room (room_id),
  CONSTRAINT fk_course_meetings_offering
    FOREIGN KEY (course_offering_id) REFERENCES course_offerings (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_course_meetings_room
    FOREIGN KEY (room_id) REFERENCES rooms (id)
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
  dropped_at DATETIME NULL,
  completed_at DATETIME NULL,
  final_numeric_grade DECIMAL(5,2) NULL,
  final_letter_grade VARCHAR(5) NULL,
  grade_points DECIMAL(4,2) NULL,
  created_by_user_id BIGINT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_enrollments_student_offering (student_id, course_offering_id),
  KEY idx_enrollments_offering (course_offering_id),
  KEY idx_enrollments_status (status),
  CONSTRAINT fk_enrollments_student
    FOREIGN KEY (student_id) REFERENCES student_profiles (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_enrollments_offering
    FOREIGN KEY (course_offering_id) REFERENCES course_offerings (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_enrollments_created_by
    FOREIGN KEY (created_by_user_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_term_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id BIGINT UNSIGNED NOT NULL,
  academic_term_id BIGINT UNSIGNED NOT NULL,
  semester_number SMALLINT UNSIGNED NOT NULL,
  registered_credits SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  earned_credits SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  term_gpa DECIMAL(4,2) NOT NULL DEFAULT 0.00,
  cumulative_gpa DECIMAL(4,2) NOT NULL DEFAULT 0.00,
  academic_standing ENUM('good','warning','probation','suspended') NOT NULL DEFAULT 'good',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_student_term_records_student_term (student_id, academic_term_id),
  KEY idx_student_term_records_term (academic_term_id),
  KEY idx_student_term_records_standing (academic_standing),
  CONSTRAINT fk_student_term_records_student
    FOREIGN KEY (student_id) REFERENCES student_profiles (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_student_term_records_term
    FOREIGN KEY (academic_term_id) REFERENCES academic_terms (id)
    ON DELETE CASCADE
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
  UNIQUE KEY uq_attendance_sessions_unique (course_offering_id, session_date, start_time),
  KEY idx_attendance_sessions_meeting (course_meeting_id),
  CONSTRAINT fk_attendance_sessions_offering
    FOREIGN KEY (course_offering_id) REFERENCES course_offerings (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_attendance_sessions_meeting
    FOREIGN KEY (course_meeting_id) REFERENCES course_meetings (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_attendance_sessions_teacher
    FOREIGN KEY (created_by_teacher_id) REFERENCES teacher_profiles (id)
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
  PRIMARY KEY (id),
  UNIQUE KEY uq_attendance_records_session_student (attendance_session_id, student_id),
  KEY idx_attendance_records_student (student_id),
  KEY idx_attendance_records_status (status),
  CONSTRAINT fk_attendance_records_session
    FOREIGN KEY (attendance_session_id) REFERENCES attendance_sessions (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_attendance_records_student
    FOREIGN KEY (student_id) REFERENCES student_profiles (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_attendance_records_teacher
    FOREIGN KEY (recorded_by_teacher_id) REFERENCES teacher_profiles (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE grade_components (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_offering_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  component_type ENUM('assignment','quiz','midterm','final','project','lab','participation','attendance','custom') NOT NULL DEFAULT 'assignment',
  max_points DECIMAL(8,2) NOT NULL,
  weight_percentage DECIMAL(5,2) NOT NULL,
  due_at DATETIME NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_grade_components_offering (course_offering_id),
  KEY idx_grade_components_due_at (due_at),
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
    FOREIGN KEY (student_id) REFERENCES student_profiles (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_grade_records_teacher
    FOREIGN KEY (graded_by_teacher_id) REFERENCES teacher_profiles (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE final_grades (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  enrollment_id BIGINT UNSIGNED NOT NULL,
  numeric_grade DECIMAL(5,2) NULL,
  letter_grade VARCHAR(5) NULL,
  grade_points DECIMAL(4,2) NULL,
  status ENUM('in_progress','published','incomplete','withdrawn') NOT NULL DEFAULT 'in_progress',
  published_at DATETIME NULL,
  approved_by_teacher_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_final_grades_enrollment (enrollment_id),
  KEY idx_final_grades_status (status),
  CONSTRAINT fk_final_grades_enrollment
    FOREIGN KEY (enrollment_id) REFERENCES enrollments (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_final_grades_teacher
    FOREIGN KEY (approved_by_teacher_id) REFERENCES teacher_profiles (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_risk_assessments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id BIGINT UNSIGNED NOT NULL,
  academic_term_id BIGINT UNSIGNED NULL,
  risk_level ENUM('low','medium','high') NOT NULL,
  risk_score DECIMAL(5,2) NULL,
  summary TEXT NULL,
  generated_by_user_id BIGINT UNSIGNED NULL,
  generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_student_risk_assessments_student (student_id),
  KEY idx_student_risk_assessments_term (academic_term_id),
  KEY idx_student_risk_assessments_level (risk_level),
  CONSTRAINT fk_student_risk_assessments_student
    FOREIGN KEY (student_id) REFERENCES student_profiles (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_student_risk_assessments_term
    FOREIGN KEY (academic_term_id) REFERENCES academic_terms (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_student_risk_assessments_user
    FOREIGN KEY (generated_by_user_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_recommendations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id BIGINT UNSIGNED NOT NULL,
  academic_term_id BIGINT UNSIGNED NULL,
  recommended_course_id BIGINT UNSIGNED NOT NULL,
  reason TEXT NOT NULL,
  priority TINYINT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('suggested','accepted','dismissed','expired') NOT NULL DEFAULT 'suggested',
  created_by_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_student_recommendations_student (student_id),
  KEY idx_student_recommendations_term (academic_term_id),
  KEY idx_student_recommendations_course (recommended_course_id),
  CONSTRAINT fk_student_recommendations_student
    FOREIGN KEY (student_id) REFERENCES student_profiles (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_student_recommendations_term
    FOREIGN KEY (academic_term_id) REFERENCES academic_terms (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_student_recommendations_course
    FOREIGN KEY (recommended_course_id) REFERENCES courses (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_student_recommendations_user
    FOREIGN KEY (created_by_user_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE fee_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(30) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  default_amount DECIMAL(12,2) NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_fee_categories_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_invoices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id BIGINT UNSIGNED NOT NULL,
  academic_term_id BIGINT UNSIGNED NULL,
  invoice_number VARCHAR(40) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  subtotal_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  balance_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status ENUM('draft','issued','partially_paid','paid','overdue','void') NOT NULL DEFAULT 'draft',
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
    FOREIGN KEY (student_id) REFERENCES student_profiles (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_student_invoices_term
    FOREIGN KEY (academic_term_id) REFERENCES academic_terms (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_student_invoices_admin
    FOREIGN KEY (created_by_admin_id) REFERENCES admin_profiles (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE invoice_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  invoice_id BIGINT UNSIGNED NOT NULL,
  fee_category_id BIGINT UNSIGNED NULL,
  description VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  unit_amount DECIMAL(12,2) NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_invoice_items_invoice (invoice_id),
  KEY idx_invoice_items_category (fee_category_id),
  CONSTRAINT fk_invoice_items_invoice
    FOREIGN KEY (invoice_id) REFERENCES student_invoices (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_invoice_items_category
    FOREIGN KEY (fee_category_id) REFERENCES fee_categories (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id BIGINT UNSIGNED NOT NULL,
  reference_number VARCHAR(60) NULL,
  payment_method ENUM('cash','card','bank_transfer','online') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  paid_at DATETIME NOT NULL,
  status ENUM('pending','confirmed','failed','refunded') NOT NULL DEFAULT 'confirmed',
  received_by_admin_id BIGINT UNSIGNED NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_reference_number (reference_number),
  KEY idx_payments_student (student_id),
  KEY idx_payments_status (status),
  CONSTRAINT fk_payments_student
    FOREIGN KEY (student_id) REFERENCES student_profiles (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_payments_admin
    FOREIGN KEY (received_by_admin_id) REFERENCES admin_profiles (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payment_allocations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payment_id BIGINT UNSIGNED NOT NULL,
  invoice_id BIGINT UNSIGNED NOT NULL,
  amount_applied DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_allocations_payment_invoice (payment_id, invoice_id),
  KEY idx_payment_allocations_invoice (invoice_id),
  CONSTRAINT fk_payment_allocations_payment
    FOREIGN KEY (payment_id) REFERENCES payments (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_payment_allocations_invoice
    FOREIGN KEY (invoice_id) REFERENCES student_invoices (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE financial_holds (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id BIGINT UNSIGNED NOT NULL,
  hold_type ENUM('finance','disciplinary','academic','administrative') NOT NULL,
  reason VARCHAR(255) NOT NULL,
  status ENUM('active','released') NOT NULL DEFAULT 'active',
  placed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  placed_by_admin_id BIGINT UNSIGNED NULL,
  released_at DATETIME NULL,
  released_by_admin_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_financial_holds_student (student_id),
  KEY idx_financial_holds_status (status),
  CONSTRAINT fk_financial_holds_student
    FOREIGN KEY (student_id) REFERENCES student_profiles (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_financial_holds_placed_by
    FOREIGN KEY (placed_by_admin_id) REFERENCES admin_profiles (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_financial_holds_released_by
    FOREIGN KEY (released_by_admin_id) REFERENCES admin_profiles (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auth_refresh_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  issued_ip VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  last_used_at DATETIME NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_auth_refresh_tokens_hash (token_hash),
  KEY idx_auth_refresh_tokens_user (user_id),
  KEY idx_auth_refresh_tokens_expires_at (expires_at),
  CONSTRAINT fk_auth_refresh_tokens_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE password_reset_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_password_reset_tokens_hash (token_hash),
  KEY idx_password_reset_tokens_user (user_id),
  KEY idx_password_reset_tokens_expires_at (expires_at),
  CONSTRAINT fk_password_reset_tokens_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_user_id BIGINT UNSIGNED NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  action ENUM('create','update','delete','login','logout','status_change','grade_publish','payment_recorded') NOT NULL,
  summary VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  metadata_json LONGTEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_logs_actor (actor_user_id),
  KEY idx_audit_logs_entity (entity_type, entity_id),
  KEY idx_audit_logs_action (action),
  CONSTRAINT fk_audit_logs_actor
    FOREIGN KEY (actor_user_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE club_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(30) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_club_categories_code (code),
  UNIQUE KEY uq_club_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE clubs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(30) NOT NULL,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL,
  description TEXT NULL,
  advisor_teacher_id BIGINT UNSIGNED NULL,
  managed_by_admin_id BIGINT UNSIGNED NULL,
  join_mode ENUM('open','request','invite_only','waitlist') NOT NULL DEFAULT 'open',
  status ENUM('draft','active','recruiting','inactive','archived') NOT NULL DEFAULT 'active',
  capacity SMALLINT UNSIGNED NULL,
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
  KEY idx_clubs_category (category_id),
  KEY idx_clubs_advisor (advisor_teacher_id),
  KEY idx_clubs_status (status),
  CONSTRAINT fk_clubs_category
    FOREIGN KEY (category_id) REFERENCES club_categories (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_clubs_advisor
    FOREIGN KEY (advisor_teacher_id) REFERENCES teacher_profiles (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_clubs_managed_by
    FOREIGN KEY (managed_by_admin_id) REFERENCES admin_profiles (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE club_memberships (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  club_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  member_role ENUM('member','volunteer','officer','president','vice_president','secretary','treasurer') NOT NULL DEFAULT 'member',
  status ENUM('active','pending','inactive','left','suspended') NOT NULL DEFAULT 'active',
  joined_at DATETIME NULL,
  left_at DATETIME NULL,
  approved_by_admin_id BIGINT UNSIGNED NULL,
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
    FOREIGN KEY (student_id) REFERENCES student_profiles (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_club_memberships_admin
    FOREIGN KEY (approved_by_admin_id) REFERENCES admin_profiles (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE club_join_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  club_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  requested_role ENUM('member','volunteer') NOT NULL DEFAULT 'member',
  status ENUM('pending','approved','waitlisted','rejected','cancelled') NOT NULL DEFAULT 'pending',
  request_message VARCHAR(500) NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  reviewed_by_admin_id BIGINT UNSIGNED NULL,
  review_notes VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_club_join_requests_club_student (club_id, student_id),
  KEY idx_club_join_requests_student (student_id),
  KEY idx_club_join_requests_status (status),
  CONSTRAINT fk_club_join_requests_club
    FOREIGN KEY (club_id) REFERENCES clubs (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_club_join_requests_student
    FOREIGN KEY (student_id) REFERENCES student_profiles (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_club_join_requests_admin
    FOREIGN KEY (reviewed_by_admin_id) REFERENCES admin_profiles (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE financial_aid_awards (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id BIGINT UNSIGNED NOT NULL,
  academic_term_id BIGINT UNSIGNED NULL,
  award_type ENUM('scholarship','grant','waiver','sponsorship','loan_credit') NOT NULL,
  provider_name VARCHAR(150) NOT NULL,
  reference_number VARCHAR(60) NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  status ENUM('pending','approved','applied','cancelled','expired') NOT NULL DEFAULT 'approved',
  approved_at DATETIME NULL,
  applied_at DATETIME NULL,
  created_by_admin_id BIGINT UNSIGNED NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_financial_aid_reference_number (reference_number),
  KEY idx_financial_aid_student (student_id),
  KEY idx_financial_aid_term (academic_term_id),
  KEY idx_financial_aid_status (status),
  CONSTRAINT fk_financial_aid_student
    FOREIGN KEY (student_id) REFERENCES student_profiles (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_financial_aid_term
    FOREIGN KEY (academic_term_id) REFERENCES academic_terms (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_financial_aid_admin
    FOREIGN KEY (created_by_admin_id) REFERENCES admin_profiles (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE news_posts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_type ENUM('announcement','notice','update','feature') NOT NULL DEFAULT 'announcement',
  title VARCHAR(180) NOT NULL,
  summary VARCHAR(500) NOT NULL,
  body LONGTEXT NULL,
  priority ENUM('notice','update','important','urgent') NOT NULL DEFAULT 'notice',
  status ENUM('draft','scheduled','published','archived') NOT NULL DEFAULT 'draft',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  visible_from DATETIME NULL,
  visible_until DATETIME NULL,
  published_at DATETIME NULL,
  created_by_user_id BIGINT UNSIGNED NULL,
  updated_by_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_news_posts_type (post_type),
  KEY idx_news_posts_priority (priority),
  KEY idx_news_posts_status (status),
  KEY idx_news_posts_published_at (published_at),
  CONSTRAINT fk_news_posts_created_by
    FOREIGN KEY (created_by_user_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_news_posts_updated_by
    FOREIGN KEY (updated_by_user_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE news_post_audiences (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  news_post_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NULL,
  department_id BIGINT UNSIGNED NULL,
  program_id BIGINT UNSIGNED NULL,
  academic_term_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_news_post_audiences_post (news_post_id),
  KEY idx_news_post_audiences_role (role_id),
  KEY idx_news_post_audiences_department (department_id),
  KEY idx_news_post_audiences_program (program_id),
  KEY idx_news_post_audiences_term (academic_term_id),
  CONSTRAINT fk_news_post_audiences_post
    FOREIGN KEY (news_post_id) REFERENCES news_posts (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_news_post_audiences_role
    FOREIGN KEY (role_id) REFERENCES roles (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_news_post_audiences_department
    FOREIGN KEY (department_id) REFERENCES departments (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_news_post_audiences_program
    FOREIGN KEY (program_id) REFERENCES programs (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_news_post_audiences_term
    FOREIGN KEY (academic_term_id) REFERENCES academic_terms (id)
    ON DELETE CASCADE
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
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  registration_required BOOLEAN NOT NULL DEFAULT FALSE,
  capacity SMALLINT UNSIGNED NULL,
  expected_attendees INT UNSIGNED NULL,
  status ENUM('draft','scheduled','open','internal','cancelled','completed') NOT NULL DEFAULT 'draft',
  managed_by_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_campus_events_club (club_id),
  KEY idx_campus_events_status (status),
  KEY idx_campus_events_starts_at (starts_at),
  CONSTRAINT fk_campus_events_club
    FOREIGN KEY (club_id) REFERENCES clubs (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_campus_events_managed_by
    FOREIGN KEY (managed_by_user_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE campus_event_audiences (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  campus_event_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NULL,
  department_id BIGINT UNSIGNED NULL,
  program_id BIGINT UNSIGNED NULL,
  academic_term_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_campus_event_audiences_event (campus_event_id),
  KEY idx_campus_event_audiences_role (role_id),
  KEY idx_campus_event_audiences_department (department_id),
  KEY idx_campus_event_audiences_program (program_id),
  KEY idx_campus_event_audiences_term (academic_term_id),
  CONSTRAINT fk_campus_event_audiences_event
    FOREIGN KEY (campus_event_id) REFERENCES campus_events (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_campus_event_audiences_role
    FOREIGN KEY (role_id) REFERENCES roles (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_campus_event_audiences_department
    FOREIGN KEY (department_id) REFERENCES departments (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_campus_event_audiences_program
    FOREIGN KEY (program_id) REFERENCES programs (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_campus_event_audiences_term
    FOREIGN KEY (academic_term_id) REFERENCES academic_terms (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE campus_event_registrations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  campus_event_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  status ENUM('registered','waitlisted','cancelled','attended') NOT NULL DEFAULT 'registered',
  registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  checked_in_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_campus_event_registrations_event_user (campus_event_id, user_id),
  KEY idx_campus_event_registrations_user (user_id),
  KEY idx_campus_event_registrations_status (status),
  CONSTRAINT fk_campus_event_registrations_event
    FOREIGN KEY (campus_event_id) REFERENCES campus_events (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_campus_event_registrations_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category ENUM('academic','finance','registration','event','campus','warning','system','club') NOT NULL DEFAULT 'system',
  severity ENUM('info','success','warning','danger') NOT NULL DEFAULT 'info',
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  action_label VARCHAR(80) NULL,
  action_url VARCHAR(255) NULL,
  source_entity_type VARCHAR(80) NULL,
  source_entity_id BIGINT UNSIGNED NULL,
  created_by_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_category (category),
  KEY idx_notifications_severity (severity),
  KEY idx_notifications_created_by (created_by_user_id),
  CONSTRAINT fk_notifications_created_by
    FOREIGN KEY (created_by_user_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notification_recipients (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  notification_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  delivered_at DATETIME NULL,
  read_at DATETIME NULL,
  archived_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_notification_recipients_notification_user (notification_id, user_id),
  KEY idx_notification_recipients_user (user_id),
  KEY idx_notification_recipients_read_at (read_at),
  CONSTRAINT fk_notification_recipients_notification
    FOREIGN KEY (notification_id) REFERENCES notifications (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_notification_recipients_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ai_chat_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(150) NULL,
  status ENUM('active','archived','closed') NOT NULL DEFAULT 'active',
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_message_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ai_chat_sessions_student (student_id),
  KEY idx_ai_chat_sessions_status (status),
  CONSTRAINT fk_ai_chat_sessions_student
    FOREIGN KEY (student_id) REFERENCES student_profiles (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ai_chat_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  session_id BIGINT UNSIGNED NOT NULL,
  sender_type ENUM('student','assistant','system') NOT NULL,
  message_text LONGTEXT NOT NULL,
  metadata_json LONGTEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ai_chat_messages_session (session_id),
  KEY idx_ai_chat_messages_sender_type (sender_type),
  CONSTRAINT fk_ai_chat_messages_session
    FOREIGN KEY (session_id) REFERENCES ai_chat_sessions (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE system_settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  setting_key VARCHAR(120) NOT NULL,
  setting_label VARCHAR(150) NOT NULL,
  value_type ENUM('string','number','boolean','json') NOT NULL DEFAULT 'string',
  value_text LONGTEXT NULL,
  description VARCHAR(255) NULL,
  updated_by_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_system_settings_key (setting_key),
  KEY idx_system_settings_updated_by (updated_by_user_id),
  CONSTRAINT fk_system_settings_updated_by
    FOREIGN KEY (updated_by_user_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
