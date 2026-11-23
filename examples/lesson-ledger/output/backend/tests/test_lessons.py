"""F02 AC-2: record and list lessons (POST/GET /api/lessons); spec Behavior: Lesson fields,
Lesson order, Pagination parameters."""

import re
from typing import Any

import pytest
from fastapi.testclient import TestClient

from tests.accounts_support import Accounts
from tests.ledger_support import ISO_UTC, Teacher


@pytest.fixture
def teacher(client: TestClient, accounts: Accounts) -> Teacher:
    return Teacher(client, accounts)


def dates(body: dict[str, Any]) -> list[str]:
    return [item["date"] for item in body["items"]]


def test_ac2_record_lesson_returns_201_unpaid_lesson(teacher: Teacher) -> None:
    zoe = teacher.add_student("Zoe Park")

    response = teacher.post(
        "/api/lessons",
        {
            "student_id": zoe["id"],
            "date": "2026-11-03",
            "duration_minutes": 45,
            "price": {"amount": 4250, "currency": "USD"},
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert isinstance(body["id"], int)
    assert re.match(ISO_UTC, body.pop("created_at"))
    assert body == {
        "id": body["id"],
        "student": {"id": zoe["id"], "name": "Zoe Park"},
        "date": "2026-11-03",
        "duration_minutes": 45,
        "price": {"amount": 4250, "currency": "USD"},
        "paid": False,
    }
    assert teacher.count("lesson") == 1


def test_ac2_extra_paid_field_is_ignored(teacher: Teacher) -> None:
    zoe = teacher.add_student("Zoe Park")

    response = teacher.record_lesson(zoe["id"], paid=True, teacher_id=1)

    assert response.status_code == 201
    assert response.json()["paid"] is False
    assert teacher.get("/api/lessons").json()["items"][0]["paid"] is False


def test_ac2_lessons_are_listed_newest_first_with_paging_envelope(teacher: Teacher) -> None:
    zoe = teacher.add_student("Zoe Park")
    for date in ("2026-11-03", "2026-10-28", "2026-11-10"):
        assert teacher.record_lesson(zoe["id"], date=date).status_code == 201

    response = teacher.get("/api/lessons")

    assert response.status_code == 200
    body = response.json()
    assert dates(body) == ["2026-11-10", "2026-11-03", "2026-10-28"]
    assert (body["total"], body["page"], body["page_size"]) == (3, 1, 50)
    assert body["items"][0]["student"] == {"id": zoe["id"], "name": "Zoe Park"}
    assert set(body["items"][0]) == {
        "id",
        "student",
        "date",
        "duration_minutes",
        "price",
        "paid",
        "created_at",
    }


def test_ac2_same_date_lessons_are_newest_created_first(teacher: Teacher) -> None:
    zoe = teacher.add_student("Zoe Park")
    ids = [teacher.record_lesson(zoe["id"]).json()["id"] for _ in range(3)]

    items = teacher.get("/api/lessons").json()["items"]

    assert [item["id"] for item in items] == list(reversed(ids))


@pytest.mark.parametrize("amount", [0, 1, 125000, 1_000_000])
def test_ac2_price_amounts_in_range_are_stored_as_cents(teacher: Teacher, amount: int) -> None:
    zoe = teacher.add_student("Zoe Park")

    response = teacher.record_lesson(zoe["id"], price={"amount": amount, "currency": "USD"})

    assert response.status_code == 201
    listed = teacher.get("/api/lessons").json()["items"][0]
    assert listed["price"] == {"amount": amount, "currency": "USD"}


@pytest.mark.parametrize(
    ("date", "duration"),
    [("2000-01-01", 1), ("2099-12-31", 600), ("2028-02-29", 30)],
)
def test_ac2_bounds_of_date_and_duration_are_accepted(
    teacher: Teacher, date: str, duration: int
) -> None:
    zoe = teacher.add_student("Zoe Park")

    response = teacher.record_lesson(zoe["id"], date=date, duration_minutes=duration)

    assert response.status_code == 201
    assert (response.json()["date"], response.json()["duration_minutes"]) == (date, duration)


def test_ac2_lessons_paging_and_invalid_paging(teacher: Teacher) -> None:
    zoe = teacher.add_student("Zoe Park")
    for date in ("2026-11-01", "2026-11-02", "2026-11-03"):
        teacher.record_lesson(zoe["id"], date=date)

    second = teacher.get("/api/lessons", page=2, page_size=2).json()
    past_end = teacher.get("/api/lessons", page=5, page_size=2).json()

    assert dates(second) == ["2026-11-01"]
    assert second["total"] == 3
    assert past_end["items"] == []
    assert past_end["total"] == 3
    for params in ({"page": 0}, {"page_size": 501}, {"page_size": 0}, {"page": "x"}):
        response = teacher.get("/api/lessons", **params)
        assert response.status_code == 422, params
        assert response.json()["error"]["code"] == "validation_error"
