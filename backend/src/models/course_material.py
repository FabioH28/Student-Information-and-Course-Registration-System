from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, Time
from sqlalchemy.dialects import mysql
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from src.config.database import Base

UnsignedInteger = Integer().with_variant(mysql.INTEGER(unsigned=True), "mysql")


class CourseMaterial(Base):
    __tablename__ = "course_materials"

    id                     = Column(UnsignedInteger, primary_key=True, index=True)
    offering_id            = Column(UnsignedInteger, ForeignKey("offerings.id", ondelete="CASCADE"), nullable=False)
    course_id              = Column(UnsignedInteger, ForeignKey("courses.id"), nullable=True)
    teacher_id             = Column(UnsignedInteger, ForeignKey("instructors.id"), nullable=False)
    week_number            = Column(Integer, nullable=False)
    weekly_topic_id        = Column(UnsignedInteger, ForeignKey("weekly_topics.id"), nullable=True)
    course_week_topic_id   = Column(UnsignedInteger, ForeignKey("course_week_topics.id"), nullable=True)
    class_session_id       = Column(UnsignedInteger, ForeignKey("class_sessions.id"), nullable=True)
    title                  = Column(String(255), nullable=False)
    description            = Column(Text)
    classwork_description  = Column(Text)
    homework_description   = Column(Text)
    weekly_topic_id        = Column(UnsignedInteger, ForeignKey("weekly_topics.id"), nullable=True)
    material_kind          = Column(String(20), nullable=False)
    file_path              = Column(String(500))
    file_url               = Column(String(1000))
    external_url           = Column(String(1000))
    link_url               = Column(String(1000))
    video_url              = Column(String(1000))
    text_content           = Column(Text)
    original_file_name     = Column(String(255))
    file_mime_type         = Column(String(150))
    file_size              = Column(Integer)
    status                 = Column(String(20), nullable=False, default="published")
    publish_at             = Column(DateTime)
    published_at           = Column(DateTime)
    is_visible_to_students = Column(Boolean, nullable=False, default=True)
    deleted_at             = Column(DateTime, nullable=True)
    created_at             = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at             = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    offering = relationship("Offering", back_populates="materials")
    teacher  = relationship("Instructor")
    course_week_topic = relationship("CourseWeekTopic")
    class_session = relationship("ClassSession")


class WeeklyTask(Base):
    __tablename__ = "weekly_tasks"

    id                    = Column(UnsignedInteger, primary_key=True, index=True)
    offering_id           = Column(UnsignedInteger, ForeignKey("offerings.id", ondelete="CASCADE"), nullable=False)
    teacher_id            = Column(UnsignedInteger, ForeignKey("instructors.id"), nullable=False)
    week_number           = Column(Integer, nullable=False)
    title                 = Column(String(255), nullable=False)
    description           = Column(Text, nullable=False)
    due_date              = Column(DateTime)
    max_points            = Column(Integer)
    is_visible_to_students = Column(Boolean, nullable=False, default=True)
    created_at            = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at            = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    offering = relationship("Offering", back_populates="weekly_tasks")
    teacher  = relationship("Instructor")


class WeeklyTopic(Base):
    __tablename__ = "weekly_topics"

    id                 = Column(UnsignedInteger, primary_key=True, index=True)
    course_offering_id = Column(UnsignedInteger, ForeignKey("offerings.id", ondelete="CASCADE"), nullable=False)
    course_id          = Column(UnsignedInteger, ForeignKey("courses.id"), nullable=False)
    teacher_id         = Column(UnsignedInteger, ForeignKey("instructors.id"), nullable=False)
    week_number        = Column(Integer, nullable=False)
    topic_title        = Column(String(255), nullable=False)
    topic_description  = Column(Text, nullable=True)
    created_at         = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at         = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    offering = relationship("Offering")
    teacher  = relationship("Instructor")


class CourseWeekTopic(Base):
    __tablename__ = "course_week_topics"

    id                 = Column(UnsignedInteger, primary_key=True, index=True)
    course_offering_id = Column(UnsignedInteger, ForeignKey("offerings.id", ondelete="CASCADE"), nullable=False)
    course_id          = Column(UnsignedInteger, ForeignKey("courses.id"), nullable=False)
    teacher_id         = Column(UnsignedInteger, ForeignKey("instructors.id"), nullable=False)
    week_number        = Column(Integer, nullable=False)
    topic_date         = Column(Date, nullable=False)
    day_of_week        = Column(String(20), nullable=False)
    topic_title        = Column(String(255), nullable=False)
    description        = Column(Text, nullable=True)
    sort_order         = Column(Integer, nullable=False, default=0)
    created_at         = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at         = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    offering = relationship("Offering")
    teacher = relationship("Instructor")


class Assignment(Base):
    __tablename__ = "assignments"

    id                     = Column(UnsignedInteger, primary_key=True, index=True)
    course_offering_id     = Column(UnsignedInteger, ForeignKey("offerings.id", ondelete="CASCADE"), nullable=False)
    course_id              = Column(UnsignedInteger, ForeignKey("courses.id"), nullable=False)
    teacher_id             = Column(UnsignedInteger, ForeignKey("instructors.id"), nullable=False)
    week_number            = Column(Integer, nullable=False)
    weekly_topic_id        = Column(UnsignedInteger, ForeignKey("weekly_topics.id"), nullable=True)
    course_week_topic_id   = Column(UnsignedInteger, ForeignKey("course_week_topics.id"), nullable=True)
    class_session_id       = Column(UnsignedInteger, ForeignKey("class_sessions.id"), nullable=True)
    title                  = Column(String(255), nullable=False)
    description            = Column(Text, nullable=True)
    instructions           = Column(Text, nullable=True)
    start_at               = Column(DateTime, nullable=True)
    end_at                 = Column(DateTime, nullable=True)
    due_date               = Column(Date, nullable=True)
    due_time               = Column(Time, nullable=True)
    max_points             = Column(Numeric(5, 2), nullable=False, default=100)
    attachment_path        = Column(String(500), nullable=True)
    attachment_original_name = Column(String(255), nullable=True)
    attachment_mime_type   = Column(String(150), nullable=True)
    attachment_size        = Column(Integer, nullable=True)
    status                 = Column(String(20), nullable=False, default="published")
    is_visible_to_students = Column(Boolean, nullable=False, default=True)
    publish_at             = Column(DateTime, nullable=True)
    published_at           = Column(DateTime, nullable=True)
    created_at             = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at             = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    offering = relationship("Offering")
    teacher  = relationship("Instructor")
    course_week_topic = relationship("CourseWeekTopic")
    class_session = relationship("ClassSession")


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id                           = Column(UnsignedInteger, primary_key=True, index=True)
    assignment_id                = Column(UnsignedInteger, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    student_id                   = Column(UnsignedInteger, ForeignKey("students.id"), nullable=False)
    submitted_text               = Column(Text, nullable=True)
    submitted_file_path          = Column(String(500), nullable=True)
    submitted_file_original_name = Column(String(255), nullable=True)
    submitted_at                 = Column(DateTime, nullable=True)
    score                        = Column(Numeric(5, 2), nullable=True)
    feedback                     = Column(Text, nullable=True)
    status                       = Column(String(20), nullable=False, default="not_submitted")
    is_published                 = Column(Boolean, nullable=False, default=False)
    created_at                   = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at                   = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    assignment = relationship("Assignment")
    student = relationship("Student")
