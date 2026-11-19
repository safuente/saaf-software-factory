---
feature: F07
project: PRJ-001
round: 1
decision: approved
route_to: human-merge
reviewed: feature/F07-home-overview @ f64fbf217de4b367c9ccdf941ddbec43bf4d6e3b
spec_version: 1
---

# Approval: F07 Home overview

## Round 1

### Preconditions
| Check | Result |
|---|---|
| Security review | pass @ f64fbf2 (head) |
| Code review | pass @ f64fbf2 (head) |
| UX review | pass @ f64fbf2 (head) |
| UI review | pass @ f64fbf2 (head) |
| Spec status and version | `approved`, v1; build report v1 |
| Checks (`make check`, `make e2e`) | pass @ f64fbf217de4b367c9ccdf941ddbec43bf4d6e3b (frontend 411, backend 323, e2e 195) |

Independent checks ran on 2026-11-19 against `http://localhost:3105` / `http://localhost:8105` (production build, seeded the same day) with Playwright scripts kept outside the repo. Seed accounts were only read. Test-created teachers: `apr-f07-mark-1795090960819@example.com`, `apr-f07-onestudent-1795090960819@example.com`, `apr-f07-octpaid-1795090960819@example.com` (left in place; the Approver does not edit the database).

### Acceptance criteria
| Criterion | Tests | Independent check | Result |
|---|---|---|---|
| AC-1 (a, b, c) | `e2e/f07-home.spec.ts` "AC-1a,b alice…", "AC-1c carol…" (Home and `/summary` read in one test); `Home.figures.test.tsx` AC-1a (incl. half-up rounding) | API: alice `GET /api/monthly-summaries/2026-11` → count 4, collected 4500, pending 13625 (avg 4531.25 → $45.31); carol → 520, 0, 2340000. UI: alice h2 "November 2026", dl `Collected=$45.00, Pending=$136.25, Lessons=4, Average per lesson=$45.31`; `/summary` "Lessons: 4 / Collected: $45.00 / Pending: $136.25", "Average per lesson: $45.31". carol `$0.00, $23,400.00, 520, $45.00`, equal to her `/summary` | pass |
| AC-1 (d) | `Home.figures.test.tsx` AC-1d; e2e AC-5b/AC-5c show the zero figures | Teacher `apr-f07-octpaid-…` with one October lesson only: `Collected=$0.00, Pending=$0.00, Lessons=0, Average per lesson=—`, "No lessons in November 2026." | pass |
| AC-2 (a, b, c) | e2e "AC-2a,b,c alice…" (compares against `/pending` and `/lessons`, status classes); `Home.lists.test.tsx` AC-2a–c | alice: h2s `November 2026, Oldest unpaid lessons, Latest lessons`; "Total pending: $363.00 across 9 lessons"; oldest rows Chloé Dubois, Dev Patel, Emma Rossi, Finn Walsh, Ava Martin = first 5 of `/pending`; latest rows = first 5 of `/lessons` (student, date, status); headers Student/Date/Duration/Price/Action and …/Status; links `/pending`, `/lessons`; "Signed in as alice@example.com" visible. Screenshot `scratchpad/shots/alice-1280.png` | pass |
| AC-2 (d) | e2e "AC-2d carol…"; `Home.lists.test.tsx` AC-2d | carol: "Total pending: $23,400.00 across 520 lessons", 5 + 5 rows, 0 "Showing…" messages | pass |
| AC-2 (e) | e2e "AC-2e…"; `Home.lists.test.tsx` AC-2e; `git diff main...HEAD -- backend frontend/nginx` empty | Reload of `/` as alice recorded exactly `GET /api/sessions/current`, `GET /api/monthly-summaries/2026-11`, `GET /api/pending-lessons?page=1&page_size=5`, `GET /api/lessons?page=1&page_size=5`, `GET /api/students?page=1&page_size=1` | pass |
| AC-3 (a, b) | e2e "AC-3a,b,c…", "AC-3b when Home's table empties…"; `Home.markPaid.test.tsx` (next row, last row → previous, empty → h2, refill) | `apr-f07-mark-…` with F03 AC-2 data, clock 2026-11-18: rows Sep 5 $33.75, Oct 10 $45.00, Oct 10 $1,250.00, Nov 3 $42.50; marking Adam Lee Oct 10 sent `PATCH /api/lessons/10746 {"paid":true}`, 3 rows, "Total pending: $1,326.25 across 3 lessons", status "Marked Adam Lee's lesson on Oct 10, 2026 as paid. Total pending: $1,326.25.", focus on "Mark as paid: Zoe Park, Oct 10, 2026". Marking the last row focused the previous row's button; emptying the table focused `H2 Oldest unpaid lessons` and showed "Nothing pending. Every lesson is paid." | pass |
| AC-3 (c) | e2e "AC-3a,b,c…"; `Home.markPaid.test.tsx` AC-3c | November figures unchanged after the October mark; after marking Nov 3 $42.50: `Collected=$42.50, Pending=$0.00`, Latest row Nov 3 → "Paid"; `/summary` "Collected: $42.50 / Pending: $0.00"; no "Undo" button | pass |
| AC-3 (d) | e2e "AC-3d…"; `Home.markPaid.test.tsx` AC-3d | Held 503: button "Saving…", disabled; then alert "We couldn't reach Lesson Ledger. Please try again.", focus back on the re-enabled button, rows unchanged. 404: "That lesson could not be found. Reload the page and try again.", focus on the same button, total and figures unchanged | pass |
| AC-4 (a–e) | e2e "AC-4a,b,c…", "AC-4d,e…"; `Home.quickActions.test.tsx`; `ActionLink.test.tsx` | 1280 px: h1 ends x≈505; links at x 979 and 1127, same row; "Record lesson" `rgb(0,0,0)/rgb(255,255,255)`, "Add student" white, 1px outline; found by role `link` and names "Record lesson on the Lessons page" / "Add student on the Students page". Clicks went to `/lessons` and `/students` in the same document; each page has exactly 1 button "Record lesson" / "Add student", `type=submit` | pass |
| AC-5 (a) | e2e "AC-5a bob…"; `Home.states.test.tsx` AC-5a | bob: h2 "Get started", ordered steps with the exact texts, links `/students` and `/lessons`; title row and "Signed in as bob@example.com" shown; 0 tables, 0 `dl`, no "$0.00" or "—" in main. Screenshot `scratchpad/shots/bob.png` | pass |
| AC-5 (b, c) | e2e "AC-5b…", "AC-5c…"; `Home.states.test.tsx` AC-5b, AC-5c | `apr-f07-onestudent-…`: zero figures, "No lessons in November 2026.", "Nothing pending.", "No lessons recorded yet.", no "Get started". `apr-f07-octpaid-…`: "Nothing pending. Every lesson is paid.", no oldest table, figures and Latest lessons (1 row) shown | pass |
| AC-5 (d, e, f) | e2e "AC-5d…" ×4 reads, "AC-5e…"; `Home.states.test.tsx` AC-5e, AC-5f | alice with pending read → 500: alert "We couldn't reach Lesson Ledger.", 0 h2, 0 tables, "Try again", title row, quick actions and email kept; "Try again" after unroute restored the four figures. No session: `/` → `/login` | pass |
| AC-6 (a–f) | `e2e/f07-home-checks.spec.ts` (F05 AC-6 a–g per Home state, touch and keyboard flows, contrast, h1/h2, layout, CSP); `designDocHome.test.ts` | One h1; status shown as "Paid"/"Unpaid" words. 320 px: section order figures → oldest → latest, links wrap below the h1 (y 313 vs h1 bottom 266), `scrollWidth` 320 (tables scroll in their own region). CSP header of `/`: `default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`, nginx config unchanged on the branch. `docs/design/f07-home-{alice,bob}-{375,1280}.png` exist. Full suites green per the checks file. Screenshot `scratchpad/shots/alice-320.png` | pass |

Behavior spot checks: average rounding (alice $45.31 from 4531.25), "Nothing pending." vs "Nothing pending. Every lesson is paid." chosen by whether lessons exist, the new-teacher state only when both totals are 0, focus to the section h2 when the table empties, and the unchanged figures after marking a lesson of another month: all as specified. Security considerations: no backend, OpenAPI or nginx change; the only write is the existing `{"paid": true}` PATCH.

### Definition of done
| Item | Result |
|---|---|
| Every criterion has tests referencing its id | pass |
| CI stages pass locally | pass (checks file @ head) |
| Branch rebased on base | pass (merge-base = main = 0ac9e59) |
| Migrations included and reversible | not applicable (no backend change) |
| `make seed` reaches every UI state | pass (alice, carol, bob; partial states via test-created teachers as the spec allows) |
| README updated if setup changed | not applicable (no setup change) |
| No TODOs without a backlog item | pass (none added) |

### Decision
Approved, route to `human-merge`. Every criterion passes in the tests and in independent checks on the running app. The owner's look-and-content approval of the four Home screenshots (ADR-006) is still a separate merge gate run by the orchestrator.

## Pull request description

```markdown
## F07: Home overview

Home becomes the teacher's overview: the current month's four figures (matching Monthly summary), the 5 oldest unpaid lessons with "Mark as paid", the 5 latest lessons, and "Record lesson" / "Add student" quick actions. New teachers see first-steps guidance. Frontend only; all data comes from existing F02/F03 endpoints.

Spec: projects/PRJ-001-lesson-ledger/specs/F07-home-overview.md (v1)

### Acceptance criteria
| Criterion | Verified by |
|---|---|
| AC-1 Month figures equal /summary's | f07-home.spec.ts AC-1a,b / AC-1c, Home.figures.test.tsx, independent check |
| AC-2 Oldest unpaid and latest lessons, exact API reads | f07-home.spec.ts AC-2a,b,c / AC-2d / AC-2e, Home.lists.test.tsx, independent check |
| AC-3 Mark as paid on Home (focus, announcement, figures, failures) | f07-home.spec.ts AC-3a,b,c / AC-3b / AC-3d, Home.markPaid.test.tsx, independent check |
| AC-4 Quick action links | f07-home.spec.ts AC-4a,b,c / AC-4d,e, Home.quickActions.test.tsx, independent check |
| AC-5 Empty, partial, loading and error states | f07-home.spec.ts AC-5a–e, Home.states.test.tsx, independent check |
| AC-6 Accessibility, devices, CSP, design doc | f07-home-checks.spec.ts, designDocHome.test.ts, full make check / make e2e, independent check |

### Reviews
Security: pass · Code: pass · UX: pass · UI: pass · Rounds: 1

### Notes for the reviewer
- No backend, OpenAPI, nginx, migration, seed or dependency changes.
- Merge gate (ADR-006): owner approval of `docs/design/f07-home-{alice,bob}-{375,1280}.png` is required before merge.
- Shared changes: `Page` gains `lead`/`actions`, `Section` gains `focusable`, new `shared/ui/ActionLink`; `usePendingRows` extracted to `features/payments/pendingRows.ts` and now shared by /pending and Home.
- `e2e/f05-pages.spec.ts` per-state checks moved verbatim to `e2e/support/pageChecks.ts`; `HomePage.test.tsx` only gained Home's fake routes.
- `docs/design.md` documents Home and the primary-style page-action link (extends F06's "primary = form submit" rule).
```

## Owner look and content approval

Approved by Santiago Alvarez on 2026-11-19 after reviewing the 4 Home screenshots in docs/design/f07-home-*.png (ADR-006 merge gate). Open suggestions (UI-1 mobile tables, UX-1, UX-2, CODE-1) left for a follow-up. Merged locally into main.
