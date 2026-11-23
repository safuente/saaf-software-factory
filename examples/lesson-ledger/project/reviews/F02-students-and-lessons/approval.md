---
feature: F02
project: PRJ-001
round: 3
decision: approved
route_to: human-merge
reviewed: feature/F02-students-and-lessons @ ce82bf4507345e1c74cfb393288aa35a8c379dd8
spec_version: 1
---

# Approval: F02 Students and recording lessons

## Round 2

First Approver pass; pipeline round 2 (round 1 was the UI-1 fix loop). No previous `approval.md`.

Independent checks ran against the shared stack (`http://localhost:3103`, `http://localhost:8103`, container `lesson-ledger-f02-backend-1`) with teachers created through `POST /api/teachers` (`apr-*@example.com`). alice and bob were only read. I did not run `make seed`, `make up`, `make down` or any test. Scripts and screenshots are in `/private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/apr/` (`api.mjs`, `noauth.mjs`, `seedcheck.mjs`, `ui.mjs`, `ui2.mjs`, `shots/`).

### Preconditions
| Check | Result |
|---|---|
| Security review | pass (round 2 @ 1c86b0c, 0 blocking) |
| Code review | pass (round 2 @ 1c86b0c, 0 blocking, 2 open suggestions) |
| UX review | pass (round 2 @ 1c86b0c, 0 blocking, 3 open suggestions) |
| UI review | pass (round 2 @ 1c86b0c, 0 blocking) |
| Spec `status: approved`, version 1 = build report version 1 | pass |
| Checks (`make check`, `make e2e`) | pass @ 1c86b0cf9c0e7b1bd2f4d619d9e0ef3468c6761a = head of `feature/F02-students-and-lessons` |

### Acceptance criteria
| Criterion | Tests | Independent check | Result |
|---|---|---|---|
| AC-1 | `backend/tests/test_students.py::test_ac1_*` (trimmed 201, case-insensitive order + ties, envelope, invalid names 422 + nothing stored, paging); `StudentsPage.test.tsx` "AC-1 students page" (each invalid value: message, `aria-invalid`, `aria-describedby`, focus, no request, cleared on change; success clears/focuses Name, `role="status"`, order); `e2e/f02-students.spec.ts` "AC-1 …" | API: empty `GET /api/students` → `{"items":[],"total":0,"page":1,"page_size":50}`; `POST {"name":" Zoe Park "}` → 201 `"name":"Zoe Park"`; `POST "adam Lee"` → 201; `GET` → `["adam Lee","Zoe Park"]`, total 2, page 1, page_size 50. `""`, `"   "`, 101 chars, tab, newline → 422 `validation_error`, total unchanged. UI (Playwright, new teacher): h1 "Students", empty-state text visible; empty / whitespace / 101 chars → 0 POSTs, `aria-invalid="true"`, describedby text "Enter the student's name." / "Name must be 100 characters or fewer.", focus on field; typing one character removes both. Add " Zoe Park ", "adam Lee" → field `""`, focus `INPUT#name`, "Student added." in `role="status"`, list `['adam Lee','Zoe Park']`, `window.__marker` survived (no reload) | pass |
| AC-2 | `test_lessons.py::test_ac2_*` (201 unpaid, `paid` ignored, newest first, same-date order, cents bounds); `LessonsPage.test.tsx` "AC-2 lessons page"; `shared/format.test.ts`; `e2e/f02-lessons.spec.ts` "AC-2 records lessons…" (exact request body, row cells, `$1,250.00`, `$0.00`, order in table and API) | API: `POST /api/lessons` Zoe 2026-11-03/45/4250 → 201 `{"student":{"id":633,"name":"Zoe Park"},"date":"2026-11-03","duration_minutes":45,"price":{"amount":4250,"currency":"USD"},"paid":false,…}`; extra `"paid": true` → stored `paid:false`; list order `2026-11-10, 2026-11-03 (id 726), 2026-11-03 (id 723), 2026-10-28`. UI: request body `{"student_id":638,"date":"2026-11-03","duration_minutes":45,"price":{"amount":4250,"currency":"USD"}}`; row `Zoe Park \| Nov 3, 2026 \| 45 min \| $42.50 \| Unpaid`, `<time datetime="2026-11-03">`; "Lesson recorded." in `role="status"`; date kept, focus on Student select; table `Nov 10 $0.00`, `Nov 3 $42.50`, `Oct 28 $1,250.00`; no reload; students-but-no-lessons shows "No lessons recorded yet." Screenshot `shots/ac2-lessons.png` | pass |
| AC-3 | `test_lesson_validation.py::test_ac3_*` (26 invalid fields incl. every AC value, missing fields, nothing stored, DB CHECKs); `LessonsPage.test.tsx` "AC-3 lesson form errors" (every AC value, association, focus, clear on change, network/5xx with values kept and focus on Record lesson); `StudentsPage.test.tsx` add-student network/5xx; e2e "AC-3 …" in both specs | API: `duration_minutes` 0, 601; `amount` -1, 1000001, 42.5; `currency` EUR; `date` 2026-02-30, 1999-12-31; each missing field → 422 `validation_error`; lesson total unchanged (4 → 6 only from the two valid bound cases 1000000/2099-12-31/600 and 2000-01-01/1). UI: no student, empty date, duration 0/-5/45.5/601, price -1/12.345/abc/$45/10000.01 → 0 POSTs each, exact AC message in the `aria-describedby` target, `aria-invalid="true"`, focus on field, cleared after a change. POST aborted (network) and 503 → alert "We couldn't reach Lesson Ledger. Please try again.", values kept (Zoe Park, 2026-11-05, 50, 55.5), focus `BUTTON[Record lesson]`. Add student 500 → same alert, name kept, focus `BUTTON[Add student]`. Screenshot `shots/ac3-lessons-503.png` | pass |
| AC-4 | `LessonsPage.test.tsx` "AC-4 lessons page without students"; e2e "AC-4 without students…" | UI, teacher with no students: "Add a student before recording a lesson." and "No lessons recorded yet." visible; `getByLabel("Student")` count 0, "Record lesson" button count 0; link "Add a student" → `/students` without reload. Screenshot `shots/ac4-lessons-no-students.png` | pass |
| AC-5 | `test_isolation.py::test_ac5_*` (own records only, identical 404 for other teacher's and nonexistent ids, DB rejects cross-teacher lesson, enumerates every registered `APIRoute` with no cookie and `not-a-real-token`, route added later without auth → 401, public routes, 404/405 kept, names not logged); e2e "AC-5 …" | Teachers B and C, one student + one lesson each: C's `GET /api/students` and `/api/lessons` → total 1, only "Cora One". C `POST /api/lessons` with B's student id → 404 `{"error":{"code":"not_found","message":"Not found","details":{}}}`; id 999999999 and 99999999999 → identical body; C and B lesson totals still 1. No cookie and `ll_session=not-a-real-token`: GET/POST `/api/students`, GET/POST `/api/lessons`, GET/DELETE `/api/sessions/current` (with and without `{}` body) → 401 `not_authenticated`. `/health`, `/api/health` 200; `POST /api/teachers`, `/api/sessions` `{}` → 422 (public). `/api/nothing-here` 404, `PUT /api/students` 405; `/docs`, `/openapi.json` 404 (disabled). UI pages of the test teacher contain none of "Bertha Secretname", "Cora One", "Ava Martin". `docker logs lesson-ledger-f02-backend-1`: 0 lines with any created student name | pass |
| AC-6 | `test_seed_ledger.py::test_ac6_*` (seed twice; reset of data added to alice and bob; dates for 4 server dates incl. year and leap edges; concurrent runs; README); `tests/stack/test_stack.py::test_ac6_make_seed_runs_twice_and_seeded_accounts_log_in` (real `make seed` twice, exit 0); e2e "AC-6 …" | Current seeded stack: alice login 200, 6 students, 12 lessons, months `2026-11: 4, 2026-10: 4, 2026-09: 4` (server date 2026-11-17), max 2 lessons on one date, non-zero cents (4550, 3375), none paid; bob login 200, 0 students, 0 lessons. README "Seed data" describes both. Not independently re-run: `make seed` is orchestrator-owned and the backend tests share the app's database; the double run with exit 0 is covered by the stack test passing at 1c86b0c | pass |

Behavior and Security rules checked beyond the ACs: paging (`page=0`, `page_size=0`, `page_size=501`, `page=abc` → 422; `page_size=500` → 200; `page=9` → `items: []` with real total 3); 100 code points accepted (`"é"×100` → 201); control characters rejected; validation `details` never echo submitted values; Main navigation `Home, Lessons, Students` with `aria-current="page"` on the current page; select first option "Choose a student", date defaults to today (2026-11-17); no session on `/lessons` → `/login`. All pass.

### Definition of done
| Item | Result |
|---|---|
| Every criterion has tests referencing its id | pass |
| CI stages pass locally | pass (`make check`, `make e2e` @ 1c86b0c) |
| Branch rebased on base; migrations apply after base's | pass (`main` is an ancestor of head; `0003` follows F01's migrations) |
| Migrations included and reversible | pass (`0003_student_and_lesson.py` downgrade drops both tables; `test_migrations.py` applies, reverts, reapplies) |
| `make seed` reaches every state in the spec's UI section | fail: see APR-1 |
| README updated if setup changed | pass (seed section and F02 states) |
| No TODOs without a backlog item | pass (no TODO/FIXME in `backend/app`, `backend/tests`, `frontend/src`, `frontend/e2e`) |

### Findings

#### APR-1: The "Many items" state is not reachable with `make seed`
- **Severity**: blocking
- **Category**: definition-of-done
- **Location**: `backend/app/seed.py`; `README.md` "Seed data" (line 87); `/students` and `/lessons` / Many items
- **Criterion**: spec UI section, "Many items" on `/students` and `/lessons` (Behavior: List sizes); conventions §8 "`make seed` reaches every state in the spec's UI section"
- **Problem**: The spec lists a "Many items" state for both pages (truncation messages "Showing the first 500 of {total} students." / "Showing the 500 most recent of {total} lessons."). After `make seed` no account has more than 6 students or 12 lessons, so the state cannot be reached. The README says it is "not seeded" and points to the e2e helper `addManyStudentsAndLessons` in `frontend/e2e/support/stack.ts`, which is a direct SQL insert used inside Playwright tests, not a command a reviewer or merger can run. The build report lists this as an open issue.
- **Evidence**: `seedcheck.mjs` after the fresh seed: alice `students 6`, `lessons 12`; bob `0`/`0`. README line 87: "Many items (more than 500, truncation message): not seeded; the e2e tests create such a teacher". `make seed` (`scripts/tasks.sh:64`) runs only `python -m app.seed`.
- **Suggestion**: Seed a third synthetic account (for example `carol@example.com`) with more than 500 students and more than 500 lessons, reset idempotently under the same advisory lock. List it in the README seed table and replace the "not seeded" line. Extend `test_seed_ledger.py` to check that its totals exceed 500. This is additive: AC-6 constrains only alice and bob, so their exact 6/12 and 0/0 stay as they are.

### Decision
Rejected, routed to the Builder. Every acceptance criterion (AC-1 to AC-6) passes: the tests cover each one as written, and my own checks against the running app agree. The rejection is for one Definition of done item, APR-1: `make seed` does not reach the spec's "Many items" UI state. It is a small, additive seed change and needs no spec change. The open Code and UX suggestions do not block.

## Round 3

Re-check after the APR-1 fix (`d0878e9`, `ce82bf4`). Diff `1c86b0c..ce82bf4` touches only `README.md`, `backend/app/seed.py`, `backend/tests/test_ac6_seed.py`, `backend/tests/test_seed_ledger.py`; no file under `frontend/`, no migration, no dependency. AC-1 to AC-5 are unaffected by these files and keep their round 2 evidence; AC-6 and APR-1 were re-verified. Checks ran against the shared stack seeded by the orchestrator; I did not run `make seed`, `make up`, `make down` or any test. Scripts and screenshots: `/private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/apr3/` (`check.mjs`, `shots/`).

### Preconditions
| Check | Result |
|---|---|
| Security review | pass (round 3 @ ce82bf4, 0 blocking) |
| Code review | pass (round 3 @ ce82bf4, 0 blocking, 3 open suggestions) |
| UX review | pass (round 2 @ 1c86b0c; `git diff 1c86b0c..ce82bf4 -- frontend/` is empty, not stale) |
| UI review | pass (round 2 @ 1c86b0c; same, not stale) |
| Spec `status: approved`, version 1 = build report version 1 | pass |
| Checks (`make check`, `make e2e`) | pass @ ce82bf4507345e1c74cfb393288aa35a8c379dd8 = head of `feature/F02-students-and-lessons` |

### Previous findings
| Id | Status | Note |
|---|---|---|
| APR-1 | resolved | `seed.py` adds `carol@example.com` with 510 students and 520 lessons, deleted and re-inserted in the same transaction and advisory lock as alice and bob. README lists carol and replaces the "not seeded" line. `test_seed_ledger.py::test_seed_many_items_*` checks totals > 500, reset of added data, and the README. |

### Acceptance criteria
| Criterion | Tests | Independent check | Result |
|---|---|---|---|
| AC-1 to AC-5 | unchanged since round 2 | round 2 evidence stands; no code under test changed | pass |
| AC-6 | `test_seed_ledger.py::test_ac6_*`, `test_ac6_seed.py` (now asserts README accounts = `seed.TEACHERS` and alice/bob credentials unchanged), `tests/stack/test_stack.py::test_ac6_*`; e2e "AC-6 …" | Fresh seed: alice login 200, 6 students, 12 lessons, none paid; bob login 200, 0/0. Carol's addition does not change alice's or bob's state | pass |

Behavior "List sizes" / UI "Many items" (APR-1), checked on the running app: carol login 200; `GET /api/students?page=1&page_size=500` → total 510, 500 items (`Student 001` … `Student 500`); `GET /api/lessons?page=1&page_size=500` → total 520, 500 items, newest 2026-11-17, oldest shown 2026-07-16, none paid. Playwright as carol: `/students` shows "Showing the first 500 of 510 students."; `/lessons` shows "Showing the 500 most recent of 520 lessons." after 500 table rows, Student select has 501 options (placeholder + 500). Screenshots `shots/many-students.png`, `shots/many-students-end.png`, `shots/many-lessons.png`, `shots/many-lessons-end.png`. pass.

### Definition of done
| Item | Result |
|---|---|
| Every criterion has tests referencing its id | pass |
| CI stages pass locally | pass (`make check`, `make e2e` @ ce82bf4) |
| Branch rebased on base; migrations apply after base's | pass (`main` is an ancestor of head) |
| Migrations included and reversible | pass (unchanged since round 2) |
| `make seed` reaches every state in the spec's UI section | pass (APR-1 resolved; Many items via carol) |
| README updated if setup changed | pass (carol in seed table and F02 states) |
| No TODOs without a backlog item | pass (none added) |

### Findings
None open.

### Decision
Approved, routed to human merge. All six acceptance criteria pass with tests that cover them as written and independent checks against the running app; APR-1 is resolved and every Definition of done item is met. Open non-blocking suggestions: CODE-1, CODE-2, CODE-3 and three UX suggestions. CODE-3 matters for reviewers: the F01 AC-1 e2e test deletes `carol@example.com`, so after running that spec alone, run `make seed` again to restore the Many items state.

## Pull request description

```markdown
## F02: Students and recording lessons

A logged-in teacher can add students and see them sorted by name, and record lessons (student, date, duration, USD price) listed newest first with formatted price and an "Unpaid" status. Teachers only see and use their own data; references to another teacher's student return 404. Every API route now requires a session unless it is on an explicit public allow-list (closes SEC-1 from F01).

Spec: projects/PRJ-001-lesson-ledger/specs/F02-students-and-lessons.md (v1)

### Acceptance criteria
| Criterion | Verified by |
|---|---|
| AC-1 Add and list students, name validation | `backend/tests/test_students.py::test_ac1_*`, `StudentsPage.test.tsx` "AC-1 students page", `e2e/f02-students.spec.ts` "AC-1 …", independent check |
| AC-2 Record lessons, order and price formatting | `backend/tests/test_lessons.py::test_ac2_*`, `LessonsPage.test.tsx` "AC-2 lessons page", `shared/format.test.ts`, `e2e/f02-lessons.spec.ts` "AC-2 …", independent check |
| AC-3 Lesson validation and failure handling | `backend/tests/test_lesson_validation.py::test_ac3_*`, `LessonsPage.test.tsx` "AC-3 lesson form errors", e2e "AC-3 …", independent check |
| AC-4 Lessons page without students | `LessonsPage.test.tsx` "AC-4 …", e2e "AC-4 …", independent check |
| AC-5 Teacher isolation, auth by default on all routes | `backend/tests/test_isolation.py::test_ac5_*`, e2e "AC-5 …", independent check |
| AC-6 Idempotent seed for alice and bob | `backend/tests/test_seed_ledger.py::test_ac6_*`, `tests/stack/test_stack.py::test_ac6_*`, e2e "AC-6 …", independent check |

### Reviews
Security: pass · Code: pass · UX: pass · UI: pass · Rounds: 3

### Notes for the reviewer
- Migration `backend/alembic/versions/0003_student_and_lesson.py` adds `student` and `lesson` tables (reversible); run migrations on deploy.
- No new dependencies or config changes.
- `make seed` now also creates `carol@example.com` / `carol-ledger-pass` with 510 students and 520 lessons to reach the "Many items" truncation state. Local-only synthetic data.
- Open suggestion CODE-3: the F01 AC-1 e2e test uses and deletes `carol@example.com`; rerun `make seed` after running that spec alone.
```
