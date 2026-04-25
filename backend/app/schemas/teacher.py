from datetime import date, datetime, time
from typing import Literal

from pydantic import BaseModel, Field


class AttendanceSessionCreateRequest(BaseModel):
    offering_id: int = Field(gt=0)
    session_date: date
    course_meeting_id: int | None = Field(default=None, gt=0)
    start_time: time | None = None
    end_time: time | None = None
    topic: str | None = Field(default=None, max_length=150)
    status: Literal["scheduled", "completed", "cancelled"] = "completed"


class AttendanceRecordInput(BaseModel):
    student_id: int = Field(gt=0)
    status: Literal["present", "absent", "late", "excused"]
    remarks: str | None = Field(default=None, max_length=255)


class AttendanceRecordBulkRequest(BaseModel):
    records: list[AttendanceRecordInput] = Field(min_length=1)


class GradeComponentCreateRequest(BaseModel):
    offering_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=100)
    component_type: Literal["assignment", "quiz", "midterm", "final", "project", "lab", "participation", "attendance", "custom"] = (
        "assignment"
    )
    max_points: float = Field(gt=0)
    weight_percentage: float = Field(gt=0, le=100)
    due_at: datetime | None = None
    sort_order: int = Field(default=1, ge=1, le=999)
    is_published: bool = False


class GradeRecordInput(BaseModel):
    student_id: int = Field(gt=0)
    score_awarded: float | None = Field(default=None, ge=0)
    remarks: str | None = Field(default=None, max_length=255)
    publish: bool = False


class GradeRecordBulkRequest(BaseModel):
    records: list[GradeRecordInput] = Field(min_length=1)


class FinalGradeInput(BaseModel):
    enrollment_id: int = Field(gt=0)
    numeric_grade: float = Field(ge=0, le=100)


class FinalGradesPublishRequest(BaseModel):
    offering_id: int = Field(gt=0)
    grades: list[FinalGradeInput] = Field(min_length=1)
