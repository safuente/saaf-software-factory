---
feature: F06
project: PRJ-001
round: 3
decision: approved
route_to: human-merge
reviewed: feature/F06-dashboard-redesign @ 84158b59cb96bc26723c7099bf36208c7b745f7a
spec_version: 1
---

# Approval: F06 Dashboard redesign of every page and the app shell

## Round 2

First Approver pass on F06. The pipeline is at round 2 because the Stage 4 checks failed once (build report, Fix round 1).

Independent checks ran against the production build at http://localhost:3104 (1280×800 unless stated) as seed teacher `alice@example.com` and as a teacher created for this check, `apr-f06-1795085159@example.com`. That teacher has student "Zoe Park" and the F03 AC-1 lessons: A 2026-11-03 4250 paid, B 2026-11-10 6000 unpaid, C 2026-11-10 0 unpaid, plus unpaid lessons on 2026-10-31 and 2026-12-01, all created through `POST /api/teachers`, `/api/sessions`, `/api/students`, `/api/lessons` and `PATCH /api/lessons/10722`. B was marked paid and then undone, so the data is back where it started. The scripts and screenshots are in `/private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/apr/` (`v1.cjs`, `v2.cjs`).

### Preconditions
| Check | Result |
|---|---|
| Security review | pass @ 89f5d66 |
| Code review | pass @ 89f5d66 (suggestions CODE-1, CODE-2) |
| UX review | pass @ 89f5d66 |
| UI review | pass @ 89f5d66 (suggestions UI-1, UI-2) |
| Spec `approved`, version 1 = build report version 1 | pass |
| Checks (`make check`, `make e2e`) | pass @ 89f5d66657de22badcabdb73c4692d8e38eb8714 (= head) |

### Acceptance criteria
| Criterion | Tests | Independent check | Result |
|---|---|---|---|
| AC-1 a | `designDoc.test.ts` `AC-1a`, `theme.test.ts` | Read `docs/design.md`: palette, Inter only, type scale, layout, buttons, tables, initials, status, chip, panel, and the reference elements adopted or left out, each with WCAG 2.2 AA notes | pass |
| AC-1 b | `designDoc.test.ts` `AC-1b`, `f06-identity.spec.ts` `AC-1b` | Computed: root 16 px; `h1` 32, body 15, label 15, input 15, button 15, `td` 15, nav link 15 px on `/login`, `/` and `/lessons`. These match "Rendered sizes" | pass |
| AC-1 c | `theme.test.ts` `AC-1c`, `f06-identity.spec.ts` `AC-1c` | `git grep` for alegreya/stave/note head/piano/bar line/verdigris/pencil/white key in `frontend` and `docs` (non-test): none. Served JS and CSS: none. The only font file is `fonts/inter/inter-latin-wght-normal.woff2` | pass |
| AC-1 d | `designDoc.test.ts` `AC-1d` | `docs/design/` holds the 14 `f06-*.png` files listed in "Screenshots", taken with alice | pass (see APR-1: the 1280 px screenshots must be retaken after the fix) |
| AC-2 a | `ShellLogOut.test.tsx` `AC-2a`, `f06-shell.spec.ts` `AC-2a,c,e` | Sidebar `rgb(27,31,38)` at x 0–240, `main` from x 240. Links in order, "Main" nav, `position: static`. On `/lessons` (alice) the sidebar is 1307 px tall but Log out ends at y 768, 540 px above the sidebar's bottom | **fail: see APR-1** |
| AC-2 b | `f06-shell.spec.ts` `AC-2b,c` | 375 px: header 0,0,375 wide, above `main` (main top 153.5), scrollWidth = clientWidth = 375, no `aria-expanded` toggle, page scrollWidth 375 | pass |
| AC-2 c | `f06-shell.spec.ts` | `position: static` at 1280 and 375 px | pass |
| AC-2 d | `MainNav.test.tsx` `F06 AC-2d`, `f06-shell.spec.ts` `AC-2d` | Current link: `aria-current="page"`, weight 600 on a `rgb(44,50,60)` pill. Others: weight 400, transparent | pass |
| AC-2 e | `f06-shell.spec.ts` `AC-2a,c,e` | `main` background white on all five pages; `h1` Inter 32 px (`title`) | pass |
| AC-2 f | `ShellLogOut.test.tsx` `AC-2f`, `HomePage.test.tsx`, `f06-shell.spec.ts` `AC-2f` | `/pending`, DELETE aborted: "Couldn't log out. Please try again." in `role="alert"` as the first child of `main`. DELETE held: button disabled. Released: one `DELETE /api/sessions/current`, lands on `/login`, `GET /api/sessions/current` → 401. `/` shows "Signed in as …" and exactly one "Log out" | pass |
| AC-2 g | `Page.test.tsx`, `f06-shell.spec.ts` `AC-2g` | `/login`, `/signup`: no `header`/`nav`, white `main`, `h1` Inter 32 px, submit black/white | pass |
| AC-2 h | `Button.test.tsx` `F06 AC-2h`, `f06-shell.spec.ts` `AC-2h` | Primary `rgb(0,0,0)` / white. Log out (secondary) white fill, `rgb(134,141,152)` border, `rgb(29,33,39)` text | pass |
| AC-3 a | `f05-tables.spec.ts` `AC-3a`, `f06-tables.spec.ts` `AC-3a` | Captions and headers as F02/F03 on all three tables. `th` slate `rgb(91,98,109)` vs `td` graphite. `td` and `th` `border-bottom: 1px solid rgb(228,230,234)`, no right border | pass |
| AC-3 b | `format.test.ts`, `StudentName.test.tsx`, `studentCells.test.tsx` `AC-3b`, `f06-tables.spec.ts` `AC-3b` | `::before` content `"DP" / ""` on a `rgb(228,230,234)` 9999 px circle. ariaSnapshot `cell "Dev Patel"`, `cell "Chloé Dubois"`. No new column | pass |
| AC-3 c | `studentCells.test.tsx` `AC-3c`, `f06-tables.spec.ts` `AC-3c` | Paid `rgb(23,128,61)` with `::before "✓" / ""`, Unpaid `rgb(154,91,0)`. ariaSnapshot `cell "Paid"` / `cell "Unpaid"` on `/lessons` and `/summary`. Contrast 5.01 and 5.43:1 (theme hex) | pass |
| AC-3 d | `studentCells.test.tsx` `AC-3d`, `f06-tables.spec.ts` `AC-3d` | `/students`: 1 px `rule` dividers and initials are present. The list's label, the `h2` "Your students" (`aria-labelledby`), is `rgb(29,33,39)` graphite, so there is no grey header or label. The tests do not check one | **fail: see APR-2 (CODE-1)** |
| AC-3 e | `f05-tables.spec.ts` `AC-3d`, `AC-3e` (unchanged) | Covered by the unchanged F05 tests in the passing e2e run. Not repeated | pass |
| AC-4 a | `MetricsPanel.test.tsx` `AC-4a`, `f06-summary.spec.ts` | DOM order Previous month, `h2` "November 2026" (9999 px radius, solid `outline` border), Next month. 2000-01: Previous disabled. 2099-12: Next disabled | pass |
| AC-4 b | `MetricsPanel.test.tsx` `AC-4b`, `f06-summary.spec.ts` | `dt` "Lessons:", "Collected:", "Pending:"; `dd` "3", "$42.50", "$60.00". SVG `aria-hidden="true"`, paid segment 0.41 of width. "41% paid · 59% pending", "Average per lesson: $34.17". Panel x 992 is right of the table (272–968) | pass |
| AC-4 c | `MetricsPanel.test.tsx` `AC-4c`, `f06-summary.spec.ts` `AC-4c` | After Mark as paid on B: "Collected: $102.50", "Pending: $0.00", "100% paid · 0% pending", average $34.17. Status "Marked as paid. Collected: $102.50, pending: $0.00." | pass |
| AC-4 d | `MetricsPanel.test.tsx` `AC-4d`, `f06-summary.spec.ts` `AC-4d` | 2026-08: 0, $0.00, $0.00, only the track rect, "No amounts this month.", "Average per lesson: —", "No lessons in August 2026." | pass |
| AC-4 e | `f06-summary.spec.ts` `AC-4e` | 1279/1024/768/375 px: panel full `main` width, above the table, before it in the DOM, no page scroll | pass |
| AC-4 f | `MetricsPanel.test.tsx` `AC-4f`, `f06-summary.spec.ts` `AC-4f` | Summary request aborted: "Try again" shown, no panel, chip still shown | pass |
| AC-4 g | `MetricsPanel.test.tsx` `AC-4g`, `f06-summary.spec.ts` | Page load requests: `GET /api/sessions/current`, `/api/monthly-summaries/2026-11`, `/api/lessons?month=2026-11&page=1&page_size=500`. These are F03's | pass |
| AC-5 a | `make check`, `make e2e` | Checks file: pass at head | pass |
| AC-5 b, c | pre-existing suites | Code review audited the changed tests (allowed kinds only). The visible copy, landmarks (1 `main`, 1 "Main" nav) and requests checked above are unchanged | pass |
| AC-5 d | `f04-fonts-csp.spec.ts` (unchanged) | CSP header identical on all 7 routes (`default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`). 0 `securitypolicyviolation`. The one font request is to `localhost:3104/assets/inter-…woff2`. `document.fonts`: `Inter:loaded` | pass |
| AC-6 (F05 a–g), a–d | `f05-pages.spec.ts`, `f04-restyled-parts.spec.ts`, `f06-shell.spec.ts` `AC-6*`, `f06-summary.spec.ts` `AC-6d` | Shell contrast from the theme hex values: 8.47/15.02:1 text, 5.09:1 focus on `shell`. No page scroll at 375/768/1280 (above). The UI reviewer's axe scans found 0 violations. The 200% and 667×375 cases rely on the passing e2e | pass |

Behavior and Security spot checks: Average per lesson rounding ($102.50 ÷ 3 = $34.17), empty-month bar and text, Log out cache clearing (401 after log out), and the unchanged CSP all pass.

### Definition of done
| Item | Result |
|---|---|
| Every criterion has tests referencing its id | pass. Two tests are weaker than the criterion (APR-1, APR-2) |
| CI green | pass @ 89f5d66 |
| Branch rebased on base | pass (`main` is an ancestor) |
| Migrations included and reversible | not applicable |
| `make seed` reaches every state in the UI section | pass (README covers the log-out failure through stopping the backend; AC-4 states use test teachers, as the spec says) |
| README updated if setup changed | not applicable |
| No TODOs without a backlog item | pass (no TODO added) |

### Findings

#### APR-1: Log out is not at the bottom of the sidebar on pages taller than the viewport
- **Severity**: blocking
- **Category**: criterion-not-met
- **Location**: `frontend/src/shared/ui/Page.tsx:58-63`. The inner header `div` is `lg:min-h-screen`, so `lg:mt-auto` pins Log out to the bottom of the first viewport height, not to the bottom of the `header`.
- **Criterion**: AC-2 (a), and Behavior "Log out moves into the shell" ("at the bottom of the sidebar")
- **Problem**: AC-2 (a) puts the "Log out" button "at the bottom of the sidebar", and the sidebar is "at least as tall as the viewport". When `main` is taller than the viewport, the dark sidebar stretches with it, but Log out stays at y ≈ 768 and appears to float mid-column. The e2e test checks `800 - logOut.bottom <= 64`, measured against the viewport, so it passes even when Log out is far from the sidebar's bottom. The Builder disclosed this as an open issue but did not meet the criterion. The criterion is clear and can be met without fixed or sticky positioning, so this goes to the Builder.
- **Evidence**: As alice, 1280×800, `/lessons`: `header` box `[0, 0, 240, 1307.6]`, Log out `getBoundingClientRect().bottom` = 768. Full-page screenshot: `/private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/apr/alice-lessons-1280.png`. The same applies to `/summary` and `/pending` whenever their content is taller than the viewport.
- **Suggestion**: Let the inner column fill the whole `header` height at `lg` (for example, header `lg:flex lg:flex-col` and inner `div` `lg:flex-1` instead of only `lg:min-h-screen`), so `mt-auto` reaches the sidebar's real bottom. Change the AC-2 a e2e check to compare Log out's bottom with the `header`'s bottom (minus padding) on a page taller than the viewport, such as alice's `/lessons`. Update the "Layout" line in `docs/design.md` ("bottom of the first screen of the sidebar"), and retake the affected 1280 px screenshots of AC-1 (d), because the look changes for the owner's gate.

#### APR-2: The students list has no grey header or label (CODE-1)
- **Severity**: blocking
- **Category**: criterion-not-met
- **Location**: `frontend/src/features/students/StudentsPage.tsx:93-108` (list labelled by the `Section` `h2` "Your students")
- **Criterion**: AC-3 (d)
- **Problem**: AC-3 (d) requires "grey headers or labels, thin dividers, and an initials circle". The dividers and initials are there. Nothing grey labels the list: its label, the `h2` "Your students" referenced by `aria-labelledby`, renders in `graphite`. Ruling on CODE-1: the spec does not contradict itself. AC-5 (c) forbids new text, not restyling existing text, and the criterion says "headers **or labels**". The list already has a label that can be styled grey (`slate`, 6.15:1 on `canvas`), so the criterion can be met in code without new copy. The AC-3 d tests (`studentCells.test.tsx`, `f06-tables.spec.ts`) check dividers, initials and names only, so they cover a weaker version.
- **Evidence**: As alice, `/students` at 1280×800: `getComputedStyle(h2 "Your students").color` = `rgb(29, 33, 39)`. The form label "Name" is also `rgb(29, 33, 39)`. No element in the list section has `slate` text. Screenshot: `docs/design/f06-students-1280.png`.
- **Suggestion**: Give the list's existing label a grey treatment in the style of the tables' header text, for example a `slate` label for the list. If the `h2` keeps its heading role, use a theme name and keep its text and level unchanged. Add an AC-3 d assertion that the list's label or header computes to `slate`, and update `docs/design.md` "Students list". If the owner would rather not have a grey section heading, the alternative is a spec change dropping "grey headers or labels" for `/students`, and the orchestrator can raise that at the look gate.

### Decision
Rejected, routed to builder. Everything else verified independently and passes, including the panel figures, mark-as-paid updates, log-out states, CSP and fonts. Two criteria are not met as written, and their tests check weaker versions: AC-2 (a) Log out is not at the bottom of the sidebar on pages taller than the viewport (APR-1), and AC-3 (d) the students list has no grey label (APR-2, the ruling on CODE-1). Both are small layout or styling fixes with no copy or behaviour change. Their screenshots must be retaken before the owner's look gate.

## Round 3

Re-run after the round 2 rejection (APR-1, APR-2). The Builder's Fix round 2 changes 3 components (`Page.tsx`, `Section.tsx`, `StudentsPage.tsx`), one doc comment (`Table.tsx`), `docs/design.md` and 4 screenshots (`git diff 89f5d66..84158b5`). Independent checks ran against the production build at http://localhost:3104 as seed teacher `alice@example.com`. No accounts were created this round. Scripts and screenshots: `/private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/apr/v3.cjs`, `v3b.cjs`, `r3/`.

### Preconditions
| Check | Result |
|---|---|
| Security review | pass @ 84158b5 |
| Code review | pass @ 84158b5 (2 suggestions) |
| UX review | pass @ 84158b5 |
| UI review | pass @ 84158b5 (2 suggestions) |
| Spec `approved`, version 1 = build report version 1 | pass |
| Checks (`make check`, `make e2e`) | pass @ 84158b59cb96bc26723c7099bf36208c7b745f7a (= head). Frontend 370, backend 323 (1 skipped), e2e 160 |

### Acceptance criteria
| Criterion | Tests | Independent check | Result |
|---|---|---|---|
| AC-2 a (APR-1) | `f06-shell.spec.ts` `AC-2a,c,e` (now measured against the `header`'s bottom), new "AC-2a at 1280 px on a page taller than the viewport", `ShellLogOut.test.tsx` `AC-2a,e` | 1280×800 `/lessons`: header `[0,0,240,1307.6]`, Log out bottom 1275.6, 32 px (the `py-8` padding) above the sidebar's bottom. The same 32 px gap holds on all five pages at 1024×768, 1280×800 and 1920×1080, on short pages (header = viewport height) and long ones (`/lessons`; `/summary` and `/pending` at 1024). Links in order, sidebar `rgb(27,31,38)`, nothing fixed or sticky in the header, one Log out per page. At 200% root text: sidebar 480 px wide, Log out 64 px above the bottom, links within the viewport, Tab reaches Home → … → Pending payments → Log out. Screenshot `r3/alice-lessons-1280.png` | pass |
| AC-2 b, c (regression from the `Page.tsx` change) | `f06-shell.spec.ts` `AC-2b,c` | At 1023, 667×375, 375 and 320 px the header is a full-width bar above `main` (top 64.5/111/153.5/196), links wrap, page `scrollWidth` = `clientWidth`, nothing fixed or sticky | pass |
| AC-2 f (regression) | `ShellLogOut.test.tsx` `AC-2f`, `f06-shell.spec.ts` `AC-2f` | Keyboard Enter on Log out on `/summary`: one `DELETE /api/sessions/current`, lands on `/login` | pass |
| AC-3 d (APR-2) | `studentCells.test.tsx` `AC-3d` (new label test), `f06-tables.spec.ts` new "AC-3d … label "Your students" is grey" | `/students`: `h2#your-students-heading` "Your students" computes `rgb(91,98,109)` (`slate`, same as `th` on `/lessons`), still 18 px / 600, still labels the list (`aria-labelledby`, ariaSnapshot `list "Your students"`). "Add a student" stays graphite. Rows keep 1 px `rule` dividers and initials circles (`"AM" / ""`, 9999 px). Screenshot `r3/alice-students-1280.png` | pass |
| AC-1 a | `designDoc.test.ts` | `docs/design.md` Layout and Students list lines updated to match (sidebar bottom grows with `main`; list label in `slate`) | pass |
| AC-1 d | `designDoc.test.ts` `AC-1d` | 14 files listed and present. Only `f06-lessons-375/1280` and `f06-students-375/1280` changed. Committed `f06-lessons-1280.png` shows Log out at the bottom of the full sidebar, matching my own capture | pass |
| All other criteria | unchanged tests, passing e2e at head | Round 2 independent checks stand: the round 3 diff touches no code they depend on (summary panel, tables, status, CSP, fonts, auth pages). The checks file confirms the full suite at head | pass |

AC-5 b: the two changed tests were strengthened, not weakened. The e2e Log out check moved from the viewport's bottom to the header's bottom, and the unit class assertion follows the new structure.

### Definition of done
| Item | Result |
|---|---|
| Every criterion has tests referencing its id | pass. APR-1 and APR-2 now have tests that check the criterion as written |
| CI green | pass @ 84158b5 |
| Branch rebased on base | pass (`main` is an ancestor) |
| Migrations included and reversible | not applicable |
| `make seed` reaches every state in the UI section | pass (unchanged from round 2) |
| README updated if setup changed | not applicable |
| No TODOs without a backlog item | pass (no TODO added) |

### Findings
APR-1: resolved in `fccd708` (test `72ed326`). APR-2: resolved in `57be7bc` (test `6701c05`). No new findings.

### Decision
Approved, routed to human-merge. Both round 2 findings are fixed and verified on the running build, the fix did not regress the narrow-screen bar or log out, and all four reviews and the full checks pass at head 84158b5. The owner's look approval of the 14 screenshots (ADR-006) is still a separate merge gate. Two items for the owner at that gate: the grey "Your students" heading (APR-2's alternative was a spec change), and UI-1 (student names wrap at 375 px), which the Builder declined as a look decision.

## Pull request description

```markdown
## F06: Dashboard redesign of every page and the app shell

Replaces the F04/F05 manuscript identity with the owner's dashboard direction (ADR-006): a dark sidebar shell (a top bar below 1024 px) with the navigation and Log out, white main area with a large sans-serif title, dense tables with student initials and worded payment status, and a month chip plus metrics panel on the Monthly summary. Login and sign-up get the same look without the sidebar. No behaviour, API or data changes.

Spec: projects/PRJ-001-lesson-ledger/specs/F06-dashboard-redesign.md (v1)

### Acceptance criteria
| Criterion | Verified by |
|---|---|
| AC-1 Design plan, rendered sizes, no manuscript identity, 14 screenshots | designDoc.test.ts, theme.test.ts, f06-identity.spec.ts, independent check |
| AC-2 Sidebar / top bar shell, current page cue, title, log out, auth pages, button styles | ShellLogOut.test.tsx, MainNav.test.tsx, Button.test.tsx, Page.test.tsx, f06-shell.spec.ts, independent check |
| AC-3 Dense tables, initials, worded status, students list style, F05 table scroll | studentCells.test.tsx, StudentName.test.tsx, format.test.ts, f06-tables.spec.ts, f05-tables.spec.ts, independent check |
| AC-4 Month chip and metrics panel (figures, bar, average, update after mark as paid, empty month, stacking, no new requests) | MetricsPanel.test.tsx, f06-summary.spec.ts, independent check |
| AC-5 Checks pass, no weakened tests, behaviour and CSP unchanged, self-hosted font loaded | make check, make e2e, f04-fonts-csp.spec.ts, independent check |
| AC-6 F05 multi-device checks on all seven pages, shell contrast and reachability, content width, panel layout | f05-pages.spec.ts, f04-restyled-parts.spec.ts, f06-shell.spec.ts, f06-summary.spec.ts, independent check |

### Reviews
Security: pass · Code: pass · UX: pass · UI: pass · Rounds: 3

### Notes for the reviewer
- Merge gate (ADR-006): the owner must approve the look on the 14 screenshots in `docs/design/` (`f06-*.png`) before merge. Open look questions: the grey "Your students" heading, and student names wrapping at 375 px (UI-1).
- Fonts: Alegreya files removed; Inter (OFL) self-hosted as one variable woff2. No other new dependencies.
- "Log out" moved from Home into the shell on every app page; same request and session handling.
- No migrations, API, seed, configuration or CSP changes.
```

## Owner look approval

Approved by Santiago Alvarez on 2026-11-19 after reviewing the 14 screenshots in docs/design/f06-*.png (ADR-006 merge gate). UI-1 and UI-2 left as they are. Merged locally into main.
