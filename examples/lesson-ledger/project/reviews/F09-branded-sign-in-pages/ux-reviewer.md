---
feature: F09
project: PRJ-001
reviewer: ux
round: 1
verdict: pass
blocking: 0
suggestions: 0
reviewed: feature/F09-branded-sign-in-pages @ cec9bc3b5a028f5af3a2dbdc4689f45cfef39f4b
---

# UX review: F09 Branded sign-in pages

## Round 1

### Findings
None.

### Summary
Walked `/login` and `/signup` as a signed-out teacher at 1280, 375, 320 and 667x375 (reduced motion and no-preference), plus the log-out flows as alice. Every state in the spec's UI section was reached and behaves as specified; screenshots are in `/private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/ux/` (`login-1280.png`, `login-notice-1280.png`, `login-empty-1280.png`, `login-formerror-1280.png`, `login-submitting-1280.png`, `signup-1280.png`, `signup-errors-1280.png`, `signup-dup-1280.png`, `login-667.png`, `logout-fail-1280.png`, 375/320 variants).

Checked:
- **Notice**: "You have logged out." appears after a 204 log out, in a status region between h1 and form, focus on the h1. It persists after an empty-submit field error. It is absent after reload, after a 401 log out, and after Back then Forward to `/login`.
- **Log out failure** (DELETE aborted): the user stays on the app page with "Couldn't log out. Please try again." and no notice text exists.
- **Form states**: field errors, "Email or password is incorrect.", submitting and the F01 focus on the first invalid field are unchanged. Slow login and network failure leave the form usable.
- **Layout**: the strip at narrow widths has no illustration; the split layout from 1024 px keeps the form in one obvious column.
