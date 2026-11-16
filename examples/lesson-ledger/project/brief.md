---
id: PRJ-900
name: lesson-ledger
repo: workspaces/lesson-ledger
client: internal
owner: factory (example project)
---

## Vision
A simple tool for independent music teachers to record the lessons they give and see at a glance who still owes them money, replacing notebooks and spreadsheets.

## Users and roles
- **Teacher**: gives private lessons to 5-30 students, records each lesson, tracks payments.

## Main features
- Monthly summary of lessons given, money collected and money pending
- Record a lesson (student, date, duration, price)
- List of pending payments and mark a lesson as paid

## Out of scope
- Invoices, online payments, student accounts, calendar sync, mobile app

## Non-functional requirements
Factory defaults. Interface in English (US), prices in USD.

## Security and compliance
- **Authentication**: own accounts with email and password
- **Sensitive data**: none beyond student names; synthetic data only

## Integrations
None.

## Constraints
Example project. Runs locally only.

## Milestones
- **v1**: the three main features.
