"""Session authentication for every non-public endpoint (ADR-004).

Default-deny (F02 SEC-1): `authenticate_unless_public` runs before every route of the app and
answers 401 not_authenticated unless the route is on the explicit PUBLIC_ROUTES allow-list.
Endpoints that need the logged-in teacher take a `CurrentSession` parameter, which reuses the
session already checked for the request."""

from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.orm import Session as DbSession

from app.accounts import service
from app.accounts.models import Session
from app.core.db import get_db
from app.core.errors import AppError, ErrorResponse

SESSION_COOKIE = "ll_session"

PUBLIC_ROUTES = frozenset(
    {
        ("GET", "/health"),
        ("GET", "/api/health"),
        ("POST", "/api/teachers"),
        ("POST", "/api/sessions"),
    }
)

NOT_AUTHENTICATED_RESPONSE: dict[int | str, dict[str, object]] = {
    401: {"model": ErrorResponse, "description": "No valid session"}
}


def require_session(
    request: Request,
    db: DbSession = Depends(get_db),  # noqa: B008
) -> Session:
    session: Session | None = getattr(request.state, "session", None)
    if session is None:
        session = service.find_active_session(db, request.cookies.get(SESSION_COOKIE))
        if session is None:
            raise AppError(401, "not_authenticated", "Authentication required")
        request.state.session = session
    return session


def authenticate_unless_public(
    request: Request,
    db: DbSession = Depends(get_db),  # noqa: B008
) -> None:
    """App-wide dependency, registered first so it answers before body checks."""
    if (request.method, request.url.path) not in PUBLIC_ROUTES:
        require_session(request, db)


CurrentSession = Annotated[Session, Depends(require_session)]
