---
id: F09
project: PRJ-001
entry: projects/PRJ-001-lesson-ledger/plan/backlog/F09-branded-sign-in-pages.md
status: approved
version: 1
touches_frontend: true
adrs: [ADR-002, ADR-004, ADR-005, ADR-006, ADR-007, ADR-008]
---

# Branded sign-in pages

## Summary
Log in and Sign up gain the brand. From 1024 px they show a dark brand panel on the left (logo mark, a larger "Lesson Ledger" wordmark, the value line and a new original illustration) and the existing form on a white card on the right. Below 1024 px a dark brand strip with mark, wordmark and value line sits above the form, without illustration. After a successful "Log out", Log in shows the status "You have logged out." once. The brand panel enters gently once per page appearance, and not at all under reduced motion. Fields, copy, validation, focus and every other F01 behaviour stay as they are.

## Acceptance criteria
- **AC-1** (wide layout): Given the production build, signed out, at 1024×768, 1280×800 and 1920×1080, when `/login` and `/signup` are shown (reduced motion), then:
  - (a) The page has, in DOM order, a `header` (the brand panel) followed by one `main`. The panel is on the left with `shell` background and is at least as tall as the viewport; `main` is on the right. Neither is fixed or sticky.
  - (b) The panel contains, in this order: the logo mark (the same drawing as the shell's mark), the visible text "Lesson Ledger", the visible text "Lessons, payments and pending fees in one place" and one illustration. No other text and no focusable element is in the panel.
  - (c) The mark and the illustration are inline `svg` with `aria-hidden="true"`, `focusable="false"`, no `title`/`desc`, no `tabindex`, and contain no `style` attribute, `<style>`, `<script>`, `data:` URI, `href`/`xlink:href` or `url(`. Every fill and stroke comes from a theme colour class or is `none`/`currentColor`. The illustration's shapes are not identical to any of the five F08 illustrations or the mark.
  - (d) The wordmark is plain text: not inside a heading, link or button, not focusable. Its computed font size is larger than the shell wordmark's (18 px at the 16 px root), and both it and the value line have ≥ 4.5:1 contrast against `shell`. "Lesson Ledger" appears exactly once as visible text in `body`.
  - (e) `main` holds a white (`canvas`) card containing the page's `h1`, the logged-out notice when shown (AC-3) and the F01 form. The card has the `panel` radius and a top accent bar in `paid`; the form controls keep their F08 look. The card is no wider than the `form` width plus its padding and lies entirely within the viewport horizontally.
  - (f) At 1920×1080 the value line is no wider than `measure` and the card is no wider than in (e); there is no horizontal page scroll at any width in this AC.
- **AC-2** (narrow layout): Given the production build, signed out, at 320×568, 375×667, 768×1024 and 667×375, when `/login` and `/signup` are shown, then:
  - (a) A full-width `header` brand strip with `shell` background is the first content, above `main`. It contains the logo mark, the visible text "Lesson Ledger" and the value line, with the AC-1 (c) and (d) properties (except the font-size comparison), and no illustration: no `svg` other than the mark is rendered visibly in the strip or anywhere on the page apart from the alert icon of F08.
  - (b) `main` follows with the `h1`, the notice when shown, and the F01 form in the `form`-width column on the white page, as before F09.
  - (c) The strip is neither fixed nor sticky. There is no horizontal page scroll. At 667×375, Tab through every control: no fixed or sticky element covers the focused element (WCAG 2.4.11).
- **AC-3** (logged-out notice): Given seed teacher `alice@example.com` logged in on any app page, when they activate "Log out" and `DELETE /api/sessions/current` returns 204, then:
  - (a) The browser is on `/login` with no query string and no hash, and `main` shows "You have logged out." in a `role="status"` region (polite; not `role="alert"`, not `aria-live="assertive"`), between the `h1` and the form.
  - (b) The notice is not styled as an error: no `danger` or `danger-wash` colour, no alert icon, no icon at all. Its text has ≥ 4.5:1 contrast against its background. It has no dismiss control and is not focusable.
  - (c) Focus is on the `h1` "Log in" as on every page appearance (F01/F04 behaviour); the notice does not take focus. Tab order and accessible names are those of AC-5 (a).
  - (d) No cookie name is added, and `localStorage` and `sessionStorage` hold the same keys as before "Log out".
  - (e) The notice stays while the teacher remains on this page, including after a field error or a failed log-in attempt.
  - (f) No notice is shown when Log in is reached in any other way: opening `/login` directly; opening `/` or `/lessons` with no cookie, with cookie `ll_session=not-a-real-token`, or with the cookie of an expired session (all end on `/login`); reloading `/login` after the notice was shown; going Back to an app page and being redirected, then Forward to `/login`; following "Create an account" then "Log in"; and after a "Log out" whose `DELETE` returns 401.
  - (g) When `DELETE /api/sessions/current` fails with a network error or 500, the teacher stays on the app page with "Couldn't log out. Please try again." (F06 AC-2 (f)) and no "You have logged out." text exists anywhere.
- **AC-4** (entrance motion): Given the production build at 1280×800, then, measured on computed styles and animation state:
  - (a) With `prefers-reduced-motion: no-preference`, when `/login` or `/signup` appears, the brand panel (or its content) runs exactly one animation: `animation-iteration-count` 1, duration ≤ 1000 ms, keyframes changing only `opacity` and/or `transform`, duration and easing from theme tokens. No other element on the page animates, apart from the F08 interaction transitions.
  - (b) From the first measurement after navigation, the form's fields and buttons have opacity 1, no transform, no running animation, and their bounding boxes equal those measured after all animations finished; typing into Email and pressing Tab works without waiting.
  - (c) Moving between Log in and Sign up by their links runs the entrance once on each new page. A field error, a failed log in, the submitting state or the notice appearing does not start it again.
  - (d) Below 1024 px (375×667) the brand strip has no animation.
  - (e) With `prefers-reduced-motion: reduce`, the longest transition or animation on both pages, at both widths, is ≤ 0.01 ms (F05 definition), and the first measurement shows the panel at opacity 1 with no transform.
  - (f) These checks live in `e2e/f08-motion.spec.ts`, which stays the only file overriding the suite's `reducedMotion: "reduce"`, reads computed styles and animation state only, and passes `--repeat-each=10`.
- **AC-5** (F01 behaviour, accessibility, devices): Given the production build, then:
  - (a) On `/login` and `/signup`, at 375 and 1280 px, there is exactly one `main`, one `h1` ("Log in" / "Create your account"), no `nav`, the document titles of F01, and the Tab order is exactly: Email, Password, the submit button ("Log in" / "Create account"), the link ("Create an account" / "Log in"). Every control matches `getByRole` with its pre-F09 role and exact name.
  - (b) Fields, hints, labels, autocomplete values, validation messages, `aria-invalid`/`aria-describedby` associations, focus on the first invalid field, the `role="alert"` messages, the submitting labels and the redirects of F01 AC-1, AC-2 and AC-4 behave as before; the F01 unit and e2e tests pass with their assertions unchanged.
  - (c) The F05 AC-6 (a)–(g) per-state checks, as extended by F06 AC-6 and F08 AC-6 (a), pass on `/login` and `/signup` in their default, field-error, form-error and (Log in) notice states, with and without reduced motion: 0 axe-core violations for wcag2a, wcag2aa, wcag21aa and wcag22aa; target size (2.5.8); focus not obscured (2.4.11); focus indicator ≥ 3:1.
  - (d) At 1280×800 with 200% root text, the panel's wordmark, value line and illustration and the strip's content wrap or scale without clipping or overlapping text, and the form stays horizontally within the viewport with no horizontal page scroll; vertical scrolling is allowed. Same at 375×667 with 200% root text.
  - (e) App pages are unchanged: the app shell and every signed-in page, including the session-check "Loading…" and "We couldn't reach Lesson Ledger." states, show no brand panel, strip, value line or new illustration; F08 AC-2 (a) and the F08 AC-6 (a) checks on app pages still pass.
  - (f) The `Content-Security-Policy` header of `/login`, `/signup` and every app page is byte-identical to F08's, and no `securitypolicyviolation` event fires on `/login` or `/signup`, with or without reduced motion. No new runtime dependency.
- **AC-6** (tests, docs, screenshots): Given the change, then:
  - (a) `make check` and `make e2e` pass. The diff of pre-existing tests removes or weakens no behaviour assertion. Allowed changes: selectors tied to CSS classes; F08's checks that `/login` and `/signup` have no `[data-brand]`, no "Lesson Ledger" text and no `svg` (F08 AC-2 (b), in e2e, component and design-doc tests), replaced by checks of AC-1 and AC-2; and tests encoding "brand in the shell only", "illustrations only above Get started and the four empty states" or the closed motion list, extended to the ADR-008 additions.
  - (b) `docs/design.md` records: in Layout, the signed-out split layout from `lg` and the brand strip below it; in Brand, the mark and wordmark on Log in and Sign up (wordmark size name, colours and contrast on `shell`, value line); in Illustrations, the brand-panel drawing; in Motion, the entrance (its token and rules) as ADR-008's addition; the logged-out notice under Components; any new theme names in their tables; "Product logo" in Reference elements mentions the signed-out pages.
  - (c) The repository's agent notes no longer say the brand is "shell only" or that illustrations appear above "Get started" and the four list empty states only; they state the ADR-008 placements and the entrance motion.
  - (d) The "Screenshots" section of `docs/design.md` lists 6 files taken from this feature's production build with reduced motion, and the files exist: `/login` and `/signup` at 375 and 1280 px (signed out, default state); `/login` at 1280 px with the logged-out notice (after `alice@example.com` logs out); `/login` at 1280 px after submitting the empty form ("Enter your email." and "Enter your password." shown).

## Behavior
- **Defaults chosen** (listed for the owner's review):
  - **"Theme's accent"** (R21): the theme has no colour named accent. The card's accent is a top bar in `paid`, the green of the logo's tick, so the brand colour carries from panel to card. No new colour token. The owner can change it at the gate.
  - **Value line** is "Lessons, payments and pending fees in one place" with no final period (R20), plain text, `shell-muted` or `shell-text`.
  - **Notice text** is "You have logged out." with a final period, like F01's other messages. No icon: ADR-007 keeps status regions without icons (F08 AC-1 (b)).
  - **Notice only after a 204 log out.** A "Log out" whose `DELETE` returns 401 (session already ended) still lands on `/login` as today but shows no notice, per R22 ("not after a 401").
  - **Notice is shown once**: on the Log in appearance that directly follows the successful log out. Reload, Back/Forward to that history entry, or any later visit shows none. While the teacher stays on the page, the notice stays (no dismiss control, R22).
  - **Notice position**: in the card, between the `h1` and the form, outside the form, so the form's Tab order and its alert position are unchanged.
  - **Brand panel is the page's `header`** (banner landmark) with no focusable content, matching the app shell's `header`; it is not a `nav`. `main` keeps the `h1` and form.
  - **Entrance** replays on every signed-out page appearance, including moves between Log in and Sign up (R23), because each is a new page. The entrance animates the panel at `lg` and up only; the strip below 1024 px is static, which keeps phones and 200% text free of motion over the form.
  - **Card only from 1024 px.** Below that the form stays on the white page in its `form` column as in F08; the strip carries the colour.
  - **No illustration below 1024 px** (entry), whether hidden or not rendered; AC-2 (a) checks it is not visible.
  - **Wordmark size** is a theme size name larger than `heading`, for example the existing `title` or a new size token; any new size or width (panel width, illustration size) is a theme token.
- **Illustration**: one new original drawing in the F08 line language (ledger rulings, notes, tick), drawn for the dark ground with theme colours, decorative. It must not copy an existing illustration set or brand. The owner judges it at the gate.
- **Theme rules** (ADR-005, ADR-006, ADR-007): theme names only; no literal colours, pixel sizes, arbitrary values or `style` attributes; keyframes once in the shared styles inside `prefers-reduced-motion: no-preference`; every `hover:` cue has a `focus-visible:` twin; CSS only, no animation library, no JavaScript animation.
- **States and accounts** (pilot finding 8): default, field-error and form-error states need no account (form error via an unknown email such as `nobody@example.com`); the notice state uses `alice@example.com` (log in then out; no data changes); the expired-session state uses a test-created teacher with a session made expired by SQL (`e2e/support/stack.ts` helpers), as F01 AC-5 does.
- **Merge gate** (ADR-006, ADR-007, ADR-008; outside the Approver's check): the orchestrator shows the owner the 6 screenshots of AC-6 (d), leaves the stack running with seed data and gives `APP_URL` and the seed credentials so the owner can see the entrance and the notice live, and asks "Do you approve the new Log in and Sign up pages?" as its own question. The owner may also change the value line wording (R20) and the accent there. A rejection loops back into F09.

## Interfaces

### API
None. `DELETE /api/sessions/current` and every F01 endpoint are unchanged.

### Data model
None.

### Configuration
None. CSP and security headers unchanged; no new dependency; any new theme tokens live in the existing theme.

## UI
Design reference: `docs/design.md`, ADR-006, ADR-007, ADR-008. Only `/login` and `/signup` change.

**`/login`**
- **Default**: ≥ 1024 px brand panel + card with `h1` and form (AC-1); < 1024 px strip + form (AC-2). Entrance per AC-4.
- **Logged out**: as default with "You have logged out." between `h1` and form (AC-3).
- **Submitting**: F01 ("Logging in…", button disabled); no entrance replay.
- **Field errors**: F01 messages, associations and focus; notice, if shown, stays.
- **Form error**: "Email or password is incorrect." or "Something went wrong. Please try again." in the F08 alert; notice, if shown, stays.
- **No permission**: a logged-in teacher is redirected to `/` (F01), as before.
- **Loading / empty**: not applicable (static page; the F01 public-route behaviour is unchanged).

**`/signup`**
- **Default**, **submitting** ("Creating account…"), **field errors** (format, length, duplicate email), **form error**, **no permission**: as `/login`, without the notice state.

**App pages**: unchanged, including session-check loading and error states (AC-5 e).

Every state under reduced motion: final state at once.

## Security considerations
- No change to who may access what: `/login` and `/signup` stay public, app pages still require a session (ADR-004), logged-in teachers are still redirected away from `/login` and `/signup`.
- User input is unchanged (F01 email and password). The notice contains no user data (no email) and is not driven by any URL parameter, so a crafted link cannot make Log in show it or inject text.
- The notice is frontend-only and must not use a cookie, query string, hash or browser storage (AC-3 d); log out still deletes the server session and clears `ll_session` exactly as F01.
- CSP `default-src 'self'` stays byte-identical; inline SVGs carry no `style`, scripts, `data:` URIs or external references. No new third-party code.
- No data leaves the system; the brand panel and strip are static.

## Non-functional
- WCAG 2.2 AA on `/login` and `/signup`: 1.4.3 (wordmark, value line and notice ≥ 4.5:1), 1.4.11, 1.1.1 (mark and illustration decorative and hidden), 1.3.1 (one `main`, one `h1`, wordmark not a heading), 4.1.3 (notice as a polite status message), 1.4.1 (notice meaning carried by text), 2.3.3 (no motion under reduce), 2.2.2 and 2.3.1 (one entrance, under a second, no flash), 2.4.3/2.4.7/2.4.11 (Tab order, focus visible, not obscured), 2.5.8, 1.4.4/1.4.10 (200% text, reflow at 320 px).
- Responsive: 320, 375, 768, 1024, 1280 and 1920 px, 667×375, 200% text (AC-1, AC-2, AC-5 d).
- E2E deterministic: suite under reduced motion; one on/off file (AC-4 f).

## Out of scope
- Any change to sign-up, log-in or log-out behaviour beyond the logged-out notice: routes, fields, copy of headings, labels and errors, validation rules, API calls, session handling, redirects.
- Backend, API, OpenAPI or seed changes.
- Changes to the app shell or any signed-in page, including the session-check loading and error states.
- A separate logged-out page, a "remember me" option, password reset or any new control on these pages, including a dismiss control on the notice.
- Making the wordmark a link or a heading.
- Aligning the F01 network-error copy with later pages (`pilot-notes.md` finding 13) and other open findings, unless an element added here is the cause.
- Photos, raster or animated illustrations, and any colour or typography rebrand.
- A notice after a session expiry, a 401 on log out or a redirect; an entrance on the narrow brand strip; a card below 1024 px.

## Traceability
| Expected result | Criteria |
|---|---|
| From 1024 px: split layout, dark brand panel with mark, larger wordmark, value line, new illustration; form on a white card with the theme's accent | AC-1 |
| Below 1024 px: brand strip with mark, wordmark, value line; form under it; no illustration | AC-2 |
| After Log out: themed "You have logged out" notice; no notice when Log in is reached any other way | AC-3 |
| Brand panel enters once; shows at once under reduced motion; form usable from the first frame | AC-4 |
| F01 fields, validation, errors, focus, links and single heading unchanged; WCAG 2.2 AA; multi-device checks | AC-5, AC-6 (a) |
| Owner approves the look, notice and entrance on screenshots and live before merge | AC-6 (b–d); merge gate in Behavior |

## Open questions
None.

## Changelog
