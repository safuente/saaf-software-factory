---
id: F01
project: PRJ-900
status: approved
version: 1
touches_frontend: true
adrs: []
---

# Lessons and payments

## Summary
The teacher logs in, sees a monthly summary with lessons given, money collected and money pending, records new lessons, and marks pending lessons as paid.

## Acceptance criteria
- **AC-1**: Given a logged-in teacher, when they open Summary, then they see the number of lessons this month, the total collected and the total pending, and a table of lessons with their payment status.
- **AC-2**: Given a logged-in teacher, when they submit Record lesson with student, date, duration and price, then the lesson appears in Summary as Pending and the pending total increases by its price.
- **AC-3**: Given unpaid lessons, when the teacher opens Pending payments, then each unpaid lesson is listed with a Mark as paid button.
- **AC-4**: Given a pending lesson, when the teacher clicks Mark as paid, then it disappears from Pending payments and the collected total increases by its price.
