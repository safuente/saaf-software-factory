# Lesson Ledger

Lesson tracking and payments for private teachers. FastAPI + PostgreSQL backend, React (Vite + TypeScript) frontend, run locally with Docker Compose. Decisions are in [`docs/adr/`](docs/adr/).

## Versions

| Tool | Version | Pinned in |
|---|---|---|
| Python | 3.15.2 | `backend/.python-version`, `backend/pyproject.toml`, `backend/Dockerfile` |
| Node.js | 26.13.1 | `frontend/.nvmrc`, `frontend/package.json` (`engines`), `frontend/Dockerfile` |
| PostgreSQL | 18.7 | `docker-compose.yml` |

Host requirements: Docker with Compose v2, [uv](https://docs.astral.sh/uv/), Node.js and npm, GNU Make, `curl`.

## Setup

```sh
cp .env.example .env   # adjust ports if the defaults are taken
make install
make up
```

Open `APP_URL` (default http://localhost:3000). The API is at `API_URL` (default http://localhost:8000); `GET /health` returns `{"status": "ok"}` when the database is reachable, 503 otherwise. The frontend forwards every `/api/*` request to the backend, so the browser only talks to `APP_URL`.

## Configuration

Everything comes from `.env` (never committed; `.env.example` is the template):

| Variable | Purpose | Default |
|---|---|---|
| `COMPOSE_PROJECT_NAME` | Isolates containers, network and volume per worktree | `lesson-ledger` |
| `APP_PORT` | Host port of the backend | `8000` |
| `FRONTEND_PORT` | Host port of the frontend | `3000` |
| `DB_PORT` | Host port of PostgreSQL; tests connect through it | `5432` |
| `REDIS_PORT` | Reserved by the factory; unused (no Redis) | `6379` |
| `APP_URL` | Frontend origin, used by Playwright | `http://localhost:3000` |
| `API_URL` | Backend base URL, used by API tests and tooling | `http://localhost:8000` |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Local-only database credentials, injected at runtime | placeholders |
| `SESSION_COOKIE_SECURE` | Sets `Secure` on the `ll_session` cookie. Must be `true` whenever the app is served over HTTPS; `false` only for local HTTP | `false` |

Several worktrees can run side by side as long as their `.env` files differ in `COMPOSE_PROJECT_NAME` and the ports.

## Make targets

| Command | What it does |
|---|---|
| `make install` | Install backend (uv), frontend (npm) and Playwright Chromium from lock files. Idempotent. |
| `make up` | Build images and start `db`, `backend` and `frontend`; returns once all are healthy, or fails within 120 s naming the service that is not. Migrations run when the backend starts. |
| `make down` | Stop and remove this worktree's containers, network and volumes. |
| `make seed` | Load local review data. Idempotent. |
| `make lint` | Lint and format check (ruff, ESLint, Prettier), OpenAPI contract check and type check (mypy strict, `tsc --noEmit`). Needs no running stack. |
| `make test` | Backend and frontend tests with coverage. Needs `make up`. `make test T=<path or test id>` runs only those tests without coverage, e.g. `T=tests/test_health.py::test_ac2_health_returns_ok_when_database_reachable` (backend) or `T=frontend/src/app/App.test.tsx`. |
| `make e2e` | Playwright tests against `APP_URL`. Needs `make up`. `make e2e T=e2e/shell.spec.ts` runs one file. |
| `make check` | Local CI, stopping at the first failing stage: install, lint, typecheck, test, build (Docker images), scan (bandit, pip-audit, `npm audit`). Needs `make up` and network access for the scanners. |
| `make openapi` | Regenerate `backend/openapi.json` from the code and `frontend/src/shared/api/schema.d.ts` from it. |

Targets print one summary line per stage on success and only the failure details otherwise.

## API contract

The OpenAPI schema is generated from the backend code and committed as `backend/openapi.json`; the frontend API types in `frontend/src/shared/api/schema.d.ts` are generated from it. After any API change run `make openapi` and commit both files. `make lint` fails if either is out of date.

## Seed data

`make seed` (needs `make up`) creates these teacher accounts, or resets their passwords if they exist, and resets their students and lessons to exactly the state below. It is idempotent: running it again replaces anything added to these accounts since. The credentials and names are synthetic and valid only on a local stack.

| Email | Password | Data |
|---|---|---|
| `alice@example.com` | `alice-ledger-pass` | 6 students and 12 lessons, 4 in each of the current calendar month and the two previous ones (server date when the seed runs): current month 1 paid and 3 unpaid, previous month 2 paid and 2 unpaid (the $60.00 lesson on day 3 and the $1,250.00 one on day 10), two months back 4 unpaid; none three months back. Two lessons on the same date, prices with and without cents, one of $0.00 and one of $1,250.00 |
| `bob@example.com` | `bob-ledger-pass1` | no students and no lessons, so nothing pending |
| `carol@example.com` | `carol-ledger-pass` | 510 students and 520 lessons, all unpaid and in the current month (more than the 500 the pages show) |

Reaching the states of the F01 screens:

- Logged out (`/login`, `/signup`, redirect from any app page): open the app without a session, or log out.
- Logged in (`/`, redirect from `/login` and `/signup`): log in as any seed account.
- Sign-up duplicate email: sign up as `alice@example.com`.
- Login error: log in with a wrong password.
- Server unreachable (session check error, "Something went wrong", "Couldn't log out"): `docker compose stop backend`, then `docker compose start backend` to recover.

Reaching the states of the F02 screens (`/students`, `/lessons`):

- Default (lists of students and lessons, lesson form): log in as alice.
- Empty students list, and `/lessons` without students (form replaced by "Add a student before recording a lesson."): log in as bob.
- `/lessons` with students but no lessons ("No lessons recorded yet."): log in as bob and add one student.
- Field errors: submit the forms empty or with the invalid values of the spec (e.g. a name of 101 characters, duration `0`, price `$45`).
- Submit and list load failures ("We couldn't reach Lesson Ledger."): `docker compose stop backend`, then `docker compose start backend` to recover.
- Many items ("Showing the first 500 of 510 students.", "Showing the 500 most recent of 520 lessons."): log in as carol.
- No permission: open `/students` or `/lessons` without a session; you are sent to `/login`.

Reaching the states of the F03 screens (`/summary`, `/pending`):

- Default: log in as alice. `/summary` opens on the current month (paid and unpaid lessons); "Previous month" shows a month with 2 paid and 2 unpaid lessons. `/pending` lists her 9 unpaid lessons over three months, oldest first.
- Empty: as alice, go three months back on `/summary` ("No lessons in …", totals at $0.00); as bob, `/pending` shows "Nothing pending. Every lesson is paid." and every month of `/summary` is empty.
- Saving and success: "Mark as paid" on either page, "Undo paid" on `/summary`.
- Load and mark/undo failures ("We couldn't reach Lesson Ledger."): `docker compose stop backend`, then `docker compose start backend` to recover. "That lesson could not be found." appears if the lesson no longer exists for the teacher, e.g. after `make seed` runs while the page is open.
- Many items ("Showing the 500 oldest of 520 pending lessons." on `/pending`): log in as carol, whose 520 unpaid lessons all fall in the current month (`/summary` shows "Showing the 500 most recent of 520 lessons in …").
- No permission: open `/summary` or `/pending` without a session; you are sent to `/login`.

## Quality gate

There is no hosted CI (ADR-002). A change is ready when `make check` and `make e2e` pass locally. Coverage is reported in the `make test` summary; there is no minimum threshold yet, but new code must not lower it. The scan fails on any medium or higher bandit finding, any known vulnerability reported by pip-audit (it has no severity filter) any high or critical `npm audit` advisory in runtime dependencies and any critical one in dev dependencies. All published ports bind to `127.0.0.1` only, so the stack is not reachable from other hosts.

Environment-level acceptance checks of the project base (start, stop, two worktrees side by side, `make check` failing on injected faults) are in `scripts/acceptance-f00.sh`; they tear the stack down, so they are not part of `make check`.

## Layout

```
backend/    FastAPI app (app/core: config, db, errors, logging; app/<domain>), alembic/, tests/
frontend/   React SPA (src/app, src/features/<feature>, src/shared), e2e/, nginx/ (static server + /api proxy)
docs/adr/   Architecture decisions
scripts/    Implementation of the make targets
```

Backend logs are JSON lines on stdout, one per request, with `request_id`, method, path, status code and duration. A valid `X-Request-ID` request header (1 to 64 characters of `A-Z a-z 0-9 . _ -`) is reused, otherwise one is generated; it is returned in the `X-Request-ID` response header.
