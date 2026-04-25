from pydantic import BaseModel, Field


class UserProfileUpdateRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    title: str | None = Field(default=None, max_length=100)
    office_location: str | None = Field(default=None, max_length=100)


class UserProfileResponse(BaseModel):
    user_id: int
    email: str
    first_name: str
    last_name: str
    full_name: str
    phone: str | None = None
    roles: list[str]
    primary_role: str | None = None
    department_name: str | None = None
    program_name: str | None = None
    student_number: str | None = None
    employee_number: str | None = None
    title: str | None = None
    office_location: str | None = None
