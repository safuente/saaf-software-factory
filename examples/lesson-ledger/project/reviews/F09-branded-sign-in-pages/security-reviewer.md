---
feature: F09
project: PRJ-001
reviewer: security
round: 1
verdict: pass
blocking: 0
suggestions: 0
reviewed: feature/F09-branded-sign-in-pages @ cec9bc3b5a028f5af3a2dbdc4689f45cfef39f4b
---

# Security review: F09 Branded sign-in pages

## Round 1

### Findings

None.

Attack surface checked:

- **Entry points**: no new or changed endpoints, routes, route guards, backend code, config, nginx/CSP or dependency files in the diff (`git diff --name-only main...feature/F09-branded-sign-in-pages` has no backend, router, package or lock file). `/login` and `/signup` stay public; app routes and the logged-in redirect are untouched.
- **Logged-out notice** (`frontend/src/features/auth/loggedOut.ts`, `LogOutProvider.tsx`, `LoginPage.tsx`): the flag is a module-level boolean set only in the `onSuccess` (204) of the existing `logOut` mutation and consumed once on Log in. It reads no URL, hash, cookie or storage, so a crafted link cannot trigger it or inject text; the text is a constant rendered as a React child (escaped). The 401 path still calls `leave()` without the flag. Log out still calls `DELETE /api/sessions/current` exactly as before.
- **XSS / CSP**: no `dangerouslySetInnerHTML`, `innerHTML`, `style` attributes, `<style>`, scripts, `data:` URIs or external `href` in the new `SignedOutPage.tsx`, `Brand.tsx` (`LogoMark`) or `BrandIllustration.tsx`; SVG attributes are built from constants only. New CSS (`app.css`) adds tokens, a keyframe and a utility; no external `url(`. Live header on `http://localhost:3107/login`: `Content-Security-Policy: default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`, unchanged; still asserted by `e2e/f08-checks.spec.ts` / `f08-brand.spec.ts` `SECURITY_HEADERS`.
- **Data exposure / logging**: nothing new leaves the system; no logging added; notice contains no user data.
- **Secrets**: none in code, tests or docs in the diff (e2e uses the existing seed `ALICE`/`PASSWORD` helpers).
- **Tests**: AC-3 negative cases are covered in `e2e/f09-notice.spec.ts` (direct open, invalid/expired cookie, reload, Back/Forward, 401 log out, 500/network failure) and AC-3 (d) asserts no new cookie names and unchanged local/session storage keys.

### Summary

Pass. Frontend-only presentational change plus an in-memory, one-shot logged-out flag; no authentication, authorization, input, CSP or dependency change. Tooling: `npm audit --omit=dev` found 0 vulnerabilities; pip-audit, semgrep and bandit not run (no backend or Python dependency change in the diff).
