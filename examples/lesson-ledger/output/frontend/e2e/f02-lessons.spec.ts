/** F02 AC-2, AC-3, AC-4: record lessons, see them newest first, field and failure errors. */
import { expect, test, type Page } from "@playwright/test";
import { PASSWORD, forgetTeacher, signUp, uniqueEmail } from "./support/stack";

async function addStudent(page: Page, name: string): Promise<void> {
  await page.goto("/students");
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Add student" }).click();
  await expect(page.getByRole("list", { name: "Your students" })).toContainText(name);
}

async function fillLesson(page: Page, date: string, duration: string, price: string) {
  await page.getByLabel("Student").selectOption({ label: "Zoe Park" });
  await page.getByLabel("Date").fill(date);
  await page.getByLabel("Duration (minutes)").fill(duration);
  await page.getByLabel("Price (USD)").fill(price);
}

function rows(page: Page) {
  return page.getByRole("table", { name: "Your lessons, newest first" }).locator("tbody tr");
}

test.describe("AC-2 AC-3 AC-4 lessons", () => {
  let email: string;

  test.beforeEach(async ({ page }) => {
    email = uniqueEmail();
    await signUp(page, email, PASSWORD);
  });
  test.afterEach(() => forgetTeacher(email));

  test("AC-4 without students the page links to adding one", async ({ page }) => {
    await page.goto("/lessons");

    await expect(page.getByText("Add a student before recording a lesson.")).toBeVisible();
    await expect(page.getByText("No lessons recorded yet.")).toBeVisible();
    await expect(page.getByLabel("Student")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Record lesson" })).toHaveCount(0);
    await page.getByRole("link", { name: "Add a student" }).click();
    await expect(page).toHaveURL(/\/students$/);
  });

  test("AC-2 records lessons and lists them newest first", async ({ page }) => {
    await addStudent(page, "Zoe Park");
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Lessons" })
      .click();
    await expect(page).toHaveTitle("Lessons · Lesson Ledger");
    await expect(page.getByText("No lessons recorded yet.")).toBeVisible();

    await fillLesson(page, "2026-11-03", "45", "42.5");
    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().endsWith("/api/lessons") && r.request().method() === "POST",
      ),
      page.getByRole("button", { name: "Record lesson" }).click(),
    ]);
    expect(response.status()).toBe(201);
    expect(response.request().postDataJSON()).toEqual({
      student_id: expect.any(Number),
      date: "2026-11-03",
      duration_minutes: 45,
      price: { amount: 4250, currency: "USD" },
    });
    expect((await response.json()).paid).toBe(false);
    await expect(page.getByRole("status").filter({ hasText: "Lesson recorded." })).toBeVisible();
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first().getByRole("cell")).toHaveText([
      "Zoe Park",
      "Nov 3, 2026",
      "45 min",
      "$42.50",
      "Unpaid",
    ]);
    await expect(page.getByLabel("Student")).toBeFocused();
    await expect(page.getByLabel("Date")).toHaveValue("2026-11-03");

    for (const [date, price] of [
      ["2026-10-28", "0"],
      ["2026-11-10", "1250"],
    ] as const) {
      await fillLesson(page, date, "30", price);
      await page.getByRole("button", { name: "Record lesson" }).click();
      await expect(page.getByLabel("Duration (minutes)")).toHaveValue("");
    }

    await expect(rows(page).locator("td:nth-child(2)")).toHaveText([
      "Nov 10, 2026",
      "Nov 3, 2026",
      "Oct 28, 2026",
    ]);
    await expect(rows(page).locator("td:nth-child(4)")).toHaveText([
      "$1,250.00",
      "$42.50",
      "$0.00",
    ]);
    const api = await (await page.request.get("/api/lessons")).json();
    expect(api.items.map((l: { date: string }) => l.date)).toEqual([
      "2026-11-10",
      "2026-11-03",
      "2026-10-28",
    ]);
  });

  test("AC-3 field errors send nothing; a failure keeps the values", async ({ page }) => {
    await addStudent(page, "Zoe Park");
    await page.goto("/lessons");
    let posts = 0;
    page.on("request", (r) => {
      if (r.method() === "POST" && r.url().endsWith("/api/lessons")) posts += 1;
    });

    await fillLesson(page, "2026-11-03", "0", "$45");
    await page.getByRole("button", { name: "Record lesson" }).click();
    await expect(
      page.getByText("Enter the duration in whole minutes, from 1 to 600."),
    ).toBeVisible();
    await expect(page.getByText("Enter a price in dollars, like 45 or 45.50.")).toBeVisible();
    await expect(page.getByLabel("Duration (minutes)")).toBeFocused();
    expect(posts).toBe(0);

    await page.getByLabel("Duration (minutes)").fill("45");
    await page.getByLabel("Price (USD)").fill("10000.01");
    await page.getByRole("button", { name: "Record lesson" }).click();
    await expect(page.getByText("Price must be $10,000.00 or less.")).toBeVisible();
    await expect(page.getByLabel("Price (USD)")).toBeFocused();
    expect(posts).toBe(0);

    await page.route("**/api/lessons", (route) =>
      route.request().method() === "POST"
        ? route.fulfill({ status: 503, body: "" })
        : route.fallback(),
    );
    await page.getByLabel("Price (USD)").fill("45");
    await page.getByRole("button", { name: "Record lesson" }).click();
    await expect(page.getByRole("alert")).toHaveText(
      "We couldn't reach Lesson Ledger. Please try again.",
    );
    await expect(page.getByRole("button", { name: "Record lesson" })).toBeFocused();
    await expect(page.getByLabel("Student")).toHaveValue(/\d+/);
    await expect(page.getByLabel("Duration (minutes)")).toHaveValue("45");
    await expect(page.getByLabel("Price (USD)")).toHaveValue("45");
  });
});
