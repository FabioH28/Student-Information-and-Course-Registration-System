from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from src.config.database import engine
from src.models.campus_resource import Building, Classroom, StudentGroup
from src.models.course_material import Assignment, AssignmentSubmission, CourseMaterial, CourseWeekTopic, WeeklyTask, WeeklyTopic
from src.models.course_status import StudentCourseStatus
from src.models.course_selection import CoursePrerequisite, StudentCourseSelection
from src.models.grade import CourseGradeConfiguration, Grade
from src.models.finance import FinanceFacultyScope
from src.models.staff import StaffFacultyScope, StaffProfile
from src.models.department import Faculty
from src.models.timetable import TimetableEntry
from src.models.message import Message
from src.models.club import Club, ClubCategory, ClubMembership
from src.models.campus_event import CampusEvent, EventRegistration
from src.routes import auth, students, courses, offerings, registrations, grades, attendance, finance, notifications, users, semesters, materials, course_offerings, campus_resources, staff, course_selections
from src.routes import messages as messages_routes, clubs as clubs_routes, communications as communications_routes
from src.routes.course_offerings import parse_schedule

app = FastAPI(
    title="Campus Information System API",
    description="Backend API for the Student Information and Course Registration System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:8088",
        "http://localhost:8088",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(students.router)
app.include_router(courses.router)
app.include_router(courses.catalog_router)
app.include_router(offerings.router)
app.include_router(registrations.router)
app.include_router(grades.router)
app.include_router(grades.teacher_api_router)
app.include_router(attendance.router)
app.include_router(attendance.teacher_api_router)
app.include_router(finance.router)
app.include_router(notifications.router)
app.include_router(users.router)
app.include_router(users.instructor_profile_router)
app.include_router(semesters.router)
app.include_router(materials.router)
app.include_router(materials.router, prefix="/api")
app.include_router(course_offerings.router)
app.include_router(campus_resources.router)
app.include_router(staff.router)
app.include_router(course_selections.router)
app.include_router(messages_routes.router)
app.include_router(clubs_routes.router)
app.include_router(communications_routes.router)

@app.on_event("startup")
def ensure_new_feature_tables():
    """Create material tables in local/dev databases that predate this feature."""
    Faculty.__table__.create(bind=engine, checkfirst=True)
    StaffProfile.__table__.create(bind=engine, checkfirst=True)
    CoursePrerequisite.__table__.create(bind=engine, checkfirst=True)
    StudentCourseSelection.__table__.create(bind=engine, checkfirst=True)
    WeeklyTopic.__table__.create(bind=engine, checkfirst=True)
    CourseWeekTopic.__table__.create(bind=engine, checkfirst=True)
    # Member 5: communications / clubs / messaging tables (create in dependency order)
    Message.__table__.create(bind=engine, checkfirst=True)
    ClubCategory.__table__.create(bind=engine, checkfirst=True)
    Club.__table__.create(bind=engine, checkfirst=True)
    ClubMembership.__table__.create(bind=engine, checkfirst=True)
    CampusEvent.__table__.create(bind=engine, checkfirst=True)
    EventRegistration.__table__.create(bind=engine, checkfirst=True)
    CourseMaterial.__table__.create(bind=engine, checkfirst=True)
    WeeklyTask.__table__.create(bind=engine, checkfirst=True)
    Assignment.__table__.create(bind=engine, checkfirst=True)
    AssignmentSubmission.__table__.create(bind=engine, checkfirst=True)
    StaffFacultyScope.__table__.create(bind=engine, checkfirst=True)
    FinanceFacultyScope.__table__.create(bind=engine, checkfirst=True)
    StudentGroup.__table__.create(bind=engine, checkfirst=True)
    Building.__table__.create(bind=engine, checkfirst=True)
    Classroom.__table__.create(bind=engine, checkfirst=True)
    TimetableEntry.__table__.create(bind=engine, checkfirst=True)
    StudentCourseStatus.__table__.create(bind=engine, checkfirst=True)
    inspector = inspect(engine)
    if inspector.has_table("semesters"):
        semester_columns = {column["name"] for column in inspector.get_columns("semesters")}
        if "total_weeks" not in semester_columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE semesters ADD COLUMN total_weeks INT NOT NULL DEFAULT 14"))
                conn.execute(text("UPDATE semesters SET total_weeks = 14 WHERE total_weeks IS NULL OR total_weeks <= 0"))
    department_columns = {column["name"] for column in inspector.get_columns("departments")}
    if "faculty_id" not in department_columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE departments ADD COLUMN faculty_id INT NULL"))
    # Demo/reference data belongs in database/seed.sql only.
    student_columns = {column["name"] for column in inspector.get_columns("students")}
    student_alters = []
    if "degree_level" not in student_columns:
        student_alters.append("ADD COLUMN degree_level VARCHAR(20) NOT NULL DEFAULT 'Bachelor'")
    if "academic_year" not in student_columns:
        student_alters.append("ADD COLUMN academic_year VARCHAR(80) NULL")
    if student_alters:
        with engine.begin() as conn:
            conn.execute(text(f"ALTER TABLE students {', '.join(student_alters)}"))
            conn.execute(text(
                "UPDATE students SET degree_level = COALESCE(degree_level, 'Bachelor'), "
                "academic_year = COALESCE(academic_year, CONCAT('Bachelor Year ', CEIL(current_semester / 2)))"
            ))
    offering_columns = {column["name"] for column in inspector.get_columns("offerings")}
    offering_alters = []
    if "program_id" not in offering_columns:
        offering_alters.append("ADD COLUMN program_id INT UNSIGNED NULL")
    if "faculty_id" not in offering_columns:
        offering_alters.append("ADD COLUMN faculty_id INT UNSIGNED NULL")
    if "created_by_staff_id" not in offering_columns:
        offering_alters.append("ADD COLUMN created_by_staff_id INT UNSIGNED NULL")
    if "academic_year" not in offering_columns:
        offering_alters.append("ADD COLUMN academic_year VARCHAR(80) NULL")
    if "group_name" not in offering_columns:
        offering_alters.append("ADD COLUMN group_name VARCHAR(80) NULL")
    if "academic_period" not in offering_columns:
        offering_alters.append("ADD COLUMN academic_period VARCHAR(80) NULL")
    if "enrollment_open" not in offering_columns:
        offering_alters.append("ADD COLUMN enrollment_open BOOLEAN NOT NULL DEFAULT TRUE")
    if "selection_deadline" not in offering_columns:
        offering_alters.append("ADD COLUMN selection_deadline DATE NULL")
    if "created_at" not in offering_columns:
        offering_alters.append("ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP")
    if "updated_at" not in offering_columns:
        offering_alters.append("ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
    if offering_alters:
        with engine.begin() as conn:
            conn.execute(text(f"ALTER TABLE offerings {', '.join(offering_alters)}"))
            conn.execute(text(
                "UPDATE offerings o "
                "JOIN courses c ON c.id = o.course_id "
                "LEFT JOIN programs p ON p.department_id = c.department_id "
                "LEFT JOIN semesters s ON s.id = o.semester_id "
                "SET o.program_id = COALESCE(o.program_id, p.id), "
                "o.academic_year = COALESCE(o.academic_year, 'Academic Year'), "
                "o.group_name = COALESCE(o.group_name, CONCAT('Offering ', o.id)), "
                "o.academic_period = COALESCE(o.academic_period, s.name)"
            ))
    selection_columns = {column["name"] for column in inspector.get_columns("student_course_selections")} if inspector.has_table("student_course_selections") else set()
    selection_alters = []
    if "approved_by_staff_id" not in selection_columns:
        selection_alters.append("ADD COLUMN approved_by_staff_id INT UNSIGNED NULL")
    if selection_alters:
        with engine.begin() as conn:
            conn.execute(text(f"ALTER TABLE student_course_selections {', '.join(selection_alters)}"))
    if inspector.has_table("staff_profiles"):
        staff_columns = {column["name"] for column in inspector.get_columns("staff_profiles")}
        staff_alters = []
        if "scope" not in staff_columns:
            staff_alters.append("ADD COLUMN scope VARCHAR(20) NOT NULL DEFAULT 'faculty'")
        staff_alters.append("MODIFY COLUMN faculty_id INT UNSIGNED NULL")
        if staff_alters:
            with engine.begin() as conn:
                conn.execute(text(f"ALTER TABLE staff_profiles {', '.join(staff_alters)}"))
    columns = {column["name"] for column in inspector.get_columns("course_materials")}
    alters = []
    if "course_id" not in columns:
        alters.append("ADD COLUMN course_id INT UNSIGNED NULL")
    if "file_url" not in columns:
        alters.append("ADD COLUMN file_url VARCHAR(1000) NULL")
    if "status" not in columns:
        alters.append("ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'published'")
    if "publish_at" not in columns:
        alters.append("ADD COLUMN publish_at DATETIME NULL")
    if "published_at" not in columns:
        alters.append("ADD COLUMN published_at DATETIME NULL")
    if "weekly_topic_id" not in columns:
        alters.append("ADD COLUMN weekly_topic_id INT UNSIGNED NULL")
    if "course_week_topic_id" not in columns:
        alters.append("ADD COLUMN course_week_topic_id INT UNSIGNED NULL")
    if "class_session_id" not in columns:
        alters.append("ADD COLUMN class_session_id INT UNSIGNED NULL")
    if "link_url" not in columns:
        alters.append("ADD COLUMN link_url VARCHAR(1000) NULL")
    if "video_url" not in columns:
        alters.append("ADD COLUMN video_url VARCHAR(1000) NULL")
    if "text_content" not in columns:
        alters.append("ADD COLUMN text_content TEXT NULL")
    if "deleted_at" not in columns:
        alters.append("ADD COLUMN deleted_at DATETIME NULL")
    if alters:
        with engine.begin() as conn:
            conn.execute(text(f"ALTER TABLE course_materials {', '.join(alters)}"))
            conn.execute(text(
                "UPDATE course_materials cm "
                "JOIN offerings o ON o.id = cm.offering_id "
                "SET cm.course_id = COALESCE(cm.course_id, o.course_id)"
            ))
    assignment_columns = {column["name"] for column in inspector.get_columns("assignments")} if inspector.has_table("assignments") else set()
    assignment_alters = []
    if "weekly_topic_id" not in assignment_columns:
        assignment_alters.append("ADD COLUMN weekly_topic_id INT UNSIGNED NULL")
    if "course_week_topic_id" not in assignment_columns:
        assignment_alters.append("ADD COLUMN course_week_topic_id INT UNSIGNED NULL")
    if "class_session_id" not in assignment_columns:
        assignment_alters.append("ADD COLUMN class_session_id INT UNSIGNED NULL")
    if "start_at" not in assignment_columns:
        assignment_alters.append("ADD COLUMN start_at DATETIME NULL")
    if "end_at" not in assignment_columns:
        assignment_alters.append("ADD COLUMN end_at DATETIME NULL")
    if assignment_alters:
        with engine.begin() as conn:
            conn.execute(text(f"ALTER TABLE assignments {', '.join(assignment_alters)}"))
    submission_columns = {column["name"] for column in inspector.get_columns("assignment_submissions")} if inspector.has_table("assignment_submissions") else set()
    if "is_published" not in submission_columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE assignment_submissions ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT FALSE"))
    attendance_columns = {column["name"] for column in inspector.get_columns("attendance_records")}
    attendance_alters = []
    if "course_offering_id" not in attendance_columns:
        attendance_alters.append("ADD COLUMN course_offering_id INT UNSIGNED NULL")
    if "course_id" not in attendance_columns:
        attendance_alters.append("ADD COLUMN course_id INT UNSIGNED NULL")
    if "teacher_id" not in attendance_columns:
        attendance_alters.append("ADD COLUMN teacher_id INT UNSIGNED NULL")
    if "week_number" not in attendance_columns:
        attendance_alters.append("ADD COLUMN week_number INT NULL")
    if "attendance_date" not in attendance_columns:
        attendance_alters.append("ADD COLUMN attendance_date DATE NULL")
    if "timetable_entry_id" not in attendance_columns:
        attendance_alters.append("ADD COLUMN timetable_entry_id INT UNSIGNED NULL")
    if "class_session_id" not in attendance_columns:
        attendance_alters.append("ADD COLUMN class_session_id INT UNSIGNED NULL")
    if "start_time" not in attendance_columns:
        attendance_alters.append("ADD COLUMN start_time VARCHAR(10) NULL")
    if "end_time" not in attendance_columns:
        attendance_alters.append("ADD COLUMN end_time VARCHAR(10) NULL")
    if "created_at" not in attendance_columns:
        attendance_alters.append("ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP")
    if "updated_at" not in attendance_columns:
        attendance_alters.append("ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
    if attendance_alters:
        with engine.begin() as conn:
            conn.execute(text(f"ALTER TABLE attendance_records {', '.join(attendance_alters)}"))
            conn.execute(text(
                "UPDATE attendance_records ar "
                "JOIN attendance_sessions s ON s.id = ar.session_id "
                "JOIN offerings o ON o.id = s.offering_id "
                "SET ar.course_offering_id = COALESCE(ar.course_offering_id, s.offering_id), "
                "ar.course_id = COALESCE(ar.course_id, o.course_id), "
                "ar.teacher_id = COALESCE(ar.teacher_id, o.instructor_id), "
                "ar.week_number = COALESCE(ar.week_number, s.week_number), "
                "ar.attendance_date = COALESCE(ar.attendance_date, s.session_date)"
            ))
    grade_columns = {column["name"] for column in inspector.get_columns("grades")}
    grade_alters = []
    if "course_offering_id" not in grade_columns:
        grade_alters.append("ADD COLUMN course_offering_id INT UNSIGNED NULL")
    if "course_id" not in grade_columns:
        grade_alters.append("ADD COLUMN course_id INT UNSIGNED NULL")
    if "teacher_id" not in grade_columns:
        grade_alters.append("ADD COLUMN teacher_id INT UNSIGNED NULL")
    for name in ("attendance_score", "participation_score", "lab_work_score"):
        if name not in grade_columns:
            grade_alters.append(f"ADD COLUMN {name} DECIMAL(5,2) NULL")
    if "student_id" not in grade_columns:
        grade_alters.append("ADD COLUMN student_id INT UNSIGNED NULL")
    if "created_at" not in grade_columns:
        grade_alters.append("ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP")
    if "project_score" not in grade_columns:
        grade_alters.append("ADD COLUMN project_score DECIMAL(5,2) NULL")
    if "quiz_score" not in grade_columns:
        grade_alters.append("ADD COLUMN quiz_score DECIMAL(5,2) NULL")
    if "final_exam_score" not in grade_columns:
        grade_alters.append("ADD COLUMN final_exam_score DECIMAL(5,2) NULL")
    if "exam_blocked_due_to_absence" not in grade_columns:
        grade_alters.append("ADD COLUMN exam_blocked_due_to_absence BOOLEAN NOT NULL DEFAULT FALSE")
    if "absence_percentage" not in grade_columns:
        grade_alters.append("ADD COLUMN absence_percentage DECIMAL(5,2) NULL")
    if "failure_reason" not in grade_columns:
        grade_alters.append("ADD COLUMN failure_reason VARCHAR(255) NULL")
    if "retake_allowed_next_academic_year" not in grade_columns:
        grade_alters.append("ADD COLUMN retake_allowed_next_academic_year BOOLEAN NOT NULL DEFAULT FALSE")
    if grade_alters:
        with engine.begin() as conn:
            conn.execute(text(f"ALTER TABLE grades {', '.join(grade_alters)}"))
            conn.execute(text(
                "UPDATE grades g "
                "JOIN registrations r ON r.id = g.registration_id "
                "JOIN offerings o ON o.id = r.offering_id "
                "SET g.course_offering_id = COALESCE(g.course_offering_id, r.offering_id), "
                "g.course_id = COALESCE(g.course_id, o.course_id), "
                "g.teacher_id = COALESCE(g.teacher_id, o.instructor_id), "
                "g.student_id = COALESCE(g.student_id, r.student_id)"
            ))
    if not inspector.has_table("course_grade_configurations"):
        with engine.begin() as conn:
            conn.execute(text(
                "CREATE TABLE course_grade_configurations ("
                "id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, "
                "course_offering_id INT UNSIGNED NOT NULL UNIQUE, "
                "course_id INT UNSIGNED NOT NULL, "
                "teacher_id INT UNSIGNED NOT NULL, "
                "semester_id INT UNSIGNED NULL, "
                "academic_year VARCHAR(50) NULL, "
                "midterm_points DECIMAL(5,2) NOT NULL DEFAULT 0, "
                "final_exam_points DECIMAL(5,2) NOT NULL DEFAULT 0, "
                "project_points DECIMAL(5,2) NOT NULL DEFAULT 0, "
                "assignment_points DECIMAL(5,2) NOT NULL DEFAULT 0, "
                "quiz_points DECIMAL(5,2) NOT NULL DEFAULT 0, "
                "attendance_points DECIMAL(5,2) NOT NULL DEFAULT 0, "
                "participation_points DECIMAL(5,2) NOT NULL DEFAULT 0, "
                "lab_work_points DECIMAL(5,2) NOT NULL DEFAULT 0, "
                "is_active BOOLEAN NOT NULL DEFAULT TRUE, "
                "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "
                "updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, "
                "CONSTRAINT fk_grade_config_offering FOREIGN KEY (course_offering_id) REFERENCES offerings(id) ON DELETE CASCADE, "
                "CONSTRAINT fk_grade_config_course FOREIGN KEY (course_id) REFERENCES courses(id), "
                "CONSTRAINT fk_grade_config_teacher FOREIGN KEY (teacher_id) REFERENCES instructors(id)"
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
            ))
    timetable_columns = {column["name"] for column in inspector.get_columns("timetable_entries")}
    timetable_alters = []
    if "group_id" not in timetable_columns:
        timetable_alters.append("ADD COLUMN group_id INT UNSIGNED NULL")
    if "building_id" not in timetable_columns:
        timetable_alters.append("ADD COLUMN building_id INT UNSIGNED NULL")
    if "classroom_id" not in timetable_columns:
        timetable_alters.append("ADD COLUMN classroom_id INT UNSIGNED NULL")
    if "room_id" not in timetable_columns:
        timetable_alters.append("ADD COLUMN room_id INT UNSIGNED NULL")
    if "room_type" not in timetable_columns:
        timetable_alters.append("ADD COLUMN room_type VARCHAR(30) NULL")
    if "lab_id" not in timetable_columns:
        timetable_alters.append("ADD COLUMN lab_id INT UNSIGNED NULL")
    if "teaching_hours" not in timetable_columns:
        timetable_alters.append("ADD COLUMN teaching_hours INT NULL")
    if "created_by_staff_id" not in timetable_columns:
        timetable_alters.append("ADD COLUMN created_by_staff_id INT UNSIGNED NULL")
    if "is_published" not in timetable_columns:
        timetable_alters.append("ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT TRUE")
    if timetable_alters:
        with engine.begin() as conn:
            conn.execute(text(f"ALTER TABLE timetable_entries {', '.join(timetable_alters)}"))
    if not inspector.has_table("class_sessions"):
        with engine.begin() as conn:
            conn.execute(text(
                "CREATE TABLE class_sessions ("
                "id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, "
                "timetable_entry_id INT UNSIGNED NULL UNIQUE, "
                "course_offering_id INT UNSIGNED NOT NULL, "
                "teacher_id INT UNSIGNED NOT NULL, "
                "course_id INT UNSIGNED NOT NULL, "
                "faculty_id INT UNSIGNED NULL, "
                "program_id INT UNSIGNED NULL, "
                "study_level_id INT UNSIGNED NULL, "
                "academic_year_id INT UNSIGNED NULL, "
                "semester_id INT UNSIGNED NULL, "
                "week_id INT NOT NULL, "
                "session_date DATE NOT NULL, "
                "day_of_week VARCHAR(20) NOT NULL, "
                "start_time VARCHAR(10) NOT NULL, "
                "end_time VARCHAR(10) NOT NULL, "
                "building_id INT UNSIGNED NULL, "
                "room_id INT UNSIGNED NULL, "
                "room_type VARCHAR(30) NULL, "
                "lab_id INT UNSIGNED NULL, "
                "room VARCHAR(80) NULL, "
                "session_order INT NOT NULL DEFAULT 1, "
                "topic_title VARCHAR(255) NULL, "
                "topic_description TEXT NULL, "
                "status VARCHAR(30) NOT NULL DEFAULT 'planned', "
                "created_by_teacher BOOLEAN NOT NULL DEFAULT FALSE, "
                "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "
                "updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, "
                "INDEX ix_class_sessions_teacher_date (teacher_id, session_date), "
                "INDEX ix_class_sessions_context (teacher_id, course_id, semester_id, week_id)"
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
            ))
    else:
        session_columns = {column["name"] for column in inspector.get_columns("class_sessions")}
        session_alters = []
        for name, ddl in {
            "topic_description": "ADD COLUMN topic_description TEXT NULL",
            "status": "ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'planned'",
            "session_order": "ADD COLUMN session_order INT NOT NULL DEFAULT 1",
            "created_by_teacher": "ADD COLUMN created_by_teacher BOOLEAN NOT NULL DEFAULT FALSE",
        }.items():
            if name not in session_columns:
                session_alters.append(ddl)
        if session_alters:
            with engine.begin() as conn:
                conn.execute(text(f"ALTER TABLE class_sessions {', '.join(session_alters)}"))
    # Do not generate seed timetable/resources in application startup.


@app.get("/")
def root():
    """Liveness check — confirms the API process is up."""
    return {"message": "CIS API is running"}

@app.get("/health")
def health():
    """Health probe used by reverse proxies and container orchestrators."""
    return {"status": "ok"}
