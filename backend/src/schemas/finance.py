from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import date, datetime

class InvoiceOut(BaseModel):
    id: int
    student_id: int
    semester_id: int
    description: str
    amount: Decimal
    amount_paid: Decimal
    due_date: date
    status: str
    issued_at: datetime

    class Config:
        from_attributes = True

class InvoiceCreate(BaseModel):
    student_id: int
    semester_id: int
    description: str
    amount: Decimal
    due_date: date

class PaymentOut(BaseModel):
    id: int
    invoice_id: int
    amount: Decimal
    method: str
    reference: Optional[str]
    paid_at: datetime

    class Config:
        from_attributes = True

class PaymentCreate(BaseModel):
    invoice_id: int
    amount: Decimal
    method: str
    reference: Optional[str] = None

class HoldOut(BaseModel):
    id: int
    student_id: int
    invoice_id: Optional[int]
    reason: str
    effect: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class HoldCreate(BaseModel):
    student_id: int
    invoice_id: Optional[int] = None
    reason: str
    effect: str
