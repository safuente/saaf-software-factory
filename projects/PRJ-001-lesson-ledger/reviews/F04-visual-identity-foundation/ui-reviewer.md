---
feature: F04
project: PRJ-001
reviewer: ui
round: 1
verdict: pass
blocking: 0
suggestions: 0
reviewed: feature/F04-visual-identity-foundation @ 791df5a65a809a141aacf9877d9bea7b548f8c27
---

# UI review: F04 Visual identity and Tailwind foundation

## Round 1

### Findings

None.

### Evidence checked
- `docs/design.md` has every AC-1 section: palette with theme name, value, role and contrast; typefaces with license and self-hosting; type scale; spacing; radii; breakpoints and `content` max width (72rem); layout concept; principles; rationale tied to music teachers; 9 "Changed versus generic defaults" items. I recomputed the contrast ratios for 9 pairs, including `stave` on `paper` (3.94) and `brass` on `paper` (4.56). All match the doc and meet 4.5:1 for text and 3:1 for UI components.
- `frontend/src/shared/styles/app.css` defines each name from the doc once in `@theme`, and clears Tailwind defaults (`--color-*: initial` and the same for font, text, spacing, radius, breakpoint, container). Fonts are self-hosted WOFF2 with `OFL.txt`. Grep of shared UI and auth components found no arbitrary `[...]` values, hex colors or `style` attributes. No CDN.
- Playwright at 320x568, 375x667, 768x1024, 1280x800, 1920x1080 and 667x375 on /login, /signup, /, /lessons and /summary: `scrollWidth` equals viewport width everywhere, so no horizontal scroll. Header links wrap at 320 with no menu. At 1920 the header and main are capped at 72rem. The header is not sticky.
- axe (wcag2a, wcag2aa, wcag21aa, wcag22aa) at 1280 on those five pages: 0 violations. Login with field errors at 320 and 1280: 0 violations.
- `document.fonts`: Alegreya 500, Alegreya Sans 400 and 700 all `loaded`.
- Root font size 200% at 1280x800 on /login and /signup: no horizontal scroll, content reflows, nothing clipped (screenshot `login-200.png`).
- Keyboard focus shows a brass 3px ring with offset on fields; invalid fields also get a thick left bar, so error is not color-only. With reduced motion emulated, 0 elements have a non-zero transition or animation duration.
- Screenshots are in `/private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/ui/`, for example `lessons-320x568.png`, `loginerr-320.png`, `focus1.png`, `home-1920x1080.png`.

### Summary
The theme, shared components and restyled screens match `docs/design.md` and meet AC-1, AC-2 and AC-6 in my checks. The mixed look on F05 pages (old blue "Log out" and "Record lesson" buttons under the new header) is accepted by the spec. I did not run the full tab-order or tap-only checks at 667x375 myself; the feature's own e2e specs cover them and passed per the checks file.
