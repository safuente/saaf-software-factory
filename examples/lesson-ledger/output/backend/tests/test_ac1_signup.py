"""AC-1: sign up with email and password (POST /api/teachers); spec Behavior: Email and Password
rules, Validation on the server, Duplicate email, Logging; Interfaces: JSON only, cookie."""

import dataclasses
import json
import logging
import threading
from datetime import UTC, datetime, timedelta

import httpx2 as httpx
import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.core.logging import JsonFormatter
from app.main import create_app
from tests.accounts_support import (
    FOURTEEN_DAYS_SECONDS,
    Accounts,
    session_cookie,
    set_cookie_attributes,
)

CAROL = "carol@example.com"
PASSWORD = "correct-horse-1"


def _signup(client: TestClient, email: str, password: str = PASSWORD) -> httpx.Response:
    return client.post("/api/teachers", json={"email": email, "password": password})


def _log_text(caplog: pytest.LogCaptureFixture) -> str:
    formatter = JsonFormatter()
    return "\n".join(formatter.format(record) for record in caplog.records)


def test_ac1_signup_returns_201_session_body_and_cookie(
    client: TestClient, accounts: Accounts
) -> None:
    accounts.forget(CAROL)
    before = datetime.now(UTC).replace(microsecond=0)

    response = client.post(
        "/api/teachers", json={"email": " Carol@Example.com ", "password": PASSWORD}
    )

    assert response.status_code == 201
    body = response.json()
    assert set(body) == {"teacher", "expires_at"}
    assert body["teacher"] == {"email": CAROL}
    assert body["expires_at"].endswith("Z")
    expires_at = datetime.fromisoformat(body["expires_at"])
    [(created_at, stored_expires_at, _)] = accounts.sessions(CAROL)
    assert stored_expires_at == expires_at == created_at + timedelta(days=14)
    assert before <= created_at <= datetime.now(UTC)

    cookie = set_cookie_attributes(response)
    assert cookie is not None
    assert len(cookie["value"]) >= 43  # 32 random bytes, URL-safe base64
    assert "httponly" in cookie
    assert cookie["samesite"].lower() == "lax"
    assert cookie["path"] == "/"
    assert cookie["max-age"] == str(FOURTEEN_DAYS_SECONDS)
    assert "secure" not in cookie


def test_ac1_cookie_is_secure_when_configured(settings: Settings, accounts: Accounts) -> None:
    secure_app = create_app(dataclasses.replace(settings, session_cookie_secure=True))
    with TestClient(secure_app, raise_server_exceptions=False) as client:
        response = _signup(client, accounts.fresh())
    secure_app.state.engine.dispose()

    cookie = set_cookie_attributes(response)
    assert cookie is not None
    assert "secure" in cookie


def test_ac1_stores_argon2id_hash_and_token_hash_only(
    client: TestClient, accounts: Accounts
) -> None:
    email = accounts.fresh()
    response = _signup(client, email)

    assert accounts.password_hash(email).startswith("$argon2id$")
    assert PASSWORD not in accounts.password_hash(email)
    [(_, _, token_hash)] = accounts.sessions(email)
    assert session_cookie(response) not in token_hash


def test_ac1_each_signup_gets_a_different_token(client: TestClient, accounts: Accounts) -> None:
    first = session_cookie(_signup(client, accounts.fresh()))
    second = session_cookie(_signup(client, accounts.fresh()))

    assert first != second


def test_ac1_duplicate_email_in_other_case_returns_409(
    client: TestClient, accounts: Accounts, caplog: pytest.LogCaptureFixture
) -> None:
    accounts.forget(CAROL)
    assert _signup(client, " Carol@Example.com ").status_code == 201

    with caplog.at_level(logging.DEBUG):
        response = _signup(client, "CAROL@example.com", "another-valid-password")

    assert response.status_code == 409
    assert response.json() == {
        "error": {
            "code": "email_taken",
            "message": "An account with this email already exists.",
            "details": {},
        }
    }
    assert set_cookie_attributes(response) is None
    assert accounts.count(CAROL) == 1
    logged = _log_text(caplog).lower()
    assert "carol" not in logged
    assert "another-valid-password" not in logged
    assert not [r for r in caplog.records if r.exc_info or r.levelno >= logging.ERROR]


def test_ac1_signup_logs_neither_email_nor_password(
    client: TestClient, accounts: Accounts, caplog: pytest.LogCaptureFixture
) -> None:
    accounts.forget(CAROL)
    with caplog.at_level(logging.DEBUG):
        _signup(client, " Carol@Example.com ")

    logged = _log_text(caplog).lower()
    assert "carol" not in logged
    assert PASSWORD not in logged


def test_ac1_concurrent_duplicate_signups_one_201_one_409(
    settings: Settings, accounts: Accounts
) -> None:
    email = accounts.fresh()
    barrier = threading.Barrier(2)
    statuses: list[int] = []

    def sign_up() -> None:
        # One app (and engine) per thread, like two backend workers.
        with TestClient(create_app(settings), raise_server_exceptions=False) as client:
            barrier.wait()
            statuses.append(_signup(client, email).status_code)

    threads = [threading.Thread(target=sign_up) for _ in range(2)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    assert sorted(statuses) == [201, 409]
    assert accounts.count(email) == 1


@pytest.mark.parametrize(
    ("payload", "field"),
    [
        ({"email": "carol@", "password": PASSWORD}, "email"),
        ({"email": CAROL, "password": "x" * 11}, "password"),
    ],
)
def test_ac1_invalid_input_returns_422_without_echoing_values(
    client: TestClient, accounts: Accounts, payload: dict[str, str], field: str
) -> None:
    accounts.forget(CAROL)
    response = client.post("/api/teachers", json=payload)

    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "validation_error"
    [detail] = error["details"]["errors"]
    assert set(detail) == {"loc", "msg", "type"}
    assert detail["loc"] == ["body", field]
    assert payload[field] not in json.dumps(error)
    assert accounts.count(CAROL) == 0


@pytest.mark.parametrize(
    "email",
    [
        "a@b.c",
        "first.last+tag@sub.example.org",
        "  padded@example.com\t",
        f"{'a' * 64}@{'b' * 180}.com",  # 249 characters
    ],
)
def test_email_rule_accepts(client: TestClient, accounts: Accounts, email: str) -> None:
    accounts.track(email.strip().lower())
    assert _signup(client, email).status_code == 201


@pytest.mark.parametrize(
    "email",
    [
        "",
        "   ",
        "a@",
        "@example.com",
        "no-at-sign.example.com",
        "two@@example.com",
        "a@b@example.com",
        "a b@example.com",
        "a@example",
        "a@.example",
        "a@example.",
        "a@b.",
        f"{'a' * 64}@{'b' * 186}.com",  # 255 characters
    ],
)
def test_email_rule_rejects(client: TestClient, email: str) -> None:
    response = _signup(client, email)

    assert response.status_code == 422
    assert response.json()["error"]["details"]["errors"][0]["loc"] == ["body", "email"]


@pytest.mark.parametrize(
    "password",
    ["x" * 12, "x" * 128, " " * 12, "é" * 12, "😀" * 12, " leading and trailing "],
)
def test_password_rule_accepts(client: TestClient, accounts: Accounts, password: str) -> None:
    assert _signup(client, accounts.fresh(), password).status_code == 201


@pytest.mark.parametrize("password", ["", "x" * 11, "😀" * 11, "x" * 129])
def test_password_rule_rejects(client: TestClient, password: str) -> None:
    response = _signup(client, "rule-check@example.com", password)

    assert response.status_code == 422
    assert response.json()["error"]["details"]["errors"][0]["loc"] == ["body", "password"]


@pytest.mark.parametrize(
    "payload",
    [{}, {"email": CAROL}, {"email": 1, "password": PASSWORD}, {"email": CAROL, "password": None}],
)
def test_signup_missing_or_non_string_field_returns_422(
    client: TestClient, payload: dict[str, object]
) -> None:
    response = client.post("/api/teachers", json=payload)

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


@pytest.mark.parametrize(
    ("content_type", "content"),
    [
        ("application/x-www-form-urlencoded", "email=a%40b.co&password=correct-horse-1"),
        ("text/plain", '{"email": "a@b.co", "password": "correct-horse-1"}'),
        ("multipart/form-data; boundary=x", "--x--"),
    ],
)
def test_signup_accepts_json_only(client: TestClient, content_type: str, content: str) -> None:
    response = client.post("/api/teachers", content=content, headers={"Content-Type": content_type})

    assert response.status_code == 415
    assert response.json() == {
        "error": {
            "code": "unsupported_media_type",
            "message": "Content-Type must be application/json",
            "details": {},
        }
    }
