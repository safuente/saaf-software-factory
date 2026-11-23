"""F03 AC-2: pending lessons across all months (GET /api/pending-lessons); spec Behavior:
Totals, Orders."""

import pytest
from fastapi.testclient import TestClient

from tests.accounts_support import Accounts
from tests.ledger_support import Teacher, usd


@pytest.fixture
def teacher(client: TestClient, accounts: Accounts) -> Teacher:
    return Teacher(client, accounts)


@pytest.fixture
def ac2(teacher: Teacher) -> list[int]:
    """The four unpaid lessons of AC-2 in the expected order, plus one paid lesson."""
    zoe = teacher.add_student("Zoe Park")["id"]
    late = teacher.add_lesson(zoe, "2026-11-03", 4250)
    first_oct = teacher.add_lesson(zoe, "2026-10-10", 4500)
    second_oct = teacher.add_lesson(zoe, "2026-10-10", 125000)
    teacher.add_lesson(zoe, "2026-10-01", 9900, paid=True)
    early = teacher.add_lesson(zoe, "2026-09-05", 3375)
    return [early, first_oct, second_oct, late]


def test_ac2_pending_lessons_oldest_first_with_amount_pending(
    teacher: Teacher, ac2: list[int]
) -> None:
    response = teacher.get("/api/pending-lessons", page=1, page_size=500)

    assert response.status_code == 200
    body = response.json()
    assert [item["id"] for item in body["items"]] == ac2
    assert [item["price"]["amount"] for item in body["items"]] == [3375, 4500, 125000, 4250]
    assert all(item["paid"] is False for item in body["items"])
    assert (body["total"], body["page"], body["page_size"]) == (4, 1, 500)
    assert body["amount_pending"] == usd(137125)
    assert set(body["items"][0]) == {
        "id",
        "student",
        "date",
        "duration_minutes",
        "price",
        "paid",
        "created_at",
    }


def test_ac2_amount_pending_covers_all_pages(teacher: Teacher, ac2: list[int]) -> None:
    body = teacher.get("/api/pending-lessons", page=2, page_size=3).json()

    assert [item["id"] for item in body["items"]] == ac2[3:]
    assert body["total"] == 4
    assert body["amount_pending"] == usd(137125)


@pytest.mark.parametrize("paid_lessons", [0, 1])
def test_ac2_nothing_pending_is_an_empty_list(teacher: Teacher, paid_lessons: int) -> None:
    zoe = teacher.add_student("Zoe Park")["id"]
    for _ in range(paid_lessons):
        teacher.add_lesson(zoe, "2026-11-03", 4250, paid=True)

    body = teacher.get("/api/pending-lessons").json()

    assert body == {
        "items": [],
        "total": 0,
        "page": 1,
        "page_size": 50,
        "amount_pending": usd(0),
    }


def test_ac2_pending_lessons_invalid_paging(teacher: Teacher) -> None:
    for params in ({"page": 0}, {"page_size": 501}, {"page_size": 0}, {"page": "x"}):
        response = teacher.get("/api/pending-lessons", **params)
        assert response.status_code == 422, params
        assert response.json()["error"]["code"] == "validation_error"
