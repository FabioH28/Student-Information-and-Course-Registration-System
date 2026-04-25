ROLE_STUDENT = "Student"
ROLE_INSTRUCTOR = "Instructor"
ROLE_ACADEMIC_STAFF = "Academic Staff"
ROLE_FINANCE_STAFF = "Finance Staff"
ROLE_COMMUNICATION_STAFF = "Communication Staff"
ROLE_SYSTEM_ADMIN = "System Admin"

ALL_ROLES = (
    ROLE_STUDENT,
    ROLE_INSTRUCTOR,
    ROLE_ACADEMIC_STAFF,
    ROLE_FINANCE_STAFF,
    ROLE_COMMUNICATION_STAFF,
    ROLE_SYSTEM_ADMIN,
)

STAFF_ROLES = (
    ROLE_ACADEMIC_STAFF,
    ROLE_FINANCE_STAFF,
    ROLE_COMMUNICATION_STAFF,
    ROLE_SYSTEM_ADMIN,
)

PERMISSION_PROFILE_VIEW_SELF = "profile.view.self"
PERMISSION_PROFILE_EDIT_SELF = "profile.edit.self"
PERMISSION_STUDENT_SELF_SERVICE = "students.self_service"
PERMISSION_INSTRUCTOR_WORKSPACE = "instructors.workspace"
PERMISSION_INSTRUCTOR_TIMETABLE = "instructors.timetable.view"
PERMISSION_INSTRUCTOR_ANNOUNCEMENTS = "announcements.manage.instructor"
PERMISSION_ACADEMIC_DASHBOARD = "academic.dashboard.view"
PERMISSION_ACADEMIC_RECORDS = "academic.records.manage"
PERMISSION_ACADEMIC_GRADES = "academic.grades.manage"
PERMISSION_ACADEMIC_ATTENDANCE = "academic.attendance.manage"
PERMISSION_ACADEMIC_COURSES = "academic.courses.manage"
PERMISSION_ACADEMIC_TERMS = "academic.terms.manage"
PERMISSION_ACADEMIC_REGISTRATIONS = "academic.registrations.manage"
PERMISSION_ACADEMIC_SCHEDULE = "academic.schedule.manage"
PERMISSION_ACADEMIC_EXAMS = "academic.exams.manage"
PERMISSION_FINANCE_DASHBOARD = "finance.dashboard.view"
PERMISSION_FINANCE_MANAGE = "finance.records.manage"
PERMISSION_COMMUNICATION_DASHBOARD = "communications.dashboard.view"
PERMISSION_ANNOUNCEMENTS_MANAGE = "announcements.manage"
PERMISSION_EVENTS_MANAGE = "events.manage"
PERMISSION_MEDIA_UPLOAD = "announcements.media.upload"
PERMISSION_NOTIFICATIONS_SEND = "notifications.send"
PERMISSION_REPORTS_VIEW = "reports.view"
PERMISSION_USERS_MANAGE = "users.manage"
PERMISSION_ROLES_MANAGE = "roles.manage"
PERMISSION_SETTINGS_MANAGE = "settings.manage"
PERMISSION_SYSTEM_OVERVIEW = "system.overview.view"
