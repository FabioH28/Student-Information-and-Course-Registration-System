from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RegistrationOut(BaseModel):
    id: int
    student_id: int
    offering_id: int
    registered_at: datetime
    status: str

    class Config:
        from_attributes = True

class RegistrationCreate(BaseModel):
    offering_id: int

class RegistrationStatusUpdate(BaseModel):
    status: str
