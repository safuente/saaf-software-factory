# ADR-008: Brand and illustration on the signed-out pages

- Status: proposed
- Date: 2026-11-19

## Context
ADR-007 placed the logo mark and wordmark in the app shell only (sidebar and narrow-screen top bar) and limited illustrations to Home's "Get started" box and the four list empty states. Its motion list is closed: "Any other motion needs a revision of this ADR." F08 applied this literally: `/login` and `/signup` show no logo, no wordmark and no `svg` (`specs/F08-icons-brand-and-motion.md` AC-2 (b), R17), and the repository's agent notes describe the brand component as "shell only".

After F08 merged, the owner said Log in and Log out are "a bit plain: there's no brand image and no colour" (owner feedback 2026-11-19, `plan/README.md` Revision 2026-11-19 d). Log out has no page of its own; it returns the teacher to Log in. The owner approved branded Log in and Sign up pages (F09): a dark brand panel with the mark, a larger wordmark, a value line and a new illustration from 1024 px, a brand strip without illustration below that, a themed "You have logged out" notice, and a gentle entrance of the brand panel.

What stays fixed: ADR-002 (CSP `default-src 'self'`), ADR-005 (theme as the only design system), ADR-006 (dashboard direction, WCAG 2.2 AA, multi-device checks, owner screenshot gate) and the rest of ADR-007 (icon rules, SVG rules, motion rules).

## Decision
This ADR amends ADR-007; the rest of ADR-007 stands.

- **Brand placement**: the logo mark and wordmark may appear in the app shell and on the signed-out pages (Log in, Sign up). On the signed-out pages the wordmark may be larger than in the shell, through a theme size name. It stays plain text: not a heading, not a link, not a Tab stop, so each page keeps its single `h1` ("Log in", "Create your account") and its Tab order. The mark stays decorative.
- **Illustration placement**: in addition to "Get started" and the four list empty states, one original illustration may appear in the brand panel of the signed-out pages. Same rules as ADR-007: original, inline SVG, theme colours only, decorative and hidden from assistive technology, no `style`, `data:` URIs, scripts or external references.
- **Motion**: one more allowed use is added to ADR-007's list: a single entrance of the signed-out brand panel (opacity and/or transform only, runs once, within ADR-007's duration limit, from theme tokens and the shared styles). It never delays the form: fields and buttons are interactive and in their final layout from the first frame, and focus behaves as before. Off under reduced motion like every other motion.
- **Gate**: ADR-006's screenshot gate and ADR-007's live try-out apply to any change of the signed-out pages' look.

## Alternatives considered
- Edit ADR-007 in place: it is built and merged (F08); a separate ADR keeps the history of why the brand moved beyond the shell, as ADR-007 did for ADR-006.
- Supersede ADR-007: only two placement rules and one motion use change; icon, SVG and motion rules stand.
- Text-only brand on signed-out pages (wordmark without mark or illustration): does not answer the owner's "no brand image".

## Consequences
- F08's checks that `/login` and `/signup` show no logo, wordmark or `svg` (AC-2 (b)) are replaced by checks of this ADR in the feature that implements it; `docs/design.md` (Brand, Illustrations, Motion) and the repository's agent notes ("shell only", "four list empty states only") must be updated in the same feature.
- The brand panel draws on the dark `shell` colour, so the wordmark, value line and illustration need theme colours that keep WCAG 2.2 AA contrast on `shell`.
- Any other placement of brand or illustrations, or any other motion, still needs a revision of ADR-007 or this ADR.
