from datetime import date, datetime, time
from typing import List, Optional
from pydantic import BaseModel


class CourseMaterialOut(BaseModel):
    id: int
    offering_id: int
    teacher_id: int
    week_number: int
    title: str
    description: Optional[str]
    classwork_description: Optional[str]
    homework_description: Optional[str]
    weekly_topic_id: Optional[int] = None
    course_week_topic_id: Optional[int] = None
    class_session_id: Optional[int] = None
    material_kind: str
    external_url: Optional[str]
    link_url: Optional[str] = None
    video_url: Optional[str] = None
    text_content: Optional[str] = None
    original_file_name: Optional[str]
    file_mime_type: Optional[str]
    file_size: Optional[int]
    status: str
    publish_at: Optional[datetime]
    published_at: Optional[datetime]
    is_visible_to_students: bool
    created_at: datetime
    updated_at: datetime
    course_name: Optional[str] = None
    course_code: Optional[str] = None
    teacher_name: Optional[str] = None

    class Config:
        from_attributes = True


class CourseMaterialUpdate(BaseModel):
    week_number: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    classwork_description: Optional[str] = None
    homework_description: Optional[str] = None
    external_url: Optional[str] = None
    publish_at: Optional[datetime] = None
    status: Optional[str] = None
    is_visible_to_students: Optional[bool] = None


class WeeklyTopicOut(BaseModel):
    id: int
    course_offering_id: int
    course_id: int
    teacher_id: int
    week_number: int
    topic_title: str
    topic_description: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WeeklyTopicUpsert(BaseModel):
    topic_title: str
    topic_description: Optional[str] = None


class AssignmentOut(BaseModel):
    id: int
    course_offering_id: int
    course_id: int
    teacher_id: int
    week_number: int
    weekly_topic_id: Optional[int] = None
    course_week_topic_id: Optional[int] = None
    class_session_id: Optional[int] = None
    title: str
    description: Optional[str]
    instructions: Optional[str]
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    due_date: Optional[date]
    due_time: Optional[time]
    max_points: float
    attachment_original_name: Optional[str]
    attachment_mime_type: Optional[str]
    attachment_size: Optional[int]
    status: str
    is_visible_to_students: bool
    publish_at: Optional[datetime]
    published_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    course_name: Optional[str] = None
    course_code: Optional[str] = None
    teacher_name: Optional[str] = None
    topic_title: Optional[str] = None
    submissions_count: int = 0
    my_submission: Optional[dict] = None

    class Config:
        from_attributes = True


class AssignmentSubmissionOut(BaseModel):
    id: Optional[int] = None
    assignment_id: int
    student_id: int
    submitted_text: Optional[str] = None
    submitted_file_original_name: Optional[str] = None
    submission_type: Optional[str] = None
    submitted_at: Optional[datetime] = None
    score: Optional[float] = None
    feedback: Optional[str] = None
    status: str
    is_published: bool = False
    student_name: Optional[str] = None
    student_code: Optional[str] = None
    download_url: Optional[str] = None

    class Config:
        from_attributes = True


class AssignmentUpdate(BaseModel):
    week_number: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    due_date: Optional[date] = None
    due_time: Optional[time] = None
    max_points: Optional[float] = None
    status: Optional[str] = None
    is_visible_to_students: Optional[bool] = None
    publish_at: Optional[datetime] = None


class WeeklyTaskOut(BaseModel):
    id: int
    offering_id: int
    teacher_id: int
    week_number: int
    title: str
    description: str
    due_date: Optional[datetime]
    max_points: Optional[int]
    is_visible_to_students: bool
    created_at: datetime
    updated_at: datetime
    course_name: Optional[str] = None
    course_code: Optional[str] = None
    teacher_name: Optional[str] = None

    class Config:
        from_attributes = True


class WeeklyTaskCreate(BaseModel):
    offering_id: int
    week_number: int
    title: str
    description: str
    due_date: Optional[datetime] = None
    max_points: Optional[int] = None
    is_visible_to_students: bool = True


class WeeklyTaskUpdate(BaseModel):
    week_number: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    max_points: Optional[int] = None
    is_visible_to_students: Optional[bool] = None


class WeekContentOut(BaseModel):
    week_number: int
    topic: Optional[WeeklyTopicOut] = None
    materials: List[CourseMaterialOut]
    tasks: List[WeeklyTaskOut]
