"""AC-2: log in (POST /api/sessions); spec Behavior: Login timing, Sessions, Logging."""

import json
import logging
import statistics
import time
from datetime import UTC, datetime, timedelta

import httpx2 as httpx
import pytest
from fastapi.testclient import TestClient

from app.accounts.security import hash_session_token
from app.core.logging import JsonFormatter
from tests.accounts_support import (
    FOURTEEN_DAYS_SECONDS,
    Accounts,
    cookie_header,
    session_cookie,
    set_cookie_attributes,
)

PASSWORD = "alice-ledger-pass"
INVALID_CREDENTIALS = {
    "error": {
        "code": "invalid_credentials",
        "message": "Email or password is incorrect.",
        "details": {},
    }
}


def _login(
    client: TestClient, email: str, password: str, headers: dict[str, str] | None = None
) -> httpx.Response:
    return client.post(
        "/api/sessions", json={"email": email, "password": password}, headers=headers
    )


@pytest.fixture
def teacher(client: TestClient, accounts: Accounts) -> str:
    email = accounts.fresh()
    assert (
        client.post("/api/teachers", json={"email": email, "password": PASSWORD}).status_code == 201
    )
    client.cookies.clear()
    return email


def test_ac2_login_any_case_returns_200_session_body_and_cookie(
    client: TestClient, accounts: Accounts, teacher: str
) -> None:
    response = _login(client, teacher.upper(), PASSWORD)

    assert response.status_code == 200
    body = response.json()
    assert body["teacher"] == {"email": teacher}
    newest = max(accounts.sessions(teacher))
    created_at, expires_at, _ = newest
    assert datetime.fromisoformat(body["expires_at"]) == expires_at
    assert expires_at == created_at + timedelta(days=14)
    assert abs(datetime.now(UTC) - created_at) < timedelta(minutes=1)
    cookie = set_cookie_attributes(response)
    assert cookie is not None
    assert "httponly" in cookie
    assert cookie["samesite"].lower() == "lax"
    assert cookie["path"] == "/"
    assert cookie["max-age"] == str(FOURTEEN_DAYS_SECONDS)


def test_ac2_login_with_padded_email_succeeds(client: TestClient, teacher: str) -> None:
    assert _login(client, f"  {teacher} ", PASSWORD).status_code == 200


def test_ac2_wrong_password_and_unknown_email_get_identical_401(
    client: TestClient, teacher: str, caplog: pytest.LogCaptureFixture
) -> None:
    with caplog.at_level(logging.DEBUG):
        wrong_password = _login(client, teacher, "wrong-password-123")
        unknown_email = _login(client, "nobody@example.com", "any-password-at-all")

    for response in (wrong_password, unknown_email):
        assert response.status_code == 401
        assert response.json() == INVALID_CREDENTIALS
        assert "set-cookie" not in response.headers
    assert wrong_password.content == unknown_email.content
    logged = "\n".join(JsonFormatter().format(r) for r in caplog.records).lower()
    for value in (teacher, "nobody", "wrong-password-123", "any-password-at-all"):
        assert value not in logged


@pytest.mark.parametrize("email", ["not-an-email", "a@b", "", "   "])
def test_login_with_syntactically_wrong_email_returns_401(client: TestClient, email: str) -> None:
    response = _login(client, email, PASSWORD)

    assert response.status_code == 401
    assert response.json() == INVALID_CREDENTIALS


def test_login_with_password_over_128_characters_returns_401(
    client: TestClient, teacher: str
) -> None:
    response = _login(client, teacher, PASSWORD + "x" * 200)

    assert response.status_code == 401
    assert response.json() == INVALID_CREDENTIALS


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"email": "a@example.com"},
        {"password": PASSWORD},
        {"email": 5, "password": PASSWORD},
        {"email": "a@example.com", "password": ["x"]},
    ],
)
def test_login_missing_or_non_string_field_returns_422(
    client: TestClient, payload: dict[str, object]
) -> None:
    response = client.post("/api/sessions", json=payload)

    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "validation_error"
    assert PASSWORD not in json.dumps(error)


def test_login_accepts_json_only(client: TestClient) -> None:
    response = client.post(
        "/api/sessions",
        content="email=a%40example.com&password=x",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    assert response.status_code == 415
    assert response.json()["error"]["code"] == "unsupported_media_type"


def test_login_creates_fresh_token_and_deletes_the_session_it_carried(
    client: TestClient, accounts: Accounts, teacher: str
) -> None:
    first = session_cookie(_login(client, teacher, PASSWORD))
    client.cookies.clear()

    second = session_cookie(_login(client, teacher, PASSWORD, headers=cookie_header(first)))

    assert second != first
    stored = {token_hash for _, _, token_hash in accounts.sessions(teacher)}
    assert hash_session_token(first) not in stored
    assert hash_session_token(second) in stored


def test_login_timing_does_not_reveal_registered_emails(client: TestClient, teacher: str) -> None:
    def median_seconds(email: str) -> float:
        samples = []
        for _ in range(5):
            started = time.perf_counter()
            assert _login(client, email, "wrong-password-123").status_code == 401
            samples.append(time.perf_counter() - started)
        return statistics.median(samples)

    _login(client, "warm-up@example.com", "wrong-password-123")
    registered = median_seconds(teacher)
    unregistered = median_seconds("nobody-here@example.com")

    assert 0.5 < unregistered / registered < 2
