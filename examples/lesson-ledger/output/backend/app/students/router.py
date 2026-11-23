from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DbSession

from app.accounts.auth import NOT_AUTHENTICATED_RESPONSE, CurrentSession
from app.core.db import get_db
from app.core.errors import UNSUPPORTED_MEDIA_TYPE_RESPONSE, VALIDATION_RESPONSE
from app.core.pagination import Page, Paging
from app.students import service
from app.students.schemas import AddStudentRequest, StudentOut

router = APIRouter(prefix="/api/students", tags=["students"])


@router.get(
    "",
    operation_id="listStudents",
    responses={**NOT_AUTHENTICATED_RESPONSE, **VALIDATION_RESPONSE},
)
def list_students(
    session: CurrentSession,
    paging: Paging,
    db: DbSession = Depends(get_db),  # noqa: B008
) -> Page[StudentOut]:
    """The teacher's students by name (case-insensitive), ties oldest first."""
    items, total = service.list_students(db, session.teacher_id, paging)
    return Page[StudentOut](
        items=[StudentOut.model_validate(s, from_attributes=True) for s in items],
        total=total,
        page=paging.page,
        page_size=paging.page_size,
    )


@router.post(
    "",
    status_code=201,
    operation_id="addStudent",
    responses={
        **NOT_AUTHENTICATED_RESPONSE,
        **UNSUPPORTED_MEDIA_TYPE_RESPONSE,
        **VALIDATION_RESPONSE,
    },
)
def add_student(
    body: AddStudentRequest,
    session: CurrentSession,
    db: DbSession = Depends(get_db),  # noqa: B008
) -> StudentOut:
    """Add a student with a trimmed name of 1 to 100 characters."""
    student = service.add_student(db, session.teacher_id, body.name)
    return StudentOut.model_validate(student, from_attributes=True)
