import { expect, test } from "@playwright/test";
import { SESSION_COOKIE, forgetTeacher, uniqueEmail } from "./support/stack";

// Its own teacher, not a seed account: other spec files read the seeded carol in parallel.
const TEACHER = uniqueEmail();
const [LOCAL, DOMAIN] = TEACHER.split("@") as [string, string];

test.describe("AC-1 sign up", () => {
  test.beforeEach(() => forgetTeacher(TEACHER));
  test.afterAll(() => forgetTeacher(TEACHER));

  test("AC-1 sign up lands on / and a second sign-up in other case is refused", async ({
    page,
    browser,
  }) => {
    await page.goto("/signup");
    await expect(page).toHaveTitle("Create your account · Lesson Ledger");
    await page.getByLabel("Email").fill(` ${LOCAL.toUpperCase()}@Example.com `);
    await page.getByLabel("Password").fill("correct-horse-1");
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith("/api/teachers")),
      page.getByRole("button", { name: "Create account" }).click(),
    ]);

    expect(response.status()).toBe(201);
    expect((await response.json()).teacher).toEqual({ email: TEACHER });
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText(`Signed in as ${TEACHER}`)).toBeVisible();
    const cookie = (await page.context().cookies()).find((c) => c.name === SESSION_COOKIE);
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("Lax");
    expect(cookie?.path).toBe("/");
    expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);

    const other = await browser.newPage();
    await other.goto("/signup");
    await other.getByLabel("Email").fill(`${LOCAL.toUpperCase()}@${DOMAIN}`);
    await other.getByLabel("Password").fill("another-valid-password");
    const [duplicate] = await Promise.all([
      other.waitForResponse((r) => r.url().endsWith("/api/teachers")),
      other.getByRole("button", { name: "Create account" }).click(),
    ]);

    expect(duplicate.status()).toBe(409);
    expect((await duplicate.json()).error.code).toBe("email_taken");
    const email = other.getByLabel("Email");
    await expect(email).toHaveAccessibleDescription(/An account with this email already exists\./);
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(email).toBeFocused();
    await expect(other).toHaveURL(/\/signup$/);
    await other.close();
  });

  test("AC-1 invalid email or short password sends no request and focuses the field", async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on("request", (r) => {
      if (r.url().endsWith("/api/teachers")) requests.push(r.url());
    });
    await page.goto("/signup");
    const email = page.getByLabel("Email");
    const password = page.getByLabel("Password");
    await expect(email).toHaveAccessibleDescription("Example: name@example.com");
    await expect(password).toHaveAccessibleDescription("At least 12 characters.");

    await email.fill(`${LOCAL}@`);
    await password.fill("correct-horse-1");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(email).toHaveAccessibleDescription(
      /Enter a valid email address, like name@example\.com\./,
    );
    await expect(email).toBeFocused();

    await email.fill(TEACHER);
    await password.fill("x".repeat(11));
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(password).toHaveAccessibleDescription(/Password must be at least 12 characters\./);
    await expect(password).toBeFocused();
    expect(requests).toEqual([]);
  });
});
