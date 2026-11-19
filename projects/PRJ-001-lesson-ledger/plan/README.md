# Plan: lesson-ledger

Status: approved by Santiago Alvarez on 2026-11-16; revision (ADR-005, F04, F05) approved by Santiago Alvarez on 2026-11-18; revision (ADR-006, F06) approved by Santiago Alvarez on 2026-11-19 (pre-authorised, applied by the orchestrator); revision (F07) approved by Santiago Alvarez on 2026-11-19 (pre-authorised, applied by the orchestrator)

## Summary
Lesson Ledger is a small web app where an independent music teacher records students and lessons, sees monthly totals of money collected and pending, and marks lessons as paid. It is the factory's pilot, so v1 is capped at 4 features including F00 and runs only on a local docker compose stack, with `make check` and `make e2e` as the CI gate. The stack is a FastAPI backend with PostgreSQL and a React (Vite + TypeScript) single-page app served from the same origin as the API. Authentication uses own email/password accounts with server-side sessions in an HttpOnly cookie, and every record carries its owning teacher so isolation is enforced on the server with 404 for other teachers' data.

## ADRs
| ID | Decision |
|---|---|
| [ADR-001](adr/001-stack.md) | FastAPI + SQLAlchemy 2 + Alembic, React (Vite, TS) with React Router and TanStack Query, PostgreSQL; OpenAPI committed and frontend types generated from it |
| [ADR-002](adr/002-local-environment-and-ci.md) | Local docker compose only (db, backend, frontend proxying `/api`); `make check` / `make e2e` are the CI; no hosted CI or deployment |
| [ADR-003](adr/003-data-model.md) | Teacher, Student, Lesson; ownership on every row, 404 across teachers; USD cents; paid as boolean without payment date; no deletes |
| [ADR-004](adr/004-authentication.md) | Email/password with Argon2id, server-side sessions in an HttpOnly SameSite=Lax cookie, 14-day expiry, no password reset |
| [ADR-005](adr/005-styling-and-visual-identity.md) | Tailwind CSS with the theme as design system, replacing CSS modules and tokens file (supersedes ADR-001's styling); visual identity in `docs/design.md` via the `frontend-design` skill; self-hosted fonts. Visual identity superseded by ADR-006 |
| [ADR-006](adr/006-dashboard-visual-identity.md) | Dashboard visual identity from the owner's reference (dark sidebar, dense tables, metrics panel), replacing the manuscript look; WCAG 2.2 AA; owner approves the look on screenshots before merge |

## Backlog
| ID | Title | Milestone | Depends on | Frontend |
|---|---|---|---|---|
| [F00](backlog/F00-project-base.md) | Project base | v1 | - | yes |
| [F01](backlog/F01-teacher-accounts.md) | Teacher accounts: sign up, log in, log out | v1 | F00 | yes |
| [F02](backlog/F02-students-and-lessons.md) | Students and recording lessons | v1 | F01 | yes |
| [F03](backlog/F03-monthly-summary-and-payments.md) | Monthly summary, pending payments, mark as paid | v1 | F02 | yes |
| [F04](backlog/F04-visual-identity-foundation.md) | Visual identity and Tailwind foundation: design plan, theme, shared components, shell, login and sign-up | v1 | F03 | yes |
| [F05](backlog/F05-restyle-remaining-pages.md) | Restyle home, students, lessons, summary and pending pages; remove CSS modules and tokens file | v1 | F04 | yes |
| [F06](backlog/F06-dashboard-redesign.md) | Dashboard redesign of every page and the app shell, approved by the owner on screenshots | v1 | F05 | yes |
| [F07](backlog/F07-home-overview.md) | Home overview: month KPIs, oldest pending payments, recent lessons, quick actions, first-steps empty state | v1 | F06 | yes |

Brief feature mapping: account -> F01; students -> F02; record a lesson -> F02; monthly summary -> F03; pending payments and mark as paid -> F03; overview on Home (owner request 2026-11-19) -> F07.

## Pages
Every page must have a stated purpose and content of its own (`pilot-notes.md` finding 17). A page without content of its own is a placeholder and must be flagged in Risks or given a backlog item.

| Page | Purpose | Content | Since |
|---|---|---|---|
| `/login` | Enter the app | Email and password form, link to sign up | F01 |
| `/signup` | Create a teacher account | Email and password form, link to log in | F01 |
| `/` Home | See at a glance how the month is going and what needs attention, and get started | Current month KPIs, 5 oldest unpaid lessons with mark as paid, 5 latest lessons, quick actions, first-steps guidance for a new teacher, "Signed in as" | F01 (placeholder until F07) |
| `/students` | Keep the list of students | Add-student form, list of students | F02 |
| `/lessons` | Record lessons and see all of them | Record-lesson form, lessons table newest first | F02 |
| `/summary` | Review one month's money | Month chip, totals, metrics panel, month's lessons with mark/undo paid | F03, panel F06 |
| `/pending` | Collect unpaid lessons | Total pending, unpaid lessons oldest first with mark as paid | F03 |

## Parallelization
None. The backlog is a single chain, each wave one feature:
1. F00
2. F01
3. F02
4. F03
5. F04
6. F05
7. F06
8. F07

F05 must wait for F04's merge, which includes the owner's approval of the visual direction. F06 starts after F05's merge (F05 merged 2026-11-19). F07 can start now (F06 merged 2026-11-19).

The F00-F03 chain is a consequence of the 4-feature cap: students and lessons were merged into F02 and summary and payments into F03, which removed the only pairs that could have run concurrently.

## Risks
- **F02 and F03 are at the upper size limit for one PR** (each merges two brief features, 6 expected results). Mitigation: Spec Writer keeps UI to the minimum screens; if a spec still exceeds one reviewable PR, the plan needs a revision, which the 4-feature cap does not allow without changing the brief.
- **Meaning of `APP_URL` and `API_URL`**: ADR-002 takes `APP_URL` as the frontend origin (where Playwright runs) and `API_URL` as the backend. If the factory's orchestrator assumes `APP_URL` is the backend, e2e tests will point to the wrong service. Confirm before F00 starts.
- **Secure cookie on local HTTP**: ADR-004 disables the `Secure` flag for local HTTP through configuration. Any future deployment must enable it; a misconfigured environment would send session cookies in clear.
- **No login rate limiting and no password reset** (ADR-004): acceptable for a local pilot with synthetic data, must be addressed by new backlog items before any real deployment.
- **Security scan needs network access** for vulnerability databases (ADR-002). Offline runs of `make check` will fail stage 6.
- **Single gate**: with no hosted CI, nothing outside the factory enforces `make check`; a manual merge bypassing the factory would not be checked.
- **Product risk** (`context/research.md`): teachers comfortable with notebooks may not see enough value. Not addressed by the pilot, whose goal is exercising the pipeline.
- **Feature cap exceeded** (revision 2026-11-18): F04 and F05 take v1 to 6 features against the brief's "at most 4 features including F00". Added at the project owner's explicit request; the brief is not edited, so the deviation is recorded here.
- **Visual direction rejected at F04 merge** (occurred: the owner rejected it after F05, see revision 2026-11-19): the owner judges a subjective look. Mitigation: F05 does not start until F04 is merged; a rejection loops F04 only. "Not AI-typical" has no further definition, so `docs/design.md` must list what was changed versus generic defaults to give the owner something concrete to accept or reject.
- **Restyle breaks tests through structure, not behavior**: e2e tests locate data by table column position (`td:nth-child(n)`) and the monthly totals by description-list structure. Mitigation: F04 and F05 constraints require keeping that structure; only selectors tied to CSS classes may change.
- **Mixed styling between F04 and F05**: shell and auth pages in the new style, other pages in the old. Acceptable only while F05 is pending; F05 must remove all CSS modules and the tokens file.
- **Self-hosted fonts and CSP**: fonts from a hosted service would be blocked by `default-src 'self'`. Fonts must ship with the build and have a license allowing redistribution; keep families and weights few to limit build size.
- **WCAG version**: plan and specs target 2.1 AA while the UI reviewer checks 2.2 AA (`pilot-notes.md` finding 7). 2.2 AA adds criteria a restyle directly affects (focus not obscured, minimum target size), so the reviewers could fail F04 on a criterion the spec does not require. Resolve in the factory before F04 review. (Revision 2026-11-19: F05's spec and ADR-006 use 2.2 AA by owner decision; the factory-level fix is still open.)
- **F06 is large for one PR** (revision 2026-11-19): theme, shared components, shell and seven pages at once, plus the new metrics panel. Mitigation: the shared components and theme already concentrate the styling, so most pages change through them; the Spec Writer keeps acceptance checks reused from F05's AC-6 rather than new ones. If the spec still exceeds one reviewable PR, split by revision (shell, auth and shared components first; pages second) and keep the owner's screenshot approval on the first part.
- **Sidebar on narrow screens**: a fixed dark sidebar does not fit at 320 px, 667x375 or 200% text. How it adapts is the spec's decision; a menu toggle would be a new interactive control, so the spec must justify it against "no new functionality" or prefer a layout where the links stay visible.
- **Owner rejects the dashboard look again**: the reference is concrete, which lowers the risk, but the approval gate is still subjective. Mitigation: the F06 merge gate shows screenshots of every page and asks the approval as its own question (`pilot-notes.md` finding 15). Optionally, the orchestrator can show the owner the redesigned shell and one table page partway through the build before the remaining pages are done.
- **Structure the e2e tests rely on**: the metrics panel and the initials circle must not add table columns or replace the totals description list, or behaviour tests break (ADR-006 Consequences).
- **Feature cap exceeded further**: F06 takes v1 to 7 features against the brief's cap of 4, at the owner's request. F07 takes it to 8, also at the owner's request (revision 2026-11-19 b).
- **Pages without content pass the look gate** (occurred: Home after F06, `pilot-notes.md` finding 17). Mitigation: the Pages section lists every page's purpose and content; at every screenshot gate the orchestrator points out any page that looks empty. After F07 no page is a placeholder.
- **Home and Monthly summary disagree**: two pages show the same month figures. Mitigation: F07 requires the F03 totals definitions and the F06 average rule (R6), and the Spec Writer should add a check comparing both pages for the same seed month.
- **Home mark-as-paid diverges from Pending payments**: a second place for the same action can drift in messages, focus handling or in-flight state. Mitigation: F07 requires the Pending payments behaviour; the spec should reuse F03's acceptance checks rather than define new ones.
- **Unneeded backend change for Home**: the existing endpoints cover every Home section with small page sizes (R9). Mitigation: F07 allows a backend change only with a concrete gap justified in the spec.
- **Quick-action labels repeat form button labels** ("Record lesson", "Add student"): links on Home and submit buttons on Lessons and Students share words, which may confuse assistive-technology users or tests that locate by name. Mitigation: F07 constraint on distinguishable names and purpose; tests locate by role.

## Assumptions carried from discovery
From `questions.md` answers:
- Q1: CI is local only; `make check` and `make e2e` are the gate.
- Q2: "money collected" in a month is the sum of paid lessons dated in that month.
- Q3: the only correction in v1 is undoing "mark as paid".

From `questions.md` Assumptions (no objections recorded):
- A1. 4-feature cap met by merging: F00 base, F01 accounts, F02 students and lessons, F03 summary and payments.
- A2. "Deployable" for F00 means the full stack starts with `make up` on a developer machine and passes the health check. No remote environment.
- A3. Stack: FastAPI + SQLAlchemy 2 + Alembic, React (Vite + TypeScript), PostgreSQL.
- A4. Open sign-up, email unique, no email verification, no password reset.
- A5. Every student and lesson belongs to one teacher; cross-teacher access returns 404, enforced on the server.
- A6. Student has a name only.
- A7. Lesson: student, calendar date, duration in minutes, price in USD cents entered per lesson.
- A8. Months are calendar months of the lesson date; no time zone conversion.
- A9. Pending payments list shows all unpaid lessons across months, oldest first, with the total.
- A10. No pagination in the UI; APIs follow the conventions' pagination format.
- A11. Accessibility target WCAG 2.1 AA.
- A12. Seed data synthetic only, with at least two teachers.

Added during planning:
- P1. `APP_URL` is the frontend origin and `API_URL` the backend base URL; the frontend server proxies `/api` to the backend (ADR-002).
- P2. Sessions expire 14 days after creation (ADR-004).
- P3. "Current month" in the monthly summary is the teacher's local month as seen by the browser (F03).
- P4. Synchronous SQLAlchemy sessions and plain CSS without a component library (ADR-001). The plain CSS part is superseded by ADR-005 (revision 2026-11-18).

Added in revision 2026-11-18:
- R1. The visual identity is driven by the subject (independent music teachers keeping a ledger of lessons and payments), since the brief has no brand direction and the owner's only direction is "not AI-typical".
- R2. No component library on top of Tailwind; own shared components only (ADR-005).
- R3. The redesign targets WCAG 2.1 AA like the rest of the plan (A11).

Added in revision 2026-11-19:
- R4. R1 and R3 are superseded for visual work: the direction is the owner's dashboard reference (ADR-006) and the target is WCAG 2.2 AA.
- R5. "Every page" includes Home, which exists since F01 and is in the sidebar navigation of `context/design-direction.md`, although the revision request did not name it.
- R6. Average per lesson is (collected + pending) divided by the month's lesson count, shown as a dash when the month has no lessons. The Spec Writer may refine it, without new data.
- R7. The month chip keeps the existing previous/next month behaviour; it is not a month picker.
- R8. Screenshots for the owner's approval are taken at 375 and 1280 px from the production build with seed data, one per page.

Added in revision 2026-11-19 b:
- R9. Home needs no backend change: the month figures come from the monthly summary endpoint, the 5 oldest unpaid lessons from the pending list (already oldest first), the 5 latest lessons from the lessons list (already newest first), and the new-teacher state from the student and lesson list totals (F02, F03 specs).
- R10. Home's "current month" is the browser's local month, as for the Monthly summary (P3); Home has no month navigation.
- R11. The quick actions lead to the Lessons and Students pages, where the existing forms are; with no students, "Record lesson" leads to Lessons, which already shows F02's "Add a student before recording a lesson." guidance.
- R12. Home has no undo for "Mark as paid", like Pending payments; undo stays on Monthly summary.
- R13. The new-teacher state is no students and no lessons. A teacher with students but no lessons sees the figures (zeros, average as a dash) and short empty messages in the lists rather than the first-steps guidance.

## Revision 2026-11-18
**What changed**
- ADR-005 added: Tailwind CSS with the theme as design system, visual identity defined in `docs/design.md` with the `frontend-design` skill, self-hosted fonts. ADR-001's status now records that its styling decision is superseded by ADR-005; the rest of ADR-001 stands.
- Backlog: F04 (visual identity and Tailwind foundation, shell, navigation, login, sign-up) and F05 (remaining pages, removal of CSS modules and tokens file) added, F05 depending on F04. Both are improvements with no behavior change.
- Risks updated (feature cap, owner rejection, test structure, mixed styling, fonts and CSP, WCAG version).

**Why**
- The project owner asked for a distinctive frontend that does not look like a typical AI-generated UI; the current UI is a minimal shell with hand-written CSS modules and a tokens file.
- `policies/conventions.md` §1 now has a Styling section requiring a CSS framework (Tailwind CSS by default) and a design plan in `docs/design.md`; F00 to F03 predate it.
- Two features instead of one so the owner can approve the visual direction on the shell and auth pages (F04) before it is applied everywhere (F05).

F00 to F03 are built and merged and were not edited. The approval status line above refers to the plan before this revision; re-approval is handled by the orchestrator.

## Revision 2026-11-19
**What changed**
- ADR-006 added: the dashboard visual identity from `context/design-direction.md` and `context/design-reference.png` replaces the manuscript identity; WCAG 2.2 AA; owner approval of the look on screenshots before any merge that sets or changes the identity. ADR-005's status records that its visual identity decision is superseded; its Tailwind CSS 4, theme, shared-component, font and hand-written-CSS rules stand.
- Backlog: F06 (dashboard redesign of login, sign-up, home, lessons, students, monthly summary, pending payments and the app shell) added, depending on F05. Visual only, no behaviour change, with the out-of-scope list of `context/design-direction.md`, the F04/F05 multi-device checks, and an explicit screenshot approval by the owner as part of its expected result and constraints.
- Risks and assumptions updated (R4 to R8; F06 size, narrow-screen sidebar, repeated rejection, test structure, feature cap).

**Why**
- The owner rejected the F04/F05 identity after F05 was built (2026-11-18/19) and gave a concrete reference.
- The F04 merge gate did not show the owner the screens (`pilot-notes.md` finding 15), so the rejection came one feature late; F06 makes the screenshot approval part of the feature itself.

F00 to F05 are built and merged and were not edited, apart from ADR-005's status line. Re-approval of this revision is handled by the orchestrator.

## Revision 2026-11-19 b
**What changed**
- Backlog: F07 "Home overview" added, depending on F06 (merged). Home becomes an overview in the ADR-006 dashboard style: current month KPIs with the Monthly summary definitions, the 5 oldest unpaid lessons with the existing "Mark as paid", the 5 latest lessons, "Record lesson" and "Add student" quick actions in the title row, and first-steps guidance for a new teacher. Existing endpoints only (R9); any backend change must be justified in the spec. WCAG 2.2 AA, the F04-F06 multi-device checks and the ADR-006 owner screenshot gate apply.
- New "Pages" section: every page with its purpose and content, as the plan's standing rule that no page is a placeholder.
- Risks and assumptions updated (R9 to R13; feature cap, empty pages, consistency of figures and mark-as-paid, backend change, repeated labels).
- No ADR added or changed: F07 follows ADR-006 and its approval gate as they stand.

**Why**
- Owner feedback after F06 merged: Home only showed the title and "Signed in as …". It had been empty since F01, and F06's "no behaviour change" rule kept it so; the screenshot gate judged the look, not whether the page was useful.
- Lesson from `pilot-notes.md` finding 17: the plan must state every page's purpose and content, and flag or schedule any page without content of its own.

F00 to F06 are built and merged and were not edited. Re-approval of this revision is handled by the orchestrator.
