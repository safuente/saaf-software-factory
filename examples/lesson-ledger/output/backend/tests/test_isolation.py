"""F02 AC-5: a teacher only sees and uses their own students and lessons, and the whole API is
default-deny (spec Behavior: Default-deny authentication, Logging; Security considerations)."""

import json
import logging
import re
from datetime import date

import pytest
from fastapi import FastAPI
from fastapi.routing import APIRoute
from fastapi.testclient import TestClient
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.core.config import Settings
from app.core.logging import JsonFormatter
from app.main import create_app
from tests.accounts_support import Accounts, cookie_header, not_authenticated
from tests.ledger_support import Teacher

PUBLIC = {
    ("GET", "/health"),
    ("GET", "/api/health"),
    ("POST", "/api/teachers"),
    ("POST", "/api/sessions"),
}
NOT_FOUND = {"error": {"code": "not_found", "message": "Not found", "details": {}}}


@pytest.fixture
def pair(client: TestClient, accounts: Accounts) -> tuple[Teacher, Teacher]:
    """Teachers A and B, each with one student and one lesson."""
    a, b = Teacher(client, accounts), Teacher(client, accounts)
    for teacher, name in ((a, "Ann Able"), (b, "Bea Secret")):
        student = teacher.add_student(name)
        assert teacher.record_lesson(student["id"]).status_code == 201
    return a, b


def test_ac5_lists_only_show_the_teachers_own_records(pair: tuple[Teacher, Teacher]) -> None:
    a, _ = pair

    students = a.get("/api/students").json()
    lessons = a.get("/api/lessons").json()

    assert students["total"] == 1
    assert [s["name"] for s in students["items"]] == ["Ann Able"]
    assert lessons["total"] == 1
    assert lessons["items"][0]["student"]["name"] == "Ann Able"
    assert "Bea Secret" not in json.dumps([students, lessons])


def test_ac5_other_teachers_student_and_unknown_id_give_identical_404(
    pair: tuple[Teacher, Teacher],
) -> None:
    a, b = pair
    b_student_id = b.get("/api/students").json()["items"][0]["id"]
    unknown_id = b_student_id + 1_000_000

    other = a.record_lesson(b_student_id)
    missing = a.record_lesson(unknown_id)

    assert other.status_code == missing.status_code == 404
    assert other.json() == missing.json() == NOT_FOUND
    assert other.content == missing.content
    assert (a.count("lesson"), b.count("lesson")) == (1, 1)


@pytest.mark.parametrize("student_id", [0, -1, 2**31, 2**63])
def test_ac5_out_of_range_student_ids_are_not_found(
    pair: tuple[Teacher, Teacher], student_id: int
) -> None:
    a, _ = pair

    response = a.record_lesson(student_id)

    assert response.status_code == 404
    assert response.json() == NOT_FOUND


def test_ac5_database_rejects_lesson_with_another_teachers_student(
    pair: tuple[Teacher, Teacher],
) -> None:
    a, b = pair
    b_student_id = b.get("/api/students").json()["items"][0]["id"]

    with pytest.raises(IntegrityError), a.accounts.engine.begin() as conn:
        conn.execute(
            text(
                "INSERT INTO lesson (teacher_id, student_id, date, duration_minutes, price_cents,"
                " created_at) SELECT id, :student_id, :date, 45, 4250, now() FROM teacher"
                " WHERE email = :email"
            ),
            {"student_id": b_student_id, "date": date(2026, 11, 3), "email": a.email},
        )


def _routes(app: FastAPI) -> list[tuple[str, str]]:
    """(method, path) of every registered route, including those of included routers, with
    path parameters filled in."""
    found: list[tuple[str, str]] = []

    def add(path: str, route: object) -> None:
        if isinstance(route, APIRoute):
            concrete = re.sub(r"\{[^}]+\}", "1", path)
            found.extend((method, concrete) for method in sorted(route.methods or ()))

    for route in app.routes:
        contexts = getattr(route, "effective_route_contexts", None)
        if contexts is None:
            add(getattr(route, "path", ""), route)
            continue
        for context in contexts():
            add(context.path, context.original_route)
    return found


@pytest.mark.parametrize("cookie", [None, "not-a-real-token"])
def test_ac5_every_non_public_route_requires_a_session(
    client: TestClient, app: FastAPI, cookie: str | None
) -> None:
    routes = _routes(app)
    assert ("GET", "/api/lessons") in routes
    assert ("POST", "/api/students") in routes
    # F03 Security considerations: Access.
    assert ("GET", "/api/monthly-summaries/1") in routes
    assert ("GET", "/api/pending-lessons") in routes
    assert ("PATCH", "/api/lessons/1") in routes
    headers = cookie_header(cookie) if cookie else {}

    for method, path in routes:
        if (method, path) in PUBLIC:
            continue
        bodies: tuple[dict[str, object] | None, ...] = (None, {})
        for body in bodies:
            response = client.request(method, path, json=body, headers=headers)
            assert response.status_code == 401, (method, path, body)
            assert response.json() == not_authenticated()


def test_ac5_public_routes_work_without_a_session(client: TestClient) -> None:
    assert client.get("/health").status_code == 200
    assert client.get("/api/health").status_code == 200
    assert client.post("/api/teachers", json={}).status_code == 422
    assert client.post("/api/sessions", json={}).status_code == 422


class _Probe(BaseModel):
    value: int


def test_ac5_a_route_added_without_authentication_still_returns_401(settings: Settings) -> None:
    app = create_app(settings)

    @app.get("/api/probe")
    def probe() -> dict[str, str]:
        return {"secret": "data"}

    @app.post("/api/probe")
    def probe_post(body: _Probe) -> dict[str, int]:
        return {"value": body.value}

    with TestClient(app, raise_server_exceptions=False) as client:
        for response in (
            client.get("/api/probe"),
            client.post("/api/probe", json={"value": 1}),
            client.post("/api/probe", content="x", headers={"Content-Type": "text/plain"}),
            client.get("/api/probe", headers=cookie_header("not-a-real-token")),
        ):
            assert response.status_code == 401
            assert response.json() == not_authenticated()
    app.state.engine.dispose()


def test_ac5_unknown_paths_keep_404_and_405(client: TestClient) -> None:
    assert client.get("/api/nothing-here").status_code == 404
    assert client.put("/api/students", json={}).status_code == 405


def test_ac5_student_names_are_never_logged(
    pair: tuple[Teacher, Teacher], caplog: pytest.LogCaptureFixture
) -> None:
    a, _ = pair
    with caplog.at_level(logging.DEBUG):
        student = a.add_student("Secret Student")
        a.post("/api/students", {"name": "Secret\tStudent"})
        a.post("/api/students", {"name": "Secret" * 30})
        a.record_lesson(student["id"])
        a.get("/api/students")
        a.get("/api/lessons")

    formatter = JsonFormatter()
    logged = "\n".join(formatter.format(record) for record in caplog.records)
    assert "Secret" not in logged
