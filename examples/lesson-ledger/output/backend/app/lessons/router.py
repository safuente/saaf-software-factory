from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.orm import Session as DbSession

from app.accounts.auth import NOT_AUTHENTICATED_RESPONSE, CurrentSession
from app.core.db import get_db
from app.core.errors import (
    NOT_FOUND_RESPONSE,
    UNSUPPORTED_MEDIA_TYPE_RESPONSE,
    VALIDATION_RESPONSE,
    AppError,
)
from app.core.pagination import Page, Paging
from app.lessons import service
from app.lessons.models import Lesson
from app.lessons.rules import MONTH_PATTERN
from app.lessons.schemas import (
    LessonOut,
    Money,
    MonthlySummary,
    PendingLessons,
    RecordLessonRequest,
    SetPaidRequest,
)
from app.students.schemas import StudentRef

router = APIRouter(prefix="/api/lessons", tags=["lessons"])
summaries_router = APIRouter(prefix="/api/monthly-summaries", tags=["lessons"])
pending_router = APIRouter(prefix="/api/pending-lessons", tags=["lessons"])

_MONTH_DESCRIPTION = "Calendar month YYYY-MM, 2000-01 to 2099-12"


def _usd(cents: int) -> Money:
    return Money(amount=cents, currency="USD")


def _lesson_out(lesson: Lesson) -> LessonOut:
    return LessonOut(
        id=lesson.id,
        student=StudentRef(id=lesson.student.id, name=lesson.student.name),
        date=lesson.date,
        duration_minutes=lesson.duration_minutes,
        price=_usd(lesson.price_cents),
        paid=lesson.paid,
        created_at=lesson.created_at,
    )


@router.get(
    "",
    operation_id="listLessons",
    responses={**NOT_AUTHENTICATED_RESPONSE, **VALIDATION_RESPONSE},
)
def list_lessons(
    session: CurrentSession,
    paging: Paging,
    month: Annotated[
        str | None, Query(pattern=MONTH_PATTERN, description=_MONTH_DESCRIPTION)
    ] = None,
    db: DbSession = Depends(get_db),  # noqa: B008
) -> Page[LessonOut]:
    """The teacher's lessons by date, newest first; same date newest created first.
    `month` keeps only the lessons dated in that month."""
    items, total = service.list_lessons(db, session.teacher_id, paging, month)
    return Page[LessonOut](
        items=[_lesson_out(lesson) for lesson in items],
        total=total,
        page=paging.page,
        page_size=paging.page_size,
    )


@router.post(
    "",
    status_code=201,
    operation_id="recordLesson",
    responses={
        **NOT_AUTHENTICATED_RESPONSE,
        **NOT_FOUND_RESPONSE,
        **UNSUPPORTED_MEDIA_TYPE_RESPONSE,
        **VALIDATION_RESPONSE,
    },
)
def record_lesson(
    body: RecordLessonRequest,
    session: CurrentSession,
    db: DbSession = Depends(get_db),  # noqa: B008
) -> LessonOut:
    """Record an unpaid lesson for one of the teacher's students; 404 for any other student."""
    try:
        lesson = service.record_lesson(
            db,
            session.teacher_id,
            student_id=body.student_id,
            lesson_date=body.date,
            duration_minutes=body.duration_minutes,
            price_cents=body.price.amount,
        )
    except service.StudentNotFoundError:
        raise AppError(404, "not_found", "Not found") from None
    return _lesson_out(lesson)


@summaries_router.get(
    "/{month}",
    operation_id="getMonthlySummary",
    responses={**NOT_AUTHENTICATED_RESPONSE, **VALIDATION_RESPONSE},
)
def get_monthly_summary(
    session: CurrentSession,
    month: Annotated[str, Path(pattern=MONTH_PATTERN, description=_MONTH_DESCRIPTION)],
    db: DbSession = Depends(get_db),  # noqa: B008
) -> MonthlySummary:
    """Lesson count, collected (paid) and pending (unpaid) amounts of the teacher's lessons
    dated in `month`."""
    count, collected, pending = service.month_totals(db, session.teacher_id, month)
    return MonthlySummary(
        month=month, lesson_count=count, collected=_usd(collected), pending=_usd(pending)
    )


@pending_router.get(
    "",
    operation_id="listPendingLessons",
    responses={**NOT_AUTHENTICATED_RESPONSE, **VALIDATION_RESPONSE},
)
def list_pending_lessons(
    session: CurrentSession,
    paging: Paging,
    db: DbSession = Depends(get_db),  # noqa: B008
) -> PendingLessons:
    """The teacher's unpaid lessons of every month by date, oldest first; same date oldest
    created first. `amount_pending` covers all of them, not only this page."""
    items, total, amount = service.list_pending(db, session.teacher_id, paging)
    return PendingLessons(
        items=[_lesson_out(lesson) for lesson in items],
        total=total,
        page=paging.page,
        page_size=paging.page_size,
        amount_pending=_usd(amount),
    )


@router.patch(
    "/{lesson_id}",
    operation_id="setLessonPaid",
    responses={
        **NOT_AUTHENTICATED_RESPONSE,
        **NOT_FOUND_RESPONSE,
        **UNSUPPORTED_MEDIA_TYPE_RESPONSE,
        **VALIDATION_RESPONSE,
    },
)
def set_lesson_paid(
    lesson_id: int,
    body: SetPaidRequest,
    session: CurrentSession,
    db: DbSession = Depends(get_db),  # noqa: B008
) -> LessonOut:
    """Mark the teacher's lesson as paid or undo it; idempotent. 404 for any other lesson."""
    try:
        lesson = service.set_paid(db, session.teacher_id, lesson_id, paid=body.paid)
    except service.LessonNotFoundError:
        raise AppError(404, "not_found", "Not found") from None
    return _lesson_out(lesson)
