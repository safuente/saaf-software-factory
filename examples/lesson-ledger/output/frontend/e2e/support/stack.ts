/**
 * Test-only access to this worktree's stack (COMPOSE_PROJECT_NAME from .env via make):
 * seed data and direct SQL for states the UI cannot create, such as an expired session.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

const ROOT = path.resolve(import.meta.dirname, "../../..");

export const ALICE = { email: "alice@example.com", password: "alice-ledger-pass" };
export const BOB = { email: "bob@example.com", password: "bob-ledger-pass1" };
export const PASSWORD = "correct-horse-1";

/** Seeds the stack (idempotent). Run once per `make e2e`, from global-setup.ts, before any
 * worker starts: the seed accounts are read-only to the specs, so no spec reseeds them while
 * another one reads them. */
export function seed(): void {
  execFileSync("make", ["seed"], { cwd: ROOT, stdio: "pipe" });
}

/** Runs SQL through psql on stdin; `vars` are bound as psql variables (:'name'). */
function sql(statement: string, vars: Record<string, string>): void {
  const args = ["compose", "exec", "-T", "db", "psql", "-v", "ON_ERROR_STOP=1", "-q"];
  args.push("-U", process.env.POSTGRES_USER ?? "", "-d", process.env.POSTGRES_DB ?? "");
  for (const [name, value] of Object.entries(vars)) args.push("-v", `${name}=${value}`);
  execFileSync("docker", args, { cwd: ROOT, input: statement, stdio: ["pipe", "pipe", "pipe"] });
}

export function forgetTeacher(email: string): void {
  sql(
    `DELETE FROM lesson WHERE teacher_id IN (SELECT id FROM teacher WHERE email = :'email');
     DELETE FROM student WHERE teacher_id IN (SELECT id FROM teacher WHERE email = :'email');
     DELETE FROM session WHERE teacher_id IN (SELECT id FROM teacher WHERE email = :'email');
     DELETE FROM teacher WHERE email = :'email';`,
    { email },
  );
}

/** Gives the teacher `count` students named "Student 0001"... and one lesson per student, so
 * the lists pass the 500 items the pages show (spec Behavior: List sizes). */
export function addManyStudentsAndLessons(email: string, count: number): void {
  sql(
    `INSERT INTO student (teacher_id, name, created_at)
       SELECT id, 'Student ' || lpad(n::text, 4, '0'), now()
       FROM teacher, generate_series(1, :count) n WHERE email = :'email';
     INSERT INTO lesson (teacher_id, student_id, date, duration_minutes, price_cents, created_at)
       SELECT s.teacher_id, s.id, DATE '2026-01-01', 45, 4500, now()
       FROM student s JOIN teacher t ON t.id = s.teacher_id WHERE t.email = :'email';`,
    { email, count: String(count) },
  );
}

/** Moves the teacher's sessions back so they were created `ago` (a PostgreSQL interval). */
export function ageSessions(email: string, ago: string): void {
  sql(
    `UPDATE session SET created_at = now() - CAST(:'ago' AS interval),
       expires_at = now() - CAST(:'ago' AS interval) + interval '14 days'
     WHERE teacher_id IN (SELECT id FROM teacher WHERE email = :'email');`,
    { email, ago },
  );
}

export function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

export async function logIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
}

export async function signUp(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
}

/**
 * Records, from the first script of every document on, whether `text` was ever rendered.
 * Read it with sawText(page); reset it with resetSawText(page).
 */
export async function watchForText(page: Page, text: string): Promise<void> {
  await page.addInitScript((watched) => {
    const w = window as unknown as { __sawText: boolean };
    w.__sawText = false;
    new MutationObserver(() => {
      if (document.body?.textContent?.includes(watched)) w.__sawText = true;
    }).observe(document, { childList: true, subtree: true, characterData: true });
  }, text);
}

export function sawText(page: Page): Promise<boolean> {
  return page.evaluate(() => (window as unknown as { __sawText: boolean }).__sawText);
}

export function resetSawText(page: Page): Promise<void> {
  return page.evaluate(() => {
    (window as unknown as { __sawText: boolean }).__sawText = false;
  });
}

export const SESSION_COOKIE = "ll_session";
