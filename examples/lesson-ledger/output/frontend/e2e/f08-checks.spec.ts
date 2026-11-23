/**
 * F08 AC-6 a, c: the F05 AC-6 per-state checks on the illustrated states of AC-3; icons, logo,
 * wordmark and illustrations at 200% text; the CSP of every page byte-identical to F07's and no
 * CSP violation on any page, with and without reduced motion. Seed accounts are read only.
 */
import { expect, test, type Page } from "@playwright/test";
import { ILLUSTRATED } from "./support/f08";
import { APP_PAGES } from "./support/layout";
import { checkPageState } from "./support/pageChecks";
import { ALICE, BOB, logIn } from "./support/stack";

/** The CSP header of F07, byte for byte (ADR-002). */
const F07_CSP =
  "default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'";

/**
 * Icons, the logo, the wordmark and illustrations that are clipped by an ancestor, reach outside
 * the viewport horizontally, or overlap text that is not their own control's.
 */
async function graphicsProblems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const problems: string[] = [];
    const graphics = [
      ...document.querySelectorAll("svg.lucide, [data-brand] svg, svg[data-illustration]"),
      ...document.querySelectorAll("[data-brand] span"),
    ];
    const texts = [
      ...document.querySelectorAll<HTMLElement>(
        "a, button, label, h1, h2, h3, p, li, th, td, dt, dd, caption, [role=status], [role=alert], span",
      ),
    ].filter((el) => el.getClientRects().length > 0 && (el.textContent ?? "").trim() !== "");
    for (const g of graphics) {
      const r = g.getBoundingClientRect();
      const name = `${g.tagName} ${g.getAttribute("class") ?? ""} in "${(g.parentElement?.textContent ?? "").trim().slice(0, 30)}"`;
      if (r.width === 0 || r.height === 0) problems.push(`${name}: not drawn`);
      if (r.left < -0.5 || r.right > window.innerWidth + 0.5) {
        const scrollable = g.closest("[role=region]");
        if (!scrollable) problems.push(`${name}: outside the viewport`);
      }
      for (let a = g.parentElement; a && a !== document.body; a = a.parentElement) {
        const s = getComputedStyle(a);
        if (s.overflowX === "visible" && s.overflowY === "visible") continue;
        const b = a.getBoundingClientRect();
        if (
          r.left < b.left - 0.5 ||
          r.right > b.right + 0.5 ||
          r.top < b.top - 0.5 ||
          r.bottom > b.bottom + 0.5
        ) {
          if (!(a.getAttribute("role") === "region"))
            problems.push(`${name}: clipped by ${a.tagName}`);
        }
      }
      for (const t of texts) {
        if (t.contains(g) || g.contains(t)) continue;
        const o = t.getBoundingClientRect();
        const x = Math.min(r.right, o.right) - Math.max(r.left, o.left);
        const y = Math.min(r.bottom, o.bottom) - Math.max(r.top, o.top);
        if (x > 1 && y > 1)
          problems.push(
            `${name}: overlaps ${t.tagName} "${(t.textContent ?? "").trim().slice(0, 30)}"`,
          );
      }
    }
    return problems;
  });
}

async function openReady(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Loading…", { exact: true })).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
}

test.describe("F08 AC-6a F05 AC-6 checks on the illustrated states", () => {
  for (const state of ILLUSTRATED) {
    test(`AC-6a ${state.who.email} ${state.path}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await logIn(page, state.who.email, state.who.password);
      await openReady(page, state.path);
      await expect(page.locator("svg[data-illustration]")).toHaveCount(1);
      await checkPageState(page, `${state.who.email} ${state.path}`, { tab: true });
    });
  }
});

test.describe("F08 AC-6a graphics at every width and at 200% text", () => {
  const cases = [
    { who: null, paths: ["/login", "/signup"] },
    { who: ALICE, paths: [...APP_PAGES] },
    { who: BOB, paths: [...APP_PAGES] },
  ];
  for (const { who, paths } of cases) {
    test(`AC-6a ${who?.email ?? "signed out"}: no graphic clipped, outside or over text`, async ({
      page,
    }) => {
      if (who) await logIn(page, who.email, who.password);
      for (const path of paths) {
        for (const width of [320, 375, 768, 1280]) {
          await page.setViewportSize({ width, height: 800 });
          await openReady(page, path);
          expect(await graphicsProblems(page), `${path} at ${width}`).toEqual([]);
        }
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.evaluate(() => {
          document.documentElement.style.fontSize = "32px";
        });
        expect(await graphicsProblems(page), `${path} at 200%`).toEqual([]);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
          `${path} at 200%: horizontal scroll`,
        ).toBeLessThanOrEqual(0);
      }
    });
  }
});

test.describe("F08 AC-6c CSP", () => {
  for (const reducedMotion of ["reduce", "no-preference"] as const) {
    test(`AC-6c every page's CSP is F07's and no violation fires (${reducedMotion})`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion });
      await page.addInitScript(() => {
        const w = window as unknown as { __violations: string[] };
        w.__violations = [];
        document.addEventListener("securitypolicyviolation", (e) =>
          w.__violations.push(`${e.violatedDirective} ${e.blockedURI}`),
        );
      });
      const violations = async () =>
        page.evaluate(() => (window as unknown as { __violations: string[] }).__violations);
      for (const path of ["/login", "/signup"]) {
        const response = await page.goto(path);
        expect(response?.headers()["content-security-policy"], path).toBe(F07_CSP);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        expect(await violations(), path).toEqual([]);
      }
      await logIn(page, ALICE.email, ALICE.password);
      for (const path of [...APP_PAGES, "/summary?month=2000-01"]) {
        const response = await page.goto(path);
        expect(response?.headers()["content-security-policy"], path).toBe(F07_CSP);
        await openReady(page, path);
        expect(await violations(), path).toEqual([]);
      }
      const icon = await page.request.get("/favicon.svg");
      expect(icon.headers()["content-security-policy"]).toBe(F07_CSP);
    });
  }
});
