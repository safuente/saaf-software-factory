from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session as DbSession

from app.accounts import service
from app.accounts.auth import NOT_AUTHENTICATED_RESPONSE, SESSION_COOKIE, CurrentSession
from app.accounts.models import Session
from app.accounts.schemas import LogInRequest, SessionBody, SignUpRequest, TeacherOut
from app.core.config import Settings
from app.core.db import get_db
from app.core.errors import AppError, ErrorResponse
from app.core.http import get_settings

SESSION_COOKIE_MAX_AGE = int(service.SESSION_LIFETIME.total_seconds())

router = APIRouter(prefix="/api", tags=["accounts"])


def _session_body(session: Session) -> SessionBody:
    return SessionBody(
        teacher=TeacherOut(email=session.teacher.email), expires_at=session.expires_at
    )


def _set_session_cookie(response: Response, token: str, settings: Settings) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=SESSION_COOKIE_MAX_AGE,
        path="/",
        httponly=True,
        samesite="lax",
        secure=settings.session_cookie_secure,
    )


@router.post(
    "/teachers",
    status_code=201,
    operation_id="signUp",
    responses={
        409: {"model": ErrorResponse, "description": "An account with this email exists"},
        415: {"model": ErrorResponse, "description": "Body is not JSON"},
        422: {"model": ErrorResponse, "description": "Invalid email or password"},
    },
)
def sign_up(
    body: SignUpRequest,
    request: Request,
    response: Response,
    db: DbSession = Depends(get_db),  # noqa: B008
    settings: Settings = Depends(get_settings),  # noqa: B008
) -> SessionBody:
    """Create a teacher account and log it in."""
    try:
        started = service.sign_up(
            db, body.email, body.password, request.cookies.get(SESSION_COOKIE)
        )
    except service.EmailTakenError:
        raise AppError(409, "email_taken", "An account with this email already exists.") from None
    _set_session_cookie(response, started.token, settings)
    return _session_body(started.session)


@router.post(
    "/sessions",
    operation_id="logIn",
    responses={
        401: {"model": ErrorResponse, "description": "Email or password is incorrect"},
        415: {"model": ErrorResponse, "description": "Body is not JSON"},
        422: {"model": ErrorResponse, "description": "Missing or non-string field"},
    },
)
def log_in(
    body: LogInRequest,
    request: Request,
    response: Response,
    db: DbSession = Depends(get_db),  # noqa: B008
    settings: Settings = Depends(get_settings),  # noqa: B008
) -> SessionBody:
    """Log in with email and password; replaces any session the request carried."""
    try:
        started = service.log_in(db, body.email, body.password, request.cookies.get(SESSION_COOKIE))
    except service.InvalidCredentialsError:
        raise AppError(401, "invalid_credentials", "Email or password is incorrect.") from None
    _set_session_cookie(response, started.token, settings)
    return _session_body(started.session)


@router.get(
    "/sessions/current", operation_id="getCurrentSession", responses=NOT_AUTHENTICATED_RESPONSE
)
def get_current_session(session: CurrentSession) -> SessionBody:
    """The logged-in teacher and when the session expires."""
    return _session_body(session)


@router.delete(
    "/sessions/current",
    status_code=204,
    operation_id="logOut",
    responses=NOT_AUTHENTICATED_RESPONSE,
)
def log_out(
    session: CurrentSession,
    response: Response,
    db: DbSession = Depends(get_db),  # noqa: B008
    settings: Settings = Depends(get_settings),  # noqa: B008
) -> None:
    """Delete the session on the server and clear the cookie."""
    service.end_session(db, session)
    response.delete_cookie(
        SESSION_COOKIE,
        path="/",
        httponly=True,
        samesite="lax",
        secure=settings.session_cookie_secure,
    )
