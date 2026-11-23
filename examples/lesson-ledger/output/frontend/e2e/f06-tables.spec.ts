/** F06 AC-3 with seed teacher alice: grey column headers, initials before every student's
 * name (hidden from assistive technology), worded payment status with a tick and colour, and
 * the students list in the same style. Structure and the F05 scroll checks are in
 * f05-tables.spec.ts. */
import { expect, test, type Locator, type Page } from "@playwright/test";
import { ALICE, logIn } from "./support/stack";

const TABLES = [
  { path: "/lessons", caption: "Your lessons, newest first", status: 5 },
  { path: "/summary", caption: /^Lessons in .+, newest first$/, status: 5 },
  { path: "/pending", caption: "Unpaid lessons, oldest first", status: 0 },
];

/** Alice's previous month has lessons (seed); the current month may have none. */
function previousMonth(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function openTable(page: Page, path: string, caption: string | RegExp): Promise<Locator> {
  await page.goto(path === "/summary" ? `/summary?month=${previousMonth()}` : path);
  const table = page.getByRole("table", { name: caption });
  await expect(table).toBeVisible();
  return table;
}

function contrast(a: string, b: string): number {
  const lum = (c: string) => {
    const [r, g, bl] = (c.match(/[\d.]+/g) ?? []).slice(0, 3).map((v) => {
      const s = Number(v) / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (bl ?? 0);
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

/** The initials a name element shows through its ::before box, and that box's size. */
const shownInitials = (el: Element) => {
  const before = getComputedStyle(el, "::before");
  return {
    content: before.content,
    attr: el.getAttribute("data-initials"),
    width: parseFloat(before.width),
    radius: before.borderTopLeftRadius,
  };
};

const initialsOf = (name: string) => {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words.at(-1)?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
};

test.beforeEach(async ({ page }) => {
  await logIn(page, ALICE.email, ALICE.password);
});

test("AC-3a header cells are grey text, distinct from the body cells", async ({ page }) => {
  for (const spec of TABLES) {
    const table = await openTable(page, spec.path, spec.caption);
    const head = await table
      .locator("thead th")
      .first()
      .evaluate((el) => getComputedStyle(el).color);
    const body = await table
      .locator("tbody td")
      .first()
      .evaluate((el) => getComputedStyle(el).color);
    expect(head, spec.path).toBe("rgb(91, 98, 109)");
    expect(body, spec.path).not.toBe(head);
  }
});

test("AC-3b each Student cell shows the initials circle; the cell's accessible text is exactly the name", async ({
  page,
}) => {
  for (const spec of TABLES) {
    const table = await openTable(page, spec.path, spec.caption);
    const cells = table.locator("tbody tr td:nth-child(1)");
    const count = await cells.count();
    expect(count, spec.path).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const cell = cells.nth(i);
      const name = ((await cell.textContent()) ?? "").trim();
      const shown = await cell.locator("[data-initials]").evaluate(shownInitials);
      expect(shown.attr, name).toBe(initialsOf(name));
      expect(shown.content, name).toMatch(/attr\(data-initials\)|"[^"]+"/);
      expect(shown.width, name).toBeGreaterThan(20);
      expect(await cell.ariaSnapshot(), name).toBe(`- cell "${name}"`);
    }
    await expect(table.getByRole("columnheader")).toHaveCount(
      spec.path === "/pending" ? 5 : spec.path === "/lessons" ? 5 : 6,
    );
  }
});

test("AC-3c Status cells show '✓ Paid' in green or 'Unpaid' in amber, 4.5:1, reading exactly Paid or Unpaid", async ({
  page,
}) => {
  const seen = new Set<string>();
  for (const spec of TABLES.filter((t) => t.status)) {
    const table = await openTable(page, spec.path, spec.caption);
    const cells = table.locator(`tbody tr td:nth-child(${spec.status})`);
    const count = await cells.count();
    for (let i = 0; i < count; i++) {
      const cell = cells.nth(i);
      const info = await cell.evaluate((td) => {
        const span = td.firstElementChild as HTMLElement;
        return {
          text: td.textContent,
          tick: getComputedStyle(span, "::before").content,
          color: getComputedStyle(span).color,
          ground: getComputedStyle(td).backgroundColor,
        };
      });
      const ground = info.ground === "rgba(0, 0, 0, 0)" ? "rgb(255, 255, 255)" : info.ground;
      expect(contrast(info.color, ground), `${spec.path} ${info.text}`).toBeGreaterThanOrEqual(4.5);
      if (info.text === "Paid") {
        expect(info.tick).toContain("✓");
        expect(info.color).toBe("rgb(23, 128, 61)");
      } else {
        expect(info.text).toBe("Unpaid");
        expect(info.tick).toBe("none");
        expect(info.color).toBe("rgb(154, 91, 0)");
      }
      expect(await cell.ariaSnapshot()).toBe(`- cell "${info.text}"`);
      seen.add(info.text ?? "");
    }
  }
  expect(seen).toEqual(new Set(["Paid", "Unpaid"]));
});

test("AC-3d /students: ruled rows with initials, names as the text", async ({ page }) => {
  await page.goto("/students");
  const list = page.getByRole("list", { name: "Your students" });
  await expect(list).toBeVisible();
  const items = list.getByRole("listitem");
  const count = await items.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const item = items.nth(i);
    const name = ((await item.textContent()) ?? "").trim();
    const shown = await item.locator("[data-initials]").evaluate(shownInitials);
    expect(shown.attr, name).toBe(initialsOf(name));
    expect(shown.width, name).toBeGreaterThan(20);
    expect(await item.evaluate((el) => getComputedStyle(el).borderBottom)).toMatch(/^1px solid/);
    expect(await item.evaluate((el) => getComputedStyle(el).listStyleType)).toBe("none");
    expect(await item.ariaSnapshot()).toBe(`- listitem: ${name}`);
  }
});

test('AC-3d /students: the list\'s label "Your students" is grey like the table headers', async ({
  page,
}) => {
  await page.goto("/students");
  await expect(page.getByRole("list", { name: "Your students" })).toBeVisible();
  const label = page.getByRole("heading", { level: 2, name: "Your students" });
  expect(await label.evaluate((el) => getComputedStyle(el).color)).toBe("rgb(91, 98, 109)");
});
