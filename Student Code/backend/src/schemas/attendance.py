from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class AttendanceSessionOut(BaseModel):
    id: int
    offering_id: int
    session_date: date
    week_number: Optional[int]
    topic: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class AttendanceSessionCreate(BaseModel):
    session_date: date
    week_number: Optional[int] = None
    topic: Optional[str] = None

class AttendanceRecordIn(BaseModel):
    student_id: int
    status: str
    notes: Optional[str] = None

class BulkAttendanceSubmit(BaseModel):
    records: List[AttendanceRecordIn]


class AttendanceRecordOut(BaseModel):
    id: int
    student_id: int
    status: str
    notes: Optional[str]
    course_offering_id: Optional[int] = None
    timetable_entry_id: Optional[int] = None
    course_name: Optional[str] = None
    course_code: Optional[str] = None
    session_date: Optional[date] = None
    week_number: Optional[int] = None
    attendance_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    building_code: Optional[str] = None
    classroom_name: Optional[str] = None
    lab_name: Optional[str] = None
    auditorium_name: Optional[str] = None

    class Config:
        from_attributes = True
