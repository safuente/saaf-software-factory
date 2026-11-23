from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class Teacher(Base):
    __tablename__ = "teacher"
    __table_args__ = (
        UniqueConstraint("email", name="uq_teacher_email"),
        CheckConstraint("char_length(email) <= 254", name="ck_teacher_email_length"),
        CheckConstraint("email = lower(email)", name="ck_teacher_email_lower"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(Text)
    password_hash: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Session(Base):
    __tablename__ = "session"
    __table_args__ = (UniqueConstraint("token_hash", name="uq_session_token_hash"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    teacher_id: Mapped[int] = mapped_column(
        ForeignKey("teacher.id", name="fk_session_teacher_id_teacher", ondelete="RESTRICT")
    )
    token_hash: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    teacher: Mapped[Teacher] = relationship(lazy="joined")
