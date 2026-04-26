from pydantic import BaseModel
from typing import Optional

class CourseOut(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str]
    credits: int
    department_id: int
    prerequisite_course_id: Optional[int]

    class Config:
        from_attributes = True

class CourseCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    credits: int
    department_id: int
    prerequisite_course_id: Optional[int] = None

class CourseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    credits: Optional[int] = None
    prerequisite_course_id: Optional[int] = None
