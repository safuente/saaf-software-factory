---
feature: F05
project: PRJ-001
reviewer: ui
round: 4
verdict: pass
blocking: 0
suggestions: 1
reviewed: feature/F05-restyle-remaining-pages @ 738b029bdd3f7fbb5d3028c0208dfc522994339b
---

# UI review: F05 Restyle the remaining pages

## Round 4

Reviewed `3d76aee..738b029`: `app.css` (`[role="region"][tabindex] { @apply scroll-mb-2 }`, the earlier region exclusion comment dropped), an e2e line and a new unit test.

### Previous findings
| Id | Status | Note |
|---|---|---|
| UI-1 | dispute accepted | Owner accepted as is. Still a suggestion. |
| UI-2 | resolved | Tab walk (`scratchpad/ui/f5.cjs`) at 320x568, 667x375 and 375x667 on Summary, Pending, Lessons and Students: no control or ring clipped, no pinned-column overlap. |
| UI-3 | resolved | Focusing the Summary region (397 px tall) now leaves its bottom ring in view: 375x667 gives `bottom 658, vh 667`, 320x568 gives `bottom 514, vh 568` (`ringBelow: true`, script `scratchpad/ui/f8.cjs`). It was `bottom 667` in round 3. |

### Checks
- AC-6 g not regressed. At 667x375 a focused region taller than the viewport still fills it: `/pending` `top 0, height 768, fills: true`; `/lessons` and `/summary` also fill the viewport. Same at 320x568 and 375x667 on `/pending` and `/lessons`. Only the bottom margin is added, so the top edge aligns as before.
- The rule uses the theme utility `scroll-mb-2`, inside `@layer base`: no hex, pixel or arbitrary value (AC-2). No horizontal page scroll in any run.
- Two tall-region rows show a ring-less top or bottom (negative `top`) by design: the region is taller than the viewport and the ring stays visible on the visible sides. Same as round 3, not a finding.

### Findings
UI-1 remains open as a suggestion, accepted by the owner. No new findings.

### Summary
UI-3 is resolved and AC-6 g holds at 667x375. No blocking findings; one suggestion open (UI-1, accepted by the owner).

## Round 3

Reviewed `f1eaf0c..3d76aee` (UI-2 fix, `table-room`, caption and scroll margins, `useWholeColumns`).

### Previous findings
- **UI-1**: dispute accepted by the owner, left as is. Still a suggestion.
- **UI-2**: resolved for controls. `@apply scroll-m-2` on links, buttons, inputs, selects, textareas and tabindex elements uses a theme spacing value. A Tab walk at 320x568, 667x375 and 375x667 on Summary, Pending, Lessons and Students shows every button and link with the whole 3 px ring plus its 2 px gap inside the viewport (script `scratchpad/ui/f5.cjs`). One residue on the table region itself, see UI-3.

### Checks on the new CSS
- `table-room` is a `@utility` in `shared/styles/app.css` with `padding-inline-end: var(--container-form)`: a theme variable, no hex, no pixel value, no arbitrary value (AC-2). `scroll-m-2` is a theme spacing utility inside `@layer base`. The caption `sticky left-0` span is a framework utility. No new hand-written style outside `app.css`.
- Pinned Student column after the table settles (500 ms after Tab) at 320 and 375 on `/summary`: the focused "Mark as paid" and "Undo paid" buttons start right of the pinned column (button left 118 and 200 against pinned right edge 104), so neither the button nor its ring is covered. A 6 px overlap shows if you measure immediately after Tab, before the region settles; it is transient.
- Multi-device: no horizontal page scroll and no sticky overlap of a focused control at the three widths tested.

### Findings

#### UI-1: Pinned Student bar line shows on wide screens where nothing scrolls
- **Severity**: suggestion
- **Status**: accepted by the owner as is
- **Category**: consistency
- **Location**: `frontend/src/shared/ui/Table.tsx` (`PINNED`)
- **Criterion**: none
- **Problem**: the bar line is drawn at every width, although `docs/design.md` describes it as a narrow-screen device.
- **Suggestion**: say in the doc that the rule is always present, or draw it only while the region overflows.

#### UI-2: Focus ring clipped when Chrome scrolls a control flush to the viewport edge
- **Severity**: suggestion
- **Status**: resolved
- **Category**: a11y-keyboard
- **Location**: `/pending` "Mark as paid" at 320x568; `/summary` month buttons at 667x375
- **Criterion**: AC-6 a, g
- **Evidence**: after the fix, the Tab walk reports `ring: true` for every control at 320x568, 667x375 and 375x667.

#### UI-3: Table region focus ring clipped at the bottom when the region is shorter than the viewport
- **Severity**: suggestion
- **Category**: a11y-keyboard
- **Location**: `/summary` at 375x667, focusing the table region
- **Criterion**: AC-6 g
- **Problem**: the CSS comment excludes `[role="region"]` from `scroll-m-2` so that a region taller than the viewport fills it. At 375x667 the Summary region is 397 px tall, shorter than the viewport, yet it is also excluded. Chrome scrolls its bottom edge to the viewport bottom (`top 270, bottom 667, viewport 667`, page scrollY 279 of 333), so the ring is cut on the bottom side. The ring stays visible on the other three sides and the region is fully in view, so I do not call it a failure. The same walk at 320x568 gives `ringBelow: true`.
- **Suggestion**: apply `scroll-m-2` to regions too. For a region taller than the viewport, scroll-margin still lets it fill the axis, since the margin only shrinks the snap area by 8 px. Check AC-6 g again if you do.

### Summary
UI-2 is fixed for every control. The new CSS follows the theme rules (AC-2) and the pinned column does not cover a focused control once the table settles. No blocking findings; three suggestions, UI-1 accepted and UI-3 new and minor.
