# ADR-002: Local-only environment and CI

- Status: proposed
- Date: 2026-11-16

## Context
The brief (Constraints) says the app runs locally only, with no deployment in v1. `questions.md` Q1 answered "local only": `make check` and `make e2e` are the gate, no hosted CI configuration. `questions.md` A2 defines "deployable" for F00 as the full stack starting with `make up` and passing `GET /health`. `policies/conventions.md` §2 "Local environment" requires several worktrees to run side by side, configured only through `.env`.

## Decision
- **Services** in `docker-compose.yml`, one image per deployable service:
  - `db`: PostgreSQL, host port `${DB_PORT:-5432}`.
  - `backend`: FastAPI app, host port `${APP_PORT:-8000}`, runs pending migrations on start, healthy when `GET /health` returns 200.
  - `frontend`: production build of the SPA served by a small static web server, host port `${FRONTEND_PORT:-3000}`. It also proxies `/api` to the backend service, so the browser talks to a single origin.
  - No `container_name`, no hardcoded host ports, every service has a healthcheck so `make up` (`docker compose up -d --wait`) returns only when all are healthy.
- **URLs**: `APP_URL` is the URL a teacher opens in the browser (the frontend origin); Playwright runs against it. `API_URL` is the backend's base URL, used by backend API tests and by tooling. Both are read from `.env`, never assumed.
- **Gate**: the Makefile targets of conventions §2 are the CI. `make check` runs, in order and with quiet output:
  1. Install from lock files (`uv.lock`, `package-lock.json`).
  2. Lint and format check: ruff, ESLint, Prettier.
  3. Type check: mypy (strict), `tsc --noEmit`.
  4. Backend and frontend tests with coverage (backend tests against the worktree's own database via `DB_PORT`).
  5. Build: every Docker image builds.
  6. Security scan: bandit (Python SAST), pip-audit and `npm audit` (dependency vulnerabilities, failing on critical).
  `make e2e` runs stage 7, Playwright against `APP_URL`.
- **No hosted CI** and no remote environment in v1. No pipeline file for a CI platform is committed.
- **Seed**: `make seed` loads synthetic data only (`brief.md` Security; `questions.md` A12), with at least two teachers whose credentials are listed in the repository `README.md`. Each feature extends the seed to reach the states its spec describes.

## Alternatives considered
- Hosted CI (e.g. GitHub Actions): rejected by the answer to Q1; adds a remote dependency the brief excludes.
- Vite dev server in compose: faster feedback for humans, but e2e tests would run against a non-production build; the static build with a proxy matches what a real deployment would serve.
- Browser calling the backend directly on `API_URL`: needs CORS with credentials across ports; the same-origin proxy avoids it (see ADR-004).

## Consequences
- Every feature's PR must pass `make check` and, if it touches the frontend, `make e2e`, locally. Nothing else enforces it, so the factory's gate is the only gate.
- The dependency scanners need network access to vulnerability databases; no account or paid service is required.
- Adding a deployment later means a new ADR for hosting and a hosted CI; the images and env-only configuration are designed not to block that.
