import dataclasses
import time

from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app
from tests.tcp_proxy import TcpProxy, free_port

OK = {"status": "ok"}
DB_DOWN = {
    "error": {
        "code": "database_unavailable",
        "message": "Database is not reachable",
        "details": {},
    }
}


def _client_for(settings: Settings) -> TestClient:
    return TestClient(create_app(settings), raise_server_exceptions=False)


def test_ac2_health_returns_ok_when_database_reachable(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == OK


def test_ac5_api_health_matches_health(client: TestClient) -> None:
    direct = client.get("/health")
    proxied_path = client.get("/api/health")

    assert proxied_path.status_code == direct.status_code == 200
    assert proxied_path.json() == direct.json() == OK


def test_ac4_health_returns_503_when_database_refuses_connections(settings: Settings) -> None:
    closed_port = free_port()
    with _client_for(dataclasses.replace(settings, db_host="127.0.0.1", db_port=closed_port)) as c:
        started = time.monotonic()
        response = c.get("/health")
        elapsed = time.monotonic() - started

    assert response.status_code == 503
    assert response.json() == DB_DOWN
    assert elapsed < 5


def test_ac4_health_answers_within_5s_when_database_host_does_not_answer(
    settings: Settings,
) -> None:
    # 192.0.2.0/24 is reserved for documentation (RFC 5737): packets go nowhere.
    with _client_for(dataclasses.replace(settings, db_host="192.0.2.1")) as c:
        started = time.monotonic()
        response = c.get("/api/health")
        elapsed = time.monotonic() - started

    assert response.status_code == 503
    assert response.json() == DB_DOWN
    assert elapsed < 5


def test_ac4_health_recovers_without_restarting_the_backend(settings: Settings) -> None:
    proxy = TcpProxy(settings.db_host, settings.db_port)
    proxy.start()
    try:
        proxied = dataclasses.replace(settings, db_host="127.0.0.1", db_port=proxy.port)
        with _client_for(proxied) as c:
            assert c.get("/health").status_code == 200

            proxy.stop()
            started = time.monotonic()
            down = c.get("/health")
            assert time.monotonic() - started < 5
            assert down.status_code == 503
            assert down.json() == DB_DOWN

            proxy.start()
            deadline = time.monotonic() + 30
            while (up := c.get("/health")).status_code != 200 and time.monotonic() < deadline:
                time.sleep(0.5)
            assert up.status_code == 200
            assert up.json() == OK
    finally:
        proxy.stop()


def test_health_503_body_reveals_no_database_details(settings: Settings) -> None:
    with _client_for(dataclasses.replace(settings, db_host="127.0.0.1", db_port=free_port())) as c:
        text = c.get("/health").text

    for leak in ("psycopg", "OperationalError", "127.0.0.1", "connection", settings.db_user):
        assert leak not in text
