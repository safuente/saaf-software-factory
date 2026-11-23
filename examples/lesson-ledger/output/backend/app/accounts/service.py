"""Sign-up, login, session lookup and logout (ADR-004)."""

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session as DbSession

from app.accounts.models import Session, Teacher
from app.accounts.rules import normalize_email
from app.accounts.security import (
    hash_password,
    hash_session_token,
    new_session_token,
    verify_password,
)

SESSION_LIFETIME = timedelta(days=14)
_UNIQUE_VIOLATION = "23505"


class EmailTakenError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


@dataclass(frozen=True)
class StartedSession:
    session: Session
    token: str


def _now() -> datetime:
    return datetime.now(UTC).replace(microsecond=0)


def _start_session(db: DbSession, teacher: Teacher, previous_token: str | None) -> StartedSession:
    """New session with a fresh token; a session the request already carried is deleted."""
    if previous_token:
        db.execute(delete(Session).where(Session.token_hash == hash_session_token(previous_token)))
    token = new_session_token()
    created_at = _now()
    session = Session(
        teacher=teacher,
        token_hash=hash_session_token(token),
        created_at=created_at,
        expires_at=created_at + SESSION_LIFETIME,
    )
    db.add(session)
    db.commit()
    return StartedSession(session=session, token=token)


def sign_up(db: DbSession, email: str, password: str, previous_token: str | None) -> StartedSession:
    """`email` is already normalized. Raises EmailTakenError, also for a concurrent duplicate."""
    teacher = Teacher(email=email, password_hash=hash_password(password), created_at=_now())
    db.add(teacher)
    try:
        db.flush()
    except IntegrityError as exc:
        db.rollback()
        if getattr(exc.orig, "sqlstate", None) == _UNIQUE_VIOLATION:
            raise EmailTakenError from None
        raise
    return _start_session(db, teacher, previous_token)


def log_in(db: DbSession, email: str, password: str, previous_token: str | None) -> StartedSession:
    """Raises InvalidCredentialsError for an unknown email or a wrong password alike; the
    password check runs in both cases so timing does not reveal registered emails."""
    teacher = db.scalars(
        select(Teacher).where(Teacher.email == normalize_email(email))
    ).one_or_none()
    if not verify_password(teacher.password_hash if teacher else None, password) or not teacher:
        raise InvalidCredentialsError
    return _start_session(db, teacher, previous_token)


def find_active_session(db: DbSession, token: str | None) -> Session | None:
    """The unexpired session for this cookie token; unknown or malformed tokens give None."""
    if not token:
        return None
    return db.scalars(
        select(Session).where(
            Session.token_hash == hash_session_token(token), Session.expires_at > _now()
        )
    ).one_or_none()


def end_session(db: DbSession, session: Session) -> None:
    db.delete(session)
    db.commit()
