/** Spec Non-functional: WCAG 2.1 AA, keyboard operation, no horizontal scrolling. */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  ALICE,
  PASSWORD,
  addManyStudentsAndLessons,
  forgetTeacher,
  logIn,
  signUp,
  uniqueEmail,
} from "./support/stack";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

async function expectNoAxeViolations(page: Page, state: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`);
  expect(summary, state).toEqual([]);
}

async function expectNoHorizontalScroll(page: Page): Promise<void> {
  for (const width of [1280, 768, 375]) {
    await page.setViewportSize({ width, height: 800 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(0);
  }
}

test("/login default and error states are accessible", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Log in");
  await expectNoAxeViolations(page, "login default");
  await expectNoHorizontalScroll(page);

  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
  await expectNoAxeViolations(page, "login field errors");

  await page.getByLabel("Email").fill(ALICE.email);
  await page.getByLabel("Password").fill("wrong-password-123");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expectNoAxeViolations(page, "login invalid credentials");
  await expectNoHorizontalScroll(page);
});

test("/signup default and error states are accessible", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Create your account");
  await expectNoAxeViolations(page, "signup default");
  await expectNoHorizontalScroll(page);

  await page.getByLabel("Email").fill(ALICE.email);
  await page.getByLabel("Password").fill("correct-horse-1");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
  await expectNoAxeViolations(page, "signup duplicate email");

  await page.route("**/api/teachers", (route) => route.fulfill({ status: 502, body: "" }));
  await page.getByLabel("Email").fill("someone-new@example.com");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("alert")).toHaveText("Something went wrong. Please try again.");
  await expectNoAxeViolations(page, "signup server error");
  await expectNoHorizontalScroll(page);
});

test("/ default and error states are accessible", async ({ page }) => {
  await logIn(page, ALICE.email, ALICE.password);
  await expectNoAxeViolations(page, "home default");
  await expectNoHorizontalScroll(page);

  await page.route("**/api/sessions/current", (route) =>
    route.request().method() === "DELETE"
      ? route.fulfill({ status: 503, body: "" })
      : route.fallback(),
  );
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByRole("alert")).toHaveText("Couldn't log out. Please try again.");
  await expectNoAxeViolations(page, "home log out failed");

  await page.unrouteAll();
  await page.route("**/api/sessions/current", (route) => route.fulfill({ status: 503, body: "" }));
  await page.reload();
  await expect(page.getByText("We couldn't reach Lesson Ledger.")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await expectNoAxeViolations(page, "home session check failed");
  await expectNoHorizontalScroll(page);

  await page.unrouteAll();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText(`Signed in as ${ALICE.email}`)).toBeVisible();
});

test("forms are operable by keyboard in a logical order with a visible focus indicator", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeFocused();
  const order = [
    page.getByLabel("Email"),
    page.getByLabel("Password"),
    page.getByRole("button", { name: "Log in" }),
    page.getByRole("link", { name: "Create an account" }),
  ];
  for (const element of order) {
    await page.keyboard.press("Tab");
    await expect(element).toBeFocused();
    const outline = await element.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe("none");
  }

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/signup$/);
  await expect(page.getByRole("heading", { level: 1, name: "Create your account" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Email")).toBeFocused();
  await page.keyboard.type(ALICE.email);
  await page.keyboard.press("Tab");
  await page.keyboard.type("x");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Password")).toBeFocused();
});

test.describe("F02 pages", () => {
  test("/students and /lessons default and error states are accessible (alice)", async ({
    page,
  }) => {
    await logIn(page, ALICE.email, ALICE.password);
    for (const path of ["/students", "/lessons"]) {
      await page.goto(path);
      await expect(page.getByRole("status").filter({ hasText: "Loading…" })).toHaveCount(0);
      await expectNoAxeViolations(page, `${path} default`);
      await expectNoHorizontalScroll(page);
      if (path === "/lessons") {
        // UI-2: at the narrowest width each date stays on one line.
        const dateLines = await page
          .getByRole("table")
          .locator("time")
          .evaluateAll((times) => times.map((t) => t.getClientRects().length));
        expect(dateLines.length).toBeGreaterThan(0);
        expect(
          dateLines.every((n) => n === 1),
          "dates on one line at 375px",
        ).toBe(true);
      }
      await page.setViewportSize({ width: 1280, height: 800 });
    }

    await page.getByRole("button", { name: "Record lesson" }).click();
    await expect(page.getByLabel("Student")).toHaveAttribute("aria-invalid", "true");
    await expectNoAxeViolations(page, "/lessons field errors");

    await page.route("**/api/lessons", (route) =>
      route.request().method() === "POST"
        ? route.fulfill({ status: 503, body: "" })
        : route.fallback(),
    );
    await page.getByLabel("Student").selectOption({ index: 1 });
    await page.getByLabel("Duration (minutes)").fill("45");
    await page.getByLabel("Price (USD)").fill("45");
    await page.getByRole("button", { name: "Record lesson" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expectNoAxeViolations(page, "/lessons submit failed");

    await page.unrouteAll();
    await page.route("**/api/{students,lessons}?*", (route) =>
      route.fulfill({ status: 503, body: "" }),
    );
    for (const path of ["/students", "/lessons"]) {
      await page.goto(path);
      await expect(page.getByText("We couldn't reach Lesson Ledger.").first()).toBeVisible();
      await expectNoAxeViolations(page, `${path} load failed`);
      await expectNoHorizontalScroll(page);
      await page.setViewportSize({ width: 1280, height: 800 });
    }
  });

  test("/students and /lessons empty, no-students and many-items states are accessible", async ({
    page,
  }) => {
    const email = uniqueEmail();
    try {
      await signUp(page, email, PASSWORD);
      await page.goto("/students");
      await expect(page.getByText("You have no students yet.", { exact: false })).toBeVisible();
      await page.getByRole("button", { name: "Add student" }).click();
      await expect(page.getByLabel("Name")).toHaveAttribute("aria-invalid", "true");
      await expectNoAxeViolations(page, "/students empty with field error");

      await page.goto("/lessons");
      await expect(page.getByText("Add a student before recording a lesson.")).toBeVisible();
      await expectNoAxeViolations(page, "/lessons no students");
      await expectNoHorizontalScroll(page);
      await page.setViewportSize({ width: 1280, height: 800 });

      addManyStudentsAndLessons(email, 501);
      await page.goto("/students");
      await expect(page.getByText("Showing the first 500 of 501 students.")).toBeVisible();
      await expectNoAxeViolations(page, "/students many items");
      await page.goto("/lessons");
      await expect(page.getByText("Showing the 500 most recent of 501 lessons.")).toBeVisible();
      await expectNoAxeViolations(page, "/lessons many items");
      await expectNoHorizontalScroll(page);
    } finally {
      forgetTeacher(email);
    }
  });

  test("the lesson form is operable by keyboard in order with a visible focus", async ({
    page,
  }) => {
    await logIn(page, ALICE.email, ALICE.password);
    await page.goto("/lessons");
    await expect(page.getByLabel("Student")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Lessons" })).toBeFocused();
    const order = [
      page.getByLabel("Student"),
      page.getByLabel("Date"),
      page.getByLabel("Duration (minutes)"),
      page.getByLabel("Price (USD)"),
      page.getByRole("button", { name: "Record lesson" }),
    ];
    for (const element of order) {
      await page.keyboard.press("Tab");
      if (element === order[2]) {
        // A date input has one tab stop per date part (month, day, year).
        while (!(await element.evaluate((el) => el === document.activeElement))) {
          await page.keyboard.press("Tab");
        }
      }
      await expect(element).toBeFocused();
      const outline = await element.evaluate((el) => getComputedStyle(el).outlineStyle);
      expect(outline).not.toBe("none");
    }
  });
});
