# Lesson Ledger visual identity

The design plan of the frontend. The Tailwind theme in `frontend/src/shared/styles/app.css` implements it: every name below is defined there once, and components use only these names (ADR-005 theme rules, which still stand).

## Direction

A clean product dashboard, set by the owner (`context/design-direction.md`, 2026-11-18) with the "Mate" orders screen as the reference for layout, density and tone, and recorded in ADR-006. It replaces the F04/F05 identity entirely. The owner's direction overrides the `frontend-design` skill's advice against generic dashboard looks, so this plan follows the reference closely and does not carry a "changed versus generic defaults" list.

What the direction asks for, in short:

- A dark sidebar for the app's own pages, a white working area and one large sans-serif title per page.
- Dense tables you can scan: grey column headers, thin rules, initials before each student's name, and payment status in words with a colour cue.
- On the Monthly summary, a metrics panel built only from figures the page already loads, and the month controls as a chip.
- Restraint everywhere else: one typeface, black and white for actions, colour only where it carries meaning (paid, unpaid, errors, focus).

Accessibility target: WCAG 2.2 AA on every page. Colour is never the only cue.

ADR-007 (F08) amends ADR-006: decorative Lucide icons next to the text of the main controls, an original logo mark with the wordmark, small original illustrations in "Get started" and the empty states, and subtle motion that is off under reduced motion. See Icons, Brand, Illustrations and Motion below.

ADR-008 (F09) amends ADR-007 for the signed-out pages: Log in and Sign up carry the mark, a larger wordmark, a value line and one more illustration in a dark brand panel, show "You have logged out." after a log out, and the panel enters once. See Layout, Brand, Illustrations, Motion and Components.

## Palette

Core colours are `canvas`, `black`, `graphite`, `slate`, `shell` and `focus`; the others support them. Contrast ratios are WCAG 2.x relative-luminance ratios computed from the hex values. Text needs 4.5:1 and UI components 3:1 (WCAG 1.4.3, 1.4.11).

| Name | Theme | Value | Role | Contrast |
|---|---|---|---|---|
| `canvas` | `--color-canvas` | `#FFFFFF` | Page and `main` background, secondary button fill, text on primary buttons | Background; `graphite` on it 16.17:1; on `black` 21.00:1, on `shell` 16.53:1 |
| `black` | `--color-black` | `#000000` | Fill and border of primary buttons | `canvas` on it 21.00:1 |
| `graphite` | `--color-graphite` | `#1D2127` | Body text, headings, labels, field values, table cells, links, secondary button text | 16.17:1 on `canvas`, 14.95:1 on `mist` |
| `slate` | `--color-slate` | `#5B626D` | Table column headers, captions, hints, totals terms, notes; disabled primary button fill | 6.15:1 on `canvas`, 5.69:1 on `mist`; `canvas` on it 6.15:1 |
| `outline` | `--color-outline` | `#868D98` | Borders of text fields, selects, secondary buttons and the month chip (UI components) | 3.35:1 on `canvas` |
| `rule` | `--color-rule` | `#E4E6EA` | 1 px row dividers, panel border, empty bar track, initials circle; disabled secondary button border | 1.25:1 on `canvas`: decorative (rows are also separated by their text), never a UI-component boundary; `graphite` on it 12.94:1 |
| `mist` | `--color-mist` | `#F5F6F8` | Hover and focus fill of secondary buttons | `graphite` on it 14.95:1 |
| `shell` | `--color-shell` | `#1B1F26` | Ground of the sidebar and the top bar | `shell-text` on it 15.02:1, `shell-muted` 8.47:1, `focus` 5.09:1 |
| `shell-raised` | `--color-shell-raised` | `#2C323C` | Pill behind the current page's link; hover and focus fill of primary buttons | `shell-text` on it 11.72:1, `canvas` on it 11.72:1, `focus` 3.97:1 |
| `shell-text` | `--color-shell-text` | `#F3F4F6` | Current page's link text in the sidebar | 15.02:1 on `shell`, 11.72:1 on `shell-raised` |
| `shell-muted` | `--color-shell-muted` | `#B4BAC4` | Text of the other sidebar links | 8.47:1 on `shell`, 6.61:1 on `shell-raised` |
| `focus` | `--color-focus` | `#4D8DF7` | Focus ring on every focusable element, in the shell and in `main` | 3.25:1 on `canvas`, 5.09:1 on `shell`, 3.97:1 on `shell-raised` |
| `paid` | `--color-paid` | `#17803D` | The status "✓ Paid" and the paid segment of the metrics bar | 5.01:1 on `canvas` |
| `unpaid` | `--color-unpaid` | `#9A5B00` | The status "Unpaid": amber, so it is not read as an error | 5.43:1 on `canvas` |
| `pending-bar` | `--color-pending-bar` | `#E8A33D` | Pending segment of the metrics bar (hidden from assistive technology; the figures are text) | Decorative, 2.16:1 on `canvas`; never the only cue |
| `danger` | `--color-danger` | `#C42B2B` | Field error text, invalid field border, alert text and bar | 5.63:1 on `canvas`, 5.07:1 on `danger-wash` |
| `danger-wash` | `--color-danger-wash` | `#FDF0EF` | Background of error alerts | Background; `danger` on it 5.07:1 |
| `paid-wash` | `--color-paid-wash` | `#EEFAF1` | Strongest colour of the just-paid row highlight (Motion), fading to `canvas` | Background; `graphite` on it 15.07:1, `slate` 5.74:1, `paid` 4.67:1, `outline` 3.12:1, `focus` 3.03:1 |

## Typefaces

One family for everything. Inter is drawn for interfaces: a large x-height that stays legible at the dense 15 px of tables, and real tabular figures for money columns. It is the closest open-licence match to the neutral grotesque of the reference.

| Name | Theme | Family | Classification | Weights | License | Hosting |
|---|---|---|---|---|---|---|
| `sans` | `--font-sans` | Inter | Sans-serif grotesque, with system sans-serif fallbacks | One variable file; used at 400, 500 and 600 | SIL Open Font License 1.1 (`fonts/inter/OFL.txt`) | Self-hosted: latin subset, one WOFF2 file (about 48 KB), served from the app's origin |

## Type scale

Steps in rem, so text follows the reader's font size. The app renders them at the browser's default 16 px root (see Rendered sizes).

| Name | Theme | Value | Rendered | Line height | Use |
|---|---|---|---|---|---|
| `micro` | `--text-micro` | `0.75rem` | 12 px | `1` | Initials inside their circle |
| `small` | `--text-small` | `0.875rem` | 14 px | `1.45` | Table column headers, captions, hints, field errors |
| `body` | `--text-body` | `0.9375rem` | 15 px | `1.5` | Set on `body`: paragraphs, labels, fields, buttons, table cells, sidebar links, totals |
| `heading` | `--text-heading` | `1.125rem` | 18 px | `1.35` | Section headings and the month (`h2`) |
| `title` | `--text-title` | `2rem` | 32 px | `1.2` | Page title (`h1`) at every width: the largest title step |
| `display` | `--text-display` | `2.5rem` | 40 px | `1.1` | The wordmark in the brand panel of Log in and Sign up from `lg` (ADR-008); never a heading |

## Spacing

A 0.25rem step (4 px), with only the steps the interface uses. Space grows between groups: 2 between a label and its field, 5 between fields, 8 to 10 between page regions.

| Name | Theme | Value | Rendered | Use |
|---|---|---|---|---|
| `0` | `--spacing-0` | `0` | 0 px | Table border spacing; the left offset of the pinned Student column |
| `1` | `--spacing-1` | `0.25rem` | 4 px | Gap between sidebar links; tick to "Paid"; a Home figure's value to its term |
| `2` | `--spacing-2` | `0.5rem` | 8 px | Label to field; vertical padding of fields, buttons, links and table cells; scroll margin around focusable elements |
| `3` | `--spacing-3` | `0.75rem` | 12 px | Horizontal padding of fields, links and table cells; initials circle to name; top bar padding |
| `4` | `--spacing-4` | `1rem` | 16 px | Page side padding on phones; button side padding; alert padding |
| `5` | `--spacing-5` | `1.25rem` | 20 px | Between form fields; metrics panel padding |
| `6` | `--spacing-6` | `1.5rem` | 24 px | Between the metrics panel and the table; between the top bar's links and Log out |
| `7` | `--spacing-7` | `1.75rem` | 28 px | Size of the initials circle |
| `8` | `--spacing-8` | `2rem` | 32 px | Page side padding from `sm`; title to content; sidebar padding |
| `10` | `--spacing-10` | `2.5rem` | 40 px | Top of `main` from `lg`; between page sections; start padding of "Get started" for its numbers |
| `12` | `--spacing-12` | `3rem` | 48 px | Top of the log-in and sign-up pages; bottom of app pages; between Home's figures from `md` |
| `20` | `--spacing-20` | `5rem` | 80 px | Top of the log-in and sign-up pages from `sm` |

## Radii

Radius follows hierarchy: controls are slightly rounded, the panel more, and round things are round.

| Name | Theme | Value | Rendered | Use |
|---|---|---|---|---|
| `control` | `--radius-control` | `0.5rem` | 8 px | Buttons, fields, alerts, sidebar link pills |
| `panel` | `--radius-panel` | `0.75rem` | 12 px | The metrics panel |
| `pill` | `--radius-pill` | `9999px` | 9999 px | Month chip, initials circle, metrics bar |

## Breakpoints and widths

Breakpoints are in rem; media queries resolve rem against the browser default (16 px). Widths are rem too and resolve against the 16 px root.

| Name | Theme | Value | Rendered | Use |
|---|---|---|---|---|
| `sm` | `--breakpoint-sm` | `40rem` | 640 px | Wider page padding; taller top margin on log in and sign-up |
| `md` | `--breakpoint-md` | `48rem` | 768 px | Month chip and its buttons on one row |
| `lg` | `--breakpoint-lg` | `64rem` | 1024 px | The top bar becomes the sidebar |
| `xl` | `--breakpoint-xl` | `80rem` | 1280 px | The metrics panel moves to the right of the table |
| `content` | `--container-content` | `80rem` | 1280 px | Maximum width of `main` on app pages; tables may use all of it |
| `form` | `--container-form` | `24rem` | 384 px | Width of every single-column form and of the log-in and sign-up pages |
| `measure` | `--container-measure` | `68ch` | about 560 px for body text | Maximum width of every paragraph, label, hint and message |
| `sidebar` | `--container-sidebar` | `15rem` | 240 px | Width of the sidebar |
| `panel` | `--container-panel` | `16rem` | 256 px | Width of the metrics panel beside the table |
| `card` | `--container-card` | `28rem` | 448 px | Maximum width of the Log in and Sign up card from `lg`: the `form` width plus its padding `8` on each side |
| `illustration` | `--container-illustration` | `24rem` | 384 px | Maximum width of the brand panel's drawing on Log in and Sign up |

## Rendered sizes

The root font size the app renders is 16 px: the theme leaves the root at the browser default and sets `body` (0.9375rem) on the `body` element, so every rem in the theme resolves against 16 px. The sizes below are measured on `/login`, `/` and `/lessons` at 1280×800 (`frontend/e2e/f06-identity.spec.ts`). If a reader sets a larger default font size, every figure grows in proportion.

| Element | Font size |
|---|---|
| `h1` | 32 px |
| Body text | 15 px |
| Label | 15 px |
| Text field | 15 px |
| Button | 15 px |
| Table cell | 15 px |
| Sidebar link | 15 px |

## Layout

**App pages** (`/`, `/lessons`, `/students`, `/summary`, `/pending`) sit in a shell:

```
≥ 1024 px                                  < 1024 px
┌──────────┬──────────────────────────┐    ┌──────────────────────────────┐
│ ◰ Lesson │ Title                    │    │ ◰ Lesson Ledger              │
│   Ledger │                          │    │ Home Lessons Students        │
│ Lessons  │                          │    │ Monthly summary  Pending …   │
│ Students │ content (≤ content)      │    │                     Log out  │
│ Monthly… │                          │    ├──────────────────────────────┤
│ Pending… │                          │    │ Title                        │
│          │                          │    │ content                      │
│ Log out  │                          │    │                              │
└──────────┴──────────────────────────┘    └──────────────────────────────┘
```

- **Sidebar** (from `lg`, 1024 px): a `shell` column of `sidebar` width, at least as tall as the viewport. The brand (logo mark and "Lesson Ledger", see Brand) comes first; the "Main" navigation follows, links stacked; "Log out" (a secondary button) sits at the bottom of the sidebar, which grows with `main` on pages taller than the viewport. It is the page's `header`.
- **Top bar** (below 1024 px): the same `header`, full width above `main`, starting with the brand, then the links wrapping onto as many rows as they need and "Log out" at the end. There is no menu toggle and nothing scrolls inside the bar.
- Neither is fixed or sticky, so they can never cover a focused element, at 667×375 or at 200% text.
- **Title row**: `main` is white, left-aligned, at most `content` wide, with side padding 4, and 8 from `sm`. Its first row is the page title (`h1`, `title`, semibold). A page may add a lead line under the title and page actions: from 1024 px the page actions sit to the right of the title, top-aligned; below it they wrap onto their own row under the title and lead line. Only Home has page actions (F07). A failed log out shows its alert at the top of `main`, above the title.
- **Home** (`/`, F07): below the title row the sections stack in this order at every width: the month figures, "Oldest unpaid lessons", "Latest lessons". A new teacher sees "Get started" instead of the three. The tables stay full width, like on the other pages; nothing sits side by side, because two five-column tables do not fit beside each other at 1280 px without scrolling.
- Forms keep the `form` width and text the `measure`; only tables and the summary's panel and table group widen to the full width of `main`.
- **Log in and Sign up** (ADR-008, F09): no navigation. The page's `header` is the brand, never fixed or sticky, with nothing focusable in it:

```
≥ 1024 px                                        < 1024 px
┌────────────────────────┬───────────────────────┐    ┌──────────────────────────────┐
│ ◰                      │                       │    │ ◰ Lesson Ledger              │
│ Lesson Ledger          │  ┌━━━━━━━━━━━━━━━━━┐  │    │ Lessons, payments and        │
│ Lessons, payments and  │  │ Log in          │  │    │ pending fees in one place    │
│ pending fees in one …  │  │ (notice)        │  │    ├──────────────────────────────┤
│                        │  │ Email           │  │    │ Log in                       │
│   ┌──────────┐         │  │ Password        │  │    │ (notice)                     │
│   │ ledger   │◉        │  │ [Log in]        │  │    │ Email                        │
│   └──────────┘         │  └─────────────────┘  │    │ Password …                   │
└────────────────────────┴───────────────────────┘    └──────────────────────────────┘
```

  - **Brand panel** (from `lg`, 1024 px): the left half of the page on `shell`, at least as tall as the viewport, padding `12` (`20` from `xl`). Top-aligned and left-aligned: the logo mark at size `12`, the wordmark, the value line, and the ledger drawing at the bottom (see Brand and Illustrations). Its content enters once (see Motion).
  - **Card** (from `lg`): `main` is the right half, white, with the card centred in it: `canvas`, a `rule` border, a `paid` top bar, `panel` radius, padding `8`, at most `card` wide (the `form` width plus its padding). It holds the `h1`, the logged-out notice when shown, and the F01 form.
  - **Brand strip** (below `lg`): a full-width `shell` strip above `main` with the mark at size `8` and the wordmark on one line and the value line under them; no drawing and no motion. Below it the title and the form sit on the white page in the `form` column, as before F09.

## Components

- **Buttons**: Primary submits a form (Log in, Create account, Add student, Record lesson): `black` fill and border, `canvas` text, `control` radius, `body` size, medium weight, padding `2` by `4`; hover and keyboard focus fill it `shell-raised`; disabled turns `slate`. Secondary is every other button (Try again, Log out, Previous month, Next month, Mark as paid, Undo paid): `canvas` fill, `outline` border, `graphite` text, hover and focus fill `mist`, disabled `rule` border and `slate` text. Both keep their label on one line.
- **Fields**: label medium weight in `body`; control with `outline` border, `control` radius, padding `2` by `3`. An invalid control gets a thicker `danger` border and a `danger` error line in `small` below it.
- **Alerts**: `danger` text, medium weight, on `danger-wash` with a thick `danger` left bar and `control` radius; the alert icon sits before the text (see Icons).
- **Sidebar links**: `body` size on `shell`, padding `2` by `3`, `control` radius. Other pages: regular weight in `shell-muted`. Current page (aria-current="page"): semibold `shell-text` on a `shell-raised` pill, so weight and shape mark it as well as colour. Hover and focus underline a link.
- **Tables**: the native table scrolls sideways inside its own focusable region, named by its caption (`small`, `slate`). Column headers are `small`, medium weight, `slate` on `canvas`; every header and cell has a `rule` bottom border, so a single 1 px line separates rows. Cells are `body`, padding `2` by `3`. Money is right-aligned with tabular figures. The Student column stays pinned at the left on `canvas` while the region scrolls.
- **Initials**: before each student's name (table Student cells and the student list), a `pill` circle of size `7` in `rule` with the initials in `micro`, semibold `graphite`, and spacing `3` to the name; from `sm` the name stays on one line. The initials are the first letter of the first and the last word of the name, uppercased. They are generated content with empty alternative text, so the name's text and accessible name stay exactly the student's name.
- **Students list**: the list is labelled by its heading "Your students", in `slate` (6.15:1 on `canvas`) like table header text, at the same size and level. The list drops its markers; each name is a row with its initials, padding `2`, and a `rule` divider, like table rows.
- **Payment status**: "✓ Paid" in `paid`, "Unpaid" in `unpaid`, both medium weight. The tick is generated content with empty alternative text, so the status reads "Paid" or "Unpaid". Unpaid is amber rather than `danger` so it is not mistaken for an error.
- **Month chip**: on /summary, "Previous month", the month heading and "Next month" form one group. The month sits in a `pill` chip with an `outline` border, padding `1` by `4`, in `heading` size; the buttons are secondary with `pill` radius and side padding `3`, `4` from `sm`. Below `md` the chip takes its own row and the two buttons share the next one.
- **Metrics panel**: on /summary, a box with a `rule` border, `panel` radius and padding `5`. It holds the totals list (Lessons, Collected, Pending: `slate` terms, semibold figures, `rule` dividers), a bar of height `2` and `pill` radius on a `rule` track with a `paid` segment and a `pending-bar` segment (hidden from assistive technology), the percentages as text in `slate`, and the average per lesson, semibold. From `xl` it sits to the right of the table at `panel` width with spacing `6` between; below `xl` it is full width between the month chip and the table.
- **Pending total**: the "Total pending" line on /pending is semibold `body` above the table.
- **Page actions**: links that only navigate, drawn as buttons, in the title row (Home's "Record lesson" and "Add student"). The main one uses the primary style (`black` fill and border, `canvas` text, hover and focus fill `shell-raised`), the other the secondary style (`canvas` fill, `outline` border, `graphite` text, hover and focus fill `mist`); both `control` radius, `body` size, medium weight, padding `2` by `4`, no underline. This extends the primary rule above: besides form submits, the main page action of a page is primary. They stay links (they navigate, they do not act), and their accessible names add where they lead, so they never share a name with a form's submit button.
- **Logged-out notice**: on Log in only, after a log out the server confirmed, "You have logged out." between the title and the form, in an always-present polite status region that is empty otherwise. Medium weight `graphite` (15.07:1) on `paid-wash` with a thick `paid` left bar, a `paid` border and `control` radius: shaped like an alert but green and without an icon, so it never reads as an error. No dismiss control; it is not focusable and stays while the teacher remains on the page.
- **Home**: the title row holds the page title, the lead line "Signed in as …" in `slate`, and the page actions. The month figures sit under the month heading in a box like the metrics panel: `rule` border, `panel` radius, padding `5`, as wide as its figures from `md`. Each figure shows its value (`heading` size, semibold, tabular figures, `graphite`) above its term (`body`, `slate`), spacing `1` between; two per row on phones with spacing `5`, one row from `md` with spacing `12` between figures, wrapping when text is enlarged. "No lessons in …" follows in `slate`. "Oldest unpaid lessons" shows the semibold total line, an alert when a mark fails, the table with "Mark as paid" and the link "View all pending payments"; "Latest lessons" shows the table with the payment status and "View all lessons". Both tables are the shared tables above. "Get started" is a numbered list of the two first steps in the same `rule` box with `panel` radius, padding `5` and `10` at the start for the numbers, no wider than `measure`; each step is a line of text and a text link.

## Icons

Lucide, through its React package `lucide-react` 1.76.0 (ISC licence, exact pin in `frontend/package.json`), bundled with the build: only the glyphs used reach the bundle, nothing is fetched from another origin. Icons are decorative (ADR-007): each sits immediately before visible text that already carries the meaning, is hidden from assistive technology (`aria-hidden`, not focusable, no title), and never changes an accessible name. There is no icon-only control. An icon is drawn in its control's text colour (`currentColor`), so it keeps the text's contrast in the normal, hover, focus and disabled states. While a button reads anything other than its label ("Saving…", "Adding…", "Recording…") it shows no icon.

| Name | Theme | Value | Use |
|---|---|---|---|
| `icon` | `--icon-size` | `1.2em` | Width of every icon, relative to the text beside it, so icons grow with enlarged text; the icon box is one line tall, so the glyph centres on the first line. Spacing `2` separates icon and text. |

## Icon map

Lucide names, per ADR-007 and the F08 spec. No other element shows an icon: not table cells, payment status, form fields, the month chip, "Try again", text links, headings or status messages.

| Element | Glyph |
|---|---|
| Home (sidebar link) | `house` |
| Lessons (sidebar link) | `music` |
| Students (sidebar link) | `users` |
| Monthly summary (sidebar link) | `chart-column` |
| Pending payments (sidebar link) | `clock` |
| Record lesson (Lessons submit, Home page action) | `calendar-plus` |
| Add student (Students submit, Home page action) | `user-plus` |
| Mark as paid (/summary, /pending, Home) | `check` |
| Undo paid (/summary) | `undo-2` |
| Log out | `log-out` |
| Alerts (every message of the shared alert) | `circle-alert` |

## Brand

An original logo mark next to the wordmark "Lesson Ledger", first in the sidebar and in the top bar of every app page, and, since ADR-008 (F09), in the brand panel and brand strip of Log in and Sign up. The mark is a ledger page on a rounded tile: three ruled lines, a note sitting on the middle line, and the note's flag drawn as a tick, so it reads as lessons recorded and paid. It imitates no existing brand. Colours: tile `canvas`, rules `outline`, note `graphite`, tick `paid`; on the dark `shell` the white tile carries the mark. The mark is decorative (hidden from assistive technology); the wordmark is plain text in `heading` size, semibold, `shell-text` (15.02:1 on `shell`), not a link or heading, so landmarks, the single `h1` and the Tab order are unchanged.

On Log in and Sign up (ADR-008) the same mark (`shared/ui/Brand` `LogoMark`) sits in the page's `header`: at size `12` in the brand panel, with the wordmark under it in `display` (40 px), semibold `shell-text` (15.02:1 on `shell`), and at size `8` in the brand strip, with the wordmark in `heading` beside it. Under the wordmark the value line "Lessons, payments and pending fees in one place" (no final period) in `shell-muted` (8.47:1 on `shell`), `heading` size in the panel and `body` in the strip, at most `measure` wide. The wordmark stays plain text, not a heading, link or Tab stop; "Lesson Ledger" appears once on each page.

The favicon `frontend/public/favicon.svg` draws the same shapes. It is the one asset with literal colour values, because a favicon cannot use theme classes; they equal the theme values of `canvas`, `outline`, `graphite` and `paid`. Neither file uses a `style` attribute, a script, a `data:` URI or a reference to another origin, so the CSP stays `default-src 'self'`.

## Illustrations

Small original inline SVG drawings, in the logo's line language (ruled ledger pages, notes, the tick), at size `20`, directly above the message they accompany. They are decorative: hidden from assistive technology, no title, never inside a table, and they never replace a message's text. Every shape is painted with a theme colour name (`canvas` pages, `outline` and `rule` lines, `graphite` or `slate` notes, `paid` ticks where something is paid).

- "Get started" on Home: an open ledger, the left page ruled with a first note, the right page still blank.
- Students, "You have no students yet…": two empty name rows with the initials circle.
- Lessons, "No lessons recorded yet.": a ledger page of empty ruled rows with a note in the margin.
- Monthly summary, "No lessons in {Month YYYY}.": a calendar page with no entries and one open note.
- Pending payments, "Nothing pending. Every lesson is paid.": a ledger page whose rows each end in a tick.

Home's in-section messages, "Add a student before recording a lesson.", loading and error states have none.

Brand panel of Log in and Sign up (ADR-008, F09; `shared/ui/BrandIllustration`), from `lg` only, at most `illustration` wide at the bottom of the panel: the value line drawn as a ledger. A month's `canvas` page with a `rule` header band lies on a second page in `shell-raised`; each of its four ruled rows holds a lesson's note (`graphite`) and an amount (`outline`), three rows end in a `paid` tick and the last in an open `pending-bar` ring (a pending fee), and a `paid` seal with a `canvas` tick sits on the page's corner. It is drawn for the dark `shell` ground, shares no shape with the mark or the five drawings above, and follows the same rules: original, inline, decorative, theme colour classes only, no `style`, `data:` URI, script or external reference. The brand strip below `lg` has no drawing.

## Motion

ADR-007 allows four motions, all in the shared styles (`frontend/src/shared/styles/app.css`) as utilities that components name: `motion-interaction`, `motion-grow`, `motion-fade` and `motion-highlight`. Durations and easings are theme tokens:

| Name | Theme | Value | Use |
|---|---|---|---|
| `interaction` | `--duration-interaction` | `180ms` | Hover and focus colour changes of buttons, page actions, sidebar links and text links |
| `grow` | `--duration-grow` | `600ms` | The paid segment of the metrics bar growing from the bar's start |
| `fade` | `--duration-fade` | `300ms` | Figure values fading in |
| `highlight` | `--duration-highlight` | `900ms` | The just-paid row fading from `paid-wash` to `canvas` |
| `entrance` | `--duration-entrance` | `700ms` | The signed-out brand panel's content rising into place from `lg` (ADR-008) |
| `standard` | `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Interaction and highlight |
| `decelerate` | `--ease-decelerate` | `cubic-bezier(0, 0, 0.2, 1)` | Grow, fade and entrance |

Rules (ADR-007):

- Transitions change colours only (text, background, border, underline colour). The focus ring is never transitioned, so it is complete in the first frame. Every `hover:` cue still has a `focus-visible:` twin.
- The bar grows and the figures fade (Home's four figures; the metrics panel's totals, percentages and average) when they appear after "Loading…" (page load, month change, Try again), not when a mark or undo changes them in place. Load motion animates opacity and transform only, so layout is final in the first frame, and text is in the accessibility tree at once.
- Highlight: only after "Mark as paid" succeeds on /summary, where the row stays; once per success, never after "Undo paid", a failed mark, or on /pending and Home, where the row leaves. One fade from `paid-wash` to the row's ground, one luminance change, no flash. At its strongest every text of the row keeps at least 4.5:1, the outlined button's border and the focus ring at least 3:1 (see Palette). The status word "Paid" stays the cue.
- Everything sits inside `prefers-reduced-motion: no-preference`: with reduced motion nothing transitions or animates and every final state shows at once (WCAG 2.3.3). Each animation runs once and lasts under a second; nothing loops (2.2.2) or flashes (2.3.1).
- CSS only: keyframes are defined once in the shared styles; no animation library, no JavaScript animation, no Tailwind motion classes in components, no literal durations. Any other motion needs a revision of ADR-007.
- The end-to-end suite runs with reduced motion; `frontend/e2e/f08-motion.spec.ts` alone checks the motion with and without it.

ADR-008 (F09) adds one motion to the list: the **entrance** of the signed-out brand panel. On each appearance of Log in or Sign up from `lg`, the panel's content (mark, wordmark, value line and drawing; not the `shell` ground) rises by spacing `4` and fades in once: keyframes `brand-enter` (opacity and transform only) through the `motion-entrance` utility, `entrance` duration with the `decelerate` easing. Moving between Log in and Sign up replays it, because each is a new page; a field error, a failed log in, the submitting state or the notice appearing do not. The form is never animated: its fields and buttons are final and usable from the first frame. The brand strip below `lg` does not move, and reduced motion turns the entrance off like everything else. Any other motion needs a revision of ADR-007 or ADR-008.

## Reference elements

From `context/design-reference.png`, per ADR-006.

| Element | Decision | WCAG 2.2 AA |
|---|---|---|
| Dark left sidebar with the main navigation and log out at the bottom | Adopted | 1.4.3: link text 8.47:1 and 15.02:1 on `shell`; 2.4.7 and 1.4.11: `focus` ring 5.09:1 on `shell`; 1.4.1: current page by weight and pill, not only colour; 1.4.10 and 2.4.11: a non-sticky top bar below 1024 px, links wrap, nothing covers focus |
| White main area with a large sans-serif page title | Adopted | 1.4.3: `graphite` on `canvas` 16.17:1; 1.4.4: sizes in rem, checked at 200% text; 2.4.6: one `h1` per page |
| Primary button solid black, secondary button outlined | Adopted | 1.4.3: `canvas` on `black` 21:1, `graphite` on `canvas` 16.17:1; 1.4.11: `outline` border 3.35:1; 2.5.8: at least 24×24 px; 2.4.7: `focus` ring 3.25:1 on `canvas` |
| Dense table with grey column headers and thin row dividers | Adopted | 1.3.1: native table with `th scope="col"` and a caption; 1.4.3: `slate` headers 6.15:1; 1.4.10: scrolls in its own focusable region with the Student column pinned |
| Student initials in a circle next to the name | Adopted | 1.1.1 and 1.3.1: decorative, empty alternative text, the name is the text; 1.4.3: `graphite` on `rule` 12.94:1 |
| Payment status as "✓ Paid" (green) or "Unpaid" (amber), always with the word | Adopted | 1.4.1: the word carries the state; 1.4.3: `paid` 5.01:1, `unpaid` 5.43:1 on `canvas` |
| Right-hand metrics panel with totals, a paid versus pending bar and the average per lesson | Adopted | 1.4.1: the bar is hidden from assistive technology and its figures are text; 1.3.1: totals stay a description list; 1.4.10: stacks above the table below 1280 px |
| Month selector as a chip, like the reference's filter chips | Adopted | 1.4.11: `outline` chip border 3.35:1; 2.4.3: DOM and focus order Previous, month, Next unchanged; 2.5.8: buttons at least 24×24 px |
| Search field | Left out | Not shown: new functionality (owner, ADR-006) |
| Extra filters (Type, Status, Order date, All filters) | Left out | Not shown: new functionality |
| Row checkboxes and bulk actions | Left out | Not shown: new functionality |
| Row detail popover | Left out | Not shown: new functionality |
| Import and Export buttons | Left out | Not shown: new functionality |
| Notifications with a badge | Left out | Not shown: new functionality |
| The reference's own navigation items (Inventory, Help and support, Settings) and its collapse toggle | Left out | Not shown: pages that do not exist; the sidebar never collapses, so no toggle is needed |
| Product logo | Adopted | Original mark and wordmark (ADR-007, see Brand), also on Log in and Sign up in the brand panel and strip (ADR-008). 1.1.1: the mark is decorative and hidden, the wordmark is text; 1.4.3: wordmark `shell-text` 15.02:1 on `shell`; 2.4.3: neither is a link or a Tab stop |
| Customer photos | Left out | Not shown: no photos or raster images (F08 out of scope) |
| Overview figures as a value above its label (Home, F07) | Adopted | 1.3.1: a description list, term then value in the DOM; the value is drawn above with layout only; 1.4.3: `graphite` 16.17:1, `slate` 6.15:1 on `canvas`; 1.4.10 and 1.4.4: wraps at 320 px and at 200% text |

## Screenshots

Taken from the production build of F06 at 375 and 1280 px wide, full page, with seed teacher `alice@example.com` on the app pages and the current month on `/summary`.

| Page | 375 px | 1280 px |
|---|---|---|
| `/login` | `design/f06-login-375.png` | `design/f06-login-1280.png` |
| `/signup` | `design/f06-signup-375.png` | `design/f06-signup-1280.png` |
| `/` | `design/f06-home-375.png` | `design/f06-home-1280.png` |
| `/lessons` | `design/f06-lessons-375.png` | `design/f06-lessons-1280.png` |
| `/students` | `design/f06-students-375.png` | `design/f06-students-1280.png` |
| `/summary` | `design/f06-summary-375.png` | `design/f06-summary-1280.png` |
| `/pending` | `design/f06-pending-375.png` | `design/f06-pending-1280.png` |

Home after F07, taken from the production build of F07 at 375 and 1280 px wide, full page, on the current month. They replace the F06 Home row above, which shows Home before the overview.

- `/` as `alice@example.com` (default state): `design/f07-home-alice-375.png` at 375 px, `design/f07-home-alice-1280.png` at 1280 px.
- `/` as `bob@example.com` (new teacher, "Get started"): `design/f07-home-bob-375.png` at 375 px, `design/f07-home-bob-1280.png` at 1280 px.

F08, taken from the production build of F08 with reduced motion (final states), at 375 and 1280 px wide, full page, on the current month. They show the icons, the logo and the illustrations, and replace the F06 and F07 files above as the current look.

- Log in (`/login`, signed out): `design/f08-login-375.png` at 375 px, `design/f08-login-1280.png` at 1280 px.
- Sign-up (`/signup`, signed out): `design/f08-signup-375.png` at 375 px, `design/f08-signup-1280.png` at 1280 px.
- Home (`/`, as `alice@example.com`): `design/f08-home-375.png` at 375 px, `design/f08-home-1280.png` at 1280 px.
- Lessons (`/lessons`, as `alice@example.com`): `design/f08-lessons-375.png` at 375 px, `design/f08-lessons-1280.png` at 1280 px.
- Students (`/students`, as `alice@example.com`): `design/f08-students-375.png` at 375 px, `design/f08-students-1280.png` at 1280 px.
- Monthly summary (`/summary`, as `alice@example.com`): `design/f08-summary-375.png` at 375 px, `design/f08-summary-1280.png` at 1280 px.
- Pending payments (`/pending`, as `alice@example.com`): `design/f08-pending-375.png` at 375 px, `design/f08-pending-1280.png` at 1280 px.
- Home (`/`, as `bob@example.com`): `design/f08-home-bob-375.png` at 375 px, `design/f08-home-bob-1280.png` at 1280 px.
- Students (`/students`, as `bob@example.com`): `design/f08-students-bob-375.png` at 375 px, `design/f08-students-bob-1280.png` at 1280 px.

F09, taken from the production build of F09 with reduced motion (final states), full page. They show the branded Log in and Sign up pages and replace the F08 Log in and Sign-up files above as the current look of those pages.

- Log in (`/login`, signed out, default state): `design/f09-login-375.png` at 375 px, `design/f09-login-1280.png` at 1280 px.
- Sign up (`/signup`, signed out, default state): `design/f09-signup-375.png` at 375 px, `design/f09-signup-1280.png` at 1280 px.
- Log in with the logged-out notice, after `alice@example.com` logs out: `design/f09-login-notice-1280.png` at 1280 px.
- Log in after submitting the empty form ("Enter your email." and "Enter your password."): `design/f09-login-errors-1280.png` at 1280 px.
