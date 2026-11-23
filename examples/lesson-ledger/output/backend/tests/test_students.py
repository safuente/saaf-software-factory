"""F02 AC-1: add and list students (POST/GET /api/students); spec Behavior: Student name,
Student order, Pagination parameters, Logging."""

import re
from typing import Any

import pytest
from fastapi.testclient import TestClient

from tests.accounts_support import Accounts
from tests.ledger_support import ISO_UTC, Teacher


@pytest.fixture
def teacher(client: TestClient, accounts: Accounts) -> Teacher:
    return Teacher(client, accounts)


def names(response_body: dict[str, Any]) -> list[str]:
    return [item["name"] for item in response_body["items"]]


def test_ac1_add_student_returns_201_with_trimmed_name(teacher: Teacher) -> None:
    response = teacher.post("/api/students", {"name": " Zoe Park "})

    assert response.status_code == 201
    body = response.json()
    assert set(body) == {"id", "name", "created_at"}
    assert isinstance(body["id"], int)
    assert body["name"] == "Zoe Park"
    assert re.match(ISO_UTC, body["created_at"])
    assert teacher.count("student") == 1


def test_ac1_list_is_sorted_case_insensitively_with_paging_envelope(teacher: Teacher) -> None:
    teacher.add_student(" Zoe Park ")
    teacher.add_student("adam Lee")

    response = teacher.get("/api/students")

    assert response.status_code == 200
    body = response.json()
    assert names(body) == ["adam Lee", "Zoe Park"]
    assert {k: body[k] for k in ("total", "page", "page_size")} == {
        "total": 2,
        "page": 1,
        "page_size": 50,
    }
    assert set(body["items"][0]) == {"id", "name", "created_at"}


def test_ac1_same_name_ties_are_in_creation_order(teacher: Teacher) -> None:
    ids = [teacher.add_student(name)["id"] for name in ("sam", "SAM", "Sam", "Ann")]

    items = teacher.get("/api/students").json()["items"]

    assert [item["id"] for item in items] == [ids[3], ids[0], ids[1], ids[2]]


def test_ac1_inner_whitespace_is_kept_and_duplicates_allowed(teacher: Teacher) -> None:
    first = teacher.add_student("Zoe   Park")
    second = teacher.add_student("Zoe   Park")

    assert first["name"] == second["name"] == "Zoe   Park"
    assert first["id"] != second["id"]


@pytest.mark.parametrize(
    "name", ["x" * 100, "é" * 100, "😀" * 100, "\N{NO-BREAK SPACE}A\N{NO-BREAK SPACE}"]
)
def test_ac1_name_of_up_to_100_code_points_is_accepted(teacher: Teacher, name: str) -> None:
    response = teacher.post("/api/students", {"name": name})

    assert response.status_code == 201
    assert response.json()["name"] == name.strip()


@pytest.mark.parametrize(
    "body",
    [
        {"name": ""},
        {"name": "   "},
        {"name": "x" * 101},
        {"name": " " + "x" * 101 + " "},
        {"name": "Secret\tName"},
        {"name": "Secret\nName"},
        {"name": "Secret\x00Name"},
        {"name": None},
        {"name": 5},
        {},
    ],
)
def test_ac1_invalid_name_returns_422_and_stores_nothing(
    teacher: Teacher, body: dict[str, Any]
) -> None:
    response = teacher.post("/api/students", body)

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"
    assert "Secret" not in response.text
    assert teacher.count("student") == 0


def test_ac1_students_accepts_json_only(teacher: Teacher) -> None:
    response = teacher.client.post(
        "/api/students",
        content="name=Zoe",
        headers={**teacher.headers, "Content-Type": "application/x-www-form-urlencoded"},
    )

    assert response.status_code == 415
    assert teacher.count("student") == 0


def test_ac1_paging_returns_the_requested_page_and_real_total(teacher: Teacher) -> None:
    for name in ("Cy", "Ann", "Bo"):
        teacher.add_student(name)

    second = teacher.get("/api/students", page=2, page_size=2).json()
    past_end = teacher.get("/api/students", page=9, page_size=2).json()

    assert names(second) == ["Cy"]
    assert (second["total"], second["page"], second["page_size"]) == (3, 2, 2)
    assert past_end["items"] == []
    assert past_end["total"] == 3


def test_ac1_page_size_500_is_allowed(teacher: Teacher) -> None:
    response = teacher.get("/api/students", page_size=500)

    assert response.status_code == 200
    assert response.json()["page_size"] == 500


@pytest.mark.parametrize(
    "params",
    [
        {"page": 0},
        {"page": -1},
        {"page": "abc"},
        {"page": 1.5},
        {"page_size": 0},
        {"page_size": 501},
        {"page_size": "x"},
    ],
)
def test_ac1_invalid_paging_returns_422(teacher: Teacher, params: dict[str, Any]) -> None:
    response = teacher.get("/api/students", **params)

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"
