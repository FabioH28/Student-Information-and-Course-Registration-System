from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class CourseEnrollmentRequest(BaseModel):
    offering_id: int = Field(gt=0)


class StudentProfileUpdateRequest(BaseModel):
    phone: str | None = Field(default=None, max_length=30)
    date_of_birth: date | None = None
    address_line_1: str | None = Field(default=None, max_length=150)
    address_line_2: str | None = Field(default=None, max_length=150)
    city: str | None = Field(default=None, max_length=100)
    state_region: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    country: str | None = Field(default=None, max_length=100)


class StudentFinanceSupportRequest(BaseModel):
    request_type: Literal["billing_question", "payment_plan", "hold_review", "statement_request"] = "billing_question"
    message: str = Field(min_length=10, max_length=600)


class StudentEventRegistrationRequest(BaseModel):
    notes: str | None = Field(default=None, max_length=255)


class StudentChatMessageRequest(BaseModel):
    message: str = Field(min_length=2, max_length=2000)
