"""Helpers for student and lesson tests: logged-in teachers, request bodies and row counts."""

from typing import Any

import httpx2 as httpx
from fastapi.testclient import TestClient
from sqlalchemy import text

from tests.accounts_support import Accounts, cookie_header, session_cookie

PASSWORD = "correct-horse-1"
ISO_UTC = r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$"


class Teacher:
    """A fresh teacher with a session; requests carry its cookie explicitly."""

    def __init__(self, client: TestClient, accounts: Accounts) -> None:
        self.client = client
        self.accounts = accounts
        self.email = accounts.fresh()
        response = client.post("/api/teachers", json={"email": self.email, "password": PASSWORD})
        self.headers = cookie_header(session_cookie(response))
        client.cookies.clear()

    def get(self, path: str, **params: Any) -> httpx.Response:
        return self.client.get(path, params=params or None, headers=self.headers)

    def post(self, path: str, body: Any) -> httpx.Response:
        return self.client.post(path, json=body, headers=self.headers)

    def patch(self, path: str, body: Any) -> httpx.Response:
        return self.client.patch(path, json=body, headers=self.headers)

    def add_student(self, name: str) -> dict[str, Any]:
        response = self.post("/api/students", {"name": name})
        assert response.status_code == 201, response.text
        body: dict[str, Any] = response.json()
        return body

    def record_lesson(self, student_id: int, **overrides: Any) -> httpx.Response:
        return self.post("/api/lessons", lesson_body(student_id, **overrides))

    def add_lesson(self, student_id: int, date: str, amount: int, *, paid: bool = False) -> int:
        """Records a lesson through the API and, if `paid`, marks it paid directly in the
        database; returns its id."""
        response = self.record_lesson(
            student_id, date=date, price={"amount": amount, "currency": "USD"}
        )
        assert response.status_code == 201, response.text
        lesson_id: int = response.json()["id"]
        if paid:
            set_paid(self.accounts, lesson_id, paid=True)
        return lesson_id

    def count(self, table: str) -> int:
        """Rows of `table` (student or lesson) owned by this teacher."""
        assert table in {"student", "lesson"}
        with self.accounts.engine.connect() as conn:
            return int(
                conn.execute(
                    text(
                        f"SELECT count(*) FROM {table} WHERE teacher_id = "  # noqa: S608
                        "(SELECT id FROM teacher WHERE email = :email)"
                    ),
                    {"email": self.email},
                ).scalar_one()
            )


def lesson_body(student_id: int, **overrides: Any) -> dict[str, Any]:
    body: dict[str, Any] = {
        "student_id": student_id,
        "date": "2026-11-03",
        "duration_minutes": 45,
        "price": {"amount": 4250, "currency": "USD"},
    }
    body.update(overrides)
    return body


def set_paid(accounts: Accounts, lesson_id: int, *, paid: bool) -> None:
    with accounts.engine.begin() as conn:
        conn.execute(
            text("UPDATE lesson SET paid = :paid WHERE id = :id"), {"paid": paid, "id": lesson_id}
        )


def lesson_paid(accounts: Accounts, lesson_id: int) -> bool:
    with accounts.engine.connect() as conn:
        return bool(
            conn.execute(
                text("SELECT paid FROM lesson WHERE id = :id"), {"id": lesson_id}
            ).scalar_one()
        )


def usd(amount: int) -> dict[str, Any]:
    return {"amount": amount, "currency": "USD"}
