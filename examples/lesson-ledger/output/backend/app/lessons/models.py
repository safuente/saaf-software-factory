from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, ForeignKeyConstraint, false
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.students.models import Student


class Lesson(Base):
    """Constraints and indexes are defined in migration 0003; the composite foreign key makes
    the database reject a student of another teacher."""

    __tablename__ = "lesson"
    __table_args__ = (
        ForeignKeyConstraint(
            ["student_id", "teacher_id"],
            ["student.id", "student.teacher_id"],
            ondelete="RESTRICT",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("teacher.id", ondelete="RESTRICT"))
    student_id: Mapped[int] = mapped_column()
    date: Mapped[date] = mapped_column(Date)
    duration_minutes: Mapped[int] = mapped_column()
    price_cents: Mapped[int] = mapped_column()
    paid: Mapped[bool] = mapped_column(server_default=false())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    student: Mapped[Student] = relationship(lazy="joined")
