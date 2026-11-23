from datetime import UTC, datetime
from typing import Annotated

from pydantic import BaseModel, Field, PlainSerializer, WithJsonSchema, field_validator
from pydantic_core import PydanticCustomError

from app.accounts.rules import (
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    is_valid_email,
    normalize_email,
)


def _utc_iso(value: datetime) -> str:
    return value.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


UtcDateTime = Annotated[
    datetime,
    PlainSerializer(_utc_iso, return_type=str),
    WithJsonSchema({"type": "string", "format": "date-time"}),
]


class SignUpRequest(BaseModel):
    email: str
    password: Annotated[str, Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)]

    @field_validator("email")
    @classmethod
    def _normalized_valid_email(cls, value: str) -> str:
        normalized = normalize_email(value)
        if not is_valid_email(normalized):
            raise PydanticCustomError("email_invalid", "Enter a valid email address")
        return normalized


class LogInRequest(BaseModel):
    """No format or length rules: any mismatch is reported as invalid credentials."""

    email: str
    password: str


class TeacherOut(BaseModel):
    email: str


class SessionBody(BaseModel):
    teacher: TeacherOut
    expires_at: UtcDateTime
