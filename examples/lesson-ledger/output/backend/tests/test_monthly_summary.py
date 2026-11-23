"""F03 AC-1: monthly summary (GET /api/monthly-summaries/{month}) and the month filter of
GET /api/lessons; spec Behavior: Month boundaries, Totals, Orders."""

import pytest
from fastapi.testclient import TestClient

from tests.accounts_support import Accounts
from tests.ledger_support import Teacher, usd


@pytest.fixture
def teacher(client: TestClient, accounts: Accounts) -> Teacher:
    return Teacher(client, accounts)


@pytest.fixture
def november(teacher: Teacher) -> dict[str, int]:
    """Lessons A, B, C of AC-1 in November 2026, plus one on each side of the month."""
    zoe = teacher.add_student("Zoe Park")["id"]
    ids = {
        "A": teacher.add_lesson(zoe, "2026-11-03", 4250, paid=True),
        "B": teacher.add_lesson(zoe, "2026-11-10", 6000),
        "C": teacher.add_lesson(zoe, "2026-11-10", 0),
        "october": teacher.add_lesson(zoe, "2026-10-31", 3000),
        "december": teacher.add_lesson(zoe, "2026-12-01", 5000),
    }
    return ids


def test_ac1_monthly_summary_counts_collected_and_pending(
    teacher: Teacher, november: dict[str, int]
) -> None:
    response = teacher.get("/api/monthly-summaries/2026-11")

    assert response.status_code == 200
    assert response.json() == {
        "month": "2026-11",
        "lesson_count": 3,
        "collected": usd(4250),
        "pending": usd(6000),
    }


def test_ac1_month_boundaries_follow_the_lesson_date(
    teacher: Teacher, november: dict[str, int]
) -> None:
    october = teacher.get("/api/monthly-summaries/2026-10").json()
    december = teacher.get("/api/monthly-summaries/2026-12").json()

    assert (october["lesson_count"], october["pending"], october["collected"]) == (
        1,
        usd(3000),
        usd(0),
    )
    assert (december["lesson_count"], december["pending"]) == (1, usd(5000))


def test_ac1_empty_month_has_zero_totals(teacher: Teacher, november: dict[str, int]) -> None:
    response = teacher.get("/api/monthly-summaries/2026-08")

    assert response.status_code == 200
    assert response.json() == {
        "month": "2026-08",
        "lesson_count": 0,
        "collected": usd(0),
        "pending": usd(0),
    }


def test_ac1_lessons_month_filter_lists_the_month_newest_first(
    teacher: Teacher, november: dict[str, int]
) -> None:
    body = teacher.get("/api/lessons", month="2026-11", page=1, page_size=500).json()

    assert [item["id"] for item in body["items"]] == [november["C"], november["B"], november["A"]]
    assert (body["total"], body["page"], body["page_size"]) == (3, 1, 500)
    assert [item["paid"] for item in body["items"]] == [False, False, True]


def test_ac1_lessons_month_filter_pages_and_empty_month(
    teacher: Teacher, november: dict[str, int]
) -> None:
    second = teacher.get("/api/lessons", month="2026-11", page=2, page_size=2).json()
    empty = teacher.get("/api/lessons", month="2026-08").json()
    unfiltered = teacher.get("/api/lessons").json()

    assert [item["id"] for item in second["items"]] == [november["A"]]
    assert second["total"] == 3
    assert (empty["items"], empty["total"]) == ([], 0)
    assert unfiltered["total"] == 5


@pytest.mark.parametrize("month", ["2000-01", "2099-12"])
def test_ac1_months_at_the_range_bounds_are_accepted(teacher: Teacher, month: str) -> None:
    assert teacher.get(f"/api/monthly-summaries/{month}").status_code == 200
    assert teacher.get("/api/lessons", month=month).status_code == 200
