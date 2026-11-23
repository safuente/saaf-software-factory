"""Students of one teacher (ADR-003): every query is scoped by teacher_id."""

from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session as DbSession

from app.core.pagination import PageRequest
from app.students.models import Student

_INT4_MAX = 2**31 - 1


def add_student(db: DbSession, teacher_id: int, name: str) -> Student:
    """`name` is already normalized."""
    student = Student(
        teacher_id=teacher_id, name=name, created_at=datetime.now(UTC).replace(microsecond=0)
    )
    db.add(student)
    db.commit()
    return student


def list_students(db: DbSession, teacher_id: int, paging: PageRequest) -> tuple[list[Student], int]:
    """Students in name order, case-insensitive; ties in creation order."""
    total = db.scalar(select(func.count()).where(Student.teacher_id == teacher_id)) or 0
    items = db.scalars(
        select(Student)
        .where(Student.teacher_id == teacher_id)
        .order_by(func.lower(Student.name), Student.id)
        .offset(paging.offset)
        .limit(paging.page_size)
    ).all()
    return list(items), total


def find_student(db: DbSession, teacher_id: int, student_id: int) -> Student | None:
    """The teacher's student, or None for another teacher's or a nonexistent id."""
    if not 1 <= student_id <= _INT4_MAX:
        return None
    return db.scalar(
        select(Student).where(Student.id == student_id, Student.teacher_id == teacher_id)
    )
