"""Request ids and JSON request logs (spec Behavior: Logging; Security: X-Request-ID validation)."""

import json
import logging
import re
import sys

import pytest
from fastapi.testclient import TestClient

from app.core.logging import JsonFormatter

GENERATED_ID = re.compile(r"^[A-Za-z0-9._-]{1,64}$")


def test_valid_request_id_is_echoed(client: TestClient) -> None:
    response = client.get("/health", headers={"X-Request-ID": "abc.DEF_123-x"})

    assert response.headers["X-Request-ID"] == "abc.DEF_123-x"


@pytest.mark.parametrize(
    "bad_id",
    ["", "has space", "x" * 65, "semi;colon", 'quote"d', "tab\tchar", "ünïcode"],
)
def test_invalid_request_id_is_replaced(client: TestClient, bad_id: str) -> None:
    response = client.get("/health", headers={b"X-Request-ID": bad_id.encode()})

    returned = response.headers["X-Request-ID"]
    assert returned != bad_id
    assert GENERATED_ID.match(returned)


def test_missing_request_id_is_generated_and_unique(client: TestClient) -> None:
    first = client.get("/health").headers["X-Request-ID"]
    second = client.get("/health").headers["X-Request-ID"]

    assert GENERATED_ID.match(first)
    assert first != second


def test_request_id_header_on_error_responses(client: TestClient) -> None:
    response = client.get("/api/nothing-here", headers={"X-Request-ID": "trace-404"})

    assert response.headers["X-Request-ID"] == "trace-404"


def test_one_json_log_line_per_request(
    client: TestClient, caplog: pytest.LogCaptureFixture
) -> None:
    with caplog.at_level(logging.INFO, logger="app.request"):
        client.get("/health", headers={"X-Request-ID": "log-me-1"})

    records = [r for r in caplog.records if r.name == "app.request"]
    assert len(records) == 1
    line = JsonFormatter().format(records[0])
    assert "\n" not in line
    entry = json.loads(line)
    assert entry["request_id"] == "log-me-1"
    assert entry["method"] == "GET"
    assert entry["path"] == "/health"
    assert entry["status_code"] == 200
    assert isinstance(entry["duration_ms"], (int, float))
    assert entry["level"] == "INFO"


def test_invalid_request_id_is_not_logged(
    client: TestClient, caplog: pytest.LogCaptureFixture
) -> None:
    with caplog.at_level(logging.INFO, logger="app.request"):
        client.get("/health", headers={"X-Request-ID": "evil value"})

    entry = json.loads(JsonFormatter().format(caplog.records[-1]))
    assert entry["request_id"] != "evil value"
    assert "evil value" not in json.dumps(entry)


def test_json_formatter_includes_exception_trace() -> None:
    try:
        raise ValueError("boom")
    except ValueError:
        exc_info = sys.exc_info()
    record = logging.LogRecord("app", logging.ERROR, __file__, 1, "failed", None, exc_info)

    entry = json.loads(JsonFormatter().format(record))
    assert entry["message"] == "failed"
    assert "ValueError: boom" in entry["exc_info"]
