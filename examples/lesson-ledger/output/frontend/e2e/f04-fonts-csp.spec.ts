/** F04 AC-5 and F05 AC-5: self-hosted fonts load under the unchanged Content-Security-Policy on
 * /login, /signup and every app page (/, /lessons, /students, /summary, /pending). */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { ALICE, logIn } from "./support/stack";

/** The policy served before F04 (F00), byte for byte. */
const CSP =
  "default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'";
const FONTS_DIR = path.resolve(import.meta.dirname, "../src/shared/styles/fonts");
const DESIGN_DOC = path.resolve(import.meta.dirname, "../../docs/design.md");

/** Font families from the Typefaces table of docs/design.md. */
function designFamilies(): string[] {
  const text = readFileSync(DESIGN_DOC, "utf8");
  const typefaces = text.split("## Typefaces")[1]?.split("\n## ")[0] ?? "";
  return typefaces
    .split("\n")
    .filter((line) => /^\| `[a-z-]+` \|/.test(line))
    .map((line) => line.split("|")[3]?.trim() ?? "");
}

interface Watch {
  failed: string[];
  fonts: { url: string; status: number }[];
}

/** Records failed requests, server errors and font responses; counts CSP violations. */
async function watch(page: Page): Promise<Watch> {
  const watched: Watch = { failed: [], fonts: [] };
  page.on("requestfailed", (r) => watched.failed.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on("response", (r) => {
    if (r.status() >= 500) watched.failed.push(`${r.url()} ${r.status()}`);
    if (r.request().resourceType() === "font")
      watched.fonts.push({ url: r.url(), status: r.status() });
  });
  await page.addInitScript(() => {
    const w = window as unknown as { __cspViolations: string[] };
    w.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (e) =>
      w.__cspViolations.push(`${e.violatedDirective} ${e.blockedURI}`),
    );
  });
  return watched;
}

async function expectPageClean(page: Page, pathname: string, watched: Watch): Promise<void> {
  const response = await page.goto(pathname);
  expect(response?.headers()["content-security-policy"], `${pathname} CSP`).toBe(CSP);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Loading…" })).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);

  const faces = await page.evaluate(() =>
    [...document.fonts].map((f) => ({ family: f.family.replace(/["']/g, ""), status: f.status })),
  );
  for (const family of designFamilies()) {
    const loaded = faces.filter((f) => f.family === family && f.status === "loaded");
    expect(loaded.length, `${pathname}: ${family} loaded`).toBeGreaterThan(0);
  }
  const violations = await page.evaluate(
    () => (window as unknown as { __cspViolations: string[] }).__cspViolations,
  );
  expect(violations, `${pathname} CSP violations`).toEqual([]);
  expect(watched.failed, `${pathname} failed requests`).toEqual([]);
  const origin = new URL(process.env.APP_URL ?? "").origin;
  expect(watched.fonts.length, `${pathname} font requests`).toBeGreaterThan(0);
  for (const font of watched.fonts) {
    expect(new URL(font.url).origin, font.url).toBe(origin);
    expect(font.status, font.url).toBeLessThan(400);
  }
}

test.describe("AC-5 fonts and CSP", () => {
  test("AC-5 typefaces of docs/design.md are 1 or 2 families", () => {
    const families = designFamilies();
    expect(families.length).toBeGreaterThanOrEqual(1);
    expect(families.length).toBeLessThanOrEqual(2);
  });

  for (const pathname of ["/login", "/signup"]) {
    test(`AC-5 ${pathname} loads own-origin fonts with no CSP violation`, async ({ page }) => {
      const watched = await watch(page);
      await expectPageClean(page, pathname, watched);
    });
  }

  test("AC-5 app pages load own-origin fonts with no CSP violation", async ({ page, context }) => {
    await logIn(page, ALICE.email, ALICE.password);
    for (const pathname of ["/", "/lessons", "/students", "/summary", "/pending"]) {
      // A fresh tab per page, so a request the previous navigation aborted is not counted.
      const tab = await context.newPage();
      const watched = await watch(tab);
      await expectPageClean(tab, pathname, watched);
      await tab.close();
    }
  });

  test("AC-5 every font file is WOFF2 with its family's license committed next to it", () => {
    expect(existsSync(FONTS_DIR), "fonts directory").toBe(true);
    const families = readdirSync(FONTS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());
    expect(families.length).toBe(designFamilies().length);
    for (const dir of families) {
      const files = readdirSync(path.join(FONTS_DIR, dir.name));
      const fonts = files.filter((f) => !/^OFL\.txt$/.test(f));
      expect(fonts.length, dir.name).toBeGreaterThan(0);
      expect(
        fonts.every((f) => f.endsWith(".woff2")),
        `${dir.name}: ${fonts}`,
      ).toBe(true);
      const license = readFileSync(path.join(FONTS_DIR, dir.name, "OFL.txt"), "utf8");
      expect(license).toContain("SIL OPEN FONT LICENSE Version 1.1");
      expect(license).toMatch(/redistribute/i);
    }
  });
});
