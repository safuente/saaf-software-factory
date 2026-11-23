# Lesson Ledger: notes for agents

Stack (docs/adr/001): FastAPI + SQLAlchemy 2 (sync) + Alembic on Python 3.15.2 with uv; React + Vite + TypeScript (strict) on Node.js 26.13.1; PostgreSQL 18.7. Local only, Docker Compose (docs/adr/002).

## Commands

Use only the `make` targets; they read `.env` and keep output quiet.

- `make install`: dependencies from lock files.
- `make up` / `make down`: start (waits for healthy) / remove containers and volumes of this worktree.
- `make seed`: idempotent local data.
- `make lint`: ruff, ESLint, Prettier, OpenAPI contract check, mypy strict, `tsc --noEmit`. No stack needed.
- `make test`: all tests with coverage (needs `make up`). `make test T=tests/test_x.py::test_y` for backend, `make test T=frontend/src/...test.tsx` for frontend.
- `make e2e`: Playwright against `APP_URL` (needs `make up`). `make e2e T=e2e/<file>.spec.ts`.
- `make check`: install, lint, typecheck, test, build, scan. Must pass before handing off, together with `make e2e`.
- `make openapi`: regenerate the API contract (see below).

Add dependencies only with `uv add` (in `backend/`) or `npm install` (in `frontend/`), and commit the lock file.

## Ports and URLs

Every host port, URL and credential comes from `.env` only (`APP_PORT`, `FRONTEND_PORT`, `DB_PORT`, `APP_URL`, `API_URL`, `POSTGRES_*`). Never hardcode them or assume defaults; never edit the factory variables in `.env`. `APP_URL` is the frontend origin (Playwright); `API_URL` is the backend (API tests). Host-side code reaches PostgreSQL on `localhost:$DB_PORT`; containers use `DATABASE_HOST=db`.

## Layout

```
backend/
  app/main.py            create_app(): error handlers, request-id middleware, routers
  app/core/              config (env only), db engine, errors (conventions §4 body), logging (JSON), request_context
  app/<domain>/          router, schemas, models, service, repository (e.g. app/health/)
  alembic/versions/      migrations, applied at backend start; every migration must downgrade cleanly
  tests/                 pytest; tests/stack/ hits the running stack at API_URL/APP_URL
frontend/
  src/app/               shell (App)
  src/features/<feature>/ components, hooks, tests of one feature
  src/shared/            reusable UI, styles, API client; src/shared/api/schema.d.ts is generated
  e2e/                   Playwright specs
  nginx/default.conf     static server, SPA fallback, /api proxy, security headers
```

## API contract rule

`backend/openapi.json` is generated from the backend code and `frontend/src/shared/api/schema.d.ts` from that file. Whenever an endpoint or schema changes, run `make openapi` and commit both files in the same change; `make lint` fails otherwise. Never edit either file by hand.

## Conventions

- Error responses: `{"error": {"code", "message", "details"}}` via `app.core.errors` (`AppError`); never expose exception text.
- Name tests after the acceptance criterion they cover, e.g. `test_ac3_...`.
- Backend tests use the real PostgreSQL of this worktree; mock only external systems. `tests/conftest.py` upgrades the schema to head before the run; the `accounts` fixture (`tests/accounts_support.py`) creates unique teachers and removes them afterwards.
- Authentication (ADR-004, F01, F02): default-deny. The app-wide dependency `authenticate_unless_public` (`app.accounts.auth`) answers 401 `not_authenticated` for every route not on `PUBLIC_ROUTES` (`GET /health`, `GET /api/health`, `POST /api/teachers`, `POST /api/sessions`); `tests/test_isolation.py` checks every registered route. Endpoints that need the teacher take a `CurrentSession` parameter. Scope every query by `session.teacher_id`; another teacher's record is 404 `not_found`, identical to a nonexistent one (ADR-003).
- Request bodies must be JSON: an app-wide dependency (`app.core.http.require_json_body`) answers 415 to POST/PUT/PATCH with another content type.
- Never log emails, passwords, student names or database driver messages; database errors are logged as class + SQLSTATE only (`app.core.errors`).
- Frontend: server state through TanStack Query; the session lives only in the `["session"]` query (`features/auth/session.ts`), never in browser storage. App pages go inside `RequireSession`; any 401 `not_authenticated` sends the teacher to `/login`. Pages use `shared/ui/Page` (title, `main`, one `h1`; `nav` puts the page in the dashboard shell: a `header` that is a dark sidebar from 1024 px and a top bar below, with the "Main" navigation and "Log out") and the shared components in `shared/ui/` (`Button`, `TextField`, `SelectField`, `Table`, `Alert`, `StatusMessage`, `LoadError`, `Form`/`Note`/`TextLink`, `Section`, `Totals`, `PaymentStatus`, `StudentName`). `Page` also takes `lead` (a line under the h1) and `actions` (page actions, `shared/ui/ActionLink`: links drawn as primary or secondary buttons, right of the h1 from `lg`); only Home uses them (F07). Log out (F01 behaviour) is provided to `Page` through `ShellContext` (`shared/ui/shell.ts`) by `LogOutProvider`, which `RequireSession` wraps around every app page.
- Styling (ADR-005, ADR-006, F06): Tailwind CSS 4 via `@tailwindcss/vite`; the theme in `shared/styles/app.css` implements `docs/design.md` (the owner's dashboard direction) and clears Tailwind's default names, so classes can use only the design's names (`bg-canvas`, `text-graphite`, `bg-shell`, `p-4`, `max-w-content`...). No literal colours, pixel sizes, arbitrary values (`[...]`) or `style` attributes; every `hover:` cue needs a `focus-visible:` twin; motion only as ADR-007 allows (below). Root font size is the browser default (16 px); `docs/design.md` "Rendered sizes" must match what renders (`e2e/f06-identity.spec.ts`). One font, Inter (OFL), self-hosted in `shared/styles/fonts/inter/`. `app.css` is the only stylesheet; its custom utilities (`initials`, `check-mark`, `table-room`, `icon` and the `motion-*` ones) cover what Tailwind cannot express. Write class names whole: Tailwind does not find a class glued to a template expression (`foo${bar}`). Buttons: `primary` (black) submits a form, `secondary` (white, outlined) for everything else, `pill` for the month chip. Student names render through `StudentName` (initials as generated content, so the text stays the name); the payment status tick is generated content too. Patterns are described in `docs/design.md` "Components". `src/shared/styles/theme.test.ts`, `designDoc.test.ts` and `shared/ui/composition.test.ts` enforce these rules; the design-doc parser lives in `src/test/designDoc.ts` (test support only). Changing the look needs the owner's approval of screenshots (ADR-006).
- Icons, brand and motion (ADR-007, F08; `docs/design.md` Icons, Icon map, Brand, Illustrations, Motion): icons are Lucide glyphs from `lucide-react` (exact pin, ISC), placed only through `shared/ui/Icon` (`icon` prop of `Button` and `ActionLink`, `MainNav`, `Alert`), decorative (`aria-hidden`, never focusable, never part of a name) and always before visible text; no icon-only controls, and no icon while a button reads "Saving…" or similar. The logo mark and wordmark are `shared/ui/Brand` in the app shell and, since ADR-008 (F09), in the brand panel/strip of Log in and Sign up (`LogoMark` is the mark alone); `public/favicon.svg` draws the same mark with the theme's colour values. Illustrations are `shared/ui/Illustration`, above "Get started" and the four list empty states, plus `shared/ui/BrandIllustration` in the signed-out brand panel from `lg` (ADR-008); nowhere else. SVGs use presentation attributes and theme classes only: no `style`, `data:` URIs, scripts or external references (CSP `default-src 'self'`). Motion: durations (`--duration-*`) and easings (`--ease-*`) are theme tokens; keyframes and the utilities `motion-interaction` (colour transitions of buttons and links, never the focus ring), `motion-grow` (metrics bar), `motion-fade` (figure values) and `motion-highlight` (a row just marked as paid on /summary) and, per ADR-008, `motion-entrance` (the signed-out brand panel's content entering once from `lg`; never the form, never the narrow strip) live once in `app.css`, inside `@media (prefers-reduced-motion: no-preference)`, so reduced motion turns everything off. Components use only these utilities: no Tailwind `transition`/`duration-`/`ease-`/`animate-` classes, no animation library, no JavaScript animation; each animation runs once, under a second. Any other motion needs a revision of ADR-007 or ADR-008. Playwright runs with `reducedMotion: "reduce"`; only `e2e/f08-motion.spec.ts` overrides it. `src/shared/styles/motion.test.ts` enforces these rules.
- Signed-out pages (F09, ADR-008): `/login` and `/signup` use `shared/ui/SignedOutPage` (not `Page`): a `header` brand panel (mark, `display` wordmark, value line, drawing) left of a white card from `lg`, a brand strip above the form below it; nothing in the header is focusable and the wordmark is not a heading. Log in shows "You have logged out." in its always-present status region only after a log out answered 204: `LogOutProvider` calls `rememberLoggedOut()` and `LoginPage` takes it once (`features/auth/loggedOut.ts`, memory only; never a cookie, URL part or browser storage). `Page` without `nav` (the session check's Loading/error states) stays unbranded.
- Forms (F02 pattern): `shared/ui/useFormErrors` (focus first invalid field, clear a field's error when it changes, map a 422's `details.errors` to fields), `useSubmitFocus` (focus the re-enabled submit button after a form-level error), `StatusMessage` (always-rendered `role="status"`) and `LoadError` ("Try again"). Lists request `?page=1&page_size=500` (`shared/api/lists.ts`); after a successful submit, invalidate the list query without awaiting it. Money and dates are formatted by `shared/format.ts`.
- Payments (F03, `features/payments`): `PaidButton` owns one row's mark/undo request ("Saving…", re-focus after it settles, 404 / unreachable alert text); it cancels in-flight list and total reads when a request starts and when it succeeds, passes `onSaved` the lesson as clicked (pages move totals by the request's own change, announce in a `StatusMessage`), and runs `invalidatePayments` (lessons, summaries, pending list) once the last pending mark/undo settles. Month lists live under the `["lessons"]` key, so invalidating lessons refreshes them too. Month strings `YYYY-MM` (2000-01 to 2099-12) use `features/payments/month.ts` and `MONTH_PATTERN` (`app.lessons.rules`) on the backend.
- Home (F07, `features/home`): four reads only (month summary, and `page_size=5` pages of pending lessons and lessons, `page_size=1` of students) under keys nested in the pending, lessons and students keys, so existing invalidations refresh Home; one Loading / load-error state for all four. Marking on Home reuses `usePendingRows` (`features/payments/pendingRows.ts`, shared with /pending). E2E: the F05 AC-6 per-state checks live in `e2e/support/pageChecks.ts`; `e2e/f07-home-checks.spec.ts` runs them on Home's states.
- Component tests fake the backend at `fetch` with `src/test/api.ts` (a `"*"` route answers paths without an exact route; `paymentRoutes` in `src/test/ledger.ts` fakes the F03 endpoints in memory) and render with `src/test/renderApp.tsx`. E2E helpers for seed data and SQL-only states are in `frontend/e2e/support/stack.ts`.
