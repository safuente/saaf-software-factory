"""F03 Non-functional: for a teacher with 5,000 lessons, GET /api/monthly-summaries/{month} and
GET /api/pending-lessons?page_size=500 answer in under 500 ms at p95 on the local stack."""

import os
import statistics
import time

import httpx2 as httpx
import pytest
from sqlalchemy import text

from tests.accounts_support import Accounts, cookie_header, session_cookie

API_URL = os.environ.get("API_URL", "")
SAMPLES = 40


@pytest.mark.parametrize(
    ("path", "params"),
    [
        ("/api/monthly-summaries/2026-03", {}),
        ("/api/pending-lessons", {"page_size": 500}),
    ],
)
def test_f03_summary_and_pending_with_5000_lessons_are_under_500_ms_at_p95(
    accounts: Accounts, path: str, params: dict[str, int]
) -> None:
    email = accounts.fresh()
    signed_up = httpx.post(
        f"{API_URL}/api/teachers", json={"email": email, "password": "correct-horse-1"}, timeout=10
    )
    headers = cookie_header(session_cookie(signed_up))
    with accounts.engine.begin() as conn:
        conn.execute(
            text(
                "INSERT INTO student (teacher_id, name, created_at)"
                " SELECT id, 'Perf ' || n, now() FROM teacher, generate_series(1, 50) n"
                " WHERE email = :email"
            ),
            {"email": email},
        )
        # Over about 3 years, every third lesson paid.
        conn.execute(
            text(
                "INSERT INTO lesson (teacher_id, student_id, date, duration_minutes,"
                " price_cents, paid, created_at)"
                " SELECT s.teacher_id, s.id, DATE '2024-01-01' + (n % 1100), 45, 4250,"
                " n % 3 = 0, now()"
                " FROM generate_series(1, 5000) n"
                " JOIN student s ON s.name = 'Perf ' || (n % 50 + 1)"
                " JOIN teacher t ON t.id = s.teacher_id AND t.email = :email"
            ),
            {"email": email},
        )

    durations = []
    with httpx.Client(base_url=API_URL, headers=headers, timeout=10) as client:
        assert client.get(path, params=params).status_code == 200
        for _ in range(SAMPLES):
            started = time.perf_counter()
            response = client.get(path, params=params)
            durations.append(time.perf_counter() - started)
            assert response.status_code == 200

    p95 = statistics.quantiles(durations, n=20)[-1]
    assert p95 < 0.5, f"{path} p95 {p95 * 1000:.0f} ms"
