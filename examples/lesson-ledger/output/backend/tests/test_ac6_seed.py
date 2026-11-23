"""AC-6: `make seed` creates or resets alice and bob, idempotently, with README credentials."""

import re
import threading
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app import seed
from tests.accounts_support import Accounts

README = Path(__file__).resolve().parents[2] / "README.md"
EXPECTED = {"alice@example.com": "alice-ledger-pass", "bob@example.com": "bob-ledger-pass1"}


def readme_seed_credentials() -> dict[str, str]:
    text = README.read_text()
    section = text.split("## Seed data", 1)[1].split("\n## ", 1)[0]
    rows = re.findall(r"^\|\s*`([^`]+@[^`]+)`\s*\|\s*`([^`]+)`\s*\|", section, re.MULTILINE)
    return dict(rows)


def test_ac6_readme_seed_section_lists_both_accounts() -> None:
    # F02 adds carol (spec UI "Many items", APR-1); the README lists every seed account.
    assert readme_seed_credentials() == seed.TEACHERS
    assert EXPECTED.items() <= seed.TEACHERS.items()


def test_ac6_seed_twice_keeps_one_teacher_each_and_readme_passwords_log_in(
    client: TestClient, accounts: Accounts, capsys: pytest.CaptureFixture[str]
) -> None:
    for email in EXPECTED:
        accounts.forget(email)

    seed.main()
    seed.main()

    output = capsys.readouterr().out
    assert len(output.strip().splitlines()) == 2  # one line per run
    for email, password in EXPECTED.items():
        assert accounts.count(email) == 1
        response = client.post("/api/sessions", json={"email": email, "password": password})
        assert response.status_code == 200, email


def test_ac6_seed_resets_a_changed_password(client: TestClient, accounts: Accounts) -> None:
    seed.main()
    with accounts.engine.begin() as conn:
        conn.execute(
            text("UPDATE teacher SET password_hash = 'changed' WHERE email = 'alice@example.com'")
        )

    seed.main()

    response = client.post(
        "/api/sessions",
        json={"email": "alice@example.com", "password": EXPECTED["alice@example.com"]},
    )
    assert response.status_code == 200


def test_ac6_concurrent_seed_runs_both_succeed(accounts: Accounts) -> None:
    """E2E workers seed in parallel; two runs on an empty table must not collide."""
    for email in EXPECTED:
        accounts.forget(email)
    barrier = threading.Barrier(2)
    errors: list[BaseException] = []

    def run() -> None:
        barrier.wait()
        try:
            seed.main()
        except BaseException as exc:
            errors.append(exc)

    threads = [threading.Thread(target=run) for _ in range(2)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    assert errors == []
    for email in EXPECTED:
        assert accounts.count(email) == 1
