import { expect, test } from "@playwright/test";

// F00 AC-5, changed by F01 AC-4: without a session, "/" now ends on /login. The shell
// guarantees still hold there: lang="en" and one h1 inside the main landmark.
test("AC-5 shell at APP_URL renders a page with one h1 in main", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toHaveText("Log in");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});
