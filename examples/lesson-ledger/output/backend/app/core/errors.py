"""Error body of conventions §4 for every backend error response."""

import logging
from collections.abc import Mapping
from http import HTTPStatus
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.exc import DBAPIError, SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("app.error")

_HTTP_ERROR_CODES = {
    HTTPStatus.NOT_FOUND: ("not_found", "Not found"),
    HTTPStatus.METHOD_NOT_ALLOWED: ("method_not_allowed", "Method not allowed"),
}


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: dict[str, Any]


class ErrorResponse(BaseModel):
    error: ErrorDetail


VALIDATION_RESPONSE: dict[int | str, dict[str, Any]] = {
    422: {"model": ErrorResponse, "description": "Invalid input"}
}
UNSUPPORTED_MEDIA_TYPE_RESPONSE: dict[int | str, dict[str, Any]] = {
    415: {"model": ErrorResponse, "description": "Body is not JSON"}
}
NOT_FOUND_RESPONSE: dict[int | str, dict[str, Any]] = {
    404: {"model": ErrorResponse, "description": "Not found, or not the teacher's"}
}


class AppError(Exception):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details or {}


def error_response(
    status_code: int,
    code: str,
    message: str,
    details: dict[str, Any] | None = None,
    headers: Mapping[str, str] | None = None,
) -> JSONResponse:
    body = ErrorResponse(error=ErrorDetail(code=code, message=message, details=details or {}))
    return JSONResponse(
        body.model_dump(), status_code=status_code, headers=dict(headers) if headers else None
    )


def internal_error_response() -> JSONResponse:
    return error_response(500, "internal_error", "Internal server error")


async def _app_error(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, AppError)  # noqa: S101
    return error_response(exc.status_code, exc.code, exc.message, exc.details)


async def _http_error(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, StarletteHTTPException)  # noqa: S101
    status = HTTPStatus(exc.status_code)
    code, message = _HTTP_ERROR_CODES.get(status, ("http_error", status.phrase))
    return error_response(exc.status_code, code, message, headers=exc.headers)


async def _validation_error(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, RequestValidationError)  # noqa: S101
    errors = [
        {"loc": list(err["loc"]), "msg": err["msg"], "type": err["type"]} for err in exc.errors()
    ]
    return error_response(422, "validation_error", "Request validation failed", {"errors": errors})


async def _database_error(request: Request, exc: Exception) -> JSONResponse:
    """Logs the exception class and SQLSTATE only: driver messages can quote input values."""
    sqlstate = getattr(exc.orig, "sqlstate", None) if isinstance(exc, DBAPIError) else None
    logger.error(
        "database error",
        extra={
            "request_id": getattr(request.state, "request_id", None),
            "error_class": type(exc).__name__,
            "sqlstate": sqlstate,
        },
    )
    return internal_error_response()


def unsupported_media_type() -> AppError:
    return AppError(415, "unsupported_media_type", "Content-Type must be application/json")


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, _app_error)
    app.add_exception_handler(SQLAlchemyError, _database_error)
    app.add_exception_handler(StarletteHTTPException, _http_error)
    app.add_exception_handler(RequestValidationError, _validation_error)
