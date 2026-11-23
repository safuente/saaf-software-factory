---
id: PRJ-001
name: lesson-ledger
repo: workspaces/lesson-ledger
client: internal
owner: Santiago Alvarez
---

## Vision
A simple web app for independent music teachers to record the lessons they give and see at a glance who still owes them money, replacing notebooks and spreadsheets. This is the factory's pilot project: its purpose is to run the full pipeline end to end and find what breaks.

## Users and roles
- **Teacher**: gives private lessons to 5-30 students. Records each lesson, sees the month's totals, and marks lessons as paid. Each teacher sees only their own students and lessons.

## Main features
- Teacher account: sign up, log in, log out
- Students: add and list the teacher's students
- Record a lesson (student, date, duration, price); new lessons start unpaid
- Monthly summary: lessons given, money collected, money pending, list of lessons with payment status
- Pending payments list, and mark a lesson as paid

## Out of scope
- Invoices, receipts or tax documents
- Online payments or payment reminders by email
- Student or parent accounts
- Calendar sync, recurring lessons, scheduling
- Mobile apps
- Multiple currencies (USD only)

## Non-functional requirements
Factory defaults. Interface in English (US), prices in USD.

## Security and compliance
- **Authentication**: own accounts with email and password
- **Sensitive data**: student names only; synthetic data in every environment
- **Regulations**: none

## Integrations
None.

## Constraints
- Pilot of the factory: keep v1 small. **At most 4 features including F00.**
- Stack: FastAPI backend and React frontend, so the UX and UI reviewers and the Playwright tests are exercised.
- Runs locally only. No deployment in v1.

## Milestones
- **v1**: account, students, lessons, monthly summary, pending payments.
- **v2**: none planned.
