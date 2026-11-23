"""F03 AC-5: summaries, the month filter, the pending list and mark as paid only see and change
the session teacher's lessons; sessions required; month validation. Spec Security
considerations: Access, Isolation, User input; Behavior: Logging."""

import json
import logging

import pytest
from fastapi.testclient import TestClient

from app.core.logging import JsonFormatter
from tests.accounts_support import Accounts, cookie_header, not_authenticated
from tests.ledger_support import Teacher, lesson_paid, usd

NOT_FOUND = {"error": {"code": "not_found", "message": "Not found", "details": {}}}


@pytest.fixture
def pair(client: TestClient, accounts: Accounts) -> tuple[Teacher, Teacher, dict[str, int]]:
    """Teachers A and B, each with a paid and an unpaid lesson in November 2026."""
    a, b = Teacher(client, accounts), Teacher(client, accounts)
    ids: dict[str, int] = {}
    for teacher, name, key, base in ((a, "Ann Able", "a", 1000), (b, "Bea Secret", "b", 5000)):
        student = teacher.add_student(name)["id"]
        ids[f"{key}_paid"] = teacher.add_lesson(student, "2026-11-03", base, paid=True)
        ids[f"{key}_unpaid"] = teacher.add_lesson(student, "2026-11-10", base + 1)
    return a, b, ids


def test_ac5_summary_month_list_and_pending_only_cover_the_teachers_lessons(
    pair: tuple[Teacher, Teacher, dict[str, int]],
) -> None:
    a, _, ids = pair

    summary = a.get("/api/monthly-summaries/2026-11").json()
    month = a.get("/api/lessons", month="2026-11").json()
    pending = a.get("/api/pending-lessons").json()

    assert summary == {
        "month": "2026-11",
        "lesson_count": 2,
        "collected": usd(1000),
        "pending": usd(1001),
    }
    assert [item["id"] for item in month["items"]] == [ids["a_unpaid"], ids["a_paid"]]
    assert month["total"] == 2
    assert [item["id"] for item in pending["items"]] == [ids["a_unpaid"]]
    assert (pending["total"], pending["amount_pending"]) == (1, usd(1001))
    assert "Bea Secret" not in json.dumps([summary, month, pending])


@pytest.mark.parametrize("paid", [True, False])
def test_ac5_patch_of_another_teachers_lesson_or_unknown_id_is_identical_404(
    pair: tuple[Teacher, Teacher, dict[str, int]], paid: bool
) -> None:
    a, b, ids = pair
    target = ids["b_unpaid"] if paid else ids["b_paid"]

    other = a.patch(f"/api/lessons/{target}", {"paid": paid})
    missing = a.patch("/api/lessons/999999999", {"paid": paid})

    assert other.status_code == missing.status_code == 404
    assert other.json() == missing.json() == NOT_FOUND
    assert other.content == missing.content
    assert lesson_paid(b.accounts, target) is not paid


@pytest.mark.parametrize("lesson_id", [0, -1, 2**31, 2**63, 10**30])
def test_ac5_out_of_range_lesson_ids_are_not_found(
    pair: tuple[Teacher, Teacher, dict[str, int]], lesson_id: int
) -> None:
    a, _, _ = pair

    response = a.patch(f"/api/lessons/{lesson_id}", {"paid": True})

    assert response.status_code == 404
    assert response.json() == NOT_FOUND


@pytest.mark.parametrize("cookie", [None, "not-a-real-token"])
def test_ac5_new_and_changed_endpoints_require_a_session(
    client: TestClient, pair: tuple[Teacher, Teacher, dict[str, int]], cookie: str | None
) -> None:
    _, b, ids = pair
    headers = cookie_header(cookie) if cookie else {}

    responses = [
        client.get("/api/monthly-summaries/2026-11", headers=headers),
        client.get("/api/lessons", params={"month": "2026-11"}, headers=headers),
        client.get("/api/pending-lessons", headers=headers),
        client.patch(f"/api/lessons/{ids['b_unpaid']}", json={"paid": True}, headers=headers),
    ]

    for response in responses:
        assert response.status_code == 401, response.request.url
        assert response.json() == not_authenticated()
    assert lesson_paid(b.accounts, ids["b_unpaid"]) is False


@pytest.mark.parametrize("month", ["2026-13", "2026-1", "1999-12", "2100-01", "abc", "2026-00"])
def test_ac5_invalid_month_is_422(
    pair: tuple[Teacher, Teacher, dict[str, int]], month: str
) -> None:
    a, _, _ = pair

    for response in (
        a.get(f"/api/monthly-summaries/{month}"),
        a.get("/api/lessons", month=month),
    ):
        assert response.status_code == 422, (month, response.request.url)
        assert response.json()["error"]["code"] == "validation_error"


def test_ac5_student_names_are_never_logged_by_the_payment_endpoints(
    pair: tuple[Teacher, Teacher, dict[str, int]], caplog: pytest.LogCaptureFixture
) -> None:
    a, _, ids = pair
    with caplog.at_level(logging.DEBUG):
        a.get("/api/monthly-summaries/2026-11")
        a.get("/api/lessons", month="2026-11")
        a.get("/api/pending-lessons")
        a.patch(f"/api/lessons/{ids['a_unpaid']}", {"paid": True})
        a.patch(f"/api/lessons/{ids['a_unpaid']}", {"paid": False})

    logged = "\n".join(JsonFormatter().format(record) for record in caplog.records)
    assert "Ann Able" not in logged
