/** F03 AC-1 to AC-6: monthly summary, pending payments, mark as paid and undo, isolation and
 * failures, through the running stack. Every test uses its own teachers; the seeded accounts
 * are checked read-only in f02-isolation-and-seed.spec.ts. */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import {
  PASSWORD,
  addManyStudentsAndLessons,
  forgetTeacher,
  signUp,
  uniqueEmail,
} from "./support/stack";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

async function expectAccessible(page: Page, state: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`),
    state,
  ).toEqual([]);
}

async function expectNoHorizontalScroll(page: Page): Promise<void> {
  for (const width of [1280, 768]) {
    await page.setViewportSize({ width, height: 800 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(0);
  }
  await page.setViewportSize({ width: 1280, height: 800 });
}

async function addStudent(request: APIRequestContext, name: string): Promise<number> {
  const response = await request.post("/api/students", { data: { name } });
  expect(response.status()).toBe(201);
  return (await response.json()).id;
}

async function addLesson(
  request: APIRequestContext,
  studentId: number,
  date: string,
  amount: number,
  paid = false,
): Promise<number> {
  const response = await request.post("/api/lessons", {
    data: {
      student_id: studentId,
      date,
      duration_minutes: 45,
      price: { amount, currency: "USD" },
    },
  });
  expect(response.status()).toBe(201);
  const id: number = (await response.json()).id;
  if (paid) {
    expect((await request.patch(`/api/lessons/${id}`, { data: { paid: true } })).status()).toBe(
      200,
    );
  }
  return id;
}

/** Marks the document so a full page reload can be detected. */
async function markDocument(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as unknown as { __sameDocument: boolean }).__sameDocument = true;
  });
}

function sameDocument(page: Page): Promise<boolean> {
  return page.evaluate(() =>
    Boolean((window as unknown as { __sameDocument?: boolean }).__sameDocument),
  );
}

const totals = (page: Page) => page.locator("main dl > div");
const tableRows = (page: Page) => page.getByRole("table").locator("tbody tr");
const status = (page: Page) =>
  page.getByRole("status").filter({ hasNotText: "Loading…" }).filter({ hasText: /\S/ });

test.describe("F03 payments", () => {
  let email: string;

  test.beforeEach(async ({ page }) => {
    email = uniqueEmail();
    await signUp(page, email, PASSWORD);
  });
  test.afterEach(() => forgetTeacher(email));

  test("AC-1 summary of the browser's month, previous/next without reload, empty month", async ({
    page,
  }) => {
    const zoe = await addStudent(page.request, "Zoe Park");
    const adam = await addStudent(page.request, "Adam Lee");
    await addLesson(page.request, zoe, "2026-11-03", 4250, true);
    await addLesson(page.request, adam, "2026-11-10", 6000);
    await addLesson(page.request, zoe, "2026-11-10", 0);
    await addLesson(page.request, adam, "2026-10-31", 3000);
    await addLesson(page.request, zoe, "2026-12-01", 5000);
    const api = await page.request.get("/api/monthly-summaries/2026-11");
    expect(await api.json()).toEqual({
      month: "2026-11",
      lesson_count: 3,
      collected: { amount: 4250, currency: "USD" },
      pending: { amount: 6000, currency: "USD" },
    });

    await page.clock.setFixedTime(new Date(2026, 10, 18, 9, 0));
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Monthly summary" })
      .click();
    await expect(page).toHaveTitle("Monthly summary · Lesson Ledger");
    await expect(page.getByRole("heading", { level: 2 })).toHaveText("November 2026");
    await expect(totals(page)).toHaveText(["Lessons: 3", "Collected: $42.50", "Pending: $60.00"]);
    await expect(page.getByRole("columnheader")).toHaveText([
      "Student",
      "Date",
      "Duration",
      "Price",
      "Status",
      "Action",
    ]);
    await expect(tableRows(page).locator("td:nth-child(1)")).toHaveText([
      "Zoe Park",
      "Adam Lee",
      "Zoe Park",
    ]);
    await expect(tableRows(page).locator("td:nth-child(5)")).toHaveText([
      "Unpaid",
      "Unpaid",
      "Paid",
    ]);
    await expectAccessible(page, "/summary default");
    await expectNoHorizontalScroll(page);

    await markDocument(page);
    await page.getByRole("button", { name: "Previous month" }).click();
    await expect(page).toHaveURL(/\/summary\?month=2026-10$/);
    await expect(page.getByRole("heading", { level: 2 })).toHaveText("October 2026");
    await expect(totals(page)).toHaveText(["Lessons: 1", "Collected: $0.00", "Pending: $30.00"]);
    await page.getByRole("button", { name: "Next month" }).click();
    await expect(page.getByRole("heading", { level: 2 })).toHaveText("November 2026");
    await page.getByRole("button", { name: "Next month" }).click();
    await expect(page.getByRole("heading", { level: 2 })).toHaveText("December 2026");
    await expect(totals(page)).toHaveText(["Lessons: 1", "Collected: $0.00", "Pending: $50.00"]);
    expect(await sameDocument(page)).toBe(true);

    await page.goBack();
    await expect(page).toHaveURL(/\/summary\?month=2026-11$/);
    await expect(page.getByRole("heading", { level: 2 })).toHaveText("November 2026");

    await page.goto("/summary?month=2026-08");
    await expect(page.getByText("No lessons in August 2026.")).toBeVisible();
    await expect(totals(page)).toHaveText(["Lessons: 0", "Collected: $0.00", "Pending: $0.00"]);
    await expect(page.getByRole("table")).toHaveCount(0);
    await expectAccessible(page, "/summary empty");
    await expectNoHorizontalScroll(page);

    await page.goto("/summary?month=2026-13");
    await expect(page).toHaveURL(/\/summary\?month=2026-11$/);
  });

  test("AC-2 AC-3 pending list, mark as paid there, mark and undo on the summary", async ({
    page,
  }) => {
    await page.goto("/pending");
    await expect(page.getByText("Nothing pending. Every lesson is paid.")).toBeVisible();
    await expectAccessible(page, "/pending empty");

    const zoe = await addStudent(page.request, "Zoe Park");
    const adam = await addStudent(page.request, "Adam Lee");
    await addLesson(page.request, zoe, "2026-09-05", 3375);
    const target = await addLesson(page.request, adam, "2026-10-10", 4500);
    await addLesson(page.request, zoe, "2026-10-10", 125000);
    await addLesson(page.request, zoe, "2026-11-03", 4250);
    await addLesson(page.request, adam, "2026-10-01", 9900, true);

    await page.goto("/pending");
    await expect(page).toHaveTitle("Pending payments · Lesson Ledger");
    await expect(page.getByText("Total pending: $1,371.25 across 4 lessons")).toBeVisible();
    await expect(page.getByRole("columnheader")).toHaveText([
      "Student",
      "Date",
      "Duration",
      "Price",
      "Action",
    ]);
    await expect(tableRows(page).locator("td:nth-child(2)")).toHaveText([
      "Sep 5, 2026",
      "Oct 10, 2026",
      "Oct 10, 2026",
      "Nov 3, 2026",
    ]);
    await expect(tableRows(page).locator("td:nth-child(4)")).toHaveText([
      "$33.75",
      "$45.00",
      "$1,250.00",
      "$42.50",
    ]);
    await expectAccessible(page, "/pending default");
    await expectNoHorizontalScroll(page);

    await markDocument(page);
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith(`/api/lessons/${target}`)),
      page.getByRole("button", { name: "Mark as paid: Adam Lee, Oct 10, 2026" }).click(),
    ]);
    expect(response.status()).toBe(200);
    expect(response.request().postDataJSON()).toEqual({ paid: true });
    expect((await response.json()).paid).toBe(true);
    await expect(tableRows(page)).toHaveCount(3);
    await expect(page.getByText("Total pending: $1,326.25 across 3 lessons")).toBeVisible();
    await expect(status(page)).toHaveText(
      "Marked Adam Lee's lesson on Oct 10, 2026 as paid. Total pending: $1,326.25.",
    );
    await expect(
      page.getByRole("button", { name: "Mark as paid: Zoe Park, Oct 10, 2026" }),
    ).toBeFocused();
    expect(await sameDocument(page)).toBe(true);

    await page.goto("/summary?month=2026-10");
    await expect(totals(page)).toHaveText([
      "Lessons: 3",
      "Collected: $144.00",
      "Pending: $1,250.00",
    ]);
    await page.getByRole("button", { name: "Mark as paid: Zoe Park, Oct 10, 2026" }).click();
    const undo = page.getByRole("button", { name: "Undo paid: Zoe Park, Oct 10, 2026" });
    await expect(undo).toBeFocused();
    await expect(totals(page)).toHaveText(["Lessons: 3", "Collected: $1,394.00", "Pending: $0.00"]);
    await expect(status(page)).toHaveText("Marked as paid. Collected: $1,394.00, pending: $0.00.");

    await page.getByRole("button", { name: "Undo paid: Adam Lee, Oct 10, 2026" }).click();
    await expect(
      page.getByRole("button", { name: "Mark as paid: Adam Lee, Oct 10, 2026" }),
    ).toBeFocused();
    await expect(status(page)).toHaveText(
      "Marked as unpaid. Collected: $1,349.00, pending: $45.00.",
    );
    const pending = await (await page.request.get("/api/pending-lessons")).json();
    expect(pending.items.map((l: { id: number }) => l.id)).toContain(target);
    await page.goto("/pending");
    await expect(page.getByText("Total pending: $121.25 across 3 lessons")).toBeVisible();
  });

  test("AC-5 another teacher's lessons are never shown or changed", async ({ page, browser }) => {
    const other = uniqueEmail();
    const otherPage = await (await browser.newContext()).newPage();
    try {
      await signUp(otherPage, other, PASSWORD);
      const bea = await addStudent(otherPage.request, "Bea Hidden");
      const hidden = await addLesson(otherPage.request, bea, "2026-11-10", 7000);

      const ann = await addStudent(page.request, "Ann Able");
      await addLesson(page.request, ann, "2026-11-03", 4250);
      await page.goto("/summary?month=2026-11");
      await expect(totals(page)).toHaveText(["Lessons: 1", "Collected: $0.00", "Pending: $42.50"]);
      await page.goto("/pending");
      await expect(page.getByText("Total pending: $42.50 across 1 lesson")).toBeVisible();
      await expect(page.getByText("Bea Hidden")).toHaveCount(0);

      const patched = await page.request.patch(`/api/lessons/${hidden}`, {
        data: { paid: true },
      });
      const missing = await page.request.patch("/api/lessons/999999999", {
        data: { paid: true },
      });
      expect([patched.status(), missing.status()]).toEqual([404, 404]);
      expect(await patched.text()).toBe(await missing.text());
      const bPending = await (await otherPage.request.get("/api/pending-lessons")).json();
      expect(bPending.total).toBe(1);
    } finally {
      await otherPage.context().close();
      forgetTeacher(other);
    }
  });

  test("AC-6 load and mark failures, and many items", async ({ page }) => {
    const zoe = await addStudent(page.request, "Zoe Park");
    await addLesson(page.request, zoe, "2026-10-10", 4500);

    await page.route("**/api/pending-lessons?*", (route) => route.abort());
    await page.goto("/pending");
    await expect(page.getByText("We couldn't reach Lesson Ledger.")).toBeVisible();
    await expectAccessible(page, "/pending load failed");
    await page.unrouteAll();
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByText("Total pending: $45.00 across 1 lesson")).toBeVisible();

    await page.route("**/api/lessons/*", (route) =>
      route.request().method() === "PATCH"
        ? route.fulfill({ status: 503, body: "" })
        : route.fallback(),
    );
    const mark = page.getByRole("button", { name: "Mark as paid: Zoe Park, Oct 10, 2026" });
    await mark.click();
    await expect(page.getByRole("alert")).toHaveText(
      "We couldn't reach Lesson Ledger. Please try again.",
    );
    await expect(mark).toBeFocused();
    await expect(mark).toBeEnabled();
    await expect(page.getByText("Total pending: $45.00 across 1 lesson")).toBeVisible();

    await page.unrouteAll();
    await page.route("**/api/monthly-summaries/*", (route) =>
      route.fulfill({ status: 500, body: "" }),
    );
    await page.goto("/summary?month=2026-10");
    await expect(page.getByText("We couldn't reach Lesson Ledger.")).toBeVisible();
    await expectAccessible(page, "/summary load failed");
    await expectNoHorizontalScroll(page);
    await page.unrouteAll();
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(totals(page)).toHaveText(["Lessons: 1", "Collected: $0.00", "Pending: $45.00"]);

    // One lesson on 2026-01-01 for each of the 502 students, Zoe included.
    addManyStudentsAndLessons(email, 501);
    await page.goto("/pending");
    await expect(page.getByText("Showing the 500 oldest of 503 pending lessons.")).toBeVisible();
    await page.goto("/summary?month=2026-01");
    await expect(
      page.getByText("Showing the 500 most recent of 502 lessons in January 2026."),
    ).toBeVisible();
  });

  test("no session sends /summary and /pending to /login", async ({ browser }) => {
    const anonymous = await (await browser.newContext()).newPage();
    for (const path of ["/summary", "/pending"]) {
      await anonymous.goto(path);
      await expect(anonymous).toHaveURL(/\/login$/);
    }
    await anonymous.context().close();
  });
});
