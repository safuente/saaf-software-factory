"""AC-6: scripts/stage.sh, the wrapper that keeps every `make check` stage to one line on success
and names the stage and shows the captured output on failure."""

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STAGE = ROOT / "scripts" / "stage.sh"


def _stage(label: str, script: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(  # noqa: S603 - fixed local script, test-controlled arguments
        [str(STAGE), label, "bash", "-c", script],
        capture_output=True,
        text=True,
        check=False,
    )


def test_ac6_stage_success_prints_one_ok_line_and_hides_command_output() -> None:
    result = _stage("lint", "for i in $(seq 50); do echo progress $i; echo noise $i >&2; done")

    assert result.returncode == 0
    assert result.stdout == "lint ok\n"
    assert result.stderr == ""


def test_ac6_stage_success_prints_the_summary_line_when_the_command_writes_one() -> None:
    result = _stage(
        "test", 'echo per-test line; printf "12 passed\\nsecond line\\n" >"$STAGE_SUMMARY"'
    )

    assert result.returncode == 0
    assert result.stdout == "test: 12 passed\n"


def test_ac6_stage_failure_names_the_stage_shows_output_and_keeps_exit_status() -> None:
    result = _stage("lint", "echo 'app/seed.py:1:1: F401 unused import'; echo detail >&2; exit 3")

    assert result.returncode == 3
    lines = result.stdout.splitlines()
    assert lines[0] == "lint FAILED"
    assert "app/seed.py:1:1: F401 unused import" in lines
    assert "detail" in lines


def test_ac6_stage_failure_keeps_only_the_last_200_lines_of_long_output() -> None:
    result = _stage(
        "test", "for i in $(seq 500); do echo line $i; done; echo FAILED test_x; exit 1"
    )

    assert result.returncode == 1
    lines = result.stdout.splitlines()
    assert lines[:2] == ["test FAILED", "(last 200 of 501 lines)"]
    assert len(lines) == 202
    assert lines[-1] == "FAILED test_x"
