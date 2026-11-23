import { expect, test } from "@playwright/test";
import { ALICE, SESSION_COOKIE } from "./support/stack";

const INCORRECT = "Email or password is incorrect.";

test.describe("AC-2 log in", () => {
  test("AC-2 seeded teacher logs in with any-case email and lands on /", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle("Log in · Lesson Ledger");
    await page.getByLabel("Email").fill("ALICE@example.com");
    await page.getByLabel("Password").fill(ALICE.password);
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith("/api/sessions")),
      page.getByRole("button", { name: "Log in" }).click(),
    ]);

    expect(response.status()).toBe(200);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText(`Signed in as ${ALICE.email}`)).toBeVisible();
    const cookie = (await page.context().cookies()).find((c) => c.name === SESSION_COOKIE);
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("Lax");
  });

  for (const [name, email] of [
    ["wrong password", ALICE.email],
    ["unknown email", "nobody@example.com"],
  ] as const) {
    test(`AC-2 ${name} shows one generic alert and empties the password`, async ({ page }) => {
      await page.goto("/login");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill("wrong-password-123");
      const [response] = await Promise.all([
        page.waitForResponse((r) => r.url().endsWith("/api/sessions")),
        page.getByRole("button", { name: "Log in" }).click(),
      ]);

      expect(response.status()).toBe(401);
      expect(await response.json()).toEqual({
        error: { code: "invalid_credentials", message: INCORRECT, details: {} },
      });
      expect(await response.headerValue("set-cookie")).toBeNull();
      await expect(page.getByRole("alert")).toHaveText(INCORRECT);
      await expect(page.getByText(INCORRECT)).toHaveCount(1);
      await expect(page.getByLabel("Email")).toHaveValue(email);
      await expect(page.getByLabel("Password")).toHaveValue("");
      await expect(page).toHaveURL(/\/login$/);
    });
  }
});
