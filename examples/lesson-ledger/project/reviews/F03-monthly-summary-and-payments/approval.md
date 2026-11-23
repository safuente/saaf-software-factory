---
feature: F03
project: PRJ-001
round: 1
decision: approved
route_to: human-merge
reviewed: feature/F03-monthly-summary-and-payments @ 519d18c50f1ff052a74ebd3f98e34e6e0f466ec1
spec_version: 1
---

# Approval: F03 Monthly summary, pending payments, mark as paid

## Round 1

### Preconditions
| Check | Result |
|---|---|
| Security review | pass @ 519d18c (head) |
| Code review | pass @ 519d18c (head), 1 suggestion (CODE-1, TDD order of AC-4/AC-5 tests) |
| UX review | pass @ 519d18c, 1 suggestion (UX-1) |
| UI review | pass @ 519d18c, 1 suggestion (UI-1) |
| Spec status / version | `approved`, v1 = build report v1 |
| Checks (`make check`, `make e2e`) | pass @ 519d18c50f1ff052a74ebd3f98e34e6e0f466ec1 (backend 323 passed / 1 skipped pre-existing, frontend 239, e2e 35) |
| Base | merge-base with `main` = `main` head `baae4d0` |

Independent checks ran against `http://localhost:8104` (API, urllib with a cookie jar) and `http://localhost:3104` (Playwright 1.65.1, Chromium) using fresh `apr-*` teachers; alice, bob and carol were only read. Scripts and screenshots: `/private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/apr/` (`checks.py`, `ui.cjs`, `dbl.cjs`, `perf.py`, `shots/*.png`).

### Acceptance criteria
| Criterion | Tests | Independent check | Result |
|---|---|---|---|
| AC-1 | `backend/tests/test_monthly_summary.py::test_ac1_*` (exact summary body, month boundaries, empty month, month filter order C,B,A, range bounds); `SummaryPage.test.tsx` "AC-1 monthly summary"; e2e `f03-payments.spec.ts` "AC-1 summary of the browser's month…" (clock 2026-11-18, exact totals, columns, rows, no reload, Back, empty month, invalid month) | API: `GET /api/monthly-summaries/2026-11` → 200 `{"month":"2026-11","lesson_count":3,"collected":{"amount":4250,"currency":"USD"},"pending":{"amount":6000,"currency":"USD"}}`; `GET /api/lessons?month=2026-11` → ids C,B,A; `2026-08` → count 0, amounts 0. UI (clock 2026-11-18): h2 "November 2026", totals "Lessons: 3 / Collected: $42.50 / Pending: $60.00", columns Student…Action, rows Zoe $0.00 Unpaid, Adam $60.00 Unpaid, Zoe $42.50 Paid; Previous → `/summary?month=2026-10`, "October 2026", same document; Next ×2 → "December 2026"; Back → November; `?month=2026-08` → zeros, "No lessons in August 2026.", no table; `?month=1999-12` → replaced by `?month=2026-11`; Previous disabled at 2000-01, Next at 2099-12. Screenshots `shots/ac1-summary-nov.png`, `shots/ac1-summary-empty.png` | pass |
| AC-2 | `backend/tests/test_pending_lessons.py::test_ac2_*` (order, `total` 4, `amount_pending` 137125, across pages, empty with/without paid); `PendingPage.test.tsx`; e2e "AC-2 AC-3 pending list…" | API: order `2026-09-05/3375, 2026-10-10/4500, 2026-10-10/125000, 2026-11-03/4250`, total 4, `amount_pending` 137125; page 2 size 3 still 137125; empty teacher and paid-only teacher → `items: []`, total 0, amount 0. UI: "Total pending: $1,371.25 across 4 lessons", caption "Unpaid lessons, oldest first", columns Student…Action, rows in spec order; empty → "Nothing pending. Every lesson is paid.", no table. `shots/ac2-pending.png`, `shots/ac2-pending-empty.png` | pass |
| AC-3 | `backend/tests/test_mark_paid.py::test_ac3_*`; `MarkPaid.test.tsx` (next/previous/h1 focus, Saving…, summary toggle, refresh); e2e "AC-2 AC-3…" | `/pending`: PATCH `{"paid":true}` → 200 `paid: true`; row removed, "Total pending: $1,326.25 across 3 lessons", status "Marked Adam Lee's lesson on Oct 10, 2026 as paid. Total pending: $1,326.25.", focus on "Mark as paid: Zoe Park, Oct 10, 2026", same document; marking the last row focuses the previous row; emptying the list focuses `h1` "Pending payments". `/summary?month=2026-10`: Mark → row "Paid"/"Undo paid" with focus, Collected $144.00→$1,394.00, Pending $1,250.00→$0.00, "Marked as paid. Collected: $1,394.00, pending: $0.00."; Undo (Enter) → PATCH `{"paid":false}` 200 `paid:false`, totals revert, "Marked as unpaid. Collected: $144.00, pending: $1,250.00.", focus on "Mark as paid", lesson back in `/pending` and the API | pass |
| AC-4 | `test_mark_paid.py::test_ac4_*` (twice true/false, 9 invalid bodies, 3 non-JSON cases, non-integer id) | PATCH `{"paid":true}` twice → 200, 200, identical bodies, summary unchanged; same for `false`; `{}`, `{"paid":"yes"}`, `{"paid":null}`, `{"paid":true,"price":…}`, `{"paid":1}`, `{"paid":"true"}` → 422 `validation_error`, lessons unchanged; form-encoded, `text/plain`, no content type → 415 `unsupported_media_type`, unchanged | pass |
| AC-5 | `backend/tests/test_payments_isolation.py::test_ac5_*`; `test_isolation.py` all-routes test now includes the new routes; e2e "AC-5 another teacher's lessons…" | Teacher A sees only own counts/amounts/items, "Bea Secret" absent from all three responses; PATCH B's lesson (true and false), `999999999` and `10^30` → 404 byte-identical `{"error":{"code":"not_found","message":"Not found","details":{}}}`, B's totals unchanged; no session → 401 `not_authenticated` on all four; `2026-13`, `2026-1`, `1999-12`, `2100-01`, `abc` → 422 `validation_error` on both endpoints | pass |
| AC-6 | `Failures.test.tsx` "AC-6 load failures" / "AC-6 mark and undo failures" (network, 5xx, 404, both pages, focus); e2e "AC-6 load and mark failures, and many items"; `test_seed_ledger.py` (seed twice, per-month paid/unpaid, README, carol truncation) | UI: `/pending` with aborted load → "We couldn't reach Lesson Ledger." + "Try again", retry loads; `/summary` with only the list failing (502) → whole-page error, no totals; mark and undo on `/summary` with 503, network abort and 404 → alerts "We couldn't reach Lesson Ledger. Please try again." / "That lesson could not be found. Reload the page and try again.", totals and status unchanged, focus on the same enabled button; same on `/pending` with 500. Seed (read-only, server date 2026-11-18): alice 2026-11 1 paid/3 unpaid, 2026-10 2 paid/2 unpaid (the 6000 day-3 and 125000 day-10), 2026-09 4 unpaid, 2026-08 none, 9 pending; bob 0 pending; carol 520 pending, "Showing the 500 oldest of 520 pending lessons." and "Showing the 500 most recent of 520 lessons in November 2026.". Running `make seed` twice was not repeated (forbidden here); covered by `test_ac6_seed_twice_gives_alice_history_and_bob_nothing` in the passing check | pass |

Behavior and Security rules checked beyond the criteria:
- Main navigation "Home, Lessons, Students, Monthly summary, Pending payments" with `aria-current="page"`; titles "Monthly summary · Lesson Ledger" / "Pending payments · Lesson Ledger"; no session on `/summary` and `/pending` → `/login`: pass.
- Paging on `/api/pending-lessons` (`page=0`, `page_size=501`, `page_size=0`, `page=x`) → 422: pass.
- Non-functional p95 for a teacher with 5,000 lessons (40 samples): monthly summary p95 10 ms, pending `page_size=500` p95 16 ms: pass.
- In flight: a human-speed double click (two clicks 5 ms or more apart, measured on both pages with a 400 ms delayed PATCH) sends one request and the button shows "Saving…". Playwright's back-to-back `dblclick()` (no gap between the two clicks) sends two identical PATCH requests, because the guard reads `mutation.isPending`, which TanStack Query updates asynchronously (`frontend/src/features/payments/PaidButton.tsx`). No person can click that fast, and the second request does nothing because PATCH is idempotent, so this is not a finding. A synchronous ref guard would close the gap if wanted.

### Definition of done
| Item | Result |
|---|---|
| Every criterion has tests referencing its id | pass (backend `test_ac1..ac6_*`, frontend `AC-n` describes, e2e titles) |
| CI green | pass @ 519d18c |
| Branch rebased on base; migrations apply after base's | pass (merge-base = `main` `baae4d0`); no migrations |
| Migrations included and reversible | not applicable (no schema change, per spec) |
| `make seed` reaches every UI state | pass: default/empty via alice and bob, many items via carol, error via `docker compose stop backend` (README); loading and saving are transient |
| README updated | pass (seed section and F03 review states) |
| No TODOs without a backlog item | pass (no TODO/FIXME in changed files) |

### Decision
Approved. Every criterion matches the spec as written. I confirmed each one against the running app and API, and the reviews and checks are on the head commit. The feature goes to human merge.

## Pull request description

```markdown
## F03: Monthly summary, pending payments, mark as paid

Adds a Monthly summary page (browser's current month by default, previous/next navigation) with the month's lesson count, collected and pending amounts in USD and its lessons with payment status, and a Pending payments page listing every unpaid lesson oldest first with the total pending. Teachers can mark a lesson as paid from either page and undo from the summary; totals update in place, and everything is scoped to the logged-in teacher.

Spec: projects/PRJ-001-lesson-ledger/specs/F03-monthly-summary-and-payments.md (v1)

### Acceptance criteria
| Criterion | Verified by |
|---|---|
| AC-1 Monthly summary, month navigation, empty month | `test_monthly_summary.py::test_ac1_*`, `SummaryPage.test.tsx`, e2e "AC-1 summary of the browser's month…", independent check |
| AC-2 Pending list oldest first with total; empty state | `test_pending_lessons.py::test_ac2_*`, `PendingPage.test.tsx`, e2e "AC-2 AC-3…", independent check |
| AC-3 Mark as paid / undo, announcements and focus | `test_mark_paid.py::test_ac3_*`, `MarkPaid.test.tsx`, e2e "AC-2 AC-3…", independent check |
| AC-4 Idempotent PATCH, 422 bodies, 415 non-JSON | `test_mark_paid.py::test_ac4_*`, independent check |
| AC-5 Teacher isolation, identical 404, 401, month validation | `test_payments_isolation.py::test_ac5_*`, `test_isolation.py`, e2e "AC-5…", independent check |
| AC-6 Load and mark/undo failures; seed states | `Failures.test.tsx`, e2e "AC-6…", `test_seed_ledger.py`, independent check |

### Reviews
Security: pass · Code: pass · UX: pass · UI: pass · Rounds: 1

### Notes for the reviewer
- No migrations and no new dependencies. New endpoints: `GET /api/monthly-summaries/{month}`, `GET /api/pending-lessons`, `PATCH /api/lessons/{id}`; `GET /api/lessons` gains `?month=`. OpenAPI and generated frontend types updated.
- Seed change: alice now has 3 paid lessons (2 in the previous month, 1 in the current one); F02's seed test and e2e follow it. Run `make seed` after merging to refresh local data.
- Open suggestions, not blocking: CODE-1 (AC-4/AC-5 tests committed after the code they cover), UX-1 (no undo on /pending, by spec), UI-1 (month navigation wraps at 375px).
- A synthetic zero-delay double click can send two identical PATCH requests (the in-flight guard reads async mutation state). Human-speed double clicks send one, and the extra request does nothing because PATCH is idempotent.
```
