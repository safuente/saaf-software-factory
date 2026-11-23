"""F03 AC-3 and AC-4: mark a lesson as paid and undo it (PATCH /api/lessons/{id}); spec
Behavior: Mark / undo; Security considerations: User input, CSRF."""

from typing import Any

import pytest
from fastapi.testclient import TestClient

from tests.accounts_support import Accounts
from tests.ledger_support import Teacher, lesson_paid, set_paid, usd


@pytest.fixture
def teacher(client: TestClient, accounts: Accounts) -> Teacher:
    return Teacher(client, accounts)


@pytest.fixture
def lesson_id(teacher: Teacher) -> int:
    zoe = teacher.add_student("Zoe Park")["id"]
    teacher.add_lesson(zoe, "2026-10-10", 125000)
    return teacher.add_lesson(zoe, "2026-10-10", 4500)


def summary(teacher: Teacher) -> dict[str, Any]:
    body: dict[str, Any] = teacher.get("/api/monthly-summaries/2026-10").json()
    return body


def pending_ids(teacher: Teacher) -> list[int]:
    return [item["id"] for item in teacher.get("/api/pending-lessons").json()["items"]]


def test_ac3_mark_as_paid_returns_the_paid_lesson_and_leaves_pending(
    teacher: Teacher, lesson_id: int
) -> None:
    before = teacher.get("/api/lessons").json()["items"]

    response = teacher.patch(f"/api/lessons/{lesson_id}", {"paid": True})

    assert response.status_code == 200
    expected = next(item for item in before if item["id"] == lesson_id)
    assert response.json() == {**expected, "paid": True}
    assert lesson_id not in pending_ids(teacher)
    assert teacher.get("/api/pending-lessons").json()["amount_pending"] == usd(125000)
    assert summary(teacher)["collected"] == usd(4500)
    assert summary(teacher)["pending"] == usd(125000)


def test_ac3_undo_paid_returns_the_lesson_to_pending(teacher: Teacher, lesson_id: int) -> None:
    teacher.patch(f"/api/lessons/{lesson_id}", {"paid": True})

    response = teacher.patch(f"/api/lessons/{lesson_id}", {"paid": False})

    assert response.status_code == 200
    assert response.json()["paid"] is False
    assert lesson_id in pending_ids(teacher)
    assert summary(teacher)["collected"] == usd(0)
    assert summary(teacher)["pending"] == usd(129500)


@pytest.mark.parametrize("paid", [True, False])
def test_ac4_setting_the_same_paid_value_twice_is_a_no_op(
    teacher: Teacher, lesson_id: int, paid: bool
) -> None:
    if paid:
        set_paid(teacher.accounts, lesson_id, paid=True)
    before = summary(teacher)

    first = teacher.patch(f"/api/lessons/{lesson_id}", {"paid": paid})
    second = teacher.patch(f"/api/lessons/{lesson_id}", {"paid": paid})

    assert first.status_code == second.status_code == 200
    assert first.json() == second.json()
    assert first.json()["paid"] is paid
    assert summary(teacher) == before


@pytest.mark.parametrize(
    "body",
    [
        {},
        {"paid": "yes"},
        {"paid": None},
        {"paid": 1},
        {"paid": "true"},
        {"paid": True, "price": {"amount": 1, "currency": "USD"}},
        {"paid": True, "date": "2026-01-01"},
        [],
        True,
    ],
)
def test_ac4_invalid_body_is_422_and_leaves_the_lesson_unchanged(
    teacher: Teacher, lesson_id: int, body: Any
) -> None:
    before = teacher.get("/api/lessons").json()

    response = teacher.patch(f"/api/lessons/{lesson_id}", body)

    assert response.status_code == 422, body
    assert response.json()["error"]["code"] == "validation_error"
    assert teacher.get("/api/lessons").json() == before
    assert lesson_paid(teacher.accounts, lesson_id) is False


@pytest.mark.parametrize(
    ("content", "content_type"),
    [
        ("paid=true", "application/x-www-form-urlencoded"),
        ('{"paid": true}', "text/plain"),
        ('{"paid": true}', None),
    ],
)
def test_ac4_non_json_body_is_415(
    teacher: Teacher, lesson_id: int, content: str, content_type: str | None
) -> None:
    headers = dict(teacher.headers)
    if content_type:
        headers["Content-Type"] = content_type

    response = teacher.client.patch(f"/api/lessons/{lesson_id}", content=content, headers=headers)

    assert response.status_code == 415
    assert response.json()["error"]["code"] == "unsupported_media_type"
    assert lesson_paid(teacher.accounts, lesson_id) is False


def test_ac4_non_integer_id_is_422(teacher: Teacher) -> None:
    response = teacher.patch("/api/lessons/abc", {"paid": True})

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"
