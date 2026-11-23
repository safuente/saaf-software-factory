/** F06 AC-4 and AC-6 d: the month chip and the metrics panel of /summary, with a teacher created
 * by the test holding the F03 AC-1 data (November 2026: collected 4250, pending 6000, 3 lessons). */
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { expectNoClipOrOverlap, expectNoHorizontalScroll } from "./support/layout";
import { PASSWORD, forgetTeacher, signUp, uniqueEmail } from "./support/stack";

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
): Promise<void> {
  const response = await request.post("/api/lessons", {
    data: { student_id: studentId, date, duration_minutes: 45, price: { amount, currency: "USD" } },
  });
  expect(response.status()).toBe(201);
  if (paid) {
    const id: number = (await response.json()).id;
    expect((await request.patch(`/api/lessons/${id}`, { data: { paid: true } })).status()).toBe(
      200,
    );
  }
}

const panel = (page: Page) => page.locator("[data-metrics-panel]");
const pairs = (page: Page) => panel(page).locator("dl > div");

async function box(page: Page, selector: string) {
  const b = await page.locator(selector).first().boundingBox();
  if (!b) throw new Error(`${selector} has no box`);
  return b;
}

async function openNovember(page: Page): Promise<void> {
  await page.goto("/summary?month=2026-11");
  await expect(page.getByRole("table")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

test.describe("F06 AC-4 month chip and metrics panel", () => {
  const email = uniqueEmail();

  test.beforeEach(async ({ page }) => {
    await signUp(page, email, PASSWORD);
    const zoe = await addStudent(page.request, "Zoe Park");
    const adam = await addStudent(page.request, "Adam Lee");
    await addLesson(page.request, zoe, "2026-11-03", 4250, true);
    await addLesson(page.request, adam, "2026-11-10", 6000);
    await addLesson(page.request, zoe, "2026-11-10", 0);
    await page.setViewportSize({ width: 1280, height: 800 });
  });
  test.afterEach(() => forgetTeacher(email));

  test("AC-4a,b,g at 1280 x 800: chip, panel right of the table with its figures, bar at 41%, no new requests", async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on("request", (r) => {
      const url = new URL(r.url());
      if (url.pathname.startsWith("/api/"))
        requests.push(`${r.method()} ${url.pathname}${url.search}`);
    });
    await openNovember(page);

    // (a) the chip: Previous, the month heading in a rounded outlined chip, Next.
    const heading = page.getByRole("heading", { level: 2 });
    await expect(heading).toHaveText("November 2026");
    const chip = await heading.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        radius: parseFloat(s.borderTopLeftRadius),
        border: `${s.borderTopWidth} ${s.borderTopStyle}`,
      };
    });
    expect(chip.radius).toBeGreaterThanOrEqual(12);
    expect(chip.border).toBe("1px solid");
    const order = await page.evaluate(() =>
      [...document.querySelectorAll("main button, main h2")]
        .slice(0, 3)
        .map((el) => el.textContent),
    );
    expect(order).toEqual(["Previous month", "November 2026", "Next month"]);

    // (b) the panel, right of the table, with the totals, bar, percentages and average.
    await expect(pairs(page)).toHaveText(["Lessons: 3", "Collected: $42.50", "Pending: $60.00"]);
    await expect(panel(page).locator("dt")).toHaveText(["Lessons:", "Collected:", "Pending:"]);
    await expect(panel(page).locator("dd")).toHaveText(["3", "$42.50", "$60.00"]);
    const panelBox = await box(page, "[data-metrics-panel]");
    const tableBox = await box(page, "[role=region]");
    expect(panelBox.x).toBeGreaterThanOrEqual(tableBox.x + tableBox.width);
    const bar = panel(page).locator("svg");
    await expect(bar).toHaveAttribute("aria-hidden", "true");
    const barBox = await bar.boundingBox();
    const paidBox = await bar.locator("[data-segment=paid]").boundingBox();
    expect(barBox && paidBox).toBeTruthy();
    expect(Math.abs((paidBox?.width ?? 0) / (barBox?.width ?? 1) - 0.41)).toBeLessThanOrEqual(0.01);
    await expect(panel(page).getByText("41% paid · 59% pending", { exact: true })).toBeVisible();
    await expect(
      panel(page).getByText("Average per lesson: $34.17", { exact: true }),
    ).toBeVisible();

    // (g) only F03's requests.
    expect(new Set(requests)).toEqual(
      new Set([
        "GET /api/sessions/current",
        "GET /api/monthly-summaries/2026-11",
        "GET /api/lessons?month=2026-11&page=1&page_size=500",
      ]),
    );
  });

  test("AC-4c Mark as paid on lesson B updates the panel without reload; average and announcement unchanged", async ({
    page,
  }) => {
    await openNovember(page);
    await page.evaluate(() => {
      (window as unknown as { __same: boolean }).__same = true;
    });
    await page.getByRole("button", { name: "Mark as paid: Adam Lee, Nov 10, 2026" }).click();
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Marked as paid. Collected: $102.50, pending: $0.00." }),
    ).toBeVisible();
    await expect(pairs(page)).toHaveText(["Lessons: 3", "Collected: $102.50", "Pending: $0.00"]);
    await expect(panel(page).getByText("100% paid · 0% pending", { exact: true })).toBeVisible();
    await expect(
      panel(page).getByText("Average per lesson: $34.17", { exact: true }),
    ).toBeVisible();
    const barBox = await panel(page).locator("svg").boundingBox();
    const paidBox = await panel(page).locator("[data-segment=paid]").boundingBox();
    expect(Math.abs((paidBox?.width ?? 0) - (barBox?.width ?? 1))).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => (window as unknown as { __same?: boolean }).__same)).toBe(
      true,
    );
  });

  test("AC-4d an empty month: zeros, empty bar, 'No amounts this month.', average '—', no table", async ({
    page,
  }) => {
    await page.goto("/summary?month=2026-08");
    await expect(page.getByText("No lessons in August 2026.")).toBeVisible();
    await expect(pairs(page)).toHaveText(["Lessons: 0", "Collected: $0.00", "Pending: $0.00"]);
    await expect(panel(page).locator("[data-segment]")).toHaveCount(0);
    await expect(panel(page).getByText("No amounts this month.", { exact: true })).toBeVisible();
    await expect(panel(page).getByText(/% paid/)).toHaveCount(0);
    await expect(panel(page).getByText("Average per lesson: —", { exact: true })).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
  });

  test("AC-4e below 1280 px the panel sits between the chip and the table, full width of main", async ({
    page,
  }) => {
    await openNovember(page);
    for (const width of [1279, 1024, 768, 375]) {
      await page.setViewportSize({ width, height: 800 });
      const chip = await box(page, "main h2");
      const p = await box(page, "[data-metrics-panel]");
      const region = await box(page, "[role=region]");
      const content = await page.locator("main").evaluate((main) => {
        const s = getComputedStyle(main);
        const r = main.getBoundingClientRect();
        return {
          x: r.x + parseFloat(s.paddingLeft),
          width: main.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight),
        };
      });
      expect(p.y, `${width}: below the chip`).toBeGreaterThanOrEqual(chip.y + chip.height);
      expect(p.y + p.height, `${width}: above the table`).toBeLessThanOrEqual(region.y);
      expect(Math.abs(p.x - content.x), `${width}: left edge`).toBeLessThanOrEqual(1);
      expect(Math.abs(p.width - content.width), `${width}: full width`).toBeLessThanOrEqual(1);
    }
  });

  test("AC-4f on load error: Try again and no panel", async ({ page }) => {
    await page.route("**/api/monthly-summaries/*", (route) =>
      route.fulfill({ status: 503, body: "" }),
    );
    await page.goto("/summary?month=2026-11");
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
    await expect(panel(page)).toHaveCount(0);
  });

  test("AC-6d at 375, 768 and 1280 px the panel and the chip cause no horizontal scroll, clipping or overlap", async ({
    page,
  }) => {
    await openNovember(page);
    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await expectNoHorizontalScroll(page, `/summary at ${width}`);
      await expectNoClipOrOverlap(page, "[data-metrics-panel]", `panel at ${width}`);
      await expectNoClipOrOverlap(page, "main", `main at ${width}`);
      const chip = await box(page, "main h2");
      expect(chip.x + chip.width, `${width}: chip inside the viewport`).toBeLessThanOrEqual(width);
    }
  });
});
