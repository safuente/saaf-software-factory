"""Helpers for account tests: unique emails, cookie parsing and direct database checks."""

import uuid
from datetime import datetime

import httpx2 as httpx
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.core.config import Settings
from app.core.db import create_db_engine

COOKIE = "ll_session"
FOURTEEN_DAYS_SECONDS = 14 * 24 * 60 * 60


def fresh_email() -> str:
    return f"t-{uuid.uuid4().hex[:16]}@example.com"


def set_cookie_attributes(response: httpx.Response, name: str = COOKIE) -> dict[str, str] | None:
    """Attributes of the Set-Cookie header for `name` (keys lower-cased), or None if not set."""
    for header in response.headers.get_list("set-cookie"):
        first, *attributes = [part.strip() for part in header.split(";")]
        cookie_name, _, value = first.partition("=")
        if cookie_name != name:
            continue
        parsed = {"value": value.strip('"')}
        for attribute in attributes:
            key, _, attr_value = attribute.partition("=")
            parsed[key.lower()] = attr_value
        return parsed
    return None


def session_cookie(response: httpx.Response) -> str:
    attributes = set_cookie_attributes(response)
    assert attributes is not None, "response did not set ll_session"
    return attributes["value"]


def cookie_header(token: str) -> dict[str, str]:
    return {"Cookie": f"{COOKIE}={token}"}


def sign_in_client(client: TestClient, accounts: Accounts) -> None:
    """Sign up a fresh teacher; the client keeps its session cookie for later requests.
    F02 makes the API default-deny, so test-only probe routes need a session."""
    response = client.post(
        "/api/teachers", json={"email": accounts.fresh(), "password": "correct-horse-1"}
    )
    assert response.status_code == 201


def not_authenticated() -> dict[str, object]:
    return {
        "error": {"code": "not_authenticated", "message": "Authentication required", "details": {}}
    }


class Accounts:
    def __init__(self, settings: Settings) -> None:
        self.engine = create_db_engine(settings)
        self.touched: set[str] = set()

    def forget(self, email: str) -> None:
        """Delete the teacher with this email, its lessons, students and sessions, now and after
        the test."""
        self.touched.add(email)
        with self.engine.begin() as conn:
            for table in ("lesson", "student"):
                conn.execute(
                    text(
                        f"DELETE FROM {table} WHERE teacher_id IN "  # noqa: S608
                        "(SELECT id FROM teacher WHERE email = :email)"
                    ),
                    {"email": email},
                )
            conn.execute(
                text(
                    "DELETE FROM session WHERE teacher_id IN "
                    "(SELECT id FROM teacher WHERE email = :email)"
                ),
                {"email": email},
            )
            conn.execute(text("DELETE FROM teacher WHERE email = :email"), {"email": email})

    def track(self, email: str) -> str:
        self.touched.add(email)
        return email

    def fresh(self) -> str:
        return self.track(fresh_email())

    def count(self, email: str) -> int:
        with self.engine.connect() as conn:
            return int(
                conn.execute(
                    text("SELECT count(*) FROM teacher WHERE lower(email) = lower(:email)"),
                    {"email": email},
                ).scalar_one()
            )

    def sessions(self, email: str) -> list[tuple[datetime, datetime, str]]:
        """(created_at, expires_at, token_hash) of the teacher's sessions."""
        with self.engine.connect() as conn:
            rows = conn.execute(
                text(
                    "SELECT s.created_at, s.expires_at, s.token_hash FROM session s "
                    "JOIN teacher t ON t.id = s.teacher_id WHERE t.email = :email"
                ),
                {"email": email},
            ).all()
        return [(row[0], row[1], row[2]) for row in rows]

    def password_hash(self, email: str) -> str:
        with self.engine.connect() as conn:
            return str(
                conn.execute(
                    text("SELECT password_hash FROM teacher WHERE email = :email"),
                    {"email": email},
                ).scalar_one()
            )

    def age_sessions(self, email: str, created_ago: str) -> None:
        """Move the teacher's sessions back in time, e.g. created_ago='14 days - 1 minute'."""
        with self.engine.begin() as conn:
            conn.execute(
                text(
                    "UPDATE session SET created_at = now() - CAST(:ago AS interval), "
                    "expires_at = now() - CAST(:ago AS interval) + interval '14 days' "
                    "WHERE teacher_id IN (SELECT id FROM teacher WHERE email = :email)"
                ),
                {"ago": created_ago, "email": email},
            )

    def close(self) -> None:
        for email in list(self.touched):
            self.forget(email)
        self.engine.dispose()
