# Design direction (owner, 2026-11-18)

After seeing F04 and F05, the owner finds the "manuscript paper" identity (green-grey paper, Alegreya, stave lines, note heads, piano-key buttons) ugly and wants it replaced. Reference: `design-reference.png` in this folder, a clean product dashboard ("Mate" orders screen).

Take from the reference:
- Dark left sidebar with the main navigation (Home, Lessons, Students, Monthly summary, Pending payments) and log out at the bottom. Replaces the header with the stave.
- White main area, large sans-serif page title, actions top right: primary button solid black, secondary button outlined.
- Dense, clean data tables: grey column headers, thin row dividers, student initials in a circle, status as "✓ Paid" (green) or "Unpaid" (amber or red), always with text, never colour alone.
- Right-hand metrics panel on the Monthly summary: collected, pending, lesson count, a paid versus pending bar, average per lesson. Only data the app already has.
- Month selector as a chip, like the reference's "Type / Status" filters.

Not in scope (new functionality, not visual): search, extra filters, row checkboxes and bulk actions, row detail popover, import/export, notifications.

The owner's direction overrides the `frontend-design` skill's advice against generic SaaS dashboard looks. Accessibility (WCAG 2.2 AA), the multi-device checks of F04/F05 and "no behavior change" still apply.

Before merge, the owner must see screenshots of every page and approve the look explicitly.
