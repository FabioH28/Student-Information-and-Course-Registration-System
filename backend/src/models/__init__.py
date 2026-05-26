from src.models.user import User
from src.models.student import Student
from src.models.instructor import Instructor
from src.models.department import Department
from src.models.program import Program
from src.models.course import Course
from src.models.semester import Semester
from src.models.offering import Offering
from src.models.registration import Registration
from src.models.grade import CourseGradeConfiguration, Grade
from src.models.course_status import StudentCourseStatus
from src.models.course_selection import CoursePrerequisite, StudentCourseSelection
from src.models.staff import StaffFacultyScope, StaffProfile
from src.models.attendance import AttendanceSession, AttendanceRecord
from src.models.course_material import CourseMaterial, CourseWeekTopic, WeeklyTask
from src.models.timetable import TimetableEntry, ClassSession
from src.models.campus_resource import Building, Classroom, StudentGroup
from src.models.finance import FinanceFacultyScope, Invoice, Payment, Hold
from src.models.notification import Notification
from src.models.announcement import Announcement
from src.models.audit_log import AuditLog
from src.models.password_reset_token import PasswordResetToken
from src.models.email_verification_token import EmailVerificationToken
from src.models.ai_chat import AIChatSession, AIChatMessage
