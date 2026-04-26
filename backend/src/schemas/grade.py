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
    total_score: Optional[Decimal]
    letter_grade: Optional[str]
    is_published: bool
    updated_at: datetime

    class Config:
        from_attributes = True

class GradeUpsert(BaseModel):
    midterm_score: Optional[Decimal] = None
    assignment_score: Optional[Decimal] = None
    final_score: Optional[Decimal] = None

class GradePublish(BaseModel):
    registration_ids: List[int]
