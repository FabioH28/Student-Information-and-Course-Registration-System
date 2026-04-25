from datetime import date, datetime, time
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from app.core.rbac import (
    ROLE_ACADEMIC_STAFF,
    ROLE_COMMUNICATION_STAFF,
    ROLE_FINANCE_STAFF,
    ROLE_INSTRUCTOR,
    ROLE_STUDENT,
    ROLE_SYSTEM_ADMIN,
)
from app.schemas.auth import UserSummary


class AdminCreateUserRequest(BaseModel):
    email: EmailStr
    password: str | None = Field(default=None, min_length=8, max_length=128)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    role: Literal[
        ROLE_STUDENT,
        ROLE_INSTRUCTOR,
        ROLE_ACADEMIC_STAFF,
        ROLE_FINANCE_STAFF,
        ROLE_COMMUNICATION_STAFF,
        ROLE_SYSTEM_ADMIN,
    ]
    status: Literal["pending", "active", "suspended", "disabled"] = "active"
    must_change_password: bool = True

    student_number: str | None = Field(default=None, max_length=30)
    department_id: int | None = None
    program_id: int | None = None
    admission_date: date | None = None
    current_semester: int | None = Field(default=1, ge=1, le=20)

    employee_number: str | None = Field(default=None, max_length=30)
    title: str | None = Field(default=None, max_length=100)
    office_location: str | None = Field(default=None, max_length=100)
    hire_date: date | None = None


class ProvisionedIdentifiers(BaseModel):
    student_number: str | None = None
    employee_number: str | None = None


class AdminProvisionUserResponse(BaseModel):
    user: UserSummary
    generated_identifiers: ProvisionedIdentifiers
    temporary_password: str | None = None


class AdminPasswordResetResponse(BaseModel):
    user: UserSummary
    temporary_password: str


class TeacherOfferingAssignmentsRequest(BaseModel):
    offering_ids: list[int] = Field(default_factory=list)


class AcademicTermUpsertRequest(BaseModel):
    code: str = Field(min_length=2, max_length=30)
    name: str = Field(min_length=3, max_length=100)
    academic_year_start: int = Field(ge=2000, le=2100)
    academic_year_end: int = Field(ge=2000, le=2101)
    term_number: int = Field(ge=1, le=8)
    start_date: date
    end_date: date
    registration_start_at: datetime
    registration_end_at: datetime
    status: Literal["planning", "registration", "active", "completed", "archived"] = "planning"
    is_current: bool = False


class CourseOfferingUpsertRequest(BaseModel):
    department_id: int
    code: str = Field(min_length=2, max_length=20)
    title: str = Field(min_length=3, max_length=150)
    description: str | None = None
    credit_hours: int = Field(ge=1, le=30)
    level_number: int = Field(ge=1, le=20)
    course_type: Literal["core", "elective", "lab", "seminar", "project"] = "core"
    grading_scheme: Literal["letter", "pass_fail"] = "letter"
    is_active: bool = True

    academic_term_id: int
    teacher_profile_id: int | None = None
    room_id: int | None = None
    section_code: str = Field(min_length=1, max_length=10)
    delivery_mode: Literal["onsite", "online", "hybrid"] = "onsite"
    capacity: int = Field(ge=1, le=2000)
    waitlist_capacity: int = Field(default=0, ge=0, le=500)
    status: Literal["draft", "open", "closed", "in_progress", "completed", "cancelled"] = "draft"
    registration_opens_at: datetime | None = None
    registration_closes_at: datetime | None = None
    schedule_notes: str | None = Field(default=None, max_length=255)

    meeting_day_of_week: Literal["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] | None = None
    meeting_start_time: time | None = None
    meeting_end_time: time | None = None
    meeting_type: Literal["lecture", "lab", "tutorial", "exam", "office_hour"] = "lecture"


class EnrollmentStatusUpdateRequest(BaseModel):
    status: Literal["pending", "enrolled", "waitlisted", "dropped", "withdrawn", "completed", "failed"]


class InvoiceCreateRequest(BaseModel):
    student_id: int
    academic_term_id: int | None = None
    issue_date: date
    due_date: date
    amount: float = Field(gt=0)
    description: str = Field(min_length=3, max_length=255)
    notes: str | None = Field(default=None, max_length=255)


class PaymentCreateRequest(BaseModel):
    student_id: int
    invoice_id: int | None = None
    amount: float = Field(gt=0)
    payment_method: Literal["cash", "card", "bank_transfer", "online"]
    paid_at: datetime
    reference_number: str | None = Field(default=None, max_length=60)
    notes: str | None = Field(default=None, max_length=255)


class FinancialHoldCreateRequest(BaseModel):
    student_id: int
    hold_type: Literal["finance", "disciplinary", "academic", "administrative"] = "finance"
    reason: str = Field(min_length=3, max_length=255)


class ClubUpsertRequest(BaseModel):
    category_id: int
    code: str = Field(min_length=2, max_length=30)
    name: str = Field(min_length=3, max_length=150)
    description: str | None = None
    advisor_teacher_id: int | None = None
    join_mode: Literal["open", "request", "invite_only", "waitlist"] = "open"
    status: Literal["draft", "active", "recruiting", "inactive", "archived"] = "active"
    capacity: int | None = Field(default=None, ge=1, le=5000)
    meeting_day_of_week: Literal["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] | None = None
    meeting_start_time: time | None = None
    meeting_end_time: time | None = None
    meeting_location: str | None = Field(default=None, max_length=150)
    contact_email: EmailStr | None = None


class ClubJoinRequestReviewRequest(BaseModel):
    status: Literal["approved", "waitlisted", "rejected"]
    review_notes: str | None = Field(default=None, max_length=255)


class NewsPostUpsertRequest(BaseModel):
    post_type: Literal["announcement", "notice", "update", "feature"] = "announcement"
    title: str = Field(min_length=3, max_length=180)
    summary: str = Field(min_length=3, max_length=500)
    body: str | None = None
    priority: Literal["notice", "update", "important", "urgent"] = "notice"
    status: Literal["draft", "scheduled", "published", "archived"] = "draft"
    featured: bool = False
    visible_from: datetime | None = None
    visible_until: datetime | None = None


class CampusEventUpsertRequest(BaseModel):
    club_id: int | None = None
    title: str = Field(min_length=3, max_length=180)
    description: str | None = None
    organizer_name: str = Field(min_length=2, max_length=150)
    event_type: str = Field(min_length=2, max_length=80)
    location_name: str = Field(min_length=2, max_length=150)
    delivery_mode: Literal["onsite", "online", "hybrid"] = "onsite"
    starts_at: datetime
    ends_at: datetime
    registration_required: bool = False
    capacity: int | None = Field(default=None, ge=1, le=100000)
    expected_attendees: int | None = Field(default=None, ge=0, le=100000)
    status: Literal["draft", "scheduled", "open", "internal", "cancelled", "completed"] = "draft"


class UserStatusUpdateRequest(BaseModel):
    status: Literal["pending", "active", "suspended", "disabled"]


class UserRoleUpdateRequest(BaseModel):
    role: Literal[
        ROLE_STUDENT,
        ROLE_INSTRUCTOR,
        ROLE_ACADEMIC_STAFF,
        ROLE_FINANCE_STAFF,
        ROLE_COMMUNICATION_STAFF,
        ROLE_SYSTEM_ADMIN,
    ]
