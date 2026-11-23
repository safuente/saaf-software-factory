"""F02 AC-6: `make seed` gives alice a populated history and leaves bob empty, idempotently
(spec Behavior: Seed). F03 AC-6 changes alice's paid lessons: 2 of 4 in the previous month and
1 of 4 in the current month are paid (F03 Behavior: Seed)."""

import threading
from collections import Counter
from datetime import date
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session as DbSession

from app import seed
from tests.accounts_support import Accounts, cookie_header, session_cookie

README = Path(__file__).resolve().parents[2] / "README.md"
ALICE = ("alice@example.com", "alice-ledger-pass")
BOB = ("bob@example.com", "bob-ledger-pass1")
CAROL = ("carol@example.com", "carol-ledger-pass")


def _rows(accounts: Accounts, email: str) -> tuple[int, list[tuple[date, int, bool]]]:
    """(student count, [(date, price_cents, paid)]) of the teacher."""
    with accounts.engine.connect() as conn:
        students = conn.execute(
            text(
                "SELECT count(*) FROM student s JOIN teacher t ON t.id = s.teacher_id"
                " WHERE t.email = :email"
            ),
            {"email": email},
        ).scalar_one()
        lessons = conn.execute(
            text(
                "SELECT l.date, l.price_cents, l.paid FROM lesson l"
                " JOIN teacher t ON t.id = l.teacher_id WHERE t.email = :email"
            ),
            {"email": email},
        ).all()
    return int(students), [(row[0], row[1], row[2]) for row in lessons]


def _month(day: date, back: int) -> tuple[int, int]:
    index = day.year * 12 + day.month - 1 - back
    return index // 12, index % 12 + 1


def _assert_seeded_state(accounts: Accounts, today: date) -> None:
    students, lessons = _rows(accounts, ALICE[0])
    assert students == 6
    assert len(lessons) == 12
    paid_by_month = Counter(((d.year, d.month), paid) for d, _, paid in lessons)
    # F03 AC-6: (months back, paid, unpaid); nothing three months back.
    for back, paid, unpaid in ((0, 1, 3), (1, 2, 2), (2, 0, 4), (3, 0, 0)):
        month = _month(today, back)
        assert (paid_by_month[(month, True)], paid_by_month[(month, False)]) == (paid, unpaid), (
            back,
            paid_by_month,
        )
    assert max(Counter(d for d, _, _ in lessons).values()) >= 2
    assert any(price % 100 for _, price, _ in lessons)
    assert all(d <= today for d, _, _ in lessons)
    assert _rows(accounts, BOB[0]) == (0, [])


def _log_in(client: TestClient, email: str, password: str) -> dict[str, str]:
    response = client.post("/api/sessions", json={"email": email, "password": password})
    assert response.status_code == 200
    client.cookies.clear()
    return cookie_header(session_cookie(response))


def test_ac6_seed_twice_gives_alice_history_and_bob_nothing(
    client: TestClient, accounts: Accounts
) -> None:
    seed.main()
    seed.main()

    _assert_seeded_state(accounts, date.today())
    for email, password in (ALICE, BOB):
        _log_in(client, email, password)


def test_ac6_seed_resets_data_added_to_alice_and_bob(
    client: TestClient, accounts: Accounts
) -> None:
    seed.main()
    for email, password in (ALICE, BOB):
        headers = _log_in(client, email, password)
        added = client.post("/api/students", json={"name": "Extra"}, headers=headers)
        assert added.status_code == 201
        lesson = {
            "student_id": added.json()["id"],
            "date": "2026-01-02",
            "duration_minutes": 30,
            "price": {"amount": 100, "currency": "USD"},
        }
        assert client.post("/api/lessons", json=lesson, headers=headers).status_code == 201

    seed.main()

    _assert_seeded_state(accounts, date.today())


@pytest.mark.parametrize(
    "today",
    [date(2026, 1, 1), date(2026, 3, 31), date(2026, 12, 15), date(2028, 2, 29)],
)
def test_ac6_seed_dates_follow_the_server_date(accounts: Accounts, today: date) -> None:
    with DbSession(accounts.engine) as db:
        seed.seed(db, today)

    _assert_seeded_state(accounts, today)


def test_ac6_concurrent_seed_runs_leave_exactly_the_seeded_state(accounts: Accounts) -> None:
    barrier = threading.Barrier(3)
    errors: list[BaseException] = []

    def run() -> None:
        barrier.wait()
        try:
            seed.main()
        except BaseException as exc:
            errors.append(exc)

    threads = [threading.Thread(target=run) for _ in range(3)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    assert errors == []
    _assert_seeded_state(accounts, date.today())


def test_ac6_readme_seed_section_describes_both_states() -> None:
    section = README.read_text().split("## Seed data", 1)[1].split("\n## ", 1)[0]

    assert "6 students" in section
    assert "12 lessons" in section
    assert "no students and no lessons" in section


def test_f03_ac6_readme_seed_section_describes_paid_and_pending_states() -> None:
    section = README.read_text().split("## Seed data", 1)[1].split("\n## ", 1)[0]

    assert "1 paid and 3 unpaid" in section
    assert "2 paid and 2 unpaid" in section
    assert "4 unpaid" in section
    assert "nothing pending" in section
    assert "`/summary`" in section
    assert "`/pending`" in section


def test_seed_many_items_carol_has_more_than_500_students_and_lessons(
    client: TestClient, accounts: Accounts
) -> None:
    """Spec UI "Many items": the truncation messages are reachable after `make seed`."""
    seed.main()
    headers = _log_in(client, *CAROL)
    added = client.post("/api/students", json={"name": "Extra"}, headers=headers)
    assert added.status_code == 201

    seed.main()

    students, lessons = _rows(accounts, CAROL[0])
    assert students > 500
    assert len(lessons) > 500
    assert not any(paid for _, _, paid in lessons)
    for path in ("/api/students", "/api/lessons"):
        page = client.get(path, params={"page_size": 500}, headers=headers).json()
        assert page["total"] > len(page["items"]) == 500
    names = [s["name"] for s in client.get("/api/students", headers=headers).json()["items"]]
    assert "Extra" not in names
    _assert_seeded_state(accounts, date.today())


def test_seed_many_items_readme_lists_carol() -> None:
    section = README.read_text().split("## Seed data", 1)[1].split("\n## ", 1)[0]

    assert "`carol@example.com`" in section
    assert "not seeded" not in section


@pytest.mark.parametrize("today", [date(2026, 11, 1), date(2026, 11, 18)])
def test_f03_ac6_carol_reaches_both_truncation_messages(accounts: Accounts, today: date) -> None:
    """F03 UI "Many items": more than 500 unpaid lessons, all in the current month, so both
    /pending and /summary show their truncation messages."""
    with DbSession(accounts.engine) as db:
        seed.seed(db, today)

    _, lessons = _rows(accounts, CAROL[0])
    assert len(lessons) > 500
    assert not any(paid for _, _, paid in lessons)
    assert all((d.year, d.month) == (today.year, today.month) and d <= today for d, _, _ in lessons)
