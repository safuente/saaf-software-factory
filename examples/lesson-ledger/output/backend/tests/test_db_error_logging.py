"""Spec Behavior "Logging": unexpected database errors are logged with the exception class and
SQLSTATE only, never the driver's message text, which can quote input values."""

import json
import logging
from collections.abc import Iterator

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.core.logging import JsonFormatter
from tests.accounts_support import Accounts, sign_in_client

SECRET = "teacher-email-in-driver-message"


@pytest.fixture
def db_error_client(app: FastAPI, accounts: Accounts) -> Iterator[TestClient]:
    def fails_in_database(request: Request) -> None:
        with request.app.state.engine.connect() as conn:
            conn.execute(text("SELECT CAST(:value AS integer)"), {"value": SECRET})

    app.add_api_route("/api/test-probe/db-error", fails_in_database, methods=["GET"])
    with TestClient(app, raise_server_exceptions=False) as client:
        sign_in_client(client, accounts)
        yield client


def test_database_error_logs_class_and_sqlstate_only(
    db_error_client: TestClient, caplog: pytest.LogCaptureFixture
) -> None:
    with caplog.at_level(logging.DEBUG):
        response = db_error_client.get("/api/test-probe/db-error", headers={"X-Request-ID": "db-1"})

    assert response.status_code == 500
    assert response.json()["error"]["code"] == "internal_error"
    lines = [json.loads(JsonFormatter().format(r)) for r in caplog.records]
    assert SECRET not in json.dumps(lines)
    [error] = [line for line in lines if line["level"] == "ERROR"]
    assert error["error_class"] == "DataError"
    assert error["sqlstate"] == "22P02"
    assert error["request_id"] == "db-1"
