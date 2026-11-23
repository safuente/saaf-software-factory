#!/usr/bin/env bash
# Usage: scripts/stage.sh <label> <command> [args...]
# Runs a command with its output captured (conventions §2 "Quiet output").
# Success: prints "<label> ok", or "<label>: <summary>" if the command wrote one to $STAGE_SUMMARY.
# Failure: prints "<label> FAILED" followed by the captured output, and exits with its status.
set -uo pipefail

label="$1"
shift
log="$(mktemp)"
STAGE_SUMMARY="$(mktemp)"
export STAGE_SUMMARY
trap 'rm -f "$log" "$STAGE_SUMMARY"' EXIT

"$@" >"$log" 2>&1
status=$?

if (( status == 0 )); then
  if [[ -s "$STAGE_SUMMARY" ]]; then
    printf '%s: %s\n' "$label" "$(head -n 1 "$STAGE_SUMMARY")"
  else
    printf '%s ok\n' "$label"
  fi
  exit 0
fi

printf '%s FAILED\n' "$label"
lines=$(wc -l <"$log")
if (( lines > 200 )); then
  printf '(last 200 of %d lines)\n' "$lines"
fi
tail -n 200 "$log"
exit "$status"
