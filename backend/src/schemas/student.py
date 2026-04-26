from pydantic import BaseModel
from typing import Optional
from datetime import date
from decimal import Decimal

class StudentOut(BaseModel):
    id: int
    user_id: int
    student_code: str
    first_name: str
    last_name: str
    phone: Optional[str]
    date_of_birth: Optional[date]
    program_id: int
    current_semester: int
    gpa: Decimal
    status: str

    class Config:
        from_attributes = True

class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None

class StudentAdminUpdate(BaseModel):
    program_id: Optional[int] = None
    current_semester: Optional[int] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None
