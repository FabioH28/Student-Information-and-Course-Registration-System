from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from datetime import datetime

class GradeOut(BaseModel):
    id: int
    registration_id: int
    midterm_score: Optional[Decimal]
    assignment_score: Optional[Decimal]
    final_score: Optional[Decimal]
    project_score: Optional[Decimal] = None
    quiz_score: Optional[Decimal] = None
    final_exam_score: Optional[Decimal] = None
    attendance_score: Optional[Decimal] = None
    participation_score: Optional[Decimal] = None
    lab_work_score: Optional[Decimal] = None
    total_score: Optional[Decimal]
    letter_grade: Optional[str]
    final_grade: Optional[int]
    pass_status: Optional[str]
    exam_blocked_due_to_absence: bool = False
    absence_percentage: Optional[Decimal] = None
    can_take_exam: bool = True
    failure_reason: Optional[str] = None
    retake_allowed_next_academic_year: bool = False
    feedback: Optional[str]
    is_published: bool
    updated_at: datetime
    course_name: Optional[str] = None
    course_code: Optional[str] = None
    student_name: Optional[str] = None

    class Config:
        from_attributes = True

class GradeUpsert(BaseModel):
    midterm_score: Optional[Decimal] = None
    assignment_score: Optional[Decimal] = None
    project_score: Optional[Decimal] = None
    quiz_score: Optional[Decimal] = None
    final_exam_score: Optional[Decimal] = None
    attendance_score: Optional[Decimal] = None
    participation_score: Optional[Decimal] = None
    lab_work_score: Optional[Decimal] = None
    feedback: Optional[str] = None

class GradePublish(BaseModel):
    registration_ids: List[int]


class BulkGradeIn(BaseModel):
    registration_id: int
    midterm_score: Optional[Decimal] = None
    assignment_score: Optional[Decimal] = None
    project_score: Optional[Decimal] = None
    quiz_score: Optional[Decimal] = None
    final_exam_score: Optional[Decimal] = None
    attendance_score: Optional[Decimal] = None
    participation_score: Optional[Decimal] = None
    lab_work_score: Optional[Decimal] = None
    feedback: Optional[str] = None


class BulkGradeSubmit(BaseModel):
    offering_id: int
    grades: List[BulkGradeIn]


class GradeComponentConfig(BaseModel):
    key: str
    label: str
    points: Decimal
    selected: bool = True


class CourseGradeConfigurationOut(BaseModel):
    id: int
    course_offering_id: int
    course_id: int
    teacher_id: int
    semester_id: Optional[int] = None
    academic_year: Optional[str] = None
    components: List[GradeComponentConfig]
    total_points: Decimal


class CourseGradeConfigurationIn(BaseModel):
    components: List[GradeComponentConfig]
