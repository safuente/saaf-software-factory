/**
 * F05 AC-3: the ledger tables of /lessons, /summary and /pending with seed teacher alice:
 * structure, row rules (F06: single 1 px), money alignment, status text, totals, the Student column staying in
 * view while a table scrolls sideways on phones, and the width cap on wide screens.
 */
import { expect, test, type Locator, type Page } from "@playwright/test";
import { ALICE, logIn } from "./support/stack";

interface TableSpec {
  path: string;
  caption: string | RegExp;
  columns: string[];
}

const TABLES: TableSpec[] = [
  {
    path: "/lessons",
    caption: "Your lessons, newest first",
    columns: ["Student", "Date", "Duration", "Price", "Status"],
  },
  {
    path: "/summary",
    caption: /^Lessons in .+, newest first$/,
    columns: ["Student", "Date", "Duration", "Price", "Status", "Action"],
  },
  {
    path: "/pending",
    caption: "Unpaid lessons, oldest first",
    columns: ["Student", "Date", "Duration", "Price", "Action"],
  },
];

async function openTable(page: Page, spec: TableSpec): Promise<Locator> {
  await page.goto(spec.path);
  await expect(page.getByRole("status").filter({ hasText: "Loading…" })).toHaveCount(0);
  const table = page.getByRole("table", { name: spec.caption });
  await expect(table).toBeVisible();
  return table;
}

test.beforeEach(async ({ page }) => {
  await logIn(page, ALICE.email, ALICE.password);
});

test.describe("AC-3 ledger tables", () => {
  for (const spec of TABLES) {
    test(`AC-3a ${spec.path}: shared table, caption, columns in order, single row rules (F06), money right-aligned`, async ({
      page,
    }) => {
      const table = await openTable(page, spec);
      await expect(table.locator("caption")).toHaveText(spec.caption);
      await expect(table.getByRole("columnheader")).toHaveText(spec.columns);
      expect(await table.locator("tbody tr").count()).toBeGreaterThan(0);

      const region = page.getByRole("region", { name: spec.caption });
      await expect(region).toHaveAttribute("tabindex", "0");
      await expect(region.locator(":scope > table")).toHaveCount(1);

      // F06 AC-3a (replaces the F05 double rule): a single 1 px rule under every header and
      // row, no gap between cells, no double rule or bar line.
      const rules = await table.locator("th, td").evaluateAll((cells) =>
        cells.map((c) => {
          const s = getComputedStyle(c);
          return `${s.borderBottomWidth} ${s.borderBottomStyle} ${s.borderRightWidth}`;
        }),
      );
      expect(new Set(rules)).toEqual(new Set(["1px solid 0px"]));
      expect(await table.evaluate((t) => getComputedStyle(t).borderSpacing)).toMatch(
        /^0px( 0px)?$/,
      );

      const price = spec.columns.indexOf("Price") + 1;
      const cells = table.locator(`thead th:nth-child(${price}), tbody td:nth-child(${price})`);
      const styles = await cells.evaluateAll((els) =>
        els.map((el) => {
          const style = getComputedStyle(el);
          return `${style.textAlign} ${style.fontVariantNumeric}`;
        }),
      );
      expect(new Set(styles)).toEqual(new Set(["right tabular-nums"]));
    });
  }

  test("AC-3b the Status column of /lessons and /summary says Paid or Unpaid in every row", async ({
    page,
  }) => {
    for (const spec of TABLES.filter((t) => t.columns.includes("Status"))) {
      const table = await openTable(page, spec);
      const column = spec.columns.indexOf("Status") + 1;
      const texts = await table.locator(`tbody td:nth-child(${column})`).allTextContents();
      expect(texts.length, spec.path).toBeGreaterThan(0);
      for (const text of texts) expect(["Paid", "Unpaid"], spec.path).toContain(text.trim());
    }
  });

  test("AC-3c summary totals stay a description list; /pending keeps its total line", async ({
    page,
  }) => {
    await openTable(page, TABLES[1] as TableSpec);
    await expect(page.locator("main dl dt")).toHaveText(["Lessons:", "Collected:", "Pending:"]);
    await expect(page.locator("main dl > div")).toHaveCount(3);

    await openTable(page, TABLES[2] as TableSpec);
    await expect(page.getByText(/^Total pending: \$[\d,.]+ across \d+ lessons?$/)).toBeVisible();
  });

  for (const width of [320, 375]) {
    test(`AC-3d at ${width} px the Student cell stays in view after scrolling a table fully right`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 640 });
      let scrolled = 0;
      for (const spec of TABLES) {
        await openTable(page, spec);
        const region = page.getByRole("region", { name: spec.caption });
        const scrolls = await region.evaluate((el) => el.scrollWidth > el.clientWidth);
        if (!scrolls) continue;
        scrolled++;
        const failures = await region.evaluate(async (el) => {
          el.scrollLeft = el.scrollWidth;
          await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
          const failing: string[] = [];
          for (const row of el.querySelectorAll("tbody tr")) {
            const cell = row.querySelector("td") as HTMLElement;
            // Bring the row into the viewport vertically without touching the region's scrollLeft.
            const top = cell.getBoundingClientRect().top + window.scrollY;
            window.scrollTo(0, top - window.innerHeight / 2);
            const box = el.getBoundingClientRect();
            const visible = {
              left: box.left + el.clientLeft,
              right: box.left + el.clientLeft + el.clientWidth,
              top: box.top + el.clientTop,
              bottom: box.top + el.clientTop + el.clientHeight,
            };
            const r = cell.getBoundingClientRect();
            const inside =
              r.left >= visible.left - 0.5 &&
              r.right <= visible.right + 0.5 &&
              r.top >= visible.top - 0.5 &&
              r.bottom <= visible.bottom + 0.5;
            const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            const topmost = hit === cell || (hit !== null && cell.contains(hit));
            if (!inside || !topmost) {
              failing.push(
                `${cell.textContent?.trim()}: inside ${inside}, topmost ${topmost} (hit ${hit?.tagName} "${hit?.textContent?.trim().slice(0, 20)}")`,
              );
            }
          }
          return failing;
        });
        expect(failures, `${spec.path} at ${width}`).toEqual([]);
      }
      expect(scrolled, "at least one table scrolls sideways").toBeGreaterThan(0);
    });
  }

  for (const width of [1280, 1920]) {
    test(`AC-3e at ${width} px a table is at most as wide as main`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const spec of TABLES) {
        const table = await openTable(page, spec);
        const main = (await page.locator("main").boundingBox())?.width ?? 0;
        const tableWidth = (await table.boundingBox())?.width ?? Infinity;
        const regionWidth =
          (await page.getByRole("region", { name: spec.caption }).boundingBox())?.width ?? Infinity;
        expect(tableWidth, `${spec.path} table`).toBeLessThanOrEqual(main);
        expect(regionWidth, `${spec.path} region`).toBeLessThanOrEqual(main);
      }
    });
  }
});

/** Ways the pinned Student column or the region's edges cut into the table at rest: a column
 * partly under the pinned column (UX-2: "$45.00" read as "45.00"), the caption cut by the
 * region's visible box, or the focused control not fully between the pinned column and the
 * region's right edge. */
function restProblems(el: HTMLElement): string[] {
  const problems: string[] = [];
  const box = el.getBoundingClientRect();
  const left = box.left + el.clientLeft;
  const right = left + el.clientWidth;
  const headers = [...el.querySelectorAll("thead th")];
  const pinned = (headers[0] as HTMLElement).getBoundingClientRect().right;
  for (const header of headers.slice(1)) {
    const r = header.getBoundingClientRect();
    if (r.left < pinned - 0.5 && r.right > pinned + 0.5) {
      problems.push(`${header.textContent} partly under the Student column`);
    }
  }
  const range = document.createRange();
  range.selectNodeContents(el.querySelector("caption") as HTMLElement);
  const caption = range.getBoundingClientRect();
  if (caption.left < left - 0.5 || caption.right > right + 0.5) {
    problems.push(`caption cut: ${Math.round(caption.left)}-${Math.round(caption.right)}`);
  }
  const focused = document.activeElement;
  if (focused && focused !== el && el.contains(focused)) {
    const f = focused.getBoundingClientRect();
    if (f.left < pinned - 0.5 || f.right > right + 0.5) {
      problems.push(`focused ${focused.getAttribute("aria-label")} not fully in view`);
    }
  }
  return problems;
}

test.describe("UX-2 sideways scrolling keeps whole columns and the caption in view", () => {
  for (const width of [320, 375]) {
    test(`UX-2 at ${width} px after scrolling or focusing, no column is cut by the Student column and the caption stays in view`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 640 });
      let scrolled = 0;
      for (const spec of TABLES) {
        await openTable(page, spec);
        const region = page.getByRole("region", { name: spec.caption });
        if (!(await region.evaluate((el) => el.scrollWidth > el.clientWidth))) continue;
        scrolled++;
        for (const fraction of [0.15, 0.35, 0.5, 0.65, 0.85, 1]) {
          await region.evaluate((el, f) => {
            el.scrollLeft = (el.scrollWidth - el.clientWidth) * f;
          }, fraction);
          await expect
            .poll(() => region.evaluate(restProblems), {
              message: `${spec.path} at ${width} px scrolled to ${fraction}`,
            })
            .toEqual([]);
        }
        const buttons = region.getByRole("button");
        const count = Math.min(await buttons.count(), 3);
        for (let i = 0; i < count; i++) {
          await region.evaluate((el) => {
            el.scrollLeft = 0;
          });
          await buttons.nth(i).focus();
          await expect
            .poll(() => region.evaluate(restProblems), {
              message: `${spec.path} at ${width} px with button ${i + 1} focused`,
            })
            .toEqual([]);
        }
      }
      expect(scrolled, "at least one table scrolls sideways").toBeGreaterThan(0);
    });
  }
});
