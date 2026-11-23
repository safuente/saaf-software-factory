"""AC-4: protected endpoints answer 401 not_authenticated without a valid session; spec
Security: unknown or malformed cookie values are treated as no session."""

import pytest
from fastapi.testclient import TestClient

from tests.accounts_support import Accounts, cookie_header, not_authenticated, session_cookie

PASSWORD = "correct-horse-1"
PROTECTED = [("GET", "/api/sessions/current"), ("DELETE", "/api/sessions/current")]


def _sign_up(client: TestClient, email: str) -> str:
    token = session_cookie(
        client.post("/api/teachers", json={"email": email, "password": PASSWORD})
    )
    client.cookies.clear()
    return token


@pytest.mark.parametrize(("method", "path"), PROTECTED)
def test_ac4_no_cookie_returns_401(client: TestClient, method: str, path: str) -> None:
    response = client.request(method, path)

    assert response.status_code == 401
    assert response.json() == not_authenticated()


@pytest.mark.parametrize(("method", "path"), PROTECTED)
@pytest.mark.parametrize("value", ["not-a-real-token", "", "x" * 5000, "%00%ff", '"quoted"'])
def test_ac4_unknown_or_malformed_cookie_returns_401(
    client: TestClient, method: str, path: str, value: str
) -> None:
    response = client.request(method, path, headers=cookie_header(value))

    assert response.status_code == 401
    assert response.json() == not_authenticated()


@pytest.mark.parametrize(("method", "path"), PROTECTED)
def test_ac4_logged_out_session_cookie_returns_401(
    client: TestClient, accounts: Accounts, method: str, path: str
) -> None:
    token = _sign_up(client, accounts.fresh())
    assert client.delete("/api/sessions/current", headers=cookie_header(token)).status_code == 204

    response = client.request(method, path, headers=cookie_header(token))

    assert response.status_code == 401
    assert response.json() == not_authenticated()


def test_ac4_current_session_returns_session_body(client: TestClient, accounts: Accounts) -> None:
    email = accounts.fresh()
    token = _sign_up(client, email)

    response = client.get("/api/sessions/current", headers=cookie_header(token))

    assert response.status_code == 200
    body = response.json()
    assert body["teacher"] == {"email": email}
    [(_, expires_at, _)] = accounts.sessions(email)
    assert body["expires_at"] == expires_at.strftime("%Y-%m-%dT%H:%M:%SZ")
    assert "set-cookie" not in response.headers


def test_ac4_a_session_only_shows_its_own_teacher(client: TestClient, accounts: Accounts) -> None:
    first, second = accounts.fresh(), accounts.fresh()
    first_token = _sign_up(client, first)
    second_token = _sign_up(client, second)

    assert client.get("/api/sessions/current", headers=cookie_header(first_token)).json()[
        "teacher"
    ] == {"email": first}
    assert client.get("/api/sessions/current", headers=cookie_header(second_token)).json()[
        "teacher"
    ] == {"email": second}
