# ADR-007: Icons, brand and motion

- Status: proposed; amended by ADR-008 (brand, illustration and an entrance motion on the signed-out pages)
- Date: 2026-11-19

## Context
ADR-006 set the dashboard identity. It did not adopt the reference's product logo or illustrations: `docs/design.md` "Reference elements" lists "Product logo and customer photos" as left out. The project's own rules in the repository then excluded motion: the repository's agent notes say "no motion" under Styling, a shared component carries the comment "the design has no motion", and the F04 build recorded "no motion" as a design choice. The factory conventions (`policies/conventions.md` §1 Styling) do not forbid motion or icons; the ban is project-level and comes from ADR-005/ADR-006 work.

After F07 merged, the owner asked for icons, an image/brand and subtle animation (owner request 2026-11-19, `plan/README.md` Revision 2026-11-19 c) and agreed the scope:
- Icons from Lucide (lucide-react, ISC licence), bundled, no CDN, CSP unchanged.
- An original SVG logo mark with the "Lesson Ledger" wordmark, a favicon, and a simple original illustration in Home's "Get started" box and in the empty states.
- 150-200 ms transitions on hover and focus, the paid/pending bar growing on load, metric figures fading in, a row just marked as paid briefly highlighting green; all off under prefers-reduced-motion.

What stays fixed:
- ADR-002: `Content-Security-Policy: default-src 'self'`, so every asset comes from the app's origin and inline `style` attributes are blocked (the project also forbids them in components).
- ADR-005: Tailwind CSS 4, the theme as the only design system, shared components, no literal colours, pixel sizes or arbitrary values, custom CSS only in the shared styles area, no component library.
- ADR-006: the dashboard direction, WCAG 2.2 AA, the multi-device checks (320, 375, 768, 1280, 1920 px; 667x375; 200% text), no behaviour change, and the owner screenshot gate.

## Decision
This ADR amends ADR-006; the rest of ADR-006 stands.

- **Icon set**: Lucide through its React package (ISC licence), installed as a pinned frontend dependency and bundled with the build; only the icons used end up in the bundle. No icon font, no CDN, no sprite fetched from another origin. An icon set is not a component library in the sense of ADR-005: it supplies glyphs only, and the shared components (buttons, links, navigation, alerts) stay the project's own and place the icons.
- **Icon use**: icons are decorative and always sit next to visible text that already carries the meaning. They are hidden from assistive technology and never change an accessible name, so links and buttons are found by the same role and name as before. No icon-only control. Icons take their colour from the surrounding text (current colour) and their size from theme names.
- **Brand**: an original logo mark in SVG, a simple note or ledger motif that does not imitate any existing brand, next to the "Lesson Ledger" wordmark as text. The mark is decorative; the wordmark is the text. Colours come from the theme. A favicon derived from the mark is served as a file from the app's origin.
- **Illustrations**: simple original inline SVG illustrations, decorative and hidden from assistive technology, drawn with theme colours. They never replace the text of a guidance or empty-state message.
- **SVG under the CSP**: logo, favicon and illustrations use SVG presentation attributes or theme classes, never inline `style` attributes, `data:` URIs or external references, so `default-src 'self'` stays unchanged.
- **Motion is allowed, within these rules**:
  - Durations and easings are theme tokens (with the 150-200 ms range for interaction feedback); keyframes, if any, are defined once in the shared styles. Components use those names only.
  - CSS transitions and animations only; no animation library and no JavaScript-driven animation loops.
  - Allowed uses are the ones the owner agreed: hover and focus feedback on buttons and links, the paid/pending bar growing on load, metric figures fading in, and a brief green highlight of a row just marked as paid where the row stays on screen. Any other motion needs a revision of this ADR.
  - Under `prefers-reduced-motion: reduce`, every transition and animation is off (WCAG 2.3.3): the final state shows at once.
  - Nothing flashes (WCAG 2.3.1), nothing moves for more than about a second, nothing loops, and nothing auto-plays that would need a pause control (2.2.2).
  - Motion never delays interaction, focus or content: elements are interactive and in their final layout from the first frame, focus moves as before, live-region announcements are unchanged, and content is in the accessibility tree before any fade ends. The focus indicator appears without delay; transitions may only soften colour changes around it.
  - A highlight is never the only cue: the status word still changes; text in a highlighted row keeps WCAG contrast at every point of the highlight.
- **Tests**: end-to-end tests run with reduced motion so they stay deterministic; one check shows that motion exists without the preference and is off with it. The existing reduced-motion checks (longest transition or animation at most 0.01 ms under reduce) stay valid.
- **Design plan**: `docs/design.md` records the icon set and its licence, the logo, favicon and illustrations, the motion tokens and the rules above, and changes "Product logo" in "Reference elements" from left out to adopted. The repository's agent notes and design tests that encode "no motion" are updated to these rules in the same feature.
- **Approval gate**: ADR-006's screenshot gate applies. Because motion cannot be judged on screenshots, the gate also leaves the stack running with seed data so the owner can try it live, and asks for approval of icons, brand and motion as its own question.

## Alternatives considered
- Edit ADR-006 in place: it is built and merged; a separate ADR keeps the history of why "no motion" changed.
- Supersede ADR-006 entirely: only its imagery and motion scope changes; the direction, accessibility and gate stand.
- Icons from a CDN or icon font: blocked by the CSP and adds an external dependency; icon fonts also risk being announced by screen readers.
- Hand-drawn SVG icons: more work and less consistent for about a dozen glyphs; the owner chose Lucide.
- An animation library: unnecessary for a few transitions and adds bundle weight and JavaScript timing that makes tests less deterministic.
- Motion without a reduced-motion switch: fails WCAG 2.3.3 and makes e2e tests timing-dependent.

## Consequences
- Supersedes the project-level "no motion" rule and the "no logo or illustrations" entry of `docs/design.md`; ADR-005 and ADR-006 otherwise stand.
- Adds a frontend dependency that must pass the dependency scan of `make check`; its licence is recorded.
- Tests locating elements by role and accessible name keep working because icons are hidden and names do not change. Table column order and the totals description list stay as ADR-006 requires; illustrations sit outside tables.
- Screenshots for any visual gate are taken with reduced motion (or after motion ends) so they show final states.
- Every later frontend feature uses the icon set, motion tokens and rules here, and adds motion only through a revision of this ADR.
