-- =============================================================
-- Campus Information System — MySQL Schema
-- =============================================================

CREATE DATABASE IF NOT EXISTS CampusIS CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE CampusIS;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS ai_chat_messages, ai_chat_sessions, password_reset_tokens,
    email_verification_tokens, audit_logs, announcements, notifications, holds, payments, invoices,
    attendance_records, attendance_sessions, assignment_submissions, assignments, weekly_topics, weekly_tasks, course_materials, class_sessions, grades, student_course_status, student_course_selections, registrations, timetable_entries,
    classrooms, groups, buildings,
    offerings, semesters, course_prerequisites, courses, teacher_faculty_assignments, instructors, staff_faculty_scopes, finance_faculty_scopes, staff_profiles, students, programs,
    departments, faculties, users;
SET FOREIGN_KEY_CHECKS = 1;

-- -------------------------------------------------------------
-- USERS
-- -------------------------------------------------------------
CREATE TABLE users (
    id             INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    email          VARCHAR(255)    NOT NULL,
    full_name      VARCHAR(255)    NULL,
    password_hash  VARCHAR(512)    NOT NULL,
    role           VARCHAR(50)     NOT NULL,
    status         VARCHAR(30)     NOT NULL DEFAULT 'active',
    is_first_login BOOLEAN         NOT NULL DEFAULT TRUE,
    is_active      BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    CONSTRAINT chk_users_role CHECK (role IN ('student','teacher','staff','admin','instructor','academic_staff','finance_staff','system_admin')),
    CONSTRAINT chk_users_status CHECK (status IN ('pending_verification','pending_approval','active','refused'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- DEPARTMENTS & PROGRAMS
-- -------------------------------------------------------------
CREATE TABLE faculties (
    id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(180) NOT NULL,
    code VARCHAR(30)  NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_faculties_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE departments (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name       VARCHAR(150) NOT NULL,
    code       VARCHAR(20)  NOT NULL,
    faculty_id INT UNSIGNED NULL,
    degree_level VARCHAR(20) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_departments_code (code),
    CONSTRAINT fk_departments_faculty FOREIGN KEY (faculty_id) REFERENCES faculties(id)
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

CREATE TABLE staff_profiles (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED NOT NULL,
    faculty_id INT UNSIGNED NULL,
    scope      VARCHAR(20)  NOT NULL DEFAULT 'faculty',
    position   VARCHAR(120) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_staff_profiles_user (user_id),
    CONSTRAINT fk_staff_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_staff_profiles_faculty FOREIGN KEY (faculty_id) REFERENCES faculties(id),
    CONSTRAINT chk_staff_scope CHECK (scope IN ('faculty','multi_faculty','university'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE staff_faculty_scopes (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED NOT NULL,
    faculty_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_staff_faculty_scope (user_id, faculty_id),
    CONSTRAINT fk_staff_scope_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_staff_scope_faculty FOREIGN KEY (faculty_id) REFERENCES faculties(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE finance_faculty_scopes (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED NOT NULL,
    faculty_id INT UNSIGNED NOT NULL,
    scope      VARCHAR(20) NOT NULL DEFAULT 'faculty',
    PRIMARY KEY (id),
    UNIQUE KEY uq_finance_faculty_scope (user_id, faculty_id),
    CONSTRAINT fk_finance_scope_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_finance_scope_faculty FOREIGN KEY (faculty_id) REFERENCES faculties(id),
    CONSTRAINT chk_finance_scope CHECK (scope IN ('faculty','multi_faculty','university'))
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
    degree_level     VARCHAR(20)    NOT NULL DEFAULT 'Bachelor',
    academic_year    VARCHAR(80)    NULL,
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

CREATE TABLE teacher_faculty_assignments (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    teacher_id INT UNSIGNED NOT NULL,
    faculty_id INT UNSIGNED NOT NULL,
    program_id INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_teacher_faculty_program (teacher_id, faculty_id, program_id),
    CONSTRAINT fk_tfa_teacher FOREIGN KEY (teacher_id) REFERENCES instructors(id) ON DELETE CASCADE,
    CONSTRAINT fk_tfa_faculty FOREIGN KEY (faculty_id) REFERENCES faculties(id),
    CONSTRAINT fk_tfa_program FOREIGN KEY (program_id) REFERENCES programs(id)
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

CREATE TABLE course_prerequisites (
    id                     INT UNSIGNED NOT NULL AUTO_INCREMENT,
    course_id              INT UNSIGNED NOT NULL,
    prerequisite_course_id INT UNSIGNED NOT NULL,
    created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_course_prerequisite (course_id, prerequisite_course_id),
    CONSTRAINT fk_cp_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_cp_prerequisite FOREIGN KEY (prerequisite_course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- SEMESTERS
-- -------------------------------------------------------------
CREATE TABLE semesters (
    id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name                  VARCHAR(100) NOT NULL,
    start_date            DATE         NOT NULL,
    end_date              DATE         NOT NULL,
    total_weeks           INT          NOT NULL DEFAULT 14,
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
    program_id    INT UNSIGNED NULL,
    faculty_id    INT UNSIGNED NULL,
    created_by_staff_id INT UNSIGNED NULL,
    academic_year VARCHAR(80) NULL,
    group_name    VARCHAR(80) NULL,
    academic_period VARCHAR(80) NULL,
    room          VARCHAR(50)  NULL,
    schedule      VARCHAR(200) NULL,
    capacity      INT          NOT NULL,
    enrolled      INT          NOT NULL DEFAULT 0,
    enrollment_open BOOLEAN    NOT NULL DEFAULT TRUE,
    selection_deadline DATE    NULL,
    status        VARCHAR(30)  NOT NULL DEFAULT 'active',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_offering (course_id, semester_id, instructor_id),
    CONSTRAINT fk_offerings_course      FOREIGN KEY (course_id)     REFERENCES courses(id),
    CONSTRAINT fk_offerings_instructor  FOREIGN KEY (instructor_id) REFERENCES instructors(id),
    CONSTRAINT fk_offerings_semester    FOREIGN KEY (semester_id)   REFERENCES semesters(id),
    CONSTRAINT fk_offerings_program     FOREIGN KEY (program_id)    REFERENCES programs(id),
    CONSTRAINT fk_offerings_faculty     FOREIGN KEY (faculty_id)    REFERENCES faculties(id),
    CONSTRAINT fk_offerings_staff       FOREIGN KEY (created_by_staff_id) REFERENCES staff_profiles(id),
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

CREATE TABLE student_course_selections (
    id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id          INT UNSIGNED NOT NULL,
    course_offering_id  INT UNSIGNED NOT NULL,
    status              VARCHAR(30)  NOT NULL DEFAULT 'requested',
    reason              VARCHAR(255) NULL,
    selected_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_by_staff_id INT UNSIGNED NULL,
    approved_at         DATETIME NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_student_course_selection (student_id, course_offering_id),
    CONSTRAINT fk_course_selection_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_course_selection_offering FOREIGN KEY (course_offering_id) REFERENCES offerings(id) ON DELETE CASCADE,
    CONSTRAINT fk_course_selection_staff FOREIGN KEY (approved_by_staff_id) REFERENCES staff_profiles(id),
    CONSTRAINT chk_course_selection_status CHECK (status IN ('requested','selected','approved','rejected','enrolled','dropped','retake_requested'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- CAMPUS SCHEDULING RESOURCES
-- -------------------------------------------------------------
CREATE TABLE groups (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name          VARCHAR(80)  NOT NULL,
    program_id    INT UNSIGNED NULL,
    department_id INT UNSIGNED NULL,
    academic_year VARCHAR(80)  NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_groups_name (name),
    CONSTRAINT fk_groups_program FOREIGN KEY (program_id) REFERENCES programs(id),
    CONSTRAINT fk_groups_department FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE buildings (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    code       VARCHAR(20)  NOT NULL,
    name       VARCHAR(120) NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_buildings_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE classrooms (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    building_id INT UNSIGNED NOT NULL,
    name        VARCHAR(80)  NOT NULL,
    room_type   VARCHAR(30)  NOT NULL DEFAULT 'classroom',
    capacity    INT          NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_classrooms_building_name (building_id, name),
    CONSTRAINT fk_classrooms_building FOREIGN KEY (building_id) REFERENCES buildings(id),
    CONSTRAINT chk_classrooms_room_type CHECK (room_type IN ('classroom','lab','auditorium'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- GRADES
-- -------------------------------------------------------------
CREATE TABLE grades (
    id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    registration_id  INT UNSIGNED  NOT NULL,
    course_offering_id INT UNSIGNED NULL,
    course_id        INT UNSIGNED NULL,
    teacher_id       INT UNSIGNED NULL,
    student_id       INT UNSIGNED NULL,
    midterm_score    DECIMAL(5,2)  NULL,
    assignment_score DECIMAL(5,2)  NULL,
    final_score      DECIMAL(5,2)  NULL,
    project_score    DECIMAL(5,2)  NULL,
    quiz_score       DECIMAL(5,2)  NULL,
    final_exam_score DECIMAL(5,2)  NULL,
    attendance_score DECIMAL(5,2)  NULL,
    participation_score DECIMAL(5,2) NULL,
    lab_work_score   DECIMAL(5,2)  NULL,
    total_score      DECIMAL(5,2)  NULL,
    letter_grade     VARCHAR(3)    NULL,
    final_grade      INT           NULL,
    pass_status      VARCHAR(20)   NULL,
    exam_blocked_due_to_absence BOOLEAN NOT NULL DEFAULT FALSE,
    absence_percentage DECIMAL(5,2) NULL,
    failure_reason   VARCHAR(255)  NULL,
    retake_allowed_next_academic_year BOOLEAN NOT NULL DEFAULT FALSE,
    feedback         TEXT          NULL,
    is_published     BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_grades_registration (registration_id),
    CONSTRAINT fk_grades_reg FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
    CONSTRAINT fk_grades_offering FOREIGN KEY (course_offering_id) REFERENCES offerings(id),
    CONSTRAINT fk_grades_course FOREIGN KEY (course_id) REFERENCES courses(id),
    CONSTRAINT fk_grades_teacher FOREIGN KEY (teacher_id) REFERENCES instructors(id),
    CONSTRAINT fk_grades_student FOREIGN KEY (student_id) REFERENCES students(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE course_grade_configurations (
    id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
    course_offering_id INT UNSIGNED NOT NULL,
    course_id          INT UNSIGNED NOT NULL,
    teacher_id         INT UNSIGNED NOT NULL,
    semester_id        INT UNSIGNED NULL,
    academic_year      VARCHAR(50) NULL,
    midterm_points     DECIMAL(5,2) NOT NULL DEFAULT 0,
    final_exam_points  DECIMAL(5,2) NOT NULL DEFAULT 0,
    project_points     DECIMAL(5,2) NOT NULL DEFAULT 0,
    assignment_points  DECIMAL(5,2) NOT NULL DEFAULT 0,
    quiz_points        DECIMAL(5,2) NOT NULL DEFAULT 0,
    attendance_points  DECIMAL(5,2) NOT NULL DEFAULT 0,
    participation_points DECIMAL(5,2) NOT NULL DEFAULT 0,
    lab_work_points    DECIMAL(5,2) NOT NULL DEFAULT 0,
    is_active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_grade_config_offering (course_offering_id),
    CONSTRAINT fk_grade_config_offering FOREIGN KEY (course_offering_id) REFERENCES offerings(id) ON DELETE CASCADE,
    CONSTRAINT fk_grade_config_course FOREIGN KEY (course_id) REFERENCES courses(id),
    CONSTRAINT fk_grade_config_teacher FOREIGN KEY (teacher_id) REFERENCES instructors(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- ATTENDANCE
-- -------------------------------------------------------------
CREATE TABLE attendance_sessions (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    offering_id  INT UNSIGNED NOT NULL,
    session_date DATE         NOT NULL,
    week_number  INT          NULL,
    topic        VARCHAR(255) NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_att_session_offering FOREIGN KEY (offering_id) REFERENCES offerings(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attendance_records (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id INT UNSIGNED NOT NULL,
    course_offering_id INT UNSIGNED NULL,
    timetable_entry_id INT UNSIGNED NULL,
    class_session_id INT UNSIGNED NULL,
    course_id INT UNSIGNED NULL,
    teacher_id INT UNSIGNED NULL,
    student_id INT UNSIGNED NOT NULL,
    week_number INT NULL,
    attendance_date DATE NULL,
    start_time VARCHAR(10) NULL,
    end_time VARCHAR(10) NULL,
    status     VARCHAR(20)  NOT NULL,
    notes      TEXT         NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_attendance (session_id, student_id),
    CONSTRAINT fk_att_record_session FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_att_record_offering FOREIGN KEY (course_offering_id) REFERENCES offerings(id),
    CONSTRAINT fk_att_record_course FOREIGN KEY (course_id) REFERENCES courses(id),
    CONSTRAINT fk_att_record_teacher FOREIGN KEY (teacher_id) REFERENCES instructors(id),
    CONSTRAINT fk_att_record_student FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT chk_att_status CHECK (status IN ('present','absent','late','excused'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_course_status (
    id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id          INT UNSIGNED NOT NULL,
    course_offering_id  INT UNSIGNED NOT NULL,
    academic_year       VARCHAR(80)  NOT NULL,
    status              VARCHAR(30)  NOT NULL DEFAULT 'active',
    absence_percentage  DECIMAL(5,2) NULL,
    can_take_exam       BOOLEAN      NOT NULL DEFAULT TRUE,
    can_retake_next_year BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_student_course_status (student_id, course_offering_id),
    CONSTRAINT fk_scs_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_scs_offering FOREIGN KEY (course_offering_id) REFERENCES offerings(id) ON DELETE CASCADE,
    CONSTRAINT chk_scs_status CHECK (status IN ('active','passed','failed','failed_absence','retake_next_year'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE timetable_entries (
    id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
    course_offering_id INT UNSIGNED NOT NULL,
    group_id           INT UNSIGNED NULL,
    building_id        INT UNSIGNED NULL,
    classroom_id       INT UNSIGNED NULL,
    room_id            INT UNSIGNED NULL,
    room_type          VARCHAR(30)  NULL,
    lab_id             INT UNSIGNED NULL,
    day_of_week        VARCHAR(20)  NOT NULL,
    timetable_date     DATE         NULL,
    start_time         VARCHAR(10)  NOT NULL,
    end_time           VARCHAR(10)  NOT NULL,
    teaching_hours     INT          NULL,
    created_by_staff_id INT UNSIGNED NULL,
    is_published       BOOLEAN      NOT NULL DEFAULT TRUE,
    room               VARCHAR(50)  NULL,
    created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX ix_timetable_entries_offering (course_offering_id),
    CONSTRAINT fk_timetable_entries_offering FOREIGN KEY (course_offering_id) REFERENCES offerings(id) ON DELETE CASCADE,
    CONSTRAINT fk_timetable_entries_group FOREIGN KEY (group_id) REFERENCES groups(id),
    CONSTRAINT fk_timetable_entries_building FOREIGN KEY (building_id) REFERENCES buildings(id),
    CONSTRAINT fk_timetable_entries_staff FOREIGN KEY (created_by_staff_id) REFERENCES staff_profiles(id),
    CONSTRAINT fk_timetable_entries_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms(id),
    CONSTRAINT fk_timetable_entries_room FOREIGN KEY (room_id) REFERENCES classrooms(id),
    CONSTRAINT fk_timetable_entries_lab FOREIGN KEY (lab_id) REFERENCES classrooms(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE class_sessions (
    id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
    timetable_entry_id INT UNSIGNED NULL,
    course_offering_id INT UNSIGNED NOT NULL,
    teacher_id         INT UNSIGNED NOT NULL,
    course_id          INT UNSIGNED NOT NULL,
    faculty_id         INT UNSIGNED NULL,
    program_id         INT UNSIGNED NULL,
    study_level_id     INT UNSIGNED NULL,
    academic_year_id   INT UNSIGNED NULL,
    semester_id        INT UNSIGNED NULL,
    week_id            INT NOT NULL,
    session_date       DATE NOT NULL,
    day_of_week        VARCHAR(20) NOT NULL,
    start_time         VARCHAR(10) NOT NULL,
    end_time           VARCHAR(10) NOT NULL,
    building_id        INT UNSIGNED NULL,
    room_id            INT UNSIGNED NULL,
    room_type          VARCHAR(30) NULL,
    lab_id             INT UNSIGNED NULL,
    room               VARCHAR(80) NULL,
    session_order      INT NOT NULL DEFAULT 1,
    topic_title        VARCHAR(255) NULL,
    topic_description  TEXT NULL,
    status             VARCHAR(30) NOT NULL DEFAULT 'planned',
    created_by_teacher BOOLEAN NOT NULL DEFAULT FALSE,
    created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_class_sessions_timetable_entry (timetable_entry_id),
    INDEX ix_class_sessions_teacher_date (teacher_id, session_date),
    INDEX ix_class_sessions_context (teacher_id, course_id, semester_id, week_id),
    CONSTRAINT fk_class_sessions_timetable FOREIGN KEY (timetable_entry_id) REFERENCES timetable_entries(id) ON DELETE SET NULL,
    CONSTRAINT fk_class_sessions_offering FOREIGN KEY (course_offering_id) REFERENCES offerings(id) ON DELETE CASCADE,
    CONSTRAINT fk_class_sessions_teacher FOREIGN KEY (teacher_id) REFERENCES instructors(id),
    CONSTRAINT fk_class_sessions_course FOREIGN KEY (course_id) REFERENCES courses(id),
    CONSTRAINT fk_class_sessions_faculty FOREIGN KEY (faculty_id) REFERENCES faculties(id),
    CONSTRAINT fk_class_sessions_program FOREIGN KEY (program_id) REFERENCES programs(id),
    CONSTRAINT fk_class_sessions_semester FOREIGN KEY (semester_id) REFERENCES semesters(id),
    CONSTRAINT fk_class_sessions_building FOREIGN KEY (building_id) REFERENCES buildings(id),
    CONSTRAINT fk_class_sessions_room FOREIGN KEY (room_id) REFERENCES classrooms(id),
    CONSTRAINT fk_class_sessions_lab FOREIGN KEY (lab_id) REFERENCES classrooms(id),
    CONSTRAINT chk_class_sessions_status CHECK (status IN ('planned','started','completed','cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE attendance_records
    ADD CONSTRAINT fk_att_record_class_session FOREIGN KEY (class_session_id) REFERENCES class_sessions(id);

-- -------------------------------------------------------------
-- WEEKLY COURSE MATERIALS & TASKS
-- -------------------------------------------------------------
CREATE TABLE course_materials (
    id                     INT UNSIGNED NOT NULL AUTO_INCREMENT,
    offering_id            INT UNSIGNED NOT NULL,
    course_id              INT UNSIGNED NULL,
    teacher_id             INT UNSIGNED NOT NULL,
    week_number            INT          NOT NULL,
    weekly_topic_id        INT UNSIGNED NULL,
    course_week_topic_id   INT UNSIGNED NULL,
    class_session_id       INT UNSIGNED NULL,
    title                  VARCHAR(255) NOT NULL,
    description            TEXT         NULL,
    classwork_description  TEXT         NULL,
    homework_description   TEXT         NULL,
    material_kind          VARCHAR(20)  NOT NULL,
    file_path              VARCHAR(500) NULL,
    file_url               VARCHAR(1000) NULL,
    external_url           VARCHAR(1000) NULL,
    link_url               VARCHAR(1000) NULL,
    video_url              VARCHAR(1000) NULL,
    text_content           TEXT         NULL,
    original_file_name     VARCHAR(255) NULL,
    file_mime_type         VARCHAR(150) NULL,
    file_size              INT          NULL,
    status                 VARCHAR(20)  NOT NULL DEFAULT 'published',
    publish_at             DATETIME     NULL,
    published_at           DATETIME     NULL,
    is_visible_to_students BOOLEAN      NOT NULL DEFAULT TRUE,
    deleted_at             DATETIME     NULL,
    created_at             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX ix_course_materials_offering_week (offering_id, week_number),
    INDEX ix_course_materials_class_session (class_session_id),
    CONSTRAINT fk_course_materials_offering FOREIGN KEY (offering_id) REFERENCES offerings(id) ON DELETE CASCADE,
    CONSTRAINT fk_course_materials_course FOREIGN KEY (course_id) REFERENCES courses(id),
    CONSTRAINT fk_course_materials_teacher FOREIGN KEY (teacher_id) REFERENCES instructors(id),
    CONSTRAINT chk_course_materials_week CHECK (week_number BETWEEN 1 AND 14),
    CONSTRAINT chk_course_materials_kind CHECK (material_kind IN ('file','link','video','text')),
    CONSTRAINT chk_course_materials_status CHECK (status IN ('draft','scheduled','published','hidden'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE weekly_topics (
    id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
    course_offering_id INT UNSIGNED NOT NULL,
    course_id          INT UNSIGNED NOT NULL,
    teacher_id         INT UNSIGNED NOT NULL,
    week_number        INT          NOT NULL,
    topic_title        VARCHAR(255) NOT NULL,
    topic_description  TEXT         NULL,
    created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_weekly_topics_offering_week (course_offering_id, week_number),
    CONSTRAINT fk_weekly_topics_offering FOREIGN KEY (course_offering_id) REFERENCES offerings(id) ON DELETE CASCADE,
    CONSTRAINT fk_weekly_topics_course FOREIGN KEY (course_id) REFERENCES courses(id),
    CONSTRAINT fk_weekly_topics_teacher FOREIGN KEY (teacher_id) REFERENCES instructors(id),
    CONSTRAINT chk_weekly_topics_week CHECK (week_number BETWEEN 1 AND 14)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE course_week_topics (
    id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
    course_offering_id INT UNSIGNED NOT NULL,
    course_id          INT UNSIGNED NOT NULL,
    teacher_id         INT UNSIGNED NOT NULL,
    week_number        INT          NOT NULL,
    topic_date         DATE         NOT NULL,
    day_of_week        VARCHAR(20)  NOT NULL,
    topic_title        VARCHAR(255) NOT NULL,
    description        TEXT         NULL,
    sort_order         INT          NOT NULL DEFAULT 0,
    created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_course_week_topic_day (course_offering_id, week_number, topic_date),
    CONSTRAINT fk_cwt_offering FOREIGN KEY (course_offering_id) REFERENCES offerings(id) ON DELETE CASCADE,
    CONSTRAINT fk_cwt_course FOREIGN KEY (course_id) REFERENCES courses(id),
    CONSTRAINT fk_cwt_teacher FOREIGN KEY (teacher_id) REFERENCES instructors(id),
    CONSTRAINT chk_cwt_week CHECK (week_number BETWEEN 1 AND 20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE course_materials
    ADD CONSTRAINT fk_course_materials_weekly_topic FOREIGN KEY (weekly_topic_id) REFERENCES weekly_topics(id),
    ADD CONSTRAINT fk_course_materials_course_week_topic FOREIGN KEY (course_week_topic_id) REFERENCES course_week_topics(id),
    ADD CONSTRAINT fk_course_materials_class_session FOREIGN KEY (class_session_id) REFERENCES class_sessions(id);

CREATE TABLE assignments (
    id                     INT UNSIGNED NOT NULL AUTO_INCREMENT,
    course_offering_id     INT UNSIGNED NOT NULL,
    course_id              INT UNSIGNED NOT NULL,
    teacher_id             INT UNSIGNED NOT NULL,
    week_number            INT          NOT NULL,
    weekly_topic_id        INT UNSIGNED NULL,
    course_week_topic_id   INT UNSIGNED NULL,
    class_session_id       INT UNSIGNED NULL,
    title                  VARCHAR(255) NOT NULL,
    description            TEXT         NULL,
    instructions           TEXT         NULL,
    start_at               DATETIME     NULL,
    end_at                 DATETIME     NULL,
    due_date               DATE         NULL,
    due_time               TIME         NULL,
    max_points             DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    attachment_path        VARCHAR(500) NULL,
    attachment_original_name VARCHAR(255) NULL,
    attachment_mime_type   VARCHAR(150) NULL,
    attachment_size        INT          NULL,
    status                 VARCHAR(20)  NOT NULL DEFAULT 'published',
    is_visible_to_students BOOLEAN      NOT NULL DEFAULT TRUE,
    publish_at             DATETIME     NULL,
    published_at           DATETIME     NULL,
    created_at             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_assignments_teacher_course_week (teacher_id, course_offering_id, week_number),
    INDEX ix_assignments_offering_week (course_offering_id, week_number),
    INDEX ix_assignments_class_session (class_session_id),
    CONSTRAINT fk_assignments_offering FOREIGN KEY (course_offering_id) REFERENCES offerings(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignments_course FOREIGN KEY (course_id) REFERENCES courses(id),
    CONSTRAINT fk_assignments_teacher FOREIGN KEY (teacher_id) REFERENCES instructors(id),
    CONSTRAINT fk_assignments_weekly_topic FOREIGN KEY (weekly_topic_id) REFERENCES weekly_topics(id),
    CONSTRAINT fk_assignments_course_week_topic FOREIGN KEY (course_week_topic_id) REFERENCES course_week_topics(id),
    CONSTRAINT fk_assignments_class_session FOREIGN KEY (class_session_id) REFERENCES class_sessions(id),
    CONSTRAINT chk_assignments_week CHECK (week_number BETWEEN 1 AND 14),
    CONSTRAINT chk_assignments_max_points CHECK (max_points BETWEEN 0 AND 100),
    CONSTRAINT chk_assignments_status CHECK (status IN ('draft','scheduled','published'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE assignment_submissions (
    id                           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    assignment_id                INT UNSIGNED NOT NULL,
    student_id                   INT UNSIGNED NOT NULL,
    submitted_text               TEXT         NULL,
    submitted_file_path          VARCHAR(500) NULL,
    submitted_file_original_name VARCHAR(255) NULL,
    submitted_at                 DATETIME     NULL,
    score                        DECIMAL(5,2) NULL,
    feedback                     TEXT         NULL,
    status                       VARCHAR(20)  NOT NULL DEFAULT 'not_submitted',
    is_published                 BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at                   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_assignment_submission (assignment_id, student_id),
    CONSTRAINT fk_assignment_submissions_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignment_submissions_student FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT chk_assignment_submissions_status CHECK (status IN ('not_submitted','submitted','graded','late'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE weekly_tasks (
    id                     INT UNSIGNED NOT NULL AUTO_INCREMENT,
    offering_id            INT UNSIGNED NOT NULL,
    teacher_id             INT UNSIGNED NOT NULL,
    week_number            INT          NOT NULL,
    title                  VARCHAR(255) NOT NULL,
    description            TEXT         NOT NULL,
    due_date               DATETIME     NULL,
    max_points             INT          NULL,
    is_visible_to_students BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX ix_weekly_tasks_offering_week (offering_id, week_number),
    CONSTRAINT fk_weekly_tasks_offering FOREIGN KEY (offering_id) REFERENCES offerings(id) ON DELETE CASCADE,
    CONSTRAINT fk_weekly_tasks_teacher FOREIGN KEY (teacher_id) REFERENCES instructors(id),
    CONSTRAINT chk_weekly_tasks_week CHECK (week_number BETWEEN 1 AND 14)
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

-- -------------------------------------------------------------
-- AI CHAT
-- -------------------------------------------------------------
CREATE TABLE ai_chat_sessions (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED NOT NULL,
    title      VARCHAR(255) NOT NULL DEFAULT 'Academic chat',
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX ix_ai_chat_sessions_user_id (user_id),
    CONSTRAINT fk_ai_chat_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ai_chat_messages (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id INT UNSIGNED NOT NULL,
    role       VARCHAR(20)  NOT NULL,
    content    TEXT         NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX ix_ai_chat_messages_session_id (session_id),
    CONSTRAINT fk_ai_chat_messages_session FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    CONSTRAINT chk_ai_chat_messages_role CHECK (role IN ('user','ai'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- EMAIL VERIFICATION TOKENS
-- -------------------------------------------------------------
CREATE TABLE email_verification_tokens (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED NOT NULL,
    token      VARCHAR(512) NOT NULL,
    expires_at DATETIME     NOT NULL,
    used_at    DATETIME     NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX ix_evt_user_id (user_id),
    CONSTRAINT fk_evt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- MEMBER 5: MESSAGING, CLUBS & EVENTS
-- -------------------------------------------------------------
CREATE TABLE messages (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    sender_id    INT UNSIGNED NOT NULL,
    recipient_id INT UNSIGNED NULL,
    subject      VARCHAR(200) NOT NULL DEFAULT '(no subject)',
    body         TEXT         NOT NULL,
    parent_id    INT UNSIGNED NULL,
    is_broadcast TINYINT(1)   NOT NULL DEFAULT 0,
    sent_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at      DATETIME     NULL,
    PRIMARY KEY (id),
    INDEX ix_messages_recipient (recipient_id, sent_at),
    INDEX ix_messages_sender (sender_id, sent_at),
    CONSTRAINT fk_msg_sender    FOREIGN KEY (sender_id)    REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_msg_parent    FOREIGN KEY (parent_id)    REFERENCES messages(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE club_categories (
    id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE clubs (
    id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    code                  VARCHAR(30)  NOT NULL,
    name                  VARCHAR(150) NOT NULL,
    category_id           INT UNSIGNED NULL,
    description           TEXT         NULL,
    status                VARCHAR(20)  NOT NULL DEFAULT 'active',
    join_mode             VARCHAR(20)  NOT NULL DEFAULT 'open',
    advisor_instructor_id INT UNSIGNED NULL,
    meeting_day_of_week   VARCHAR(15)  NULL,
    meeting_start_time    TIME         NULL,
    meeting_end_time      TIME         NULL,
    meeting_location      VARCHAR(150) NULL,
    created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_clubs_code (code),
    CONSTRAINT fk_club_category FOREIGN KEY (category_id) REFERENCES club_categories(id),
    CONSTRAINT fk_club_advisor  FOREIGN KEY (advisor_instructor_id) REFERENCES instructors(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE club_memberships (
    id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    club_id         INT UNSIGNED NOT NULL,
    student_id      INT UNSIGNED NOT NULL,
    member_role     VARCHAR(50)  NOT NULL DEFAULT 'member',
    status          VARCHAR(20)  NOT NULL DEFAULT 'pending',
    request_message VARCHAR(255) NULL,
    submitted_at    DATETIME     NULL,
    reviewed_at     DATETIME     NULL,
    joined_at       DATETIME     NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX ix_cm_club (club_id),
    INDEX ix_cm_student (student_id),
    CONSTRAINT fk_cm_club    FOREIGN KEY (club_id)    REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_cm_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE campus_events (
    id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    club_id               INT UNSIGNED NULL,
    title                 VARCHAR(180) NOT NULL,
    description           TEXT         NULL,
    organizer_name        VARCHAR(150) NOT NULL,
    event_type            VARCHAR(80)  NOT NULL DEFAULT 'event',
    location_name         VARCHAR(150) NULL,
    delivery_mode         VARCHAR(20)  NOT NULL DEFAULT 'onsite',
    starts_at             DATETIME     NOT NULL,
    ends_at               DATETIME     NULL,
    status                VARCHAR(20)  NOT NULL DEFAULT 'scheduled',
    registration_required TINYINT(1)   NOT NULL DEFAULT 0,
    capacity              INT          NULL,
    created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_event_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE event_registrations (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    event_id      INT UNSIGNED NOT NULL,
    user_id       INT UNSIGNED NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'registered',
    registered_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX ix_er_event (event_id),
    INDEX ix_er_user (user_id),
    CONSTRAINT fk_er_event FOREIGN KEY (event_id) REFERENCES campus_events(id) ON DELETE CASCADE,
    CONSTRAINT fk_er_user  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
