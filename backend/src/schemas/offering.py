from pydantic import BaseModel
from typing import Optional

class OfferingOut(BaseModel):
    id: int
    course_id: int
    instructor_id: int
    semester_id: int
    room: Optional[str]
    schedule: Optional[str]
    capacity: int
    enrolled: int
    status: str

    class Config:
        from_attributes = True

class OfferingCreate(BaseModel):
    course_id: int
    instructor_id: int
    semester_id: int
    room: Optional[str] = None
    schedule: Optional[str] = None
    capacity: int

class OfferingUpdate(BaseModel):
    room: Optional[str] = None
    schedule: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[str] = None
