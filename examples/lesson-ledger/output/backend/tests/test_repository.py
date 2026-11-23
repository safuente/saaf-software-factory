"""AC-1: repository layout, configuration files, pinned versions and documented targets."""

import hashlib
import json
import os
import re
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
MAKE_TARGETS = ("install", "up", "down", "seed", "lint", "test", "e2e", "check")
ENV_KEYS = (
    "COMPOSE_PROJECT_NAME",
    "APP_PORT",
    "FRONTEND_PORT",
    "DB_PORT",
    "REDIS_PORT",
    "APP_URL",
    "API_URL",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "POSTGRES_DB",
)
ENV_DEFAULTS = {
    "APP_PORT": "8000",
    "FRONTEND_PORT": "3000",
    "DB_PORT": "5432",
    "APP_URL": "http://localhost:3000",
    "API_URL": "http://localhost:8000",
}


def _read(relative: str) -> str:
    return (ROOT / relative).read_text()


def _git(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(  # noqa: S603
        ["git", "-C", str(ROOT), *args],  # noqa: S607
        capture_output=True,
        text=True,
        check=False,
    )


def _readme_version(name: str) -> str:
    match = re.search(rf"^\|\s*{re.escape(name)}\s*\|\s*([0-9.]+)\s*\|", _read("README.md"), re.M)
    assert match, f"README has no version row for {name}"
    return match.group(1)


def _parse_env(text: str) -> dict[str, str]:
    pairs = (line.split("=", 1) for line in text.splitlines() if "=" in line)
    return {k.strip(): v.strip() for k, v in pairs if not k.lstrip().startswith("#")}


@pytest.mark.parametrize(
    "path",
    [
        "backend",
        "frontend",
        "docs/adr",
        "docker-compose.yml",
        "Makefile",
        "CLAUDE.md",
        "README.md",
        ".env.example",
    ],
)
def test_ac1_required_path_exists(path: str) -> None:
    assert (ROOT / path).exists()


# SHA-256 of each ADR in the project plan's plan/adr/ when it was copied (AC-1: identical content).
# The plan lives outside this repository; set PLAN_ADR_DIR to also compare against it directly.
PLAN_ADR_SHA256 = {
    "001-stack.md": "adac71df2645d00437d8db2c8dcc322b785ed45e7b96c9b7d8661c1bc8b377aa",
    "002-local-environment-and-ci.md": (
        "97b03f631110ae45e80dd8a622262c986f8cfb0fa8b913d63e69c1e0e516dc0a"
    ),
    "003-data-model.md": "a88e270a487c7382eb43d7e83c5988b6b19e0b3138bb544d71d1a733322545fd",
    "004-authentication.md": "81278893716881e737072b8d385383dc12c75ea5a6cce03ce83f7f680c489fe6",
}


def test_ac1_adrs_001_to_004_are_copied() -> None:
    names = sorted(p.name for p in (ROOT / "docs/adr").glob("*.md"))

    assert names == sorted(PLAN_ADR_SHA256)


@pytest.mark.parametrize("name", sorted(PLAN_ADR_SHA256))
def test_ac1_adr_content_is_identical_to_the_plan(name: str) -> None:
    digest = hashlib.sha256((ROOT / "docs/adr" / name).read_bytes()).hexdigest()

    assert digest == PLAN_ADR_SHA256[name]


@pytest.mark.skipif(not os.environ.get("PLAN_ADR_DIR"), reason="PLAN_ADR_DIR not set")
def test_ac1_adrs_match_plan_adr_dir() -> None:
    plan = Path(os.environ["PLAN_ADR_DIR"])
    plan_files = {p.name: p.read_bytes() for p in plan.glob("*.md")}
    repo_files = {p.name: p.read_bytes() for p in (ROOT / "docs/adr").glob("*.md")}

    assert repo_files == plan_files


def test_ac1_env_is_ignored_and_untracked_and_example_is_tracked() -> None:
    assert _git("check-ignore", "-q", ".env").returncode == 0
    assert _git("ls-files", "--error-unmatch", ".env").returncode != 0
    assert _git("check-ignore", "-q", ".env.example").returncode != 0


def test_ac1_env_example_lists_every_variable_with_defaults() -> None:
    env = _parse_env(_read(".env.example"))

    assert set(ENV_KEYS) <= set(env)
    for key, default in ENV_DEFAULTS.items():
        assert env[key] == default


def test_ac1_python_version_matches_readme_image_and_toolchain() -> None:
    version = _readme_version("Python")

    assert re.fullmatch(r"\d+\.\d+\.\d+", version)
    assert _read("backend/.python-version").strip() == version
    assert f'requires-python = "=={version}"' in _read("backend/pyproject.toml")
    assert f"FROM python:{version}-" in _read("backend/Dockerfile")


def test_ac1_node_version_matches_readme_image_and_toolchain() -> None:
    version = _readme_version("Node.js")

    assert re.fullmatch(r"\d+\.\d+\.\d+", version)
    assert _read("frontend/.nvmrc").strip() == version
    assert json.loads(_read("frontend/package.json"))["engines"]["node"] == version
    assert f"FROM node:{version}-" in _read("frontend/Dockerfile")


def test_ac1_postgresql_version_matches_readme_and_image() -> None:
    version = _readme_version("PostgreSQL")

    assert re.fullmatch(r"\d+\.\d+", version)
    assert re.search(rf"image:\s*postgres:{re.escape(version)}-", _read("docker-compose.yml"))


@pytest.mark.parametrize("target", MAKE_TARGETS)
def test_ac1_makefile_defines_and_readme_documents_target(target: str) -> None:
    assert re.search(rf"^{target}:", _read("Makefile"), re.M)
    assert f"make {target}" in _read("README.md")


def test_makefile_reads_env() -> None:
    makefile = _read("Makefile").splitlines()

    assert "-include .env" in makefile
    assert "export" in makefile


def test_compose_has_no_container_name_and_no_literal_host_port() -> None:
    compose = _read("docker-compose.yml")
    port_lines = re.findall(r'^\s*-\s*"?([^"\n]+:\d+)"?\s*$', compose, re.M)

    assert "container_name" not in compose
    assert port_lines, "expected published ports"
    for mapping in port_lines:
        assert re.fullmatch(r"127\.0\.0\.1:\$\{[A-Z_]+_PORT:-\d+\}:\d+", mapping), mapping
