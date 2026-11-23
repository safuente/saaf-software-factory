---
id: F02
project: PRJ-001
type: feature
priority: high
milestone: v1
depends_on: [F01]
touches_frontend: true
adrs: [ADR-001, ADR-002, ADR-003, ADR-004]
---

## Problem
Teachers track their students and the lessons they give in notebooks or spreadsheets, which are tedious to keep up to date and easy to lose track of (`context/research.md`). They cannot yet record either in the app.

## Affected user
Teacher, logged in, adding a new student when they start teaching them, and recording a lesson right after giving it or later the same week.

## Expected result
- The teacher can add a student by name and sees the list of their students sorted by name; with no students yet, the list shows an empty state that invites them to add one.
- The teacher can record a lesson by choosing one of their students and entering the date, the duration in minutes and the price in US dollars; invalid input (missing student, non-positive duration, negative or malformed price, invalid date) shows a clear error on the field.
- A newly recorded lesson is unpaid and appears in the teacher's list of lessons, newest date first, showing student name, date, duration, price formatted in USD and payment status.
- Recording a lesson when the teacher has no students explains that a student must be added first and links to adding one.
- A teacher never sees, and cannot record lessons for, another teacher's students; API requests that reference another teacher's student or lesson get 404.
- `make seed` gives one teacher several students and lessons across several months, and leaves another teacher with no students, so empty and populated states can be reviewed.

## Out of scope
- Editing or deleting students or lessons (`questions.md` Q3).
- Student contact details or any field other than name (`questions.md` A6).
- Per-student default prices, recurring lessons, scheduling, calendar sync.
- Monthly totals, pending payments and marking lessons as paid (F03).
- Pagination in the UI (`questions.md` A10).

## Constraints
- Data model, ownership and money representation from ADR-003. Prices are USD only.
- Student names are the only personal data; they must not be logged.
- WCAG 2.1 AA for forms and lists.
- APIs follow the pagination and error formats of `policies/conventions.md` §4.

## Context
- `brief.md` Main features: "Students: add and list"; "Record a lesson (student, date, duration, price); new lessons start unpaid".
- `questions.md` Q3, A5, A6, A7, A10, A12.
- `context/research.md`: target users have 5-30 students.
- ADR-003, ADR-004.
