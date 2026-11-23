"""AC-5: sessions expire 14 days after creation, fixed, checked on the server."""

import pytest
from fastapi.testclient import TestClient

from tests.accounts_support import Accounts, cookie_header, not_authenticated, session_cookie


@pytest.fixture
def signed_up(client: TestClient, accounts: Accounts) -> tuple[str, str]:
    email = accounts.fresh()
    token = session_cookie(
        client.post("/api/teachers", json={"email": email, "password": "correct-horse-1"})
    )
    client.cookies.clear()
    return email, token


def test_ac5_session_created_14_days_minus_1_minute_ago_is_valid(
    client: TestClient, accounts: Accounts, signed_up: tuple[str, str]
) -> None:
    email, token = signed_up
    accounts.age_sessions(email, "14 days - 1 minute")

    response = client.get("/api/sessions/current", headers=cookie_header(token))

    assert response.status_code == 200
    assert response.json()["teacher"] == {"email": email}


def test_ac5_session_created_14_days_plus_1_minute_ago_is_rejected(
    client: TestClient, accounts: Accounts, signed_up: tuple[str, str]
) -> None:
    email, token = signed_up
    accounts.age_sessions(email, "14 days + 1 minute")

    for method in ("GET", "DELETE"):
        response = client.request(method, "/api/sessions/current", headers=cookie_header(token))
        assert response.status_code == 401
        assert response.json() == not_authenticated()


def test_ac5_using_a_session_does_not_extend_it(
    client: TestClient, accounts: Accounts, signed_up: tuple[str, str]
) -> None:
    email, token = signed_up
    [before] = accounts.sessions(email)

    client.get("/api/sessions/current", headers=cookie_header(token))

    assert accounts.sessions(email) == [before]
    assert (
        "set-cookie"
        not in client.get("/api/sessions/current", headers=cookie_header(token)).headers
    )
