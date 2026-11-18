# Build report: F02 Students and recording lessons

- Spec: projects/PRJ-001-lesson-ledger/specs/F02-students-and-lessons.md (version 1)
- Repo: workspaces/.worktrees/lesson-ledger/F02-students-and-lessons
- Branch: feature/F02-students-and-lessons (23 commits on main 71b562e; main has not moved, no rebase needed, no remote)
- Mode: build
- Result: complete

## Criteria
| Criterion | Tests | Status |
|---|---|---|
| AC-1 | backend/tests/test_students.py (`test_ac1_*`: 201 trimmed name, case-insensitive order with creation-order ties, 100 code points, invalid names 422 + nothing stored + no echo, 415, paging and invalid paging); test_lesson_validation.py::test_ac1_database_enforces_student_name_length; frontend/src/features/students/StudentsPage.test.tsx ("AC-1 students page", "Main navigation"); students/validation.test.ts; e2e/f02-students.spec.ts | passing |
| AC-2 | backend/tests/test_lessons.py (`test_ac2_*`: 201 unpaid lesson, extra `paid` ignored, newest first, same-date newest created first, cents bounds, date/duration bounds, paging); tests/stack/test_lessons_performance.py (p95 of 500 lessons); LessonsPage.test.tsx ("AC-2 lessons page"); shared/format.test.ts; e2e/f02-lessons.spec.ts "AC-2 records lessons…" | passing |
| AC-3 | backend/tests/test_lesson_validation.py (`test_ac3_*`: 26 invalid field cases, missing fields, no echo, 415, database range checks); LessonsPage.test.tsx ("AC-3 lesson form errors": every field message, association, focus, clear-on-change, server 422 mapping, network/5xx/404 alerts with values kept and focus on Record lesson); lessons/validation.test.ts; StudentsPage.test.tsx (add-student failure alert); e2e/f02-lessons.spec.ts and f02-students.spec.ts "AC-3 …" | passing |
| AC-4 | LessonsPage.test.tsx ("AC-4 lessons page without students"); e2e/f02-lessons.spec.ts "AC-4 …" | passing |
| AC-5 | backend/tests/test_isolation.py (`test_ac5_*`: own records only, identical 404 for another teacher's and nonexistent ids incl. out-of-int4 ids, database rejects cross-teacher lesson, enumeration of every registered route without cookie and with `not-a-real-token`, a route added without auth still 401, public routes stay public, unknown paths keep 404/405, student names never logged); e2e/f02-isolation-and-seed.spec.ts "AC-5 …" | passing |
| AC-6 | backend/tests/test_seed_ledger.py (`test_ac6_*`: seed twice, reset of added data, dates relative to server date for month/leap-year edges, 3 concurrent runs, README section); existing test_ac6_seed.py still passes; e2e/f02-isolation-and-seed.spec.ts "AC-6 …" | passing |

Non-functional: axe (wcag2a/2aa/21aa) on /students and /lessons default, empty, no-students, field-error, submit-failure, load-failure and many-items states, 1280/768 px no horizontal scroll, keyboard order with visible focus: e2e/accessibility.spec.ts "F02 pages".

## Checks
| Stage | Command | Result |
|---|---|---|
| Install | `make check` | pass |
| Lint | `make check` (ruff, ESLint, Prettier, OpenAPI contract) | pass |
| Type check | `make check` (mypy strict, tsc) | pass |
| Tests | `make check` | pass: backend 270 passed, 1 skipped, coverage 99%; frontend 194 passed, coverage 98% |
| Build | `make check` | pass |
| Scan | `make check` (bandit, pip-audit, npm audit) | pass |
| E2E | `make e2e` | pass, 29 passed (run 3 times green) |

## Changes
- New dependencies: none
- Migrations: `backend/alembic/versions/0003_student_and_lesson.py` (student, lesson; composite FK `(student_id, teacher_id)` → `student(id, teacher_id)` so the database rejects a cross-teacher lesson; CHECKs for name length, date range, duration, price; indexes `(teacher_id, lower(name), id)` and `(teacher_id, date DESC, id DESC)`). Downgrade drops both tables; covered by test_migrations.py.
- Default-deny: app-wide dependency `authenticate_unless_public` (`app/accounts/auth.py`) registered before the JSON-body check, with `PUBLIC_ROUTES` allow-list; `CurrentSession` reuses the session checked for the request.
- Seed: `app/seed.py` now upserts teachers and replaces alice's and bob's students and lessons in one transaction under a PostgreSQL advisory lock (parallel e2e workers); dates computed from `date.today()` in the backend container.
- Tests changed rather than added:
  - `tests/test_migrations.py::test_ac1_migrations_create_teacher_and_session_tables`: exact table set → subset; F02 adds tables.
  - `tests/test_openapi.py::test_openapi_schema_contains_health_and_account_endpoints`: adds `/api/students`, `/api/lessons` (F02 Interfaces).
  - `tests/test_errors.py` and `tests/test_db_error_logging.py` probe-route fixtures now sign in first: F02 AC-5 makes every non-public route require a session.
  - `tests/accounts_support.py::Accounts.forget` and e2e `forgetTeacher` delete the teacher's lessons and students first (FK restrict).
  - Own tests corrected before green: StudentsPage "line break" case replaced by a BEL control character (a text input drops pasted line breaks itself; the line-break rule is covered in validation.test.ts); a Loading… test waited for the session gate's Loading instead of the page's.

## Open issues
- "Many items" (> 500) is not part of `make seed` (AC-6 fixes alice at 6/12); reviewers reach it with the e2e helper `addManyStudentsAndLessons` in `frontend/e2e/support/stack.ts`, noted in the README seed section.
- E2E specs were written after the component and API tests that drove the code (they verify the criteria end to end). Writing them found one real bug, reproduced test-first: after a success, the mutation awaited the list refetch, so a second submit during a slow reload was silently dropped (fixed in 349ed07 / b3c8978).
- Commit b3c8978 left a type error in an e2e file (a lint exit code was hidden by a pipe); 349ed07 fixes it. Both carry the same subject line.
- F01's `features/auth/useFieldErrors` still exists next to the new generic `shared/ui/useFormErrors`; login/sign-up were not migrated (out of scope; F01 messages unchanged per spec).
- Server and client trims differ for a few exotic Unicode whitespace characters (Python `str.strip` vs JS `trim`); harmless, since the server result is authoritative and shown.

## Fix round 1 (UI review)

- Findings: `projects/PRJ-001-lesson-ledger/reviews/F02-students-and-lessons/ui-reviewer.md` (round 1)
- Mode: fix
- Result: complete

### Findings
| Finding | Action | Commit |
|---|---|---|
| UI-1 (blocking): lessons table overflows the page at 375px | fixed: table wrapped in a `role="region"` scroll container (`overflow-x: auto`, `tabIndex={0}`, named by the table caption "Your lessons, newest first" via `aria-labelledby`); focus ring comes from the global `:focus-visible` style | test 83d47fc, fix 1c86b0c |
| UI-2 (suggestion): date cells wrap onto three lines | fixed: `white-space: nowrap` on the Date and Price cells (new `.nowrap` class in `ui.module.css`) | test 83d47fc, fix 1c86b0c |

### Tests
- `frontend/e2e/accessibility.spec.ts`: `expectNoHorizontalScroll` now also checks 375px (every page using it, including login/sign-up and the /lessons many-items state); the alice `/lessons` check asserts each `<time>` in the table renders as one line box. Red before the fix: overflow 57px (alice) and 33px (many items) at 375px.
- `frontend/src/features/lessons/LessonsPage.test.tsx`: "wraps the table in a focusable, named scroll region ... (UI-1)".

### Checks
| Stage | Command | Result |
|---|---|---|
| Local CI | `make check` | pass (backend 270 passed, 1 skipped, coverage 99%; frontend 195 passed, coverage 98%; build, scan ok) |
| End to end | `make e2e` | pass, 29 tests |

### Changes
- New dependencies: none
- Migrations: none
- Tests changed rather than added: `expectNoHorizontalScroll` widened from [1280, 768] to [1280, 768, 375] (stricter, not weaker).

### Open issues
- The UI-2 one-line-date assertion runs after the overflow assertion, so its own red state was not observed separately; the reviewer's screenshot documents the wrapping it guards against.
- The frontend container serves a production build: after frontend changes, `make up` must be rerun before `make e2e` reflects them.

## Fix round 3 (Approver round 2, APR-1)

- Mode: fix
- Findings: `projects/PRJ-001-lesson-ledger/reviews/F02-students-and-lessons/approval.md`
- Result: complete
- Head: ce82bf4 (main is an ancestor; no remote, no rebase needed)

### Findings
| Finding | Action | Commit |
|---|---|---|
| APR-1 (blocking): "Many items" state not reachable with `make seed` | fixed: `make seed` also creates/resets `carol@example.com` / `carol-ledger-pass` with 510 students and 520 unpaid lessons (bulk insert in the same transaction and advisory lock); README seed table and "Many items" line updated. alice (6/12) and bob (0/0) unchanged | d0878e9 (test), ce82bf4 (fix) |

### Tests
| Rule | Tests | Status |
|---|---|---|
| UI "Many items" reachable after seed | `backend/tests/test_seed_ledger.py::test_seed_many_items_carol_has_more_than_500_students_and_lessons` (seed twice, carol's added student removed, `total` > 500 items shown for both lists, alice/bob state intact), `::test_seed_many_items_readme_lists_carol` | passing |

### Checks
| Stage | Command | Result |
|---|---|---|
| Lint, typecheck | `make lint` | pass |
| Tests | `make test` | pass: backend 272 passed, 1 skipped, coverage 99%; frontend 195 passed, coverage 98% |
| Full gate | `make check` | pass (install, lint, typecheck, test, build, scan) |
| E2E | `make e2e` | pass, 29 |
| Seed | `make seed` twice after rebuild | exit 0; carol API totals 510 students / 520 lessons with 500 items per page; alice 6/12 |

### Changes
- New dependencies: none
- Migrations: none
- Tests changed rather than added: `backend/tests/test_ac6_seed.py::test_ac6_readme_seed_section_lists_both_accounts` asserted the README seed table had exactly alice and bob; it now asserts the table equals `seed.TEACHERS` and still contains alice and bob with their F01 passwords (APR-1 adds carol).

### Open issues
- `make seed` runs in the backend container; after pulling this change, `make up` (which rebuilds) is needed before `make seed` shows carol.
