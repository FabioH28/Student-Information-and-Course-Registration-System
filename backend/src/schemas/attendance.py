from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class AttendanceSessionOut(BaseModel):
    id: int
    offering_id: int
    session_date: date
    topic: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class AttendanceSessionCreate(BaseModel):
    session_date: date
    topic: Optional[str] = None

class AttendanceRecordIn(BaseModel):
    student_id: int
    status: str

class BulkAttendanceSubmit(BaseModel):
    records: List[AttendanceRecordIn]
