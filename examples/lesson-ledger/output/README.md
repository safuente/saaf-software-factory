# Lesson Ledger

Example app for the software factory. Static single page; data is kept in the browser's localStorage.

## Run

```bash
python3 -m http.server 8791
```

Open http://localhost:8791

## Seed users

| Role | Email | Password |
|---|---|---|
| Teacher (main user) | teacher@example.com | demo1234 |

Any email and password are accepted; the seed user is the one used in demos.

Seed data: 4 students, 5 lessons in November 2026, 2 of them unpaid. Reset by clearing localStorage.
