/** F07 Home overview: the month figures, the two short lists, mark as paid on Home, the quick
 * actions and the empty and error states, through the running production build. Seed accounts
 * (alice, bob, carol) are read only; flows that write use teachers created by the test. */
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import {
  ALICE,
  BOB,
  PASSWORD,
  forgetTeacher,
  logIn,
  sawText,
  signUp,
  uniqueEmail,
  watchForText,
} from "./support/stack";

const CAROL = { email: "carol@example.com", password: "carol-ledger-pass" };

/** The browser's current month as "November 2026". */
function monthName(): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date());
}

/** Home's month figures as "term value" strings, in order. */
async function homeFigures(page: Page, month = monthName()): Promise<string[]> {
  const section = page.getByRole("region", { name: month });
  const pairs = section.locator("dl > div");
  await expect(pairs).toHaveCount(4);
  return pairs.evaluateAll((els) =>
    els.map(
      (el) => `${el.querySelector("dt")?.textContent} ${el.querySelector("dd")?.textContent}`,
    ),
  );
}

/** /summary's figures for the same month, as Home names them. */
async function summaryFigures(page: Page): Promise<string[]> {
  await page.goto("/summary");
  const totals = page.locator("main dl > div");
  await expect(totals).toHaveCount(3);
  const pairs = await totals.evaluateAll((els) =>
    els.map((el) => [el.querySelector("dt")?.textContent, el.querySelector("dd")?.textContent]),
  );
  const value = (term: string) => pairs.find(([t]) => t === `${term}:`)?.[1];
  const average = (await page.getByText(/^Average per lesson: /).textContent()) ?? "";
  return [
    `Collected ${value("Collected")}`,
    `Pending ${value("Pending")}`,
    `Lessons ${value("Lessons")}`,
    `Average per lesson ${average.replace("Average per lesson: ", "")}`,
  ];
}

test.describe("F07 AC-1 month figures", () => {
  test("AC-1a,b alice: the four figures under the month heading equal /summary's", async ({
    page,
  }) => {
    await logIn(page, ALICE.email, ALICE.password);
    await expect(page.getByRole("heading", { level: 2, name: monthName() })).toBeVisible();
    const home = await homeFigures(page);
    expect(home).toEqual([
      "Collected $45.00",
      "Pending $136.25",
      "Lessons 4",
      "Average per lesson $45.31",
    ]);
    expect(await summaryFigures(page)).toEqual(home);
  });

  test("AC-1c carol: the four figures equal /summary's", async ({ page }) => {
    await logIn(page, CAROL.email, CAROL.password);
    const home = await homeFigures(page);
    expect(home).toEqual([
      "Collected $0.00",
      "Pending $23,400.00",
      "Lessons 520",
      "Average per lesson $45.00",
    ]);
    expect(await summaryFigures(page)).toEqual(home);
  });
});

const OLDEST = "Oldest unpaid lessons, oldest first";
const LATEST = "Latest lessons, newest first";

/** The first `count` body rows of a table, each as the texts of the given columns (1-based). */
async function tableCells(page: Page, table: string, columns: number[], count = 5) {
  const body = page.getByRole("table", { name: table }).locator("tbody tr");
  await expect(body.first()).toBeVisible();
  const rows = await body.evaluateAll((trs) =>
    trs.map((tr) => [...tr.querySelectorAll("td")].map((td) => td.textContent ?? "")),
  );
  return rows.slice(0, count).map((cells) => columns.map((c) => cells[c - 1] ?? ""));
}

/** API paths Home reads while it loads, besides the session check. */
function recordReads(page: Page): string[] {
  const reads: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/") && url.pathname !== "/api/sessions/current") {
      reads.push(`${request.method()} ${url.pathname}${url.search}`);
    }
  });
  return reads;
}

test.describe("F07 AC-2 lists", () => {
  test("AC-2a,b,c alice: the 5 oldest unpaid equal /pending's first rows; the 5 latest equal /lessons'", async ({
    page,
  }) => {
    await logIn(page, ALICE.email, ALICE.password);
    const oldest = page.getByRole("region", { name: "Oldest unpaid lessons", exact: true });
    await expect(oldest.getByRole("heading", { level: 2 })).toHaveText("Oldest unpaid lessons");
    await expect(oldest.getByText("Total pending: $363.00 across 9 lessons")).toBeVisible();
    await expect(page.getByRole("table", { name: OLDEST }).getByRole("columnheader")).toHaveText([
      "Student",
      "Date",
      "Duration",
      "Price",
      "Action",
    ]);
    await expect(page.getByRole("table", { name: OLDEST }).locator("tbody tr")).toHaveCount(5);
    const homeOldest = await tableCells(page, OLDEST, [1, 2]);
    expect(homeOldest.map(([name]) => name)).toEqual([
      "Chloé Dubois",
      "Dev Patel",
      "Emma Rossi",
      "Finn Walsh",
      "Ava Martin",
    ]);
    await expect(page.getByRole("table", { name: LATEST }).getByRole("columnheader")).toHaveText([
      "Student",
      "Date",
      "Duration",
      "Price",
      "Status",
    ]);
    await expect(page.getByRole("table", { name: LATEST }).locator("tbody tr")).toHaveCount(5);
    const homeLatest = await tableCells(page, LATEST, [1, 2, 5]);
    for (const [, , status] of homeLatest) expect(["Paid", "Unpaid"]).toContain(status);
    const latestStatus = page.getByRole("table", { name: LATEST }).locator("td:nth-child(5) span");
    const homeStatusClasses = await latestStatus.evaluateAll((els) =>
      els.map((el) => el.className),
    );
    await expect(page.getByText(`Signed in as ${ALICE.email}`)).toBeVisible();

    await page.getByRole("link", { name: "View all pending payments" }).click();
    await expect(page).toHaveURL(/\/pending$/);
    expect(await tableCells(page, "Unpaid lessons, oldest first", [1, 2])).toEqual(homeOldest);

    await page.goto("/");
    await page.getByRole("link", { name: "View all lessons" }).click();
    await expect(page).toHaveURL(/\/lessons$/);
    expect(await tableCells(page, "Your lessons, newest first", [1, 2, 5])).toEqual(homeLatest);
    const lessonsStatusClasses = await page
      .getByRole("table", { name: "Your lessons, newest first" })
      .locator("td:nth-child(5) span")
      .evaluateAll((els) => els.slice(0, 5).map((el) => el.className));
    expect(homeStatusClasses).toEqual(lessonsStatusClasses);
  });

  test("AC-2d carol: 5 rows per table, the full total, no truncation message", async ({ page }) => {
    await logIn(page, CAROL.email, CAROL.password);
    await expect(page.getByText("Total pending: $23,400.00 across 520 lessons")).toBeVisible();
    await expect(page.getByRole("table", { name: OLDEST }).locator("tbody tr")).toHaveCount(5);
    await expect(page.getByRole("table", { name: LATEST }).locator("tbody tr")).toHaveCount(5);
    await expect(page.getByText(/^Showing/)).toHaveCount(0);
  });

  test("AC-2e loading / reads exactly the summary of this month and three first pages", async ({
    page,
  }) => {
    await logIn(page, ALICE.email, ALICE.password);
    // Let the load after logging in finish, so only the next load is recorded.
    await expect(page.getByRole("table", { name: LATEST })).toBeVisible();
    const reads = recordReads(page);
    await page.goto("/");
    await expect(page.getByRole("table", { name: LATEST })).toBeVisible();
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    expect(reads.sort()).toEqual(
      [
        `GET /api/monthly-summaries/${month}`,
        "GET /api/pending-lessons?page=1&page_size=5",
        "GET /api/lessons?page=1&page_size=5",
        "GET /api/students?page=1&page_size=1",
      ].sort(),
    );
  });
});

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
    data: { student_id: studentId, date, duration_minutes: 45, price: { amount, currency: "USD" } },
  });
  expect(response.status()).toBe(201);
  const id: number = (await response.json()).id;
  if (paid) {
    const patched = await request.patch(`/api/lessons/${id}`, { data: { paid: true } });
    expect(patched.status()).toBe(200);
  }
  return id;
}

/** F03 AC-2 data: four unpaid lessons over three months and one paid. Returns the ids of the
 * 2026-10-10 $45.00 lesson and the 2026-11-03 $42.50 one. */
async function addF03Lessons(request: APIRequestContext) {
  const zoe = await addStudent(request, "Zoe Park");
  const adam = await addStudent(request, "Adam Lee");
  await addLesson(request, zoe, "2026-09-05", 3375);
  const october = await addLesson(request, adam, "2026-10-10", 4500);
  await addLesson(request, zoe, "2026-10-10", 125000);
  const november = await addLesson(request, zoe, "2026-11-03", 4250);
  await addLesson(request, adam, "2026-10-01", 9900, true);
  return { october, november };
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

const status = (page: Page) =>
  page.getByRole("status").filter({ hasNotText: "Loading…" }).filter({ hasText: /\S/ });

test.describe("F07 AC-3 mark as paid on Home", () => {
  let email: string;

  test.beforeEach(async ({ page }) => {
    email = uniqueEmail();
    await signUp(page, email, PASSWORD);
    await page.clock.setFixedTime(new Date(2026, 10, 18, 9, 0));
  });
  test.afterEach(() => forgetTeacher(email));

  test("AC-3a,b,c the F03 AC-3 check on Home's table; figures move only for this month", async ({
    page,
  }) => {
    const { october, november } = await addF03Lessons(page.request);
    await page.goto("/");
    const table = page.getByRole("table", { name: OLDEST });
    await expect(table.locator("tbody tr")).toHaveCount(4);
    await expect(page.getByText("Total pending: $1,371.25 across 4 lessons")).toBeVisible();
    await expect(table.getByRole("columnheader")).toHaveText([
      "Student",
      "Date",
      "Duration",
      "Price",
      "Action",
    ]);
    await expect(table.locator("tbody td:nth-child(2)")).toHaveText([
      "Sep 5, 2026",
      "Oct 10, 2026",
      "Oct 10, 2026",
      "Nov 3, 2026",
    ]);
    await expect(table.locator("tbody td:nth-child(4)")).toHaveText([
      "$33.75",
      "$45.00",
      "$1,250.00",
      "$42.50",
    ]);
    await expect(page.getByRole("heading", { level: 2, name: "November 2026" })).toBeVisible();
    const figuresBefore = await homeFigures(page, "November 2026");
    expect(figuresBefore).toEqual([
      "Collected $0.00",
      "Pending $42.50",
      "Lessons 1",
      "Average per lesson $42.50",
    ]);

    await markDocument(page);
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith(`/api/lessons/${october}`)),
      page.getByRole("button", { name: "Mark as paid: Adam Lee, Oct 10, 2026" }).click(),
    ]);
    expect(response.status()).toBe(200);
    expect(response.request().postDataJSON()).toEqual({ paid: true });
    await expect(table.locator("tbody tr")).toHaveCount(3);
    await expect(page.getByText("Total pending: $1,326.25 across 3 lessons")).toBeVisible();
    await expect(status(page)).toHaveText(
      "Marked Adam Lee's lesson on Oct 10, 2026 as paid. Total pending: $1,326.25.",
    );
    await expect(
      page.getByRole("button", { name: "Mark as paid: Zoe Park, Oct 10, 2026" }),
    ).toBeFocused();
    expect(await sameDocument(page)).toBe(true);
    expect(await homeFigures(page, "November 2026")).toEqual(figuresBefore);

    await Promise.all([
      page.waitForResponse((r) => r.url().endsWith(`/api/lessons/${november}`)),
      page.getByRole("button", { name: "Mark as paid: Zoe Park, Nov 3, 2026" }).click(),
    ]);
    await expect
      .poll(() => homeFigures(page, "November 2026"))
      .toEqual(["Collected $42.50", "Pending $0.00", "Lessons 1", "Average per lesson $42.50"]);
    await expect(
      page.getByRole("table", { name: LATEST }).locator("tbody tr").first().locator("td").nth(4),
    ).toHaveText("Paid");
    expect(await sameDocument(page)).toBe(true);
    await expect(page.getByRole("button", { name: /^Undo paid/ })).toHaveCount(0);

    const summary = await summaryFigures(page);
    expect(summary.slice(0, 2)).toEqual(["Collected $42.50", "Pending $0.00"]);
  });

  test("AC-3b when Home's table empties, focus goes to the h2 'Oldest unpaid lessons'", async ({
    page,
  }) => {
    const zoe = await addStudent(page.request, "Zoe Park");
    await addLesson(page.request, zoe, "2026-10-10", 4500);
    await page.goto("/");
    await page.getByRole("button", { name: "Mark as paid: Zoe Park, Oct 10, 2026" }).click();
    await expect(
      page.getByRole("heading", { level: 2, name: "Oldest unpaid lessons" }),
    ).toBeFocused();
    await expect(page.getByText("Nothing pending. Every lesson is paid.")).toBeVisible();
  });

  test("AC-3d Saving…, then the F03 AC-6 failure alerts; nothing changes and focus returns", async ({
    page,
  }) => {
    await addF03Lessons(page.request);
    await page.goto("/");
    const figuresBefore = await homeFigures(page, "November 2026");
    const button = page.getByRole("button", { name: "Mark as paid: Adam Lee, Oct 10, 2026" });

    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/api/lessons/*", async (route) => {
      if (route.request().method() !== "PATCH") return route.fallback();
      await held;
      return route.fulfill({ status: 503, body: "" });
    });
    await button.click();
    await expect(button).toBeDisabled();
    await expect(button).toHaveText("Saving…");
    release();
    await expect(page.getByRole("alert")).toHaveText(
      "We couldn't reach Lesson Ledger. Please try again.",
    );
    await expect(button).toBeFocused();
    await expect(button).toBeEnabled();

    await page.unrouteAll();
    await page.route("**/api/lessons/*", (route) =>
      route.request().method() === "PATCH" ? route.abort() : route.fallback(),
    );
    await button.click();
    await expect(page.getByRole("alert")).toHaveText(
      "We couldn't reach Lesson Ledger. Please try again.",
    );
    await expect(button).toBeFocused();

    await page.unrouteAll();
    await page.route("**/api/lessons/*", (route) =>
      route.request().method() === "PATCH"
        ? route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({
              error: { code: "not_found", message: "Not found", details: {} },
            }),
          })
        : route.fallback(),
    );
    await button.click();
    await expect(page.getByRole("alert")).toHaveText(
      "That lesson could not be found. Reload the page and try again.",
    );
    await expect(button).toBeFocused();
    await expect(button).toBeEnabled();
    await expect(page.getByRole("table", { name: OLDEST }).locator("tbody tr")).toHaveCount(4);
    await expect(page.getByText("Total pending: $1,371.25 across 4 lessons")).toBeVisible();
    expect(await homeFigures(page, "November 2026")).toEqual(figuresBefore);
  });
});

const RECORD = "Record lesson on the Lessons page";
const ADD = "Add student on the Students page";

test.describe("F07 AC-4 quick actions", () => {
  test("AC-4a,b,c at 1280 px two links right of the h1: Record lesson black, Add student outlined", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await logIn(page, ALICE.email, ALICE.password);
    const h1 = await page.getByRole("heading", { level: 1 }).boundingBox();
    const style = (name: string) =>
      page.getByRole("link", { name, exact: true }).evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          text: el.textContent,
          background: s.backgroundColor,
          color: s.color,
          border: `${s.borderTopWidth} ${s.borderTopStyle}`,
        };
      });
    expect(await style(RECORD)).toEqual({
      text: "Record lesson",
      background: "rgb(0, 0, 0)",
      color: "rgb(255, 255, 255)",
      border: "1px solid",
    });
    expect(await style(ADD)).toMatchObject({
      text: "Add student",
      background: "rgb(255, 255, 255)",
      color: "rgb(29, 33, 39)",
      border: "1px solid",
    });
    for (const name of [RECORD, ADD]) {
      const box = await page.getByRole("link", { name, exact: true }).boundingBox();
      if (!h1 || !box) throw new Error("no box");
      expect(box.x, `${name} right of the h1`).toBeGreaterThanOrEqual(h1.x + h1.width);
      expect(box.y, `${name} in the title row`).toBeLessThan(h1.y + h1.height);
    }
    await expect(page.getByRole("button", { name: /Record lesson|Add student/ })).toHaveCount(0);
  });

  test("AC-4d,e the links open /lessons and /students without a reload; each form's submit is the only button of its name", async ({
    page,
  }) => {
    await logIn(page, ALICE.email, ALICE.password);
    await markDocument(page);
    await page.getByRole("link", { name: RECORD }).click();
    await expect(page).toHaveURL(/\/lessons$/);
    await expect(page.getByRole("button", { name: "Record lesson" })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Record lesson" })).toHaveAttribute(
      "type",
      "submit",
    );
    expect(await sameDocument(page)).toBe(true);

    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Home" })
      .click();
    await page.getByRole("link", { name: ADD }).click();
    await expect(page).toHaveURL(/\/students$/);
    await expect(page.getByRole("button", { name: "Add student" })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Add student" })).toHaveAttribute(
      "type",
      "submit",
    );
    expect(await sameDocument(page)).toBe(true);
  });
});

async function expectTitleRow(page: Page, email: string): Promise<void> {
  await expect(page.getByRole("heading", { level: 1, name: "Lesson Ledger" })).toBeVisible();
  await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
  await expect(page.getByRole("link", { name: RECORD })).toBeVisible();
  await expect(page.getByRole("link", { name: ADD })).toBeVisible();
}

test.describe("F07 AC-5 empty, partial and error states", () => {
  test("AC-5a bob: 'Get started' with two steps; no figures, tables, $0.00 or dash", async ({
    page,
  }) => {
    await logIn(page, BOB.email, BOB.password);
    const heading = page.getByRole("heading", { level: 2, name: "Get started" });
    await expect(heading).toBeVisible();
    const steps = page.locator("main ol > li");
    await expect(steps).toHaveText([
      "Add your students. Add your first student",
      "Record each lesson; Home then shows how the month is going and what is unpaid. Record your first lesson",
    ]);
    await expect(
      steps.nth(0).getByRole("link", { name: "Add your first student" }),
    ).toHaveAttribute("href", "/students");
    await expect(
      steps.nth(1).getByRole("link", { name: "Record your first lesson" }),
    ).toHaveAttribute("href", "/lessons");
    await expectTitleRow(page, BOB.email);
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(page.locator("main dl")).toHaveCount(0);
    await expect(page.getByRole("main")).not.toContainText("$0.00");
    await expect(page.getByRole("main")).not.toContainText("—");
  });

  test("AC-5e while a read is pending one 'Loading…' shows and 'Get started' never does", async ({
    page,
  }) => {
    await logIn(page, BOB.email, BOB.password);
    await watchForText(page, "Get started");
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/api/students?*", async (route) => {
      await held;
      await route.fallback();
    });
    await page.goto("/");
    await expect(page.getByRole("status").filter({ hasText: "Loading…" })).toHaveCount(1);
    await expectTitleRow(page, BOB.email);
    expect(await sawText(page)).toBe(false);
    await expect(page.getByRole("heading", { level: 2 })).toHaveCount(0);
    release();
    await expect(page.getByRole("heading", { level: 2, name: "Get started" })).toBeVisible();
    await expect(page.getByText("Loading…")).toHaveCount(0);
  });

  for (const pattern of [
    "**/api/monthly-summaries/*",
    "**/api/pending-lessons?*",
    "**/api/lessons?*",
    "**/api/students?*",
  ]) {
    test(`AC-5d alice with ${pattern} failing: only the load error below the title row; Try again recovers`, async ({
      page,
    }) => {
      await logIn(page, ALICE.email, ALICE.password);
      await expect(page.getByRole("table", { name: LATEST })).toBeVisible();
      await page.route(pattern, (route) => route.fulfill({ status: 503, body: "" }));
      await page.goto("/");
      await expect(page.getByRole("alert")).toHaveText("We couldn't reach Lesson Ledger.");
      await expectTitleRow(page, ALICE.email);
      await expect(page.getByRole("heading", { level: 2 })).toHaveCount(0);
      await expect(page.getByRole("table")).toHaveCount(0);
      await page.unrouteAll();
      await page.route(pattern, (route) => route.abort());
      await page.getByRole("button", { name: "Try again" }).click();
      await expect(page.getByRole("alert")).toHaveText("We couldn't reach Lesson Ledger.");
      await page.unrouteAll();
      await page.getByRole("button", { name: "Try again" }).click();
      await expect(page.getByRole("table", { name: OLDEST })).toBeVisible();
      await expect(page.getByRole("table", { name: LATEST })).toBeVisible();
      expect(await homeFigures(page)).toHaveLength(4);
    });
  }
});

test.describe("F07 AC-5 states of test-created teachers", () => {
  let email: string;

  test.beforeEach(async ({ page }) => {
    email = uniqueEmail();
    await signUp(page, email, PASSWORD);
  });
  test.afterEach(() => forgetTeacher(email));

  test("AC-5b one student, no lessons: zero figures, 'Nothing pending.', 'No lessons recorded yet.'", async ({
    page,
  }) => {
    await addStudent(page.request, "Zoe Park");
    await page.goto("/");
    expect(await homeFigures(page)).toEqual([
      "Collected $0.00",
      "Pending $0.00",
      "Lessons 0",
      "Average per lesson —",
    ]);
    await expect(page.getByText(`No lessons in ${monthName()}.`)).toBeVisible();
    await expect(
      page
        .getByRole("region", { name: "Oldest unpaid lessons" })
        .getByText("Nothing pending.", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Latest lessons" }).getByText("No lessons recorded yet."),
    ).toBeVisible();
    await expect(page.getByText("Get started")).toHaveCount(0);
  });

  test("AC-5c all lessons paid: 'Nothing pending. Every lesson is paid.', no table there", async ({
    page,
  }) => {
    const zoe = await addStudent(page.request, "Zoe Park");
    await addLesson(page.request, zoe, "2026-10-10", 4500, true);
    await page.goto("/");
    await expect(page.getByText("Nothing pending. Every lesson is paid.")).toBeVisible();
    await expect(page.getByRole("table", { name: OLDEST })).toHaveCount(0);
    await expect(page.getByRole("table", { name: LATEST }).locator("tbody tr")).toHaveCount(1);
    expect(await homeFigures(page)).toHaveLength(4);
  });
});
