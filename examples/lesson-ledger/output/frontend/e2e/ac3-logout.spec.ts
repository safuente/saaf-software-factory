import { expect, test } from "@playwright/test";
import { ALICE, SESSION_COOKIE, logIn, resetSawText, sawText, watchForText } from "./support/stack";

test("AC-3 home shows the email; keyboard log out ends the session for good", async ({
  page,
  request,
}) => {
  await watchForText(page, ALICE.email);
  await logIn(page, ALICE.email, ALICE.password);
  await expect(page).toHaveTitle("Lesson Ledger");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lesson Ledger");
  const token = (await page.context().cookies()).find((c) => c.name === SESSION_COOKIE)?.value;
  expect(token).toBeTruthy();

  const logOut = page.getByRole("button", { name: "Log out" });
  // F06: Log out moved into the shell, right before main, so it is one Shift+Tab from the h1.
  await page.keyboard.press("Shift+Tab");
  await expect(logOut).toBeFocused();
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().endsWith("/api/sessions/current") && r.request().method() === "DELETE",
    ),
    page.keyboard.press("Enter"),
  ]);

  expect(response.status()).toBe(204);
  expect(await response.headerValue("set-cookie")).toMatch(/ll_session=.*Max-Age=0/i);
  await expect(page).toHaveURL(/\/login$/);
  await resetSawText(page);

  await page.goBack();
  await expect(page).toHaveURL(/\/login$/);
  expect(await sawText(page)).toBe(false);

  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  expect(await sawText(page)).toBe(false);

  const old = await request.get("/api/sessions/current", {
    headers: { Cookie: `${SESSION_COOKIE}=${token}` },
  });
  expect(old.status()).toBe(401);
});
