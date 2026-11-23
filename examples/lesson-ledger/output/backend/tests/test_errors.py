"""Every backend error uses the conventions' error body (spec Behavior: Backend errors)."""

from collections.abc import Iterator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from tests.accounts_support import Accounts, sign_in_client


def _error(code: str, message: str) -> dict[str, object]:
    return {"error": {"code": code, "message": message, "details": {}}}


@pytest.fixture
def app_with_probe_routes(app: FastAPI) -> Iterator[FastAPI]:
    """Test-only routes that trigger validation and unhandled errors."""

    def needs_int(count: int) -> dict[str, int]:
        return {"count": count}

    def explodes() -> None:
        raise RuntimeError("secret internal detail")

    app.add_api_route("/api/test-probe/validation", needs_int, methods=["GET"])
    app.add_api_route("/api/test-probe/crash", explodes, methods=["GET"])
    yield app


@pytest.fixture
def probe_client(app_with_probe_routes: FastAPI, accounts: Accounts) -> Iterator[TestClient]:
    with TestClient(app_with_probe_routes, raise_server_exceptions=False) as c:
        sign_in_client(c, accounts)
        yield c


def test_unknown_api_path_returns_404_error_body(client: TestClient) -> None:
    response = client.get("/api/does-not-exist")

    assert response.status_code == 404
    assert response.json() == _error("not_found", "Not found")


def test_unknown_root_path_returns_404_error_body(client: TestClient) -> None:
    response = client.get("/nope")

    assert response.status_code == 404
    assert response.json() == _error("not_found", "Not found")


def test_wrong_method_returns_405_error_body(client: TestClient) -> None:
    response = client.post("/health")

    assert response.status_code == 405
    assert response.json() == _error("method_not_allowed", "Method not allowed")


def test_validation_error_returns_422_error_body(probe_client: TestClient) -> None:
    response = probe_client.get("/api/test-probe/validation", params={"count": "many"})

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "validation_error"
    assert body["error"]["message"] == "Request validation failed"
    assert isinstance(body["error"]["details"], dict)
    assert body["error"]["details"]["errors"][0]["loc"] == ["query", "count"]


def test_unhandled_exception_returns_500_without_internals(probe_client: TestClient) -> None:
    response = probe_client.get("/api/test-probe/crash")

    assert response.status_code == 500
    assert response.json() == _error("internal_error", "Internal server error")
    assert "secret" not in response.text
    assert "Traceback" not in response.text
    assert response.headers["X-Request-ID"]


@pytest.mark.parametrize("path", ["/docs", "/redoc", "/openapi.json"])
def test_no_endpoints_besides_health_are_exposed(client: TestClient, path: str) -> None:
    assert client.get(path).status_code == 404
