---
feature: F01
project: PRJ-001
reviewer: code
round: 1
verdict: pass
blocking: 0
suggestions: 4
reviewed: feature/F01-teacher-accounts @ 23a6634c8c6a05d14fd2b5950f7bd9890b8c3800
---

# Code review: F01 Teacher accounts

## Round 1

### Findings

#### CODE-1: AC-3 and AC-5 backend tests were written after the code, so they never ran red
- **Severity**: suggestion
- **Category**: tdd
- **Location**: commits `8f176c0` (test AC-3/AC-5) after `ddf49fd` (feat AC-4)
- **Criterion**: AC-3, AC-5
- **Problem**: Logout and the 14-day expiry were implemented inside the AC-4 feat commit, then tested in a later commit that passed on arrival. AC-5 has no feat commit at all. The frontend side of AC-3 does have test (`07b3746`) before feat (`bc03fa0`), and the build report states the situation openly.
- **Evidence**: `git log` order: `ddf49fd feat AC-4` -> `8f176c0 test AC-3 and AC-5 (pass with the AC-4 endpoints)`. Not blocking because the tests exist, are specific (14d-1min 200, 14d+1min 401, `Max-Age=0`) and every criterion has at least one test-before-feat pair.
- **Suggestion**: Split the work by criterion next time, or note in the build report that the behavior is shared with another criterion (already done here).

#### CODE-2: Test commits carry runtime dependencies
- **Severity**: suggestion
- **Category**: tdd
- **Location**: `9d1cea6` (`argon2-cffi`, `backend/uv.lock`), `060adde` (`react-router`, `@tanstack/react-query`)
- **Criterion**: none
- **Problem**: `test(...)` commits should hold only tests; these add production dependencies. All are justified in the build report.
- **Evidence**: `git show --stat 9d1cea6 060adde`.
- **Suggestion**: Put dependency changes in a separate `chore` commit.

#### CODE-3: First unknown-email login pays an extra Argon2 hash
- **Severity**: suggestion
- **Category**: correctness
- **Location**: `backend/app/accounts/security.py:19` (`_unknown_account_hash` is `@cache`d lazily)
- **Criterion**: AC-2
- **Problem**: The first login for an unregistered email after process start hashes the dummy password and then verifies, so it takes about twice as long as a normal check. That is a one-time timing difference that reveals "unregistered" for that single request.
- **Evidence**: code read; the timing test compares medians, so it cannot see this.
- **Suggestion**: Compute the dummy hash at import or app startup.

#### CODE-4: Concurrent double logout can return 500
- **Severity**: suggestion
- **Category**: correctness
- **Location**: `backend/app/accounts/service.py:96` (`end_session`)
- **Criterion**: AC-3
- **Problem**: Two simultaneous `DELETE /api/sessions/current` with the same cookie both pass `find_active_session`; the second `db.delete` + `commit` hits an already deleted row (`StaleDataError`, a `SQLAlchemyError`) and answers 500 instead of 401/204. The frontend disables the button, so this needs a scripted client.
- **Evidence**: code read, not reproduced.
- **Suggestion**: Delete with `delete(Session).where(id == ...)` and ignore a zero row count.

### Summary
Checks are green on the current head (`23a6634`), no stale commit. The code is cleanly layered (router, service, security, rules), the migration is reversible and matches the data model, interfaces match the spec, and every AC has traceable tests with specific assertions. No blocking findings; the timing test is statistical (noted in the build report) and is worth watching for flakiness.
