---
feature: F01
project: PRJ-001
reviewer: ux
round: 1
verdict: pass
blocking: 0
suggestions: 3
reviewed: feature/F01-teacher-accounts @ 23a6634c8c6a05d14fd2b5950f7bd9890b8c3800
---

# UX review: F01 Teacher accounts

## Round 1

### Findings

#### UX-1: Focus is lost after a failed login
- **Severity**: suggestion
- **Category**: keyboard-flow
- **Location**: `/login` / error (`frontend/src/features/auth/LoginPage.tsx`)
- **Criterion**: none
- **Problem**: The submit button is disabled while the request is in flight, so focus falls to `body`. After the "incorrect" error the keyboard user has to tab from the top. The password field was emptied and is the natural place to retry.
- **Evidence**: Playwright run, `document.activeElement` after a wrong-password submit was `BODY`. Screenshot: `/private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/ux/login-wrong.png`. The `role="alert"` is announced, so this is not blocking.
- **Suggestion**: Focus the Password field on `invalid_credentials`.

#### UX-2: Duplicate-email error offers no way to log in
- **Severity**: suggestion
- **Category**: error-recovery
- **Location**: `/signup` / duplicate email
- **Criterion**: AC-1
- **Problem**: "An account with this email already exists." is exact per spec, but the user who forgot they had an account gets no hint to log in. The "Already have an account? Log in" link is further down the form.
- **Evidence**: `/private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/ux/signup-dup.png`
- **Suggestion**: Consider an inline "Log in" link next to the message. Needs a spec change because the message text is fixed.

#### UX-3: Field errors persist after the user edits the field
- **Severity**: suggestion
- **Category**: forms
- **Location**: `/login`, `/signup` / field errors (`useFieldErrors.ts`)
- **Criterion**: none
- **Problem**: Errors are cleared only on the next submit, so a corrected field keeps showing a stale error and `aria-invalid` until the user submits again.
- **Evidence**: `useFieldErrors` has no clear-on-change path; `TextField` `onChange` only updates the value.
- **Suggestion**: Clear a field's error when its value changes, or validate on blur after the first submit.

### Summary
The flow is complete and I confirmed each state in the running app as alice (login, wrong password, slow login, home, session-check error with retry, logout failure, logout, signup validation, duplicate, 5xx). Each state has the spec's wording, keeps the email, and none are blank or technical. Three non-blocking suggestions; `make seed` covers every state, and the error states were forced with network interception. Screenshots are in `/private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/ux/`.
