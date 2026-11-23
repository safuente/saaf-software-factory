"""F02 Non-functional: GET /api/lessons?page_size=500 for a teacher with 500 lessons answers in
under 500 ms at p95 on the local stack (AC-2 list)."""

import os
import statistics
import time

import httpx2 as httpx
from sqlalchemy import text

from tests.accounts_support import Accounts, cookie_header, session_cookie

API_URL = os.environ.get("API_URL", "")
SAMPLES = 40


def test_ac2_listing_500_lessons_is_under_500_ms_at_p95(accounts: Accounts) -> None:
    email = accounts.fresh()
    signed_up = httpx.post(
        f"{API_URL}/api/teachers", json={"email": email, "password": "correct-horse-1"}, timeout=10
    )
    headers = cookie_header(session_cookie(signed_up))
    with accounts.engine.begin() as conn:
        conn.execute(
            text(
                "INSERT INTO student (teacher_id, name, created_at)"
                " SELECT id, 'Perf ' || n, now() FROM teacher, generate_series(1, 20) n"
                " WHERE email = :email"
            ),
            {"email": email},
        )
        conn.execute(
            text(
                "INSERT INTO lesson (teacher_id, student_id, date, duration_minutes,"
                " price_cents, created_at)"
                " SELECT s.teacher_id, s.id, DATE '2026-01-01' + (n % 300), 45, 4250, now()"
                " FROM generate_series(1, 500) n"
                " JOIN student s ON s.name = 'Perf ' || (n % 20 + 1)"
                " JOIN teacher t ON t.id = s.teacher_id AND t.email = :email"
            ),
            {"email": email},
        )

    durations = []
    with httpx.Client(base_url=API_URL, headers=headers, timeout=10) as client:
        assert client.get("/api/lessons", params={"page_size": 500}).json()["total"] == 500
        for _ in range(SAMPLES):
            started = time.perf_counter()
            response = client.get("/api/lessons", params={"page_size": 500})
            durations.append(time.perf_counter() - started)
            assert len(response.json()["items"]) == 500

    p95 = statistics.quantiles(durations, n=20)[-1]
    assert p95 < 0.5, f"p95 {p95 * 1000:.0f} ms"
