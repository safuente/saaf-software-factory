"""The committed OpenAPI schema is generated from the code (spec Behavior: OpenAPI contract)."""

import json
from pathlib import Path

from app.openapi import render_schema

COMMITTED_SCHEMA = Path(__file__).resolve().parents[1] / "openapi.json"


def test_ac6_committed_openapi_schema_matches_code() -> None:
    assert COMMITTED_SCHEMA.read_text() == render_schema()


def test_openapi_schema_contains_health_and_account_endpoints() -> None:
    """F01 adds the account endpoints (spec Interfaces) next to F00's health endpoints; F02 adds
    the student and lesson endpoints (F02 Interfaces); F03 the monthly summary,
    pending lessons and mark as paid (F03 Interfaces)."""
    schema = json.loads(render_schema())

    assert set(schema["paths"]) == {
        "/health",
        "/api/health",
        "/api/teachers",
        "/api/sessions",
        "/api/sessions/current",
        "/api/students",
        "/api/lessons",
        "/api/monthly-summaries/{month}",
        "/api/pending-lessons",
        "/api/lessons/{lesson_id}",
    }
    for path in ("/health", "/api/health"):
        operation = schema["paths"][path]
        assert set(operation) == {"get"}
        assert set(operation["get"]["responses"]) >= {"200", "503"}
    assert set(schema["paths"]["/api/teachers"]) == {"post"}
    assert set(schema["paths"]["/api/teachers"]["post"]["responses"]) >= {"201", "409", "422"}
    assert set(schema["paths"]["/api/sessions"]) == {"post"}
    assert set(schema["paths"]["/api/sessions"]["post"]["responses"]) >= {"200", "401", "422"}
    current = schema["paths"]["/api/sessions/current"]
    assert set(current) == {"get", "delete"}
    assert set(current["get"]["responses"]) >= {"200", "401"}
    assert set(current["delete"]["responses"]) >= {"204", "401"}
    students = schema["paths"]["/api/students"]
    assert set(students) == {"get", "post"}
    assert set(students["get"]["responses"]) >= {"200", "401", "422"}
    assert set(students["post"]["responses"]) >= {"201", "401", "415", "422"}
    lessons = schema["paths"]["/api/lessons"]
    assert set(lessons) == {"get", "post"}
    assert set(lessons["get"]["responses"]) >= {"200", "401", "422"}
    assert set(lessons["post"]["responses"]) >= {"201", "401", "404", "415", "422"}


def test_openapi_schema_has_no_server_or_version_details() -> None:
    schema = json.loads(render_schema())

    assert "servers" not in schema
    assert schema["info"]["title"] == "Lesson Ledger API"
