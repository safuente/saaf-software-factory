---
feature: F08
project: PRJ-001
reviewer: security
round: 1
verdict: pass
blocking: 0
suggestions: 1
reviewed: feature/F08-icons-brand-and-motion @ 7bac4f31a5d3771c81e5e7ae3cb5d77d024ea697
---

# Security review: F08 Icons, brand and motion

## Round 1

### Findings

#### SEC-1: lucide-react pinned to a release published the same day
- **Severity**: suggestion
- **Category**: dependencies
- **Location**: `frontend/package.json:20`, `frontend/package-lock.json:3511`
- **Criterion**: none
- **Problem**: `lucide-react@1.76.0` was published on 2026-11-19 at 06:14 UTC, a few hours before it was pinned. Recently published versions are when a hijacked maintainer account or poisoned release is most likely to go unnoticed, because the community and scanners have not reviewed it yet. `npm audit` cannot flag a malicious release that nobody has reported yet.
- **Evidence**: `npm view lucide-react@1.76.0 time` gives `"1.76.0": "2026-11-19T06:14:21.092Z"` and `"1.75.0": "2026-11-18T06:17:23.635Z"`. I found no concrete exploit, and the risk is low: the version is exact-pinned, the lock `integrity` matches the registry's `dist.integrity` (`sha512-wRVHt2Xf...`), the package has zero runtime dependencies and no `preinstall`/`install`/`postinstall` scripts, the license is ISC, and the source repository is `lucide-icons/lucide`. The bundled ESM in `node_modules/lucide-react/dist/esm` contains no `innerHTML`.
- **Suggestion**: Wait a few days before taking a fresh release, or pin the previous release that has been public longer. Optionally, add an npm `min-release-age` / cooldown policy so this happens by default.

### Summary
F08 is frontend-only and adds no endpoints, inputs, data flows or backend/infra changes. The attack surface is the new dependency and the SVG assets, and both are clean.

**Dependency scan**: `npm audit --omit=dev` found 0 vulnerabilities.

**SVG assets**: The live check on the running app (`http://localhost:3106`) shows that `/favicon.svg` returns 200 with `image/svg+xml`, and its `X-Content-Type-Options`, `Referrer-Policy` and `Content-Security-Policy` headers match `/`. `public/favicon.svg`, `Brand.tsx` and `Illustration.tsx` contain no `style` attribute, `<style>`, `<script>`, `data:` URI or external reference.

**CSP**: Icons are bundled through named imports, so there is no CDN or dynamic import. The diff adds no `dangerouslySetInnerHTML` or `style=`, and `app.css` adds no `url()`/`@import`. The CSP (`default-src 'self'`) is unchanged. e2e covers `securitypolicyviolation` and the favicon headers.

**Not run**: semgrep and bandit (no Python changes).

The only finding is SEC-1, a suggestion about the very fresh release of `lucide-react`.
