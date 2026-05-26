from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class InvoiceCreate(BaseModel):
    student_id: int
    semester_id: int
    description: str
    amount: Decimal
    due_date: date


class InvoiceOut(InvoiceCreate):
    id: int
    amount_paid: Decimal
    status: str
    issued_at: datetime

    class Config:
        from_attributes = True


class PaymentCreate(BaseModel):
    invoice_id: int
    amount: Decimal
    method: str
    reference: str | None = None


class PaymentOut(PaymentCreate):
    id: int
    paid_at: datetime

    class Config:
        from_attributes = True


class HoldCreate(BaseModel):
    student_id: int
    invoice_id: int | None = None
    reason: str
    effect: str


class HoldOut(HoldCreate):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
