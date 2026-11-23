/** F02 AC-1: add students and see them in name order, with field errors and failures. */
import { expect, test } from "@playwright/test";
import { PASSWORD, forgetTeacher, signUp, uniqueEmail } from "./support/stack";

const EMPTY = "You have no students yet. Add your first student with the form above.";

test.describe("AC-1 students", () => {
  let email: string;

  test.beforeEach(async ({ page }) => {
    email = uniqueEmail();
    await signUp(page, email, PASSWORD);
  });
  test.afterEach(() => forgetTeacher(email));

  test("AC-1 adds students by keyboard and lists them case-insensitively", async ({ page }) => {
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Students" })
      .click();
    await expect(page).toHaveTitle("Students · Lesson Ledger");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Students");
    await expect(page.getByText(EMPTY)).toBeVisible();

    const name = page.getByLabel("Name");
    for (const value of [" Zoe Park ", "adam Lee"]) {
      await name.fill(value);
      const [response] = await Promise.all([
        page.waitForResponse(
          (r) => r.url().endsWith("/api/students") && r.request().method() === "POST",
        ),
        name.press("Enter"),
      ]);
      expect(response.status()).toBe(201);
      expect((await response.json()).name).toBe(value.trim());
      await expect(page.getByRole("status").filter({ hasText: "Student added." })).toBeVisible();
      await expect(name).toHaveValue("");
      await expect(name).toBeFocused();
    }

    const list = page.getByRole("list", { name: "Your students" });
    await expect(list.getByRole("listitem")).toHaveText(["adam Lee", "Zoe Park"]);
    const api = await page.request.get("/api/students");
    expect(await api.json()).toMatchObject({ total: 2, page: 1, page_size: 50 });

    await page.reload();
    await expect(list.getByRole("listitem")).toHaveText(["adam Lee", "Zoe Park"]);
  });

  test("AC-1 invalid names show a field error and send nothing", async ({ page }) => {
    await page.goto("/students");
    await expect(page.getByText(EMPTY)).toBeVisible();
    let posts = 0;
    page.on("request", (r) => {
      if (r.method() === "POST" && r.url().endsWith("/api/students")) posts += 1;
    });
    const name = page.getByLabel("Name");

    await name.fill("   ");
    await page.getByRole("button", { name: "Add student" }).click();
    await expect(page.getByText("Enter the student's name.")).toBeVisible();
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(name).toBeFocused();

    await name.fill("x".repeat(101));
    await expect(page.getByText("Enter the student's name.")).toHaveCount(0);
    await page.getByRole("button", { name: "Add student" }).click();
    await expect(page.getByText("Name must be 100 characters or fewer.")).toBeVisible();
    expect(posts).toBe(0);
  });

  test("AC-3 a failed add keeps the name and focuses Add student", async ({ page }) => {
    await page.goto("/students");
    await expect(page.getByText(EMPTY)).toBeVisible();
    await page.route("**/api/students", (route) =>
      route.request().method() === "POST" ? route.abort("connectionrefused") : route.fallback(),
    );

    await page.getByLabel("Name").fill("Zoe Park");
    await page.getByRole("button", { name: "Add student" }).click();

    await expect(page.getByRole("alert")).toHaveText(
      "We couldn't reach Lesson Ledger. Please try again.",
    );
    await expect(page.getByLabel("Name")).toHaveValue("Zoe Park");
    await expect(page.getByRole("button", { name: "Add student" })).toBeFocused();
  });
});
