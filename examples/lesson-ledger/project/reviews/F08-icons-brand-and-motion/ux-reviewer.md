---
feature: F08
project: PRJ-001
reviewer: ux
round: 1
verdict: pass
blocking: 0
suggestions: 0
reviewed: feature/F08-icons-brand-and-motion @ 7bac4f31a5d3771c81e5e7ae3cb5d77d024ea697
---

# UX review: F08 Icons, brand and motion

## Round 1

### Findings

None.

### Summary
Walked the running app as alice, bob, and own `ux-` teachers, with `reduce` and `no-preference`, at 1280 and 375 px. Evidence in `/private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/ux/` (`*-bob-home|pending|lessons.png`, `*-alice-empty-month.png`, `*-own-saving.png`, `*-own-marketror.png`, `login-error.png`, `m375-home.png`).

- Task flow unchanged: mark as paid shows "Saving…" without an icon, then "Marked as paid. Collected: ..." status, focus lands on "Undo paid"; a forced network failure shows the alert with icon and the same copy as before, with the row left unchanged and retry possible.
- Illustrations: Home "Get started", Lessons, Pending and the empty month (alice, 2000-01) show one illustration above unchanged text; "Add a student before recording a lesson." has none.
- Brand: logo and wordmark at the top of the sidebar and of the narrow top bar; `/login` shows no logo; alert icon appears on the login error.
- Motion: under `no-preference`, marking a lesson on `/summary` runs `paid-highlight` (900 ms, 1 iteration, on the row cells); under `reduce` no animations are active. Status word, announcement and focus are immediate in both modes.
- Not exercised: hover/focus transition timings, bar grow and figure fade measurements (covered by the F08 motion e2e), keyboard-only pass.
