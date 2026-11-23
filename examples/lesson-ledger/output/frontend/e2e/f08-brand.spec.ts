/** F08 AC-2: logo mark and wordmark in the sidebar and the top bar (on log-in and sign-up in
 * their brand panel since F09, ADR-008), and the favicon served from the app's origin with the app's security headers. */
import { expect, test, type Page } from "@playwright/test";
import { APP_PAGES, tabThrough } from "./support/layout";
import { focusFromTop } from "./support/pageChecks";
import { ALICE, logIn } from "./support/stack";

const SECURITY_HEADERS = ["content-security-policy", "x-content-type-options", "referrer-policy"];

/** Where the brand sits in the header, and the landmarks the page keeps. */
async function brandLayout(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector("header");
    const brand = header?.querySelector("[data-brand]");
    const nav = header?.querySelector('nav[aria-label="Main"]');
    const mark = brand?.querySelector("svg");
    const box = (el: Element | null | undefined) => el?.getBoundingClientRect();
    const firstText = [...(header?.querySelectorAll("*") ?? [])].find(
      (el) => el.children.length === 0 && (el.textContent ?? "").trim() !== "",
    );
    return {
      exists: Boolean(brand),
      text: brand?.textContent ?? "",
      markHidden: mark?.getAttribute("aria-hidden"),
      markFirst: brand?.firstElementChild === mark,
      brandBeforeNav: Boolean(
        brand && nav && brand.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING,
      ),
      firstTextInBrand: Boolean(brand && firstText && brand.contains(firstText)),
      brandBottom: box(brand)?.bottom ?? NaN,
      brandRight: box(brand)?.right ?? NaN,
      navTop: box(nav)?.top ?? NaN,
      firstLinkLeft: box(nav?.querySelector("a"))?.left ?? NaN,
      firstLinkTop: box(nav?.querySelector("a"))?.top ?? NaN,
      brandTop: box(brand)?.top ?? NaN,
      interactive: brand?.querySelectorAll("a, button, [tabindex], h1, h2, h3").length ?? -1,
      insideInteractive: Boolean(brand?.closest("a, button, h1, h2, h3")),
      h1: document.querySelectorAll("h1").length,
      main: document.querySelectorAll("main").length,
      navs: document.querySelectorAll('nav[aria-label="Main"]').length,
    };
  });
}

test.describe("F08 AC-2 brand in the shell", () => {
  test.beforeEach(async ({ page }) => {
    await logIn(page, ALICE.email, ALICE.password);
  });

  test("AC-2a at 1280 px the sidebar starts with the mark and 'Lesson Ledger', above the nav", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    for (const path of APP_PAGES) {
      await page.goto(path);
      await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
      const b = await brandLayout(page);
      expect(b.exists, path).toBe(true);
      expect(b.text, path).toBe("Lesson Ledger");
      expect(b.markHidden, path).toBe("true");
      expect(b.markFirst && b.brandBeforeNav && b.firstTextInBrand, path).toBe(true);
      expect(b.brandBottom, `${path}: above the nav`).toBeLessThanOrEqual(b.navTop);
      expect(b.interactive + Number(b.insideInteractive), path).toBe(0);
      expect([b.h1, b.main, b.navs], path).toEqual([1, 1, 1]);
      await expect(
        page.locator("header").getByText("Lesson Ledger", { exact: true }),
      ).toBeVisible();
    }
  });

  test("AC-2a below 1024 px the top bar starts with the same pair, before the links", async ({
    page,
  }) => {
    for (const width of [375, 768]) {
      await page.setViewportSize({ width, height: 800 });
      for (const path of APP_PAGES) {
        await page.goto(path);
        await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
        const b = await brandLayout(page);
        expect(b.text, `${path} ${width}`).toBe("Lesson Ledger");
        expect(b.brandBeforeNav && b.firstTextInBrand, `${path} ${width}`).toBe(true);
        const before =
          b.brandBottom <= b.firstLinkTop + 1 ||
          (b.brandRight <= b.firstLinkLeft + 1 && b.brandTop < b.firstLinkTop + 40);
        expect(before, `${path} ${width}: brand before the links`).toBe(true);
      }
    }
  });

  test("AC-2a the Tab order is unchanged: the brand is never a stop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/lessons");
    await expect(page.getByRole("table")).toBeVisible();
    await focusFromTop(page);
    const stops = await tabThrough(page, "header", 12);
    expect(stops.filter((s) => s.inScope).map((s) => s.name)).toEqual([
      'A "Home"',
      'A "Lessons"',
      'A "Students"',
      'A "Monthly summary"',
      'A "Pending payments"',
      'BUTTON "Log out"',
    ]);
  });
});

// F09 (ADR-008) replaces F08 AC-2 (b): /login and /signup now carry the mark and the wordmark
// in their own brand panel (checked in full by e2e/f09-signed-out.spec.ts, AC-1 and AC-2).
test("AC-2b (F09) /login and /signup show the mark and wordmark once, in the brand header only", async ({
  page,
}) => {
  for (const path of ["/login", "/signup"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const wordmark = page.locator("body").getByText("Lesson Ledger", { exact: true });
    await expect(wordmark, path).toHaveCount(1);
    await expect(page.locator("header").getByText("Lesson Ledger", { exact: true })).toBeVisible();
    await expect(page.getByRole("navigation"), path).toHaveCount(0);
    expect(await page.locator("main svg").count(), path).toBe(0);
  }
});

test("AC-2c /favicon.svg is served as image/svg+xml with the security headers of /", async ({
  request,
  page,
}) => {
  const root = await request.get("/");
  const icon = await request.get("/favicon.svg");
  expect(icon.status()).toBe(200);
  expect(icon.headers()["content-type"]).toMatch(/^image\/svg\+xml\b/);
  for (const name of SECURITY_HEADERS) {
    expect(icon.headers()[name], name).toBe(root.headers()[name]);
    expect(root.headers()[name], name).toBeTruthy();
  }
  await page.goto("/login");
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", "/favicon.svg");
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("type", "image/svg+xml");
});
