-- =============================================================
-- Campus Information System — MySQL Schema
-- =============================================================

CREATE DATABASE IF NOT EXISTS CampusIS CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE CampusIS;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS ai_chat_messages, ai_chat_sessions, password_reset_tokens,
    audit_logs, announcements, notifications, holds, payments, invoices,
    attendance_records, attendance_sessions, grades, registrations,
    offerings, semesters, courses, instructors, students, programs,
    departments, users;
SET FOREIGN_KEY_CHECKS = 1;

-- -------------------------------------------------------------
-- USERS
-- -------------------------------------------------------------
CREATE TABLE users (
    id             INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    email          VARCHAR(255)    NOT NULL,
    password_hash  VARCHAR(512)    NOT NULL,
    role           VARCHAR(50)     NOT NULL,
    is_first_login BOOLEAN         NOT NULL DEFAULT TRUE,
    is_active      BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    CONSTRAINT chk_users_role CHECK (role IN ('student','instructor','academic_staff','finance_staff','system_admin'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- DEPARTMENTS & PROGRAMS
-- -------------------------------------------------------------
CREATE TABLE departments (
    id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(20)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_departments_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE programs (
    id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name               VARCHAR(150) NOT NULL,
    code               VARCHAR(20)  NOT NULL,
    department_id      INT UNSIGNED NOT NULL,
    total_credits      INT          NOT NULL,
    duration_semesters INT          NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_programs_code (code),
    CONSTRAINT fk_programs_dept FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- STUDENTS
-- -------------------------------------------------------------
CREATE TABLE students (
    id               INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    user_id          INT UNSIGNED   NOT NULL,
    student_code     VARCHAR(30)    NOT NULL,
    first_name       VARCHAR(100)   NOT NULL,
    last_name        VARCHAR(100)   NOT NULL,
    phone            VARCHAR(30)    NULL,
    date_of_birth    DATE           NULL,
    program_id       INT UNSIGNED   NOT NULL,
    current_semester INT            NOT NULL DEFAULT 1,
    gpa              DECIMAL(4,2)   NOT NULL DEFAULT 0.00,
    status           VARCHAR(30)    NOT NULL DEFAULT 'active',
    PRIMARY KEY (id),
    UNIQUE KEY uq_students_user (user_id),
    UNIQUE KEY uq_students_code (student_code),
    CONSTRAINT fk_students_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_students_program FOREIGN KEY (program_id) REFERENCES programs(id),
    CONSTRAINT chk_students_status CHECK (status IN ('active','probation','suspended','graduated','withdrawn'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- INSTRUCTORS
-- -------------------------------------------------------------
CREATE TABLE instructors (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id       INT UNSIGNED NOT NULL,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    title         VARCHAR(50)  NULL,
    department_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_instructors_user (user_id),
    CONSTRAINT fk_instructors_user FOREIGN KEY (user_id)       REFERENCES users(id)       ON DELETE CASCADE,
    CONSTRAINT fk_instructors_dept FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- COURSES
-- -------------------------------------------------------------
CREATE TABLE courses (
    id                     INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    code                   VARCHAR(20)   NOT NULL,
    name                   VARCHAR(200)  NOT NULL,
    description            TEXT          NULL,
    credits                INT           NOT NULL,
    department_id          INT UNSIGNED  NOT NULL,
    prerequisite_course_id INT UNSIGNED  NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_courses_code (code),
    CONSTRAINT fk_courses_dept    FOREIGN KEY (department_id)          REFERENCES departments(id),
    CONSTRAINT fk_courses_prereq  FOREIGN KEY (prerequisite_course_id) REFERENCES courses(id),
    CONSTRAINT chk_courses_credits CHECK (credits > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- SEMESTERS
-- -------------------------------------------------------------
CREATE TABLE semesters (
    id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name                  VARCHAR(100) NOT NULL,
    start_date            DATE         NOT NULL,
    end_date              DATE         NOT NULL,
    is_active             BOOLEAN      NOT NULL DEFAULT FALSE,
    registration_deadline DATE         NOT NULL,
    drop_deadline         DATE         NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT chk_semester_dates CHECK (end_date > start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- OFFERINGS
-- -------------------------------------------------------------
CREATE TABLE offerings (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    course_id     INT UNSIGNED NOT NULL,
    instructor_id INT UNSIGNED NOT NULL,
    semester_id   INT UNSIGNED NOT NULL,
    room          VARCHAR(50)  NULL,
    schedule      VARCHAR(200) NULL,
    capacity      INT          NOT NULL,
    enrolled      INT          NOT NULL DEFAULT 0,
    status        VARCHAR(30)  NOT NULL DEFAULT 'active',
    PRIMARY KEY (id),
    UNIQUE KEY uq_offering (course_id, semester_id, instructor_id),
    CONSTRAINT fk_offerings_course      FOREIGN KEY (course_id)     REFERENCES courses(id),
    CONSTRAINT fk_offerings_instructor  FOREIGN KEY (instructor_id) REFERENCES instructors(id),
    CONSTRAINT fk_offerings_semester    FOREIGN KEY (semester_id)   REFERENCES semesters(id),
    CONSTRAINT chk_offerings_capacity   CHECK (capacity > 0),
    CONSTRAINT chk_offerings_enrolled   CHECK (enrolled >= 0),
    CONSTRAINT chk_offerings_status     CHECK (status IN ('active','full','cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- REGISTRATIONS
-- -------------------------------------------------------------
CREATE TABLE registrations (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id    INT UNSIGNED NOT NULL,
    offering_id   INT UNSIGNED NOT NULL,
    registered_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status        VARCHAR(30)  NOT NULL DEFAULT 'active',
    PRIMARY KEY (id),
    UNIQUE KEY uq_registration (student_id, offering_id),
    CONSTRAINT fk_reg_student  FOREIGN KEY (student_id)  REFERENCES students(id),
    CONSTRAINT fk_reg_offering FOREIGN KEY (offering_id) REFERENCES offerings(id),
    CONSTRAINT chk_reg_status  CHECK (status IN ('active','dropped','completed','failed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- GRADES
-- -------------------------------------------------------------
CREATE TABLE grades (
    id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    registration_id  INT UNSIGNED  NOT NULL,
    midterm_score    DECIMAL(5,2)  NULL,
    assignment_score DECIMAL(5,2)  NULL,
    final_score      DECIMAL(5,2)  NULL,
    total_score      DECIMAL(5,2)  NULL,
    letter_grade     VARCHAR(3)    NULL,
    is_published     BOOLEAN       NOT NULL DEFAULT FALSE,
    updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_grades_registration (registration_id),
    CONSTRAINT fk_grades_reg FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- ATTENDANCE
-- -------------------------------------------------------------
CREATE TABLE attendance_sessions (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    offering_id  INT UNSIGNED NOT NULL,
    session_date DATE         NOT NULL,
    topic        VARCHAR(255) NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_att_session_offering FOREIGN KEY (offering_id) REFERENCES offerings(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attendance_records (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    status     VARCHAR(20)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_attendance (session_id, student_id),
    CONSTRAINT fk_att_record_session FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_att_record_student FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT chk_att_status CHECK (status IN ('present','absent','late'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- FINANCE
-- -------------------------------------------------------------
CREATE TABLE invoices (
    id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    student_id  INT UNSIGNED  NOT NULL,
    semester_id INT UNSIGNED  NOT NULL,
    description VARCHAR(255)  NOT NULL,
    amount      DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
    due_date    DATE          NOT NULL,
    status      VARCHAR(30)   NOT NULL DEFAULT 'pending',
    issued_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_inv_student  FOREIGN KEY (student_id)  REFERENCES students(id),
    CONSTRAINT fk_inv_semester FOREIGN KEY (semester_id) REFERENCES semesters(id),
    CONSTRAINT chk_inv_status  CHECK (status IN ('pending','partial','paid','overdue'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
    id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    invoice_id  INT UNSIGNED  NOT NULL,
    recorded_by INT UNSIGNED  NOT NULL,
    amount      DECIMAL(10,2) NOT NULL,
    method      VARCHAR(50)   NOT NULL,
    reference   VARCHAR(100)  NULL,
    paid_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_pay_invoice  FOREIGN KEY (invoice_id)  REFERENCES invoices(id),
    CONSTRAINT fk_pay_recorder FOREIGN KEY (recorded_by) REFERENCES users(id),
    CONSTRAINT chk_pay_method  CHECK (method IN ('cash','card','bank_transfer','online'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE holds (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id  INT UNSIGNED NOT NULL,
    invoice_id  INT UNSIGNED NULL,
    reason      VARCHAR(255) NOT NULL,
    effect      VARCHAR(255) NOT NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_by  INT UNSIGNED NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_by INT UNSIGNED NULL,
    resolved_at DATETIME     NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_hold_student  FOREIGN KEY (student_id)  REFERENCES students(id),
    CONSTRAINT fk_hold_invoice  FOREIGN KEY (invoice_id)  REFERENCES invoices(id),
    CONSTRAINT fk_hold_creator  FOREIGN KEY (created_by)  REFERENCES users(id),
    CONSTRAINT fk_hold_resolver FOREIGN KEY (resolved_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- NOTIFICATIONS & ANNOUNCEMENTS
-- -------------------------------------------------------------
CREATE TABLE notifications (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED NOT NULL,
    title      VARCHAR(255) NOT NULL,
    message    TEXT         NOT NULL,
    type       VARCHAR(50)  NOT NULL,
    is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_notif_type CHECK (type IN ('info','warning','success','error'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE announcements (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    created_by   INT UNSIGNED NOT NULL,
    title        VARCHAR(255) NOT NULL,
    content      TEXT         NOT NULL,
    target_role  VARCHAR(50)  NULL,
    published_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_ann_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- AUDIT LOGS
-- -------------------------------------------------------------
CREATE TABLE audit_logs (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED NULL,
    action     VARCHAR(100) NOT NULL,
    entity     VARCHAR(100) NULL,
    entity_id  INT          NULL,
    details    TEXT         NULL,
    ip_address VARCHAR(50)  NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- PASSWORD RESET TOKENS
-- -------------------------------------------------------------
CREATE TABLE password_reset_tokens (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED NOT NULL,
    token      VARCHAR(512) NOT NULL,
    expires_at DATETIME     NOT NULL,
    used_at    DATETIME     NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_prt_token (token),
    CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
