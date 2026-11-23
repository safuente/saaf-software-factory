"""Spec Configuration: SESSION_COOKIE_SECURE (Secure flag of the ll_session cookie, AC-1)."""

from pathlib import Path

import pytest

from app.core.config import Settings

ROOT = Path(__file__).resolve().parents[2]


@pytest.mark.parametrize(
    ("value", "expected"), [("true", True), ("TRUE", True), ("false", False), ("", False)]
)
def test_ac1_session_cookie_secure_is_read_from_env(value: str, expected: bool) -> None:
    assert Settings.from_env({"SESSION_COOKIE_SECURE": value}).session_cookie_secure is expected


def test_ac1_session_cookie_secure_defaults_to_false() -> None:
    assert Settings.from_env({}).session_cookie_secure is False


def test_ac1_env_example_documents_session_cookie_secure() -> None:
    lines = (ROOT / ".env.example").read_text().splitlines()
    index = lines.index("SESSION_COOKIE_SECURE=false")
    assert "HTTPS" in lines[index - 1]
    assert lines[index - 1].startswith("#")


def test_ac1_readme_and_compose_pass_session_cookie_secure() -> None:
    assert "| `SESSION_COOKIE_SECURE` |" in (ROOT / "README.md").read_text()
    compose = (ROOT / "docker-compose.yml").read_text()
    assert "SESSION_COOKIE_SECURE: ${SESSION_COOKIE_SECURE:-false}" in compose
