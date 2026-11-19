# ADR-006: Dashboard visual identity

- Status: proposed; amended by ADR-007 (icon set, logo and illustrations, motion)
- Date: 2026-11-19

## Context
ADR-005 set Tailwind CSS with the theme as the design system and asked for a visual identity driven by the subject, written to `docs/design.md` with the `frontend-design` skill. F04 and F05 delivered that identity: a "manuscript paper" look with green-grey paper, Alegreya and Alegreya Sans, a stave under the navigation, note heads for the current page and piano-key buttons. Both features are merged.

The owner rejected that identity after seeing F05 (`context/design-direction.md`, 2026-11-18) and gave a concrete direction instead: a clean product dashboard, with `context/design-reference.png` (the "Mate" orders screen) as the visual reference. The owner's direction explicitly overrides the `frontend-design` skill's advice against generic SaaS dashboard looks. The F04 merge gate failed to catch the rejection because the owner was not asked to look at the screens (`pilot-notes.md` finding 15).

What stays fixed:
- Tailwind CSS 4, the theme as the only design system, the shared components, self-hosted fonts, no CSS modules or tokens file, custom CSS only in the shared styles area (ADR-005).
- `Content-Security-Policy: default-src 'self'` (ADR-002).
- WCAG 2.2 AA, which the F05 spec already adopted by owner decision, and the multi-device checks of F04 and F05: widths 320, 375, 768, 1280 and 1920; 667x375 landscape; text at 200%.
- No behaviour change, and the out-of-scope list in `context/design-direction.md`.

## Decision
- **Direction**: the visual identity is the dashboard direction of `context/design-direction.md`, with `context/design-reference.png` as the reference for layout, density and tone. It replaces the manuscript identity entirely: no stave, note heads, piano-key buttons, paper texture colours or Alegreya fonts remain, and the font files no longer used are removed from the build.
- **Elements taken from the reference** (from `context/design-direction.md`):
  - A dark left sidebar holding the main navigation (Home, Lessons, Students, Monthly summary, Pending payments) with log out at the bottom. It replaces the header with the stave.
  - A white main area with a large sans-serif page title and the page's actions at the top right: the primary button solid black, the secondary button outlined.
  - Dense, clean data tables: grey column headers, thin row dividers, the student's initials in a circle next to the name, payment status as "✓ Paid" (green) or "Unpaid" (amber or red), always with the word.
  - On the Monthly summary, a right-hand metrics panel with collected, pending, lesson count, a paid versus pending bar and the average per lesson, computed only from data the page already has.
  - The month selector presented as a chip, like the reference's filter chips.
- **Elements of the reference not taken**, because they are new functionality: search, extra filters, row checkboxes and bulk actions, row detail popover, import and export, notifications, and the reference's own navigation items (Inventory, Help, Settings).
- **Typography**: one self-hosted sans-serif family with an open licence, few weights. The `docs/design.md` sizes must match what the app renders, including the root font size (the F04 18 px root mismatch, `pilot-notes.md`, must not recur).
- **Where it is written**: `docs/design.md` in the repository and the theme in the frontend's shared styles are rewritten for this direction, keeping ADR-005's rules (names defined once in the theme, no literal colours, pixel sizes or arbitrary values in components). `docs/design.md` records which reference elements were adopted, which were left out and why, and how each one meets WCAG 2.2 AA. The subject-driven rationale and the "changed versus generic defaults" list required by ADR-005 no longer apply.
- **Accessibility**: WCAG 2.2 AA. Colour is never the only cue (status keeps its word, the bar has its figures as text, the current page in the sidebar has a non-colour cue). Text on the dark sidebar and on black buttons meets contrast; focus stays visible on dark and light grounds; fixed or sticky regions never cover focused elements. The sidebar layout must still pass the 320 px reflow, 200% text and 667x375 checks; how the navigation adapts on narrow screens is decided in the spec, with every link reachable by keyboard and touch at every width.
- **Approval gate**: a feature that sets or changes the visual identity is not merged until the owner has seen screenshots of every page and has answered, as its own question, that they approve the look.
- **Migration in one feature (F06)**: unlike ADR-005's two-step migration, the direction is now fixed by the owner's reference, and the shared components and theme already make every page depend on one place. F06 redesigns the theme, shared components, shell and every page together.

## Alternatives considered
- Edit ADR-005 in place: it is built and merged, and its subject-driven direction is what was rejected; superseding keeps the history of why the look changed.
- Keep the manuscript identity and only tone it down: the owner rejected the look itself, not its intensity.
- Two features again (shell and auth first, then the rest): the split did not protect against rejection in F04/F05 because the gate failed, and with a concrete reference the risk of a wrong direction is lower than the cost of a mixed look between two merges.
- A component library or dashboard template on top of Tailwind: same reasons as ADR-005; the app has few screens and its own shared components already exist.
- Adopting the reference's search, filters and detail popover: new functionality, out of scope per the owner.

## Consequences
- Supersedes ADR-005's visual identity decision (subject-driven direction, `frontend-design` skill as the source of the direction, two-feature migration). ADR-005's framework, theme, shared-component, font and hand-written-CSS rules stand.
- Tests that assert the manuscript identity itself (contents of the old design plan, old theme names and values, the stave, the pinned column's bar line) are rewritten for the new direction. Tests of behaviour keep their assertions; only selectors tied to styling may change.
- The UI reviewer checks against the new `docs/design.md` and the reference, not against the `frontend-design` skill's anti-generic criteria.
- The e2e tests locate data by table column order and the monthly totals by description-list structure (plan Risks). The metrics panel and redesigned tables must keep that structure or the tests' assertions break.
- Every later frontend feature follows the dashboard direction and the approval gate above.
