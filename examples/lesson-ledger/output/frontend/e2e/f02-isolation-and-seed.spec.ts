/** F02 AC-5 (teachers only see their own data) and AC-6 (seeded review data in the UI). */
import { expect, test } from "@playwright/test";
import { ALICE, BOB, PASSWORD, forgetTeacher, logIn, signUp, uniqueEmail } from "./support/stack";

test("AC-5 a teacher never sees or uses another teacher's student", async ({ browser }) => {
  const a = uniqueEmail();
  const b = uniqueEmail();
  const aPage = await (await browser.newContext()).newPage();
  const bPage = await (await browser.newContext()).newPage();
  try {
    await signUp(bPage, b, PASSWORD);
    await bPage.goto("/students");
    await bPage.getByLabel("Name").fill("Bea Hidden");
    await bPage.getByRole("button", { name: "Add student" }).click();
    await expect(
      bPage.getByRole("list", { name: "Your students" }).getByRole("listitem"),
    ).toHaveText(["Bea Hidden"]);
    const bStudent = (await (await bPage.request.get("/api/students")).json()).items[0];

    await signUp(aPage, a, PASSWORD);
    await aPage.goto("/students");
    await expect(aPage.getByText("You have no students yet.", { exact: false })).toBeVisible();
    await aPage.goto("/lessons");
    await expect(aPage.getByText("No lessons recorded yet.")).toBeVisible();
    await expect(aPage.getByText("Bea Hidden")).toHaveCount(0);

    const response = await aPage.request.post("/api/lessons", {
      data: {
        student_id: bStudent.id,
        date: "2026-11-03",
        duration_minutes: 45,
        price: { amount: 4250, currency: "USD" },
      },
    });
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({
      error: { code: "not_found", message: "Not found", details: {} },
    });
  } finally {
    await aPage.context().close();
    await bPage.context().close();
    forgetTeacher(a);
    forgetTeacher(b);
  }
});

test.describe("AC-6 seeded review data", () => {
  test("AC-6 alice has six students and twelve lessons, 3 paid (F03 AC-6)", async ({ page }) => {
    await logIn(page, ALICE.email, ALICE.password);
    await page.goto("/students");
    await expect(
      page.getByRole("list", { name: "Your students" }).getByRole("listitem"),
    ).toHaveCount(6);
    await page.goto("/lessons");
    const rows = page
      .getByRole("table", { name: "Your lessons, newest first" })
      .locator("tbody tr");
    await expect(rows).toHaveCount(12);
    await expect(rows.locator("td:nth-child(5)").filter({ hasText: /^Paid$/ })).toHaveCount(3);
    await expect(rows.locator("td:nth-child(5)").filter({ hasText: /^Unpaid$/ })).toHaveCount(9);
  });

  test("F03 AC-6 alice's previous month mixes paid and unpaid; pending spans three months", async ({
    page,
  }) => {
    await logIn(page, ALICE.email, ALICE.password);
    await page.goto("/summary");
    await page.getByRole("button", { name: "Previous month" }).click();
    const status = page.getByRole("table").locator("tbody tr td:nth-child(5)");
    await expect(status).toHaveCount(4);
    await expect(status.filter({ hasText: /^Paid$/ })).toHaveCount(2);
    await page.goto("/pending");
    await expect(page.getByText(/^Total pending: \$[\d,.]+ across 9 lessons$/)).toBeVisible();
  });

  test("AC-6 bob has no students and no lessons", async ({ page }) => {
    await logIn(page, BOB.email, BOB.password);
    await page.goto("/lessons");
    await expect(page.getByText("Add a student before recording a lesson.")).toBeVisible();
    await expect(page.getByText("No lessons recorded yet.")).toBeVisible();
    await page.goto("/pending");
    await expect(page.getByText("Nothing pending. Every lesson is paid.")).toBeVisible();
  });
});
