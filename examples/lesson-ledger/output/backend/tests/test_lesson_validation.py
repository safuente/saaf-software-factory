"""F02 AC-3: invalid lessons are rejected with 422 validation_error and nothing is stored, by
the API and by the database itself (spec Behavior: Lesson fields; Data model)."""

from datetime import date
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from tests.accounts_support import Accounts
from tests.ledger_support import Teacher, lesson_body


@pytest.fixture
def teacher(client: TestClient, accounts: Accounts) -> Teacher:
    return Teacher(client, accounts)


def _usd(amount: Any) -> dict[str, Any]:
    return {"amount": amount, "currency": "USD"}


INVALID_FIELDS: list[dict[str, Any]] = [
    {"duration_minutes": 0},
    {"duration_minutes": 601},
    {"duration_minutes": -5},
    {"duration_minutes": 45.5},
    {"duration_minutes": "45"},
    {"duration_minutes": True},
    {"duration_minutes": None},
    {"price": _usd(-1)},
    {"price": _usd(1_000_001)},
    {"price": _usd(42.5)},
    {"price": _usd("4250")},
    {"price": {"amount": 4250, "currency": "EUR"}},
    {"price": {"amount": 4250, "currency": "usd"}},
    {"price": {"amount": 4250}},
    {"price": 4250},
    {"date": "2026-02-30"},
    {"date": "1999-12-31"},
    {"date": "2100-01-01"},
    {"date": "2026-11-03T10:00:00"},
    {"date": "2026-11-3"},
    {"date": "20261103"},
    {"date": 1_762_128_000},
    {"date": ""},
    {"student_id": "abc"},
    {"student_id": 1.5},
    {"student_id": None},
]


@pytest.mark.parametrize("overrides", INVALID_FIELDS)
def test_ac3_invalid_field_returns_422_and_stores_nothing(
    teacher: Teacher, overrides: dict[str, Any]
) -> None:
    zoe = teacher.add_student("Zoe Park")

    response = teacher.post("/api/lessons", {**lesson_body(zoe["id"]), **overrides})

    assert response.status_code == 422, response.text
    assert response.json()["error"]["code"] == "validation_error"
    assert teacher.count("lesson") == 0


@pytest.mark.parametrize("missing", ["student_id", "date", "duration_minutes", "price"])
def test_ac3_missing_field_returns_422(teacher: Teacher, missing: str) -> None:
    zoe = teacher.add_student("Zoe Park")
    body = lesson_body(zoe["id"])
    del body[missing]

    response = teacher.post("/api/lessons", body)

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"
    assert teacher.count("lesson") == 0


def test_ac3_validation_details_do_not_echo_values(teacher: Teacher) -> None:
    zoe = teacher.add_student("Zoe Park")

    response = teacher.record_lesson(
        zoe["id"], date="1999-12-31", price={"amount": 987654321, "currency": "EURO-X"}
    )

    assert response.status_code == 422
    for value in ("1999", "987654321", "EURO-X"):
        assert value not in response.text


def test_ac3_lessons_accept_json_only(teacher: Teacher) -> None:
    response = teacher.client.post(
        "/api/lessons",
        content="student_id=1",
        headers={**teacher.headers, "Content-Type": "text/plain"},
    )

    assert response.status_code == 415


@pytest.mark.parametrize(
    ("column", "value"),
    [
        ("duration_minutes", 0),
        ("duration_minutes", 601),
        ("price_cents", -1),
        ("price_cents", 1_000_001),
        ("date", date(1999, 12, 31)),
        ("date", date(2100, 1, 1)),
    ],
)
def test_ac3_database_enforces_lesson_ranges(teacher: Teacher, column: str, value: Any) -> None:
    zoe = teacher.add_student("Zoe Park")
    row: dict[str, Any] = {
        "student_id": zoe["id"],
        "date": date(2026, 11, 3),
        "duration_minutes": 45,
        "price_cents": 4250,
        column: value,
    }

    with pytest.raises(IntegrityError), teacher.accounts.engine.begin() as conn:
        conn.execute(
            text(
                "INSERT INTO lesson (teacher_id, student_id, date, duration_minutes, price_cents,"
                " created_at) SELECT id, :student_id, :date, :duration_minutes, :price_cents,"
                " now() FROM teacher WHERE email = :email"
            ),
            {**row, "email": teacher.email},
        )


@pytest.mark.parametrize("name", ["", "x" * 101])
def test_ac1_database_enforces_student_name_length(teacher: Teacher, name: str) -> None:
    with pytest.raises(IntegrityError), teacher.accounts.engine.begin() as conn:
        conn.execute(
            text(
                "INSERT INTO student (teacher_id, name, created_at)"
                " SELECT id, :name, now() FROM teacher WHERE email = :email"
            ),
            {"name": name, "email": teacher.email},
        )
