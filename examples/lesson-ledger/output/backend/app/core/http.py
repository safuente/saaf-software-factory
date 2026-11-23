"""Request rules shared by every endpoint."""

from fastapi import Request

from app.core.config import Settings
from app.core.errors import unsupported_media_type

_BODY_METHODS = frozenset({"POST", "PUT", "PATCH"})


def require_json_body(request: Request) -> None:
    """CSRF rule of ADR-004: requests with a body accept only JSON, which a cross-site form
    cannot send without a CORS preflight."""
    if request.method not in _BODY_METHODS:
        return
    media_type = request.headers.get("content-type", "").split(";", 1)[0].strip().lower()
    if media_type != "application/json":
        raise unsupported_media_type()


def get_settings(request: Request) -> Settings:
    settings: Settings = request.app.state.settings
    return settings
