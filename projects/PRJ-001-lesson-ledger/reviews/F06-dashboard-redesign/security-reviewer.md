---
feature: F06
project: PRJ-001
reviewer: security
round: 3
verdict: pass
blocking: 0
suggestions: 0
reviewed: feature/F06-dashboard-redesign @ 84158b59cb96bc26723c7099bf36208c7b745f7a
---

# Security review: F06 Dashboard redesign of every page and the app shell

## Round 2

First security review of F06. The round is 2 because the Stage 4 checks failed once and were fixed.

### Previous findings
None. There was no earlier security review of F06.

### Findings
None.

What was checked:

- **Attack surface.** The diff has no backend, API, nginx, CSP or dependency changes (`git diff --stat` shows only frontend, docs and test files). There are no new entry points and no new data leaving the system. `SummaryPage.tsx` adds no new query or mutation. `MetricsPanel` and `metrics.ts` compute only from the `MonthlySummary` the page already loads.
- **Log out moved into the shell** (`frontend/src/features/auth/LogOutProvider.tsx`, `SessionGate.tsx`, `shared/ui/Page.tsx`). This is the same F01 logic, unchanged: `DELETE /api/sessions/current`, then `queryClient.clear()` and navigation to `/login` on success or 401. The provider is mounted only inside `RequireSession`, after a valid session is confirmed. `ShellLogOut.test.tsx` covers the DELETE, the disabled state, the failure alert and the cache clear on each app page.
- **XSS / CSP.** There is no `dangerouslySetInnerHTML`, `innerHTML` or `style=` in the diff. Initials are rendered with CSS `content: attr(data-initials) / ""`, which inserts text only and cannot inject markup. The bar uses SVG `width`/`x` attributes with numeric values, not inline styles. Live check on `http://localhost:3104`: `/login`, `/summary` and `/lessons` return `Content-Security-Policy: default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`, which matches the spec.
- **Fonts.** The single Inter variable woff2 is self-hosted, uses the OFL licence and is referenced through a relative `url()`, so there is no external origin.
- **Secrets.** None were added. The e2e tests use the seed `ALICE` credentials constant that already existed.
- **Dependencies.** `npm audit --omit=dev` reports `found 0 vulnerabilities`. There are no package changes.

### Summary
Pass with no findings. F06 is a presentation-only change: it adds no endpoints, inputs, requests or dependencies, keeps the CSP unchanged, and keeps F01's log-out and cache-clear behaviour, which is now reached from every app page. Not run: semgrep, pip-audit and bandit (not installed). pip-audit was not relevant anyway because the backend did not change.

## Round 3

Reviewed `89f5d66..84158b5`: APR-1 sidebar layout (`shared/ui/Page.tsx`), APR-2 grey list label (`Section.tsx` new `label` prop, `StudentsPage.tsx`), CODE-2 comment re-wrap in `Table.tsx`, tests, `docs/design.md` and screenshots.

### Previous findings
None. Round 2 had no findings.

### Findings
None.

What was checked:

- **Attack surface.** These commits change only Tailwind class names, one boolean prop, one comment, tests and docs. They add no endpoints, requests, inputs, dependencies, or backend, nginx or CSP changes. `git diff --name-only main...feature/F06-dashboard-redesign` lists no `package*.json`, backend, nginx or env files.
- **XSS.** The new `label` prop picks between two static class strings. No user data reaches markup, and the diff adds no `dangerouslySetInnerHTML`, `innerHTML` or inline `style`.
- **Log out.** `Page.tsx` changes only the header layout classes (`lg:flex lg:flex-col` on the header, `lg:flex-1` on the inner column). The `LogOutProvider` and the session-gated rendering of Log out are unchanged.
- **CSP.** On `http://localhost:3104/lessons` the header is still `default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`.
- **Dependencies.** `npm audit --omit=dev` reports `found 0 vulnerabilities`.

### Summary
Pass with no findings. The round 3 changes are presentation-only and do not change the attack surface. Not run: semgrep, pip-audit and bandit (not installed; the backend did not change).
