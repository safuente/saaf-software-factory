"""Checks against the running stack of this worktree (`make up`), at API_URL and APP_URL."""

import os
import subprocess
import uuid
from pathlib import Path

import httpx2 as httpx
import pytest

API_URL = os.environ.get("API_URL", "")
APP_URL = os.environ.get("APP_URL", "")

if not (API_URL and APP_URL):
    pytest.fail("API_URL and APP_URL are not set; run the tests through make", pytrace=False)


def test_ac2_backend_health_ok() -> None:
    response = httpx.get(f"{API_URL}/health", timeout=5)

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response.headers["X-Request-ID"]


def test_ac5_frontend_proxies_api_health_unchanged() -> None:
    direct = httpx.get(f"{API_URL}/health", timeout=5)
    proxied = httpx.get(f"{APP_URL}/api/health", headers={"X-Request-ID": "via-proxy"}, timeout=5)

    assert proxied.status_code == direct.status_code
    assert proxied.json() == direct.json()
    assert proxied.headers["X-Request-ID"] == "via-proxy"


def test_ac5_unknown_api_path_through_proxy_is_backend_404() -> None:
    response = httpx.get(f"{APP_URL}/api/no-such-thing", timeout=5)

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_ac5_client_side_path_returns_shell() -> None:
    root = httpx.get(f"{APP_URL}/", timeout=5)
    deep = httpx.get(f"{APP_URL}/any/client/path", timeout=5)

    assert root.status_code == deep.status_code == 200
    assert deep.text == root.text
    assert "<title>Lesson Ledger</title>" in deep.text
    assert deep.headers["content-type"].startswith("text/html")


def test_frontend_sends_security_headers() -> None:
    for path in ("/", "/any/client/path", "/api/health"):
        headers = httpx.get(f"{APP_URL}{path}", timeout=5).headers

        assert headers["X-Content-Type-Options"] == "nosniff", path
        assert headers["Referrer-Policy"] == "same-origin", path
        csp = headers["Content-Security-Policy"]
        assert "default-src 'self'" in csp, path
        assert "frame-ancestors 'none'" in csp, path


def test_frontend_does_not_advertise_server_version() -> None:
    server = httpx.get(f"{APP_URL}/", timeout=5).headers.get("Server", "")

    assert not any(ch.isdigit() for ch in server)


def test_backend_has_no_cors() -> None:
    response = httpx.get(f"{API_URL}/health", headers={"Origin": "http://evil.example"}, timeout=5)

    assert "access-control-allow-origin" not in response.headers


ROOT = Path(__file__).resolve().parents[3]


@pytest.mark.parametrize(
    ("service", "container_port"), [("db", 5432), ("backend", 8000), ("frontend", 8080)]
)
def test_published_ports_bind_to_loopback_only(service: str, container_port: int) -> None:
    """SEC-1: the local stack must not be reachable from other hosts on the network."""
    result = subprocess.run(  # noqa: S603 (fixed argv, no user input)
        ["docker", "compose", "port", service, str(container_port)],  # noqa: S607
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    )

    host_ip = result.stdout.strip().rsplit(":", 1)[0]
    assert host_ip == "127.0.0.1"


def test_ac6_make_seed_runs_twice_and_seeded_accounts_log_in() -> None:
    for _ in range(2):
        result = subprocess.run(
            ["make", "seed"],  # noqa: S607
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        assert result.returncode == 0, result.stdout + result.stderr
        assert len(result.stdout.strip().splitlines()) == 1

    for email, password in (
        ("alice@example.com", "alice-ledger-pass"),
        ("bob@example.com", "bob-ledger-pass1"),
    ):
        response = httpx.post(
            f"{API_URL}/api/sessions", json={"email": email, "password": password}, timeout=5
        )
        assert response.status_code == 200, email


def _backend_logs() -> str:
    return subprocess.run(
        ["docker", "compose", "logs", "--no-log-prefix", "backend"],  # noqa: S607
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    ).stdout


def test_ac1_ac2_backend_logs_of_account_requests_hold_no_email_or_password() -> None:
    run = uuid.uuid4().hex[:12]
    email = f"Stack-{run}@Example.com"
    password = f"pw-{run}-secret"
    calls = [
        ("signup", "/api/teachers", email, password, 201),
        ("duplicate", "/api/teachers", email.upper(), password, 409),
        ("wrong", "/api/sessions", email, f"{password}-wrong", 401),
        ("unknown", "/api/sessions", f"nobody-{run}@example.com", password, 401),
    ]
    for name, path, sent_email, sent_password, expected in calls:
        response = httpx.post(
            f"{API_URL}{path}",
            json={"email": sent_email, "password": sent_password},
            headers={"X-Request-ID": f"{name}-{run}"},
            timeout=5,
        )
        assert response.status_code == expected, name

    logs = _backend_logs()
    request_lines = [line for line in logs.splitlines() if run in line]
    assert len(request_lines) == len(calls)
    for line in request_lines:
        assert email.lower() not in line.lower()
        assert f"nobody-{run}" not in line
        assert password not in line
