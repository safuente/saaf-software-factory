---
id: F01
project: PRJ-001
type: feature
priority: high
milestone: v1
depends_on: [F00]
touches_frontend: true
adrs: [ADR-001, ADR-002, ADR-003, ADR-004]
---

## Problem
A teacher cannot have a private space in the app. Without an account, there is no way to keep one teacher's students and lessons separate from another's, which every later feature requires.

## Affected user
Teacher, the first time they open the app (sign up) and every time they come back (log in, log out), on a desktop or laptop browser.

## Expected result
- A visitor can sign up with an email and a password and lands in the app already logged in; signing up with an email that is already registered (in any letter case) shows a clear error.
- A registered teacher can log in with email and password; wrong credentials show one generic error that does not reveal whether the email exists.
- A logged-in teacher sees an authenticated home page with their email and a way to log out; after logging out, going back to any app page sends them to the login page.
- A visitor who is not logged in and opens any app page is sent to the login page; the API rejects unauthenticated requests to protected data with 401.
- The session survives a page reload and expires after the period set in ADR-004.
- `make seed` creates at least two teacher accounts with known credentials, listed in the README.

## Out of scope
- Password reset, email verification, changing email or password, deleting the account (`questions.md` A4).
- Social login or SSO.
- Login rate limiting (recorded as a plan risk).
- Students and lessons.

## Constraints
- Session model, password hashing and cookie rules from ADR-004; no auth data in browser storage.
- Passwords and emails never appear in logs.
- Forms meet WCAG 2.1 AA (`questions.md` A11): labelled fields, errors announced and associated with their field, keyboard operable.
- Minimum password length and email format rules are set in the spec; they must be shown to the user before submission fails.

## Context
- `brief.md` Main features: "Teacher account: sign up, log in, log out"; Security: own accounts.
- `questions.md` A4, A5, A11, A12.
- ADR-003 (Teacher entity), ADR-004.
