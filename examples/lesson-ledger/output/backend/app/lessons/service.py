"""Lessons of one teacher (ADR-003): every query is scoped by teacher_id."""

from datetime import UTC, date, datetime

from sqlalchemy import ColumnElement, func, select
from sqlalchemy.orm import Session as DbSession

from app.core.pagination import PageRequest
from app.lessons.models import Lesson
from app.lessons.rules import month_range
from app.students.service import find_student

_INT4_MAX = 2**31 - 1


class LessonNotFoundError(Exception):
    """The lesson is another teacher's or does not exist; both are reported the same way."""


class StudentNotFoundError(Exception):
    """The student is another teacher's or does not exist; both are reported the same way."""


def record_lesson(
    db: DbSession,
    teacher_id: int,
    *,
    student_id: int,
    lesson_date: date,
    duration_minutes: int,
    price_cents: int,
) -> Lesson:
    student = find_student(db, teacher_id, student_id)
    if student is None:
        raise StudentNotFoundError
    lesson = Lesson(
        teacher_id=teacher_id,
        student=student,
        date=lesson_date,
        duration_minutes=duration_minutes,
        price_cents=price_cents,
        paid=False,
        created_at=datetime.now(UTC).replace(microsecond=0),
    )
    db.add(lesson)
    db.commit()
    return lesson


def _in_month(teacher_id: int, month: str | None) -> list[ColumnElement[bool]]:
    conditions = [Lesson.teacher_id == teacher_id]
    if month is not None:
        start, end = month_range(month)
        conditions += [Lesson.date >= start, Lesson.date < end]
    return conditions


def list_lessons(
    db: DbSession, teacher_id: int, paging: PageRequest, month: str | None = None
) -> tuple[list[Lesson], int]:
    """Lessons by date, newest first; same date newest created first. `month` (`YYYY-MM`)
    keeps only the lessons dated in that month."""
    conditions = _in_month(teacher_id, month)
    total = db.scalar(select(func.count()).where(*conditions)) or 0
    items = db.scalars(
        select(Lesson)
        .where(*conditions)
        .order_by(Lesson.date.desc(), Lesson.id.desc())
        .offset(paging.offset)
        .limit(paging.page_size)
    ).all()
    return list(items), total


def month_totals(db: DbSession, teacher_id: int, month: str) -> tuple[int, int, int]:
    """(lesson count, collected cents, pending cents) of the teacher's lessons in `month`."""
    row = db.execute(
        select(
            func.count(),
            func.coalesce(func.sum(Lesson.price_cents).filter(Lesson.paid), 0),
            func.coalesce(func.sum(Lesson.price_cents).filter(~Lesson.paid), 0),
        ).where(*_in_month(teacher_id, month))
    ).one()
    return int(row[0]), int(row[1]), int(row[2])


def list_pending(
    db: DbSession, teacher_id: int, paging: PageRequest
) -> tuple[list[Lesson], int, int]:
    """Unpaid lessons by date, oldest first; same date oldest created first. Returns the page,
    the number of unpaid lessons and their total price in cents."""
    conditions = [Lesson.teacher_id == teacher_id, ~Lesson.paid]
    total, amount = db.execute(
        select(func.count(), func.coalesce(func.sum(Lesson.price_cents), 0)).where(*conditions)
    ).one()
    items = db.scalars(
        select(Lesson)
        .where(*conditions)
        .order_by(Lesson.date, Lesson.id)
        .offset(paging.offset)
        .limit(paging.page_size)
    ).all()
    return list(items), int(total), int(amount)


def set_paid(db: DbSession, teacher_id: int, lesson_id: int, *, paid: bool) -> Lesson:
    """Sets the teacher's lesson paid or unpaid; setting the value it already has is a no-op."""
    lesson = (
        db.scalar(select(Lesson).where(Lesson.id == lesson_id, Lesson.teacher_id == teacher_id))
        if 1 <= lesson_id <= _INT4_MAX
        else None
    )
    if lesson is None:
        raise LessonNotFoundError
    if lesson.paid != paid:
        lesson.paid = paid
        db.commit()
    return lesson
