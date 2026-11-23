import { expect, test } from "@playwright/test";
import { SESSION_COOKIE, ageSessions, forgetTeacher, signUp, uniqueEmail } from "./support/stack";

const PASSWORD = "correct-horse-1";
const created: string[] = [];

test.afterAll(() => created.forEach(forgetTeacher));

test("AC-5 reload keeps the teacher on / without passing /login", async ({ page }) => {
  const email = uniqueEmail();
  created.push(email);
  await signUp(page, email, PASSWORD);
  const visited: string[] = [];
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) visited.push(new URL(frame.url()).pathname);
  });

  await page.reload();

  await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
  expect(visited).not.toContain("/login");
  await expect(page).toHaveURL(/\/$/);
});

test("AC-5 a session is valid until 14 days after creation, then sends / to /login", async ({
  page,
  request,
}) => {
  const email = uniqueEmail();
  created.push(email);
  await signUp(page, email, PASSWORD);
  const token = (await page.context().cookies()).find((c) => c.name === SESSION_COOKIE)?.value;
  const headers = { Cookie: `${SESSION_COOKIE}=${token}` };

  ageSessions(email, "14 days - 1 minute");
  expect((await request.get("/api/sessions/current", { headers })).status()).toBe(200);

  ageSessions(email, "14 days + 1 minute");
  const expired = await request.get("/api/sessions/current", { headers });
  expect(expired.status()).toBe(401);
  expect((await expired.json()).error.code).toBe("not_authenticated");

  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});
