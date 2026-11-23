/** F06 AC-1 b, c: the sizes docs/design.md states are what the production build renders, and
 * the build output carries no trace of the manuscript identity of F04/F05. */
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { ALICE, logIn } from "./support/stack";

const DESIGN_DOC = path.resolve(import.meta.dirname, "../../docs/design.md");

/** Where each element of the "Rendered sizes" table is measured. */
const SELECTORS: Record<string, string> = {
  "`h1`": "main h1",
  // Paragraphs without an id: hints and field errors have ids and use the small step.
  "Body text": "main p:not([id])",
  Label: "main label",
  "Text field": "main input",
  Button: "main button",
  "Table cell": "main td",
  "Sidebar link": "header nav a",
};

/** The "Rendered sizes" section: the stated root and one [element, px] pair per table row. */
function statedSizes(): { root: number; rows: [string, number][] } {
  const text = readFileSync(DESIGN_DOC, "utf8");
  const body = text.split("\n## Rendered sizes")[1]?.split("\n## ")[0] ?? "";
  const root = Number(/root font size[^.]*?\b(\d+(?:\.\d+)?) px\b/i.exec(body)?.[1]);
  const rows = body
    .split("\n")
    .filter((line) => /^\| [^-|]/.test(line) && !line.startsWith("| Element"))
    .map((line) => line.split("|").map((cell) => cell.trim()))
    .map((cells): [string, number] => [cells[1] ?? "", parseFloat(cells[2] ?? "")]);
  return { root, rows };
}

async function fontSizes(page: Page, selector: string): Promise<number[]> {
  return page
    .locator(selector)
    .evaluateAll((els) =>
      els
        .filter((el) => el.getClientRects().length > 0)
        .map((el) => parseFloat(getComputedStyle(el).fontSize)),
    );
}

test.use({ viewport: { width: 1280, height: 800 } });

test("AC-1b the root and element font sizes of docs/design.md are rendered on /login, / and /lessons", async ({
  page,
}) => {
  const { root, rows } = statedSizes();
  expect(rows.length).toBe(Object.keys(SELECTORS).length);
  const measured = new Map<string, number[]>();

  const measure = async () => {
    await page.evaluate(() => document.fonts.ready);
    expect(await fontSizes(page, "html")).toEqual([root]);
    for (const [element] of rows) {
      const selector = SELECTORS[element];
      expect(selector, element).toBeDefined();
      measured.set(element, [
        ...(measured.get(element) ?? []),
        ...(await fontSizes(page, selector ?? "")),
      ]);
    }
  };

  await page.goto("/login");
  await measure();
  await logIn(page, ALICE.email, ALICE.password);
  await measure();
  await page.goto("/lessons");
  await expect(page.getByRole("table")).toBeVisible();
  await measure();

  for (const [element, px] of rows) {
    const sizes = measured.get(element) ?? [];
    expect(sizes.length, `${element} measured`).toBeGreaterThan(0);
    expect(new Set(sizes), element).toEqual(new Set([px]));
  }
});

test("AC-1c the build output names no stave, note head, piano key, bar line, F04 palette name or Alegreya", async ({
  page,
}) => {
  const response = await page.goto("/login");
  const html = (await response?.text()) ?? "";
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g)].map(
    (m) => m[1] ?? "",
  );
  expect(assets.length).toBeGreaterThanOrEqual(2);
  const manuscript =
    /stave|note.?head|piano|bar.?line|white.?key|alegreya|rounded-note|--radius-key|--color-(paper|sheet|ink|pencil|verdigris|brass|correction)\b|\b(bg|text|border|outline)-(paper|sheet|ink|pencil|stave|verdigris|brass|correction)\b/i;
  for (const text of [
    html,
    ...(await Promise.all(assets.map(async (a) => (await page.request.get(a)).text()))),
  ]) {
    expect(manuscript.exec(text)?.[0]).toBeUndefined();
  }
});
