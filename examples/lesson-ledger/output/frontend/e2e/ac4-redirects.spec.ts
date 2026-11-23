import { expect, test } from "@playwright/test";
import { ALICE, logIn, sawText, watchForText } from "./support/stack";

const NOT_AUTHENTICATED = {
  error: { code: "not_authenticated", message: "Authentication required", details: {} },
};

for (const path of ["/", "/some/other/path"]) {
  test(`AC-4 ${path} without a session ends on /login without rendering home`, async ({ page }) => {
    await watchForText(page, "Signed in as");
    await page.goto(path);

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Log in");
    expect(await sawText(page)).toBe(false);
  });
}

test("AC-4 protected endpoints answer 401 not_authenticated without a valid session", async ({
  request,
}) => {
  for (const cookie of [undefined, "ll_session=not-a-real-token"]) {
    const headers = cookie ? { Cookie: cookie } : undefined;
    for (const response of [
      await request.get("/api/sessions/current", { headers }),
      await request.delete("/api/sessions/current", { headers }),
    ]) {
      expect(response.status()).toBe(401);
      expect(await response.json()).toEqual(NOT_AUTHENTICATED);
    }
  }
});

test("AC-4 a logged-in teacher opening /login or /signup ends on /", async ({ page }) => {
  await logIn(page, ALICE.email, ALICE.password);
  for (const path of ["/login", "/signup"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText(`Signed in as ${ALICE.email}`)).toBeVisible();
  }
});
