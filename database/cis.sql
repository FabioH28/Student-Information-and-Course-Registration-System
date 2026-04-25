

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

-- ============================================================================
-- Source: backend\database\mysql\02_seed_reference.sql
-- ============================================================================

USE cis;

INSERT INTO roles (code, name, description, is_system)
VALUES
  ('Student', 'Student', 'Accesses personal academic and financial information and self-service student workflows.', TRUE),
  ('Instructor', 'Instructor', 'Manages teaching workflows for assigned course offerings and students.', TRUE),
  ('Academic Staff', 'Academic Staff', 'Handles academic administration, registration, scheduling, and academic records.', TRUE),
  ('Finance Staff', 'Finance Staff', 'Manages tuition, manual invoices, payment records, and finance records.', TRUE),
  ('Communication Staff', 'Communication Staff', 'Manages announcements, events, media, and public communication content.', TRUE),
  ('System Admin', 'System Admin', 'Manages users, roles, settings, reports, and overall system oversight.', TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  is_system = VALUES(is_system);

INSERT INTO permissions (code, name, description, resource, action)
VALUES
  ('profile.view.self', 'View Own Profile', 'Allows a user to view their own CIS profile.', 'profile', 'view_self'),
  ('profile.edit.self', 'Edit Own Profile', 'Allows a user to update their own CIS profile.', 'profile', 'edit_self'),
  ('students.self_service', 'Student Self-Service Workspace', 'Allows a student to use their academic, registration, finance, inbox, club, and chatbot workspace.', 'students', 'self_service'),
  ('instructors.workspace', 'Instructor Workspace', 'Allows an instructor to manage assigned courses, grades, attendance, and inbox items.', 'instructors', 'workspace'),
  ('instructors.timetable.view', 'View Instructor Timetable', 'Allows an instructor to view their assigned timetable.', 'instructors', 'view_timetable'),
  ('announcements.manage.instructor', 'Manage Course Announcements', 'Allows an instructor to create and update course-related announcements.', 'announcements', 'manage_instructor'),
  ('academic.dashboard.view', 'View Academic Dashboard', 'Allows academic staff to view academic administration dashboards.', 'academic', 'view_dashboard'),
  ('academic.records.manage', 'Manage Academic Records', 'Allows academic staff to manage student academic records and roster visibility.', 'academic_records', 'manage'),
  ('academic.grades.manage', 'Manage Grades', 'Allows academic staff to edit grades across academic workflows.', 'grades', 'manage'),
  ('academic.attendance.manage', 'Manage Attendance', 'Allows academic staff to record and update attendance across academic workflows.', 'attendance', 'manage'),
  ('academic.courses.manage', 'Manage Course Catalog and Offerings', 'Allows academic staff to manage course catalog and semester offerings.', 'courses', 'manage'),
  ('academic.terms.manage', 'Manage Terms', 'Allows academic staff to manage semesters, exam periods, and registration windows.', 'academic_terms', 'manage'),
  ('academic.registrations.manage', 'Manage Registrations', 'Allows academic staff to manage course registrations and enrollment statuses.', 'registrations', 'manage'),
  ('academic.schedule.manage', 'Manage Scheduling', 'Allows academic staff to manage timetables and scheduling workflows.', 'scheduling', 'manage'),
  ('academic.exams.manage', 'Manage Exam Scheduling', 'Allows academic staff to manage exam schedules.', 'exams', 'manage'),
  ('finance.dashboard.view', 'View Finance Dashboard', 'Allows finance staff to view finance dashboards and reports.', 'finance', 'view_dashboard'),
  ('finance.records.manage', 'Manage Finance Records', 'Allows finance staff to manage manual invoices, payment records, and holds.', 'finance', 'manage'),
  ('communications.dashboard.view', 'View Communications Dashboard', 'Allows staff to view announcement and event management dashboards.', 'communications', 'view_dashboard'),
  ('announcements.manage', 'Manage Announcements', 'Allows staff to create and update announcements and news items.', 'announcements', 'manage'),
  ('events.manage', 'Manage Events', 'Allows staff to create and update campus events and related club workflows.', 'events', 'manage'),
  ('announcements.media.upload', 'Upload Announcement Media', 'Allows staff to manage media assets used in public communications.', 'media', 'upload'),
  ('notifications.send', 'Send Notifications', 'Allows staff to issue notifications to relevant users.', 'notifications', 'send'),
  ('reports.view', 'View Reports', 'Allows access to dashboard and reporting summaries.', 'reports', 'view'),
  ('users.manage', 'Manage Users', 'Allows a System Admin to create and manage user accounts.', 'users', 'manage'),
  ('roles.manage', 'Manage Roles', 'Allows a System Admin to change role assignments.', 'roles', 'manage'),
  ('settings.manage', 'Manage Settings', 'Allows a System Admin to manage system settings.', 'settings', 'manage'),
  ('system.overview.view', 'View System Overview', 'Allows a System Admin to view global system dashboards.', 'system', 'view_overview')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  resource = VALUES(resource),
  action = VALUES(action);

DELETE rp
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
WHERE r.code IN ('Student', 'Instructor', 'Academic Staff', 'Finance Staff', 'Communication Staff', 'System Admin');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
  ON (
    (r.code = 'Student' AND p.code IN (
      'profile.view.self',
      'profile.edit.self',
      'students.self_service',
      'reports.view'
    ))
    OR
    (r.code = 'Instructor' AND p.code IN (
      'profile.view.self',
      'profile.edit.self',
      'instructors.workspace',
      'instructors.timetable.view',
      'announcements.manage.instructor',
      'notifications.send',
      'reports.view'
    ))
    OR
    (r.code = 'Academic Staff' AND p.code IN (
      'profile.view.self',
      'profile.edit.self',
      'academic.dashboard.view',
      'academic.records.manage',
      'academic.grades.manage',
      'academic.attendance.manage',
      'academic.courses.manage',
      'academic.terms.manage',
      'academic.registrations.manage',
      'academic.schedule.manage',
      'academic.exams.manage',
      'communications.dashboard.view',
      'announcements.manage',
      'events.manage',
      'announcements.media.upload',
      'notifications.send',
      'reports.view'
    ))
    OR
    (r.code = 'Finance Staff' AND p.code IN (
      'profile.view.self',
      'profile.edit.self',
      'finance.dashboard.view',
      'finance.records.manage',
      'notifications.send',
      'reports.view'
    ))
    OR
    (r.code = 'Communication Staff' AND p.code IN (
      'profile.view.self',
      'profile.edit.self',
      'communications.dashboard.view',
      'announcements.manage',
      'events.manage',
      'announcements.media.upload',
      'notifications.send',
      'reports.view'
    ))
    OR
    (r.code = 'System Admin' AND p.code IN (
      'profile.view.self',
      'profile.edit.self',
      'system.overview.view',
      'academic.dashboard.view',
      'academic.records.manage',
      'academic.courses.manage',
      'academic.terms.manage',
      'academic.registrations.manage',
      'academic.schedule.manage',
      'academic.exams.manage',
      'finance.dashboard.view',
      'finance.records.manage',
      'communications.dashboard.view',
      'announcements.manage',
      'events.manage',
      'announcements.media.upload',
      'notifications.send',
      'reports.view',
      'users.manage',
      'roles.manage',
      'settings.manage'
    ))
  )
ON DUPLICATE KEY UPDATE
  granted_at = granted_at;

INSERT INTO fee_categories (code, name, description, default_amount, is_recurring, is_active)
VALUES
  ('TUITION', 'Tuition', 'Base tuition fee charged per academic term.', NULL, TRUE, TRUE),
  ('LAB', 'Laboratory Fee', 'Laboratory and equipment usage fee.', NULL, TRUE, TRUE),
  ('LIBRARY', 'Library Fee', 'Library access and materials fee.', NULL, TRUE, TRUE),
  ('EXAM', 'Examination Fee', 'Assessment and exam administration fee.', NULL, TRUE, TRUE),
  ('LATE', 'Late Penalty', 'Penalty applied for overdue balances.', NULL, FALSE, TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  default_amount = VALUES(default_amount),
  is_recurring = VALUES(is_recurring),
  is_active = VALUES(is_active);

INSERT INTO club_categories (code, name, description, is_active)
VALUES
  ('ACADEMIC', 'Academic', 'Academic and professional development organizations.', TRUE),
  ('ENGINEERING', 'Engineering', 'Engineering and technology-focused organizations.', TRUE),
  ('ARTS', 'Arts', 'Creative arts, music, and design organizations.', TRUE),
  ('LEADERSHIP', 'Leadership', 'Leadership, debate, and student development clubs.', TRUE),
  ('SPORTS', 'Sports', 'Sports, recreation, and athletic clubs.', TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  is_active = VALUES(is_active);

INSERT INTO system_settings (setting_key, setting_label, value_type, value_text, description)
VALUES
  ('auth.email_login_only', 'Email Login Only', 'boolean', 'true', 'Only admin-provisioned email accounts can be used to sign in.'),
  ('finance.default_currency', 'Default Currency', 'string', 'USD', 'Default currency for invoices, payments, and finance displays.'),
  ('clubs.join_request_review_sla_hours', 'Club Join Review SLA', 'number', '72', 'Expected review turnaround for club join requests in hours.'),
  ('news.default_visibility_days', 'News Visibility Window', 'number', '14', 'Default number of days a published news post remains visible.'),
  ('chatbot.academic_assistant_enabled', 'Academic Assistant Enabled', 'boolean', 'true', 'Controls whether the AI academic assistant is enabled for students.')
ON DUPLICATE KEY UPDATE
  setting_label = VALUES(setting_label),
  value_type = VALUES(value_type),
  value_text = VALUES(value_text),
  description = VALUES(description);

-- ============================================================================
-- Source: backend\database\mysql\03_views.sql
-- ============================================================================

USE cis;

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
GROUP BY
  co.id,
  c.code,
  c.title,
  at.name,
  co.section_code,
  co.capacity;

CREATE OR REPLACE VIEW vw_student_financial_summary AS
SELECT
  sp.id AS student_id,
  sp.student_number,
  CONCAT(u.first_name, ' ', u.last_name) AS student_name,
  COUNT(DISTINCT si.id) AS invoice_count,
  COALESCE(SUM(si.total_amount), 0.00) AS total_invoiced,
  COALESCE(SUM(pa.amount_applied), 0.00) AS total_paid,
  COALESCE(SUM(si.balance_amount), 0.00) AS outstanding_balance
FROM student_profiles sp
JOIN users u ON u.id = sp.user_id
LEFT JOIN student_invoices si ON si.student_id = sp.id AND si.status <> 'void'
LEFT JOIN payment_allocations pa ON pa.invoice_id = si.id
GROUP BY
  sp.id,
  sp.student_number,
  u.first_name,
  u.last_name;

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
JOIN (
  SELECT student_id, MAX(generated_at) AS max_generated_at
  FROM student_risk_assessments
  GROUP BY student_id
) latest
  ON latest.student_id = sra.student_id
 AND latest.max_generated_at = sra.generated_at
JOIN student_profiles sp ON sp.id = sra.student_id
JOIN users u ON u.id = sp.user_id;

CREATE OR REPLACE VIEW vw_club_summary AS
SELECT
  c.id AS club_id,
  c.code AS club_code,
  c.name AS club_name,
  cc.name AS category_name,
  c.status AS club_status,
  c.join_mode,
  COALESCE(members.active_members, 0) AS active_members,
  COALESCE(requests.pending_requests, 0) AS pending_requests,
  COALESCE(events.upcoming_events, 0) AS upcoming_events
FROM clubs c
JOIN club_categories cc ON cc.id = c.category_id
LEFT JOIN (
  SELECT club_id, COUNT(*) AS active_members
  FROM club_memberships
  WHERE status = 'active'
  GROUP BY club_id
) members ON members.club_id = c.id
LEFT JOIN (
  SELECT club_id, COUNT(*) AS pending_requests
  FROM club_join_requests
  WHERE status = 'pending'
  GROUP BY club_id
) requests ON requests.club_id = c.id
LEFT JOIN (
  SELECT club_id, COUNT(*) AS upcoming_events
  FROM campus_events
  WHERE starts_at >= CURRENT_TIMESTAMP
    AND status IN ('scheduled', 'open')
  GROUP BY club_id
) events ON events.club_id = c.id;

CREATE OR REPLACE VIEW vw_user_notification_summary AS
SELECT
  nr.user_id,
  COUNT(*) AS total_notifications,
  SUM(CASE WHEN nr.read_at IS NULL THEN 1 ELSE 0 END) AS unread_notifications,
  SUM(CASE WHEN n.severity IN ('warning', 'danger') AND nr.read_at IS NULL THEN 1 ELSE 0 END) AS unread_action_items,
  MAX(n.created_at) AS latest_notification_at
FROM notification_recipients nr
JOIN notifications n ON n.id = nr.notification_id
GROUP BY nr.user_id;

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

-- ============================================================================
-- Source: backend\database\mysql\04_seed_core_data.sql
-- ============================================================================

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

-- ============================================================================
-- Source: backend\database\mysql\05_seed_undergraduate_catalog.sql
-- ============================================================================

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



-- ============================================================================
-- Source: backend\database\mysql\06_seed_graduate_catalog.sql
-- ============================================================================

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



-- ============================================================================
-- Source: backend\database\mysql\07_normalize_catalog_identity.sql
-- ============================================================================

USE cis;

-- Normalize imported academic catalogs so visible codes and labels are original to CIS.
-- Database primary keys remain internal auto-generated identifiers.
-- This script only rewrites human-facing department/program/course codes and selected program names.

UPDATE departments
SET
  code = CASE code
    WHEN 'CEN' THEN 'SCOMP'
    WHEN 'BUSA' THEN 'SBUS'
    WHEN 'GRADCSIT' THEN 'GCOMP'
    ELSE code
  END,
  name = CASE code
    WHEN 'CEN' THEN 'School of Computing'
    WHEN 'BUSA' THEN 'School of Business and Informatics'
    WHEN 'GRADCSIT' THEN 'Graduate School of Computing'
    ELSE name
  END
WHERE code IN ('CEN', 'BUSA', 'GRADCSIT');

UPDATE departments
SET name = CASE code
  WHEN 'SCOMP' THEN 'School of Computing'
  WHEN 'SBUS' THEN 'School of Business and Informatics'
  WHEN 'GCOMP' THEN 'Graduate School of Computing'
  ELSE name
END
WHERE code IN ('SCOMP', 'SBUS', 'GCOMP');

UPDATE programs
SET
  code = CASE code
    WHEN 'BSWE' THEN 'UG-SWE'
    WHEN 'BBINF' THEN 'UG-BINF'
    WHEN 'GRAD-MSSE' THEN 'MSC-SWE'
    ELSE code
  END,
  name = CASE code
    WHEN 'BSWE' THEN 'B.Sc. Software Engineering'
    WHEN 'BBINF' THEN 'B.Sc. Business Informatics'
    WHEN 'GRAD-MSSE' THEN 'M.Sc. Software Engineering'
    ELSE name
  END
WHERE code IN ('BSWE', 'BBINF', 'GRAD-MSSE');

UPDATE programs
SET name = CASE code
  WHEN 'UG-SWE' THEN 'B.Sc. Software Engineering'
  WHEN 'UG-BINF' THEN 'B.Sc. Business Informatics'
  WHEN 'MSC-SWE' THEN 'M.Sc. Software Engineering'
  ELSE name
END
WHERE code IN ('UG-SWE', 'UG-BINF', 'MSC-SWE');

UPDATE courses
SET code = CASE code
  WHEN 'CEN 105' THEN 'SWE101'
  WHEN 'CEN 109' THEN 'SWE102'
  WHEN 'ENG 103' THEN 'SWE103'
  WHEN 'MTH 101' THEN 'SWE104'
  WHEN 'PHY 101' THEN 'SWE105'
  WHEN 'CEN 110' THEN 'SWE106'
  WHEN 'ENG 104' THEN 'SWE107'
  WHEN 'MTH 102' THEN 'SWE108'
  WHEN 'MTH 106' THEN 'SWE109'
  WHEN 'SWE 101' THEN 'SWE110'
  WHEN 'CEN 203' THEN 'SWE201'
  WHEN 'CEN 215' THEN 'SWE202'
  WHEN 'CEN 219' THEN 'SWE203'
  WHEN 'MTH 207' THEN 'SWE204'
  WHEN 'CEN 206' THEN 'SWE205'
  WHEN 'CEN 311' THEN 'SWE206'
  WHEN 'SWE 202' THEN 'SWE207'
  WHEN 'SWE 211' THEN 'SWE208'
  WHEN 'CEN 307' THEN 'SWE301'
  WHEN 'SWE 303' THEN 'SWE302'
  WHEN 'CEN 308' THEN 'SWE303'
  WHEN 'CEN 390' THEN 'SWE304'
  WHEN 'SWE 302' THEN 'SWE305'
  WHEN 'CEN 352' THEN 'SWEE01'
  WHEN 'CEN 380' THEN 'SWEE02'
  WHEN 'BINF 101' THEN 'BIN101'
  WHEN 'BUS 101' THEN 'BIN102'
  WHEN 'BUS 103' THEN 'BIN103'
  WHEN 'CEN 111' THEN 'BIN104'
  WHEN 'ECO 101' THEN 'BIN105'
  WHEN 'ENG 109' THEN 'BIN106'
  WHEN 'BUS 102' THEN 'BIN107'
  WHEN 'BUS 108' THEN 'BIN108'
  WHEN 'BUS 112' THEN 'BIN109'
  WHEN 'BUS 132' THEN 'BIN110'
  WHEN 'CEN 114' THEN 'BIN111'
  WHEN 'ECO 102' THEN 'BIN112'
  WHEN 'BINF 251' THEN 'BIN201'
  WHEN 'BUS 201' THEN 'BIN202'
  WHEN 'BUS 205' THEN 'BIN203'
  WHEN 'CEN 213' THEN 'BIN204'
  WHEN 'BUS 202' THEN 'BIN205'
  WHEN 'BUS 226' THEN 'BIN206'
  WHEN 'CEN 254' THEN 'BIN207'
  WHEN 'CEN 361' THEN 'BIN208'
  WHEN 'BINF 202' THEN 'BINE01'
  WHEN 'BAF 233' THEN 'BIN301'
  WHEN 'BUS 309' THEN 'BIN302'
  WHEN 'BUS 321' THEN 'BIN303'
  WHEN 'BINF 303' THEN 'BINE02'
  WHEN 'BINF 311' THEN 'BINE03'
  WHEN 'BUS 324' THEN 'BIN304'
  WHEN 'CEN 302' THEN 'BIN305'
  WHEN 'CEN 318' THEN 'BIN306'
  WHEN 'BINF 312' THEN 'BINE04'
  WHEN 'INF401' THEN 'MSE401'
  WHEN 'MTH401' THEN 'MSE402'
  WHEN 'INF402' THEN 'MSE403'
  WHEN 'AI401' THEN 'MSEE01'
  WHEN 'INF403' THEN 'MSE404'
  WHEN 'SWE401' THEN 'MSE405'
  WHEN 'INF404' THEN 'MSE406'
  WHEN 'SWE402' THEN 'MSE407'
  WHEN 'COM502' THEN 'MSE501'
  WHEN 'BUS561' THEN 'MSE502'
  WHEN 'COM402' THEN 'MSE503'
  WHEN 'AI404' THEN 'MSEE02'
  WHEN 'COM403' THEN 'MSEE03'
  WHEN 'COM401' THEN 'MSEE04'
  WHEN 'INF406' THEN 'MSEE05'
  WHEN 'INF407' THEN 'MSEE06'
  WHEN 'INF408' THEN 'MSEE07'
  WHEN 'SWE590' THEN 'MSE590'
  WHEN 'SWE591' THEN 'MSE591'
  ELSE code
END
WHERE code IN (
  'CEN 105','CEN 109','ENG 103','MTH 101','PHY 101','CEN 110','ENG 104','MTH 102','MTH 106','SWE 101',
  'CEN 203','CEN 215','CEN 219','MTH 207','CEN 206','CEN 311','SWE 202','SWE 211','CEN 307','SWE 303',
  'CEN 308','CEN 390','SWE 302','CEN 352','CEN 380','BINF 101','BUS 101','BUS 103','CEN 111','ECO 101',
  'ENG 109','BUS 102','BUS 108','BUS 112','BUS 132','CEN 114','ECO 102','BINF 251','BUS 201','BUS 205',
  'CEN 213','BUS 202','BUS 226','CEN 254','CEN 361','BINF 202','BAF 233','BUS 309','BUS 321','BINF 303',
  'BINF 311','BUS 324','CEN 302','CEN 318','BINF 312','INF401','MTH401','INF402','AI401','INF403',
  'SWE401','INF404','SWE402','COM502','BUS561','COM402','AI404','COM403','COM401','INF406','INF407',
  'INF408','SWE590','SWE591'
);


-- ============================================================================
-- Source: backend\database\mysql\08_migrate_rbac_roles.sql
-- ============================================================================

USE cis;

START TRANSACTION;

-- Legacy admin accounts were previously the only broad staff role.
-- Migrate them to System Admin so existing deployments keep management access,
-- then provision or reassign Academic/Finance/Communication roles as needed.
UPDATE roles
SET
  code = 'Student',
  name = 'Student',
  description = 'Accesses personal academic and financial information and self-service student workflows.',
  updated_at = CURRENT_TIMESTAMP
WHERE code = 'student';

UPDATE roles
SET
  code = 'Instructor',
  name = 'Instructor',
  description = 'Manages teaching workflows for assigned course offerings and students.',
  updated_at = CURRENT_TIMESTAMP
WHERE code = 'teacher';

UPDATE roles
SET
  code = 'System Admin',
  name = 'System Admin',
  description = 'Manages users, roles, settings, reports, and overall system oversight.',
  updated_at = CURRENT_TIMESTAMP
WHERE code = 'admin';

INSERT INTO roles (code, name, description, is_system)
VALUES
  ('Student', 'Student', 'Accesses personal academic and financial information and self-service student workflows.', TRUE),
  ('Instructor', 'Instructor', 'Manages teaching workflows for assigned course offerings and students.', TRUE),
  ('Academic Staff', 'Academic Staff', 'Handles academic administration, registration, scheduling, and academic records.', TRUE),
  ('Finance Staff', 'Finance Staff', 'Manages tuition, manual invoices, payment records, and finance records.', TRUE),
  ('Communication Staff', 'Communication Staff', 'Manages announcements, events, media, and public communication content.', TRUE),
  ('System Admin', 'System Admin', 'Manages users, roles, settings, reports, and overall system oversight.', TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  is_system = VALUES(is_system),
  updated_at = CURRENT_TIMESTAMP;

DELETE rp
FROM role_permissions rp
JOIN permissions p ON p.id = rp.permission_id
WHERE p.code LIKE 'students.%'
   OR p.code LIKE 'teachers.%'
   OR p.code LIKE 'admins.%'
   OR p.code IN (
     'profile.view.self',
     'profile.edit.self',
     'students.self_service',
     'instructors.workspace',
     'instructors.timetable.view',
     'announcements.manage.instructor',
     'academic.dashboard.view',
     'academic.records.manage',
     'academic.grades.manage',
     'academic.attendance.manage',
     'academic.courses.manage',
     'academic.terms.manage',
     'academic.registrations.manage',
     'academic.schedule.manage',
     'academic.exams.manage',
     'finance.dashboard.view',
     'finance.records.manage',
     'communications.dashboard.view',
     'announcements.manage',
     'events.manage',
     'announcements.media.upload',
     'notifications.send',
     'reports.view',
     'users.manage',
     'roles.manage',
     'settings.manage',
     'system.overview.view'
   );

DELETE FROM permissions
WHERE code LIKE 'students.%'
   OR code LIKE 'teachers.%'
   OR code LIKE 'admins.%';

INSERT INTO permissions (code, name, description, resource, action)
VALUES
  ('profile.view.self', 'View Own Profile', 'Allows a user to view their own CIS profile.', 'profile', 'view_self'),
  ('profile.edit.self', 'Edit Own Profile', 'Allows a user to update their own CIS profile.', 'profile', 'edit_self'),
  ('students.self_service', 'Student Self-Service Workspace', 'Allows a student to use their academic, registration, finance, inbox, club, and chatbot workspace.', 'students', 'self_service'),
  ('instructors.workspace', 'Instructor Workspace', 'Allows an instructor to manage assigned courses, grades, attendance, and inbox items.', 'instructors', 'workspace'),
  ('instructors.timetable.view', 'View Instructor Timetable', 'Allows an instructor to view their assigned timetable.', 'instructors', 'view_timetable'),
  ('announcements.manage.instructor', 'Manage Course Announcements', 'Allows an instructor to create and update course-related announcements.', 'announcements', 'manage_instructor'),
  ('academic.dashboard.view', 'View Academic Dashboard', 'Allows academic staff to view academic administration dashboards.', 'academic', 'view_dashboard'),
  ('academic.records.manage', 'Manage Academic Records', 'Allows academic staff to manage student academic records and roster visibility.', 'academic_records', 'manage'),
  ('academic.grades.manage', 'Manage Grades', 'Allows academic staff to edit grades across academic workflows.', 'grades', 'manage'),
  ('academic.attendance.manage', 'Manage Attendance', 'Allows academic staff to record and update attendance across academic workflows.', 'attendance', 'manage'),
  ('academic.courses.manage', 'Manage Course Catalog and Offerings', 'Allows academic staff to manage course catalog and semester offerings.', 'courses', 'manage'),
  ('academic.terms.manage', 'Manage Terms', 'Allows academic staff to manage semesters, exam periods, and registration windows.', 'academic_terms', 'manage'),
  ('academic.registrations.manage', 'Manage Registrations', 'Allows academic staff to manage course registrations and enrollment statuses.', 'registrations', 'manage'),
  ('academic.schedule.manage', 'Manage Scheduling', 'Allows academic staff to manage timetables and scheduling workflows.', 'scheduling', 'manage'),
  ('academic.exams.manage', 'Manage Exam Scheduling', 'Allows academic staff to manage exam schedules.', 'exams', 'manage'),
  ('finance.dashboard.view', 'View Finance Dashboard', 'Allows finance staff to view finance dashboards and reports.', 'finance', 'view_dashboard'),
  ('finance.records.manage', 'Manage Finance Records', 'Allows finance staff to manage manual invoices, payment records, and holds.', 'finance', 'manage'),
  ('communications.dashboard.view', 'View Communications Dashboard', 'Allows staff to view announcement and event management dashboards.', 'communications', 'view_dashboard'),
  ('announcements.manage', 'Manage Announcements', 'Allows staff to create and update announcements and news items.', 'announcements', 'manage'),
  ('events.manage', 'Manage Events', 'Allows staff to create and update campus events and related club workflows.', 'events', 'manage'),
  ('announcements.media.upload', 'Upload Announcement Media', 'Allows staff to manage media assets used in public communications.', 'media', 'upload'),
  ('notifications.send', 'Send Notifications', 'Allows staff to issue notifications to relevant users.', 'notifications', 'send'),
  ('reports.view', 'View Reports', 'Allows access to dashboard and reporting summaries.', 'reports', 'view'),
  ('users.manage', 'Manage Users', 'Allows a System Admin to create and manage user accounts.', 'users', 'manage'),
  ('roles.manage', 'Manage Roles', 'Allows a System Admin to change role assignments.', 'roles', 'manage'),
  ('settings.manage', 'Manage Settings', 'Allows a System Admin to manage system settings.', 'settings', 'manage'),
  ('system.overview.view', 'View System Overview', 'Allows a System Admin to view global system dashboards.', 'system', 'view_overview')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  resource = VALUES(resource),
  action = VALUES(action);

DELETE rp
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
WHERE r.code IN ('Student', 'Instructor', 'Academic Staff', 'Finance Staff', 'Communication Staff', 'System Admin');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
  ON (
    (r.code = 'Student' AND p.code IN (
      'profile.view.self',
      'profile.edit.self',
      'students.self_service',
      'reports.view'
    ))
    OR
    (r.code = 'Instructor' AND p.code IN (
      'profile.view.self',
      'profile.edit.self',
      'instructors.workspace',
      'instructors.timetable.view',
      'announcements.manage.instructor',
      'notifications.send',
      'reports.view'
    ))
    OR
    (r.code = 'Academic Staff' AND p.code IN (
      'profile.view.self',
      'profile.edit.self',
      'academic.dashboard.view',
      'academic.records.manage',
      'academic.grades.manage',
      'academic.attendance.manage',
      'academic.courses.manage',
      'academic.terms.manage',
      'academic.registrations.manage',
      'academic.schedule.manage',
      'academic.exams.manage',
      'communications.dashboard.view',
      'announcements.manage',
      'events.manage',
      'announcements.media.upload',
      'notifications.send',
      'reports.view'
    ))
    OR
    (r.code = 'Finance Staff' AND p.code IN (
      'profile.view.self',
      'profile.edit.self',
      'finance.dashboard.view',
      'finance.records.manage',
      'notifications.send',
      'reports.view'
    ))
    OR
    (r.code = 'Communication Staff' AND p.code IN (
      'profile.view.self',
      'profile.edit.self',
      'communications.dashboard.view',
      'announcements.manage',
      'events.manage',
      'announcements.media.upload',
      'notifications.send',
      'reports.view'
    ))
    OR
    (r.code = 'System Admin' AND p.code IN (
      'profile.view.self',
      'profile.edit.self',
      'system.overview.view',
      'academic.dashboard.view',
      'academic.records.manage',
      'academic.courses.manage',
      'academic.terms.manage',
      'academic.registrations.manage',
      'academic.schedule.manage',
      'academic.exams.manage',
      'finance.dashboard.view',
      'finance.records.manage',
      'communications.dashboard.view',
      'announcements.manage',
      'events.manage',
      'announcements.media.upload',
      'notifications.send',
      'reports.view',
      'users.manage',
      'roles.manage',
      'settings.manage'
    ))
  )
ON DUPLICATE KEY UPDATE
  granted_at = granted_at;

COMMIT;

-- ============================================================================
-- Source: backend\database\mysql\09_seed_demo_users.sql
-- ============================================================================

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
  ('student.one@campus.example', '$pbkdf2-sha256$29000$cO4dIySklFLKWYtx7r03Rg$yNmWBgJARJKCg9867vukVJhejm4FFrh.G37BAUDGVSg', 'Student', 'One', '+1 555 0101', 'active', FALSE, 'api_seed', CURRENT_TIMESTAMP),
  ('student.two@campus.example', '$pbkdf2-sha256$29000$cO4dIySklFLKWYtx7r03Rg$yNmWBgJARJKCg9867vukVJhejm4FFrh.G37BAUDGVSg', 'Student', 'Two', '+1 555 0102', 'active', FALSE, 'api_seed', CURRENT_TIMESTAMP),
  ('instructor.demo@campus.example', '$pbkdf2-sha256$29000$yRmDcI5x7v0/Z4wRgtBayw$tTyZdbKrbZPwMGrezWsZtIev2tmUtl1KIr4eBEiRuag', 'Instructor', 'Demo', '+1 555 0201', 'active', FALSE, 'api_seed', CURRENT_TIMESTAMP),
  ('academic.staff@campus.example', '$pbkdf2-sha256$29000$Y0xJyVlLCYFQCoFwDgFgTA$wy1b8jCRtOHeTB.wLqwewWbXisEiGwcRhiAc7wo94NE', 'Academic', 'Staff', '+1 555 0301', 'active', FALSE, 'api_seed', CURRENT_TIMESTAMP),
  ('finance.staff@campus.example', '$pbkdf2-sha256$29000$9f7fu9d67z0HYKw1Rugdgw$c09IAu5JrMpEonA94.tzAHxda7fdwUUD/wwCsNBF.58', 'Finance', 'Staff', '+1 555 0401', 'active', FALSE, 'api_seed', CURRENT_TIMESTAMP),
  ('communications.staff@campus.example', '$pbkdf2-sha256$29000$nZPynlNqDWEs5dybk/Ieww$3Qoh3dc1c475gEPAIytu9VNlGzuh5HFdaWy6a7tFQ1M', 'Communication', 'Staff', '+1 555 0501', 'active', FALSE, 'api_seed', CURRENT_TIMESTAMP),
  ('sysadmin.primary@campus.example', '$pbkdf2-sha256$29000$TSklhDAmBABgzFmrdQ4hBA$yx0FovUqPJxPKu6l6lTMTalfoZZGLw.wnCYVaHXwSNo', 'System', 'Admin', '+1 555 0601', 'active', FALSE, 'api_seed', CURRENT_TIMESTAMP),
  ('sysadmin.backup@campus.example', '$pbkdf2-sha256$29000$TSklhDAmBABgzFmrdQ4hBA$yx0FovUqPJxPKu6l6lTMTalfoZZGLw.wnCYVaHXwSNo', 'System', 'Admin', '+1 555 0602', 'active', FALSE, 'api_seed', CURRENT_TIMESTAMP)
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

SET @student_one_user_id = (SELECT id FROM users WHERE email = 'student.one@campus.example');
SET @student_two_user_id = (SELECT id FROM users WHERE email = 'student.two@campus.example');
SET @instructor_user_id = (SELECT id FROM users WHERE email = 'instructor.demo@campus.example');
SET @academic_staff_user_id = (SELECT id FROM users WHERE email = 'academic.staff@campus.example');
SET @finance_staff_user_id = (SELECT id FROM users WHERE email = 'finance.staff@campus.example');
SET @communications_staff_user_id = (SELECT id FROM users WHERE email = 'communications.staff@campus.example');
SET @sys_admin_primary_user_id = (SELECT id FROM users WHERE email = 'sysadmin.primary@campus.example');
SET @sys_admin_backup_user_id = (SELECT id FROM users WHERE email = 'sysadmin.backup@campus.example');

DELETE FROM user_roles
WHERE user_id IN (@student_one_user_id, @student_two_user_id, @instructor_user_id, @academic_staff_user_id, @finance_staff_user_id, @communications_staff_user_id, @sys_admin_primary_user_id, @sys_admin_backup_user_id);

INSERT INTO user_roles (user_id, role_id, is_primary, assigned_at)
SELECT @student_one_user_id, id, TRUE, CURRENT_TIMESTAMP FROM roles WHERE code = 'Student'
UNION ALL
SELECT @student_two_user_id, id, TRUE, CURRENT_TIMESTAMP FROM roles WHERE code = 'Student'
UNION ALL
SELECT @instructor_user_id, id, TRUE, CURRENT_TIMESTAMP FROM roles WHERE code = 'Instructor'
UNION ALL
SELECT @academic_staff_user_id, id, TRUE, CURRENT_TIMESTAMP FROM roles WHERE code = 'Academic Staff'
UNION ALL
SELECT @finance_staff_user_id, id, TRUE, CURRENT_TIMESTAMP FROM roles WHERE code = 'Finance Staff'
UNION ALL
SELECT @communications_staff_user_id, id, TRUE, CURRENT_TIMESTAMP FROM roles WHERE code = 'Communication Staff'
UNION ALL
SELECT @sys_admin_primary_user_id, id, TRUE, CURRENT_TIMESTAMP FROM roles WHERE code = 'System Admin'
UNION ALL
SELECT @sys_admin_backup_user_id, id, TRUE, CURRENT_TIMESTAMP FROM roles WHERE code = 'System Admin';

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
  (@student_one_user_id, '2026-STU-0001', @cs_department_id, @bscs_program_id, '2024-09-01', '2028-06-15', 4, 3.62, 54, 'active', '12 Innovation Avenue', 'Berlin', 'Berlin', '10115', 'Germany'),
  (@student_two_user_id, '2026-STU-0002', @cs_department_id, @bscs_program_id, '2024-09-01', '2028-06-15', 4, 3.18, 51, 'active', '44 Campus Square', 'Berlin', 'Berlin', '10117', 'Germany')
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
  (@instructor_user_id, 'INS-0001', @cs_department_id, 'Senior Lecturer', '2022-08-15', 'active', 'Databases and applied software engineering', 'Engineering Hall 3.12')
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
  (@academic_staff_user_id, 'ACS-0001', 'Registrar Officer', 'Administration Block 2.01', 'active'),
  (@finance_staff_user_id, 'FIN-0001', 'Finance Officer', 'Administration Block 1.14', 'active'),
  (@communications_staff_user_id, 'COM-0001', 'Communications Officer', 'Student Affairs Studio', 'active'),
  (@sys_admin_primary_user_id, 'SYS-0001', 'System Administrator', 'Administration Block 3.02', 'active'),
  (@sys_admin_backup_user_id, 'SYS-0002', 'System Administrator', 'Administration Block 3.03', 'active')
ON DUPLICATE KEY UPDATE
  employee_number = VALUES(employee_number),
  title = VALUES(title),
  office_location = VALUES(office_location),
  employment_status = VALUES(employment_status);

SET @student_one_student_id = (SELECT id FROM student_profiles WHERE user_id = @student_one_user_id);
SET @student_two_student_id = (SELECT id FROM student_profiles WHERE user_id = @student_two_user_id);
SET @instructor_teacher_id = (SELECT id FROM teacher_profiles WHERE user_id = @instructor_user_id);
SET @academic_staff_admin_id = (SELECT id FROM admin_profiles WHERE user_id = @academic_staff_user_id);
SET @finance_staff_admin_id = (SELECT id FROM admin_profiles WHERE user_id = @finance_staff_user_id);
SET @communications_staff_admin_id = (SELECT id FROM admin_profiles WHERE user_id = @communications_staff_user_id);
SET @sys_admin_primary_admin_id = (SELECT id FROM admin_profiles WHERE user_id = @sys_admin_primary_user_id);
SET @sys_admin_backup_admin_id = (SELECT id FROM admin_profiles WHERE user_id = @sys_admin_backup_user_id);

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
SET teacher_id = @instructor_teacher_id
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
  (@student_one_student_id, @cs201_offering_id, 'enrolled', '2026-01-08 10:00:00', '2026-01-08 10:30:00', @academic_staff_user_id),
  (@student_one_student_id, @cs220_offering_id, 'enrolled', '2026-01-08 10:05:00', '2026-01-08 10:35:00', @academic_staff_user_id),
  (@student_one_student_id, @math301_offering_id, 'enrolled', '2026-01-08 10:10:00', '2026-01-08 10:40:00', @academic_staff_user_id),
  (@student_two_student_id, @cs201_offering_id, 'enrolled', '2026-01-08 10:12:00', '2026-01-08 10:42:00', @academic_staff_user_id)
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
  (@student_one_student_id, @spring_term_id, 4, 10, 0, 3.74, 3.62, 'good'),
  (@student_two_student_id, @spring_term_id, 4, 3, 0, 3.12, 3.18, 'good')
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
  @instructor_teacher_id
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
  (@cs201_attendance_session_id, @student_one_student_id, 'present', 'On time', @instructor_teacher_id, '2026-02-16 10:35:00'),
  (@cs201_attendance_session_id, @student_two_student_id, 'late', 'Arrived after the warm-up quiz', @instructor_teacher_id, '2026-02-16 10:35:00')
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
  (@cs201_midterm_component_id, @student_one_student_id, 88.00, 88.00, 'B+', 'Strong performance', @instructor_teacher_id, '2026-03-16 12:00:00', '2026-03-16 12:00:00'),
  (@cs201_midterm_component_id, @student_two_student_id, 74.00, 74.00, 'C', 'Needs more practice with recursion', @instructor_teacher_id, '2026-03-16 12:00:00', '2026-03-16 12:00:00')
ON DUPLICATE KEY UPDATE
  score_awarded = VALUES(score_awarded),
  percentage = VALUES(percentage),
  letter_grade = VALUES(letter_grade),
  remarks = VALUES(remarks),
  graded_by_teacher_id = VALUES(graded_by_teacher_id),
  graded_at = VALUES(graded_at),
  published_at = VALUES(published_at);

SET @student_one_cs201_enrollment_id = (
  SELECT id FROM enrollments
  WHERE student_id = @student_one_student_id AND course_offering_id = @cs201_offering_id
  LIMIT 1
);
SET @student_two_cs201_enrollment_id = (
  SELECT id FROM enrollments
  WHERE student_id = @student_two_student_id AND course_offering_id = @cs201_offering_id
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
  (@student_one_cs201_enrollment_id, 89.00, 'B+', 3.30, 'published', '2026-03-20 11:00:00', @instructor_teacher_id),
  (@student_two_cs201_enrollment_id, 76.00, 'C+', 2.30, 'published', '2026-03-20 11:00:00', @instructor_teacher_id)
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
    WHEN id = @student_one_cs201_enrollment_id THEN 89.00
    WHEN id = @student_two_cs201_enrollment_id THEN 76.00
    ELSE final_numeric_grade
  END,
  final_letter_grade = CASE
    WHEN id = @student_one_cs201_enrollment_id THEN 'B+'
    WHEN id = @student_two_cs201_enrollment_id THEN 'C+'
    ELSE final_letter_grade
  END,
  grade_points = CASE
    WHEN id = @student_one_cs201_enrollment_id THEN 3.30
    WHEN id = @student_two_cs201_enrollment_id THEN 2.30
    ELSE grade_points
  END
WHERE id IN (@student_one_cs201_enrollment_id, @student_two_cs201_enrollment_id);

DELETE FROM student_risk_assessments
WHERE student_id IN (@student_one_student_id, @student_two_student_id)
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
  (@student_one_student_id, @spring_term_id, 'low', 18.00, 'Consistent attendance and strong midterm score.', @academic_staff_user_id, '2026-03-21 09:00:00'),
  (@student_two_student_id, @spring_term_id, 'medium', 42.00, 'Attendance and coursework follow-up needed for CS201.', @academic_staff_user_id, '2026-03-21 09:00:00');
DELETE FROM student_recommendations
WHERE student_id = @student_one_student_id
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
  @student_one_student_id,
  @spring_term_id,
  c.id,
  'Recommended as the next AI-focused course after completing AI Foundations.',
  1,
  'suggested',
  @academic_staff_user_id
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
  (@student_one_student_id, @spring_term_id, 'INV-2026-9001', '2026-01-10', '2026-02-10', 'USD', 1500.00, 0.00, 0.00, 1500.00, 500.00, 'partially_paid', 'Spring tuition demo invoice.', @finance_staff_admin_id)
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

SET @student_one_invoice_id = (SELECT id FROM student_invoices WHERE invoice_number = 'INV-2026-9001' LIMIT 1);

DELETE FROM invoice_items
WHERE invoice_id = @student_one_invoice_id
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
  @student_one_invoice_id,
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
  (@student_one_student_id, 'PAY-2026-9001', 'bank_transfer', 1000.00, 'USD', '2026-01-28 13:30:00', 'confirmed', @finance_staff_admin_id, 'Partial tuition payment received.')
ON DUPLICATE KEY UPDATE
  payment_method = VALUES(payment_method),
  amount = VALUES(amount),
  currency = VALUES(currency),
  paid_at = VALUES(paid_at),
  status = VALUES(status),
  received_by_admin_id = VALUES(received_by_admin_id),
  notes = VALUES(notes);

SET @student_one_payment_id = (SELECT id FROM payments WHERE reference_number = 'PAY-2026-9001' LIMIT 1);

INSERT INTO payment_allocations (payment_id, invoice_id, amount_applied)
VALUES (@student_one_payment_id, @student_one_invoice_id, 1000.00)
ON DUPLICATE KEY UPDATE
  amount_applied = VALUES(amount_applied);

DELETE FROM financial_holds
WHERE student_id = @student_two_student_id
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
  (@student_two_student_id, 'finance', 'Payment verification pending for spring balance', 'active', '2026-02-05 09:15:00', @finance_staff_admin_id);

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
    @academic_staff_user_id,
    @academic_staff_user_id
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
    @communications_staff_user_id,
    @communications_staff_user_id
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
  @communications_staff_user_id
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
    @student_one_cs201_enrollment_id,
    @academic_staff_user_id
  ),
  (
    'finance',
    'warning',
    'Finance reminder for tuition balance',
    'A remaining tuition balance of 500.00 USD is due for Spring 2026. Contact Finance Staff if you need a payment plan review.',
    'Open finance',
    '/student/finance',
    'student_invoice',
    @student_one_invoice_id,
    @finance_staff_user_id
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
    @academic_staff_user_id
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
  (@registration_notification_id, @student_one_user_id, '2026-01-12 09:00:00'),
  (@finance_notification_id, @student_one_user_id, '2026-01-28 14:00:00'),
  (@teaching_notification_id, @instructor_user_id, '2026-01-09 09:00:00')
ON DUPLICATE KEY UPDATE
  delivered_at = VALUES(delivered_at),
  archived_at = NULL;

COMMIT;

