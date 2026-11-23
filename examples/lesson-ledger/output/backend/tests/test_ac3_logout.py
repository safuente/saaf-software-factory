"""AC-3: logout deletes the session on the server and clears the cookie."""

from fastapi.testclient import TestClient

from tests.accounts_support import (
    Accounts,
    cookie_header,
    not_authenticated,
    session_cookie,
    set_cookie_attributes,
)


def test_ac3_logout_returns_204_clears_cookie_and_revokes_session(
    client: TestClient, accounts: Accounts
) -> None:
    email = accounts.fresh()
    token = session_cookie(
        client.post("/api/teachers", json={"email": email, "password": "correct-horse-1"})
    )
    client.cookies.clear()

    response = client.delete("/api/sessions/current", headers=cookie_header(token))

    assert response.status_code == 204
    assert response.content == b""
    cleared = set_cookie_attributes(response)
    assert cleared is not None
    assert cleared["value"] == ""
    assert cleared["max-age"] == "0"
    assert cleared["path"] == "/"
    assert accounts.sessions(email) == []
    old = client.get("/api/sessions/current", headers=cookie_header(token))
    assert old.status_code == 401
    assert old.json() == not_authenticated()
