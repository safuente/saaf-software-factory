---
feature: F04
project: PRJ-001
reviewer: security
round: 1
verdict: pass
blocking: 0
suggestions: 0
reviewed: feature/F04-visual-identity-foundation @ 791df5a65a809a141aacf9877d9bea7b548f8c27
---

# Security review: F04 Visual identity and Tailwind foundation

## Round 1

### Findings

None.

Checked:

- **Attack surface**: no backend files, endpoints, routes, forms fields or API calls change. `LoginPage`, `SignupPage` and `SessionGate` only swap markup for shared components; submit handlers, validation, session handling and the `RequireSession` redirect are untouched. The spec's "no change to who can access what" holds.
- **CSP and headers**: `frontend/index.html`, the server config and the Dockerfile are not in the diff. Live `curl -sI http://localhost:3102/login` returns `Content-Security-Policy: default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`, identical to the spec, plus `X-Content-Type-Options: nosniff` and `Referrer-Policy: same-origin`. No `style` attributes or inline `<style>` added.
- **External resources**: the only `url(...)` and `@import` in the diff point to `tailwindcss` (build-time) and the local files `./tokens.css` and `./fonts/**.woff2`. There are no CDN or third-party origins. `e2e/f04-fonts-csp.spec.ts` checks that font requests are same-origin and no CSP violation fires (AC-5). The checks file says e2e passed.
- **XSS / injection**: no `dangerouslySetInnerHTML`, `innerHTML`, `eval` or dynamic HTML in the added code. `designDocParser.ts` is only imported by tests.
- **Secrets / logging / storage**: no secrets, no `console.*` and no browser storage in the added code.
- **Dependencies**: the new packages are `tailwindcss@4.3.5` and `@tailwindcss/vite@4.3.5`, both devDependencies pinned exactly. Their transitive packages (`@tailwindcss/node`, `oxide*`, `enhanced-resolve`, `graceful-fs`, `jiti`, `tapable`) all resolve from `registry.npmjs.org`, with MIT/0BSD/BlueOak licenses. `npm audit --omit=dev` reports `found 0 vulnerabilities`. Fonts are under the SIL OFL, and `OFL.txt` is committed next to each family.

### Summary
Pass. This is a styling-only change with no new entry points, no change to authentication or authorization, an unchanged CSP, self-hosted fonts and clean production dependencies. The full `npm audit` (including dev dependencies) reports 13 high findings. They all come from a ReDoS in `picomatch` that is already on main: it is reached through `vite`, `vitest` and `typescript-eslint`. None comes through the new Tailwind packages, and this feature does not change the `picomatch` lock entries. Out of scope here. semgrep and bandit were not run: this diff has no Python, and semgrep is not part of this review's toolchain.
