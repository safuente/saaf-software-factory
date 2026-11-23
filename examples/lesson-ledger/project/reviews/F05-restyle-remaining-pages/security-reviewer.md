---
feature: F05
project: PRJ-001
reviewer: security
round: 4
verdict: pass
blocking: 0
suggestions: 0
reviewed: feature/F05-restyle-remaining-pages @ 738b029bdd3f7fbb5d3028c0208dfc522994339b
---

# Security review: F05 Restyle the remaining pages

## Round 2

First security review of this feature (round 1 was a failed checks run). Full review of `main...feature/F05-restyle-remaining-pages`.

### Previous findings
| Id | Status | Note |
|---|---|---|
| none | | No previous security findings. |

### Findings

None.

### Verification against Security considerations

- **No change to access, input, endpoints or data leaving the system**: the diff touches no file under `backend/`, and no API client, query or mutation in `frontend/src`. Page diffs (`HomePage`, `StudentsPage`, `LessonsPage`, `SummaryPage`, `PendingPage`, `PaidButton`) only replace markup and CSS-module classes with `shared/ui` components (`Button`, `Section`, `Table`, `TableCell`, `PaymentStatus`, `Totals`, `Form`, `TextLink`). Same fields are rendered as before (student name, date, duration, price, paid status). All user data is rendered as React text children; no `dangerouslySetInnerHTML`, `innerHTML`, `eval` or `style={...}` anywhere in non-test `frontend/src`.
- **CSP unchanged**: `curl -sI http://localhost:3103/` and `/students` return `Content-Security-Policy: default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`, matching the spec byte for byte. No change to `nginx.conf`, `vite.config.ts` or compose files. No external fonts, styles or scripts added; `tokens.css` and `ui.module.css` removed.
- **Parser not in production bundle**: `frontend/src/test/designDoc.ts` is imported only by `shared/styles/designDoc.test.ts` and `shared/styles/theme.test.ts`. The served JS assets at `app_url` contain no `sectionTable` or `docs/design.md` strings.
- **Dependencies**: `package.json` and `package-lock.json` unchanged. `npm audit --omit=dev`: `found 0 vulnerabilities`.
- **Secrets**: the only credentials added are in e2e specs (`carol@example.com` / `carol-ledger-pass`), the documented dev seed password already in `backend/app/seed.py` and `README.md`, like alice and bob in `e2e/support/stack.ts`. Not a secret.
- **Test config**: `playwright.config.ts` adds `globalSetup` (runs `make seed` once), `workers: 4` and a 10 s expect timeout; no security impact.

Tools: `npm audit --omit=dev` run. No backend change, so `pip-audit`, `bandit` and `semgrep` were not run.

### Summary
Presentational change only: no new entry points, input, data exposure or dependencies; CSP is unchanged and the design-doc parser stays out of the production bundle. Verdict pass, no findings.

## Round 3

Reviewed `f1eaf0c..3d76aee` (fix round 2: PaidButton request/cancel logic, `useWholeColumns`, scroll margins, `table-room` CSS, e2e and unit tests, docs).

### Previous findings
| Id | Status | Note |
|---|---|---|
| none | | No previous security findings. |

### Findings

None.

### Verification

- **No backend, endpoint or request change**: no file under `backend/` changed. `PaidButton` still calls the existing `setLessonPaid` (`PATCH /api/lessons/:id`) with the lesson the user clicked; the only new client code is `cancelPaymentReads` (React Query `cancelQueries` on existing keys) and moving `invalidatePayments` into `onSettled`. Authorization stays on the server, unchanged.
- **`useWholeColumns` / `Table`**: reads layout geometry and calls `region.scrollTo`; no user data reaches the DOM except as React text children (the caption is wrapped in a `<span>`). No `dangerouslySetInnerHTML`, `innerHTML` or `eval` in non-test `frontend/src`.
- **CSP unchanged**: `curl -sI http://localhost:3103/` returns `default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`. No inline styles or external resources added; `app.css` changes are scroll margins and `table-room`.
- **Dependencies**: `package.json` and `package-lock.json` unchanged; `npm audit --omit=dev`: `found 0 vulnerabilities`.
- **Secrets**: the new e2e tests reuse the existing seed login helper; no new credentials.

Tools: `npm audit --omit=dev` run. No backend change, so `pip-audit`, `bandit` and `semgrep` were not run.

### Summary
The fix round is client-side state and layout only: no new entry points, input, data exposure or dependencies, and CSP is unchanged. Verdict pass, no findings.

## Round 4

Reviewed `3d76aee..738b029` (CODE-3 unit tests for `useWholeColumns`, UI-3 scroll margin on table regions, one extra e2e viewport).

### Previous findings
| Id | Status | Note |
|---|---|---|
| none | | No previous security findings. |

### Findings

None.

### Verification

- **No backend, endpoint, request or dependency change**: the diff touches only `frontend/src/shared/styles/app.css` (adds `scroll-mb-2` to `[role="region"][tabindex]`), the new `frontend/src/shared/ui/useWholeColumns.test.tsx` and a viewport entry in `frontend/e2e/f05-pages.spec.ts`. `package.json` and `package-lock.json` unchanged since round 3, when `npm audit --omit=dev` reported 0 vulnerabilities.
- **Test file**: imports only `@testing-library/react`, `vitest` and `./Table`; stubs geometry, `ResizeObserver` and `scrollTo`. No credentials, network calls, `innerHTML` or `eval`, and not part of the production bundle.
- **CSP unchanged**: `curl -sI http://localhost:3103/` returns `default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`.

Tools: no dependency or backend change, so `npm audit`, `pip-audit`, `bandit` and `semgrep` were not rerun.

### Summary
Round 4 is a CSS scroll margin and tests only: no new entry points, input, data exposure, secrets or dependencies. Verdict pass, no findings.
