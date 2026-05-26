from pydantic import BaseModel


class CourseBase(BaseModel):
    code: str
    name: str
    description: str | None = None
    credits: int
    department_id: int
    prerequisite_course_id: int | None = None


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    description: str | None = None
    credits: int | None = None
    department_id: int | None = None
    prerequisite_course_id: int | None = None


class CourseOut(CourseBase):
    id: int

    class Config:
        from_attributes = True
