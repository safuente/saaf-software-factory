/**
 * F09 AC-1, AC-2 and AC-5 (a, d, e): the brand on Log in and Sign up (ADR-008), measured in the
 * production build with reduced motion. From 1024 px a dark brand panel sits left of a white
 * card holding the h1 and the F01 form; below it a brand strip sits above the form.
 */
import { expect, test, type Page } from "@playwright/test";
import { contrast } from "./support/f08";
import { APP_PAGES, expectNoHorizontalScroll, tabThrough, themeLength } from "./support/layout";
import { focusFromTop } from "./support/pageChecks";
import { ALICE, logIn } from "./support/stack";

const VALUE_LINE = "Lessons, payments and pending fees in one place";
const SHELL = "rgb(27, 31, 38)";
const CANVAS = "rgb(255, 255, 255)";
const PAID = "rgb(23, 128, 61)";
const PAGES = [
  { path: "/login", heading: "Log in", title: "Log in · Lesson Ledger", submit: "Log in" },
  {
    path: "/signup",
    heading: "Create your account",
    title: "Create your account · Lesson Ledger",
    submit: "Create account",
  },
] as const;
const LINKS: Record<string, string> = { "/login": "Create an account", "/signup": "Log in" };

async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

/** Geometry and colours of the panel, the wordmark, the value line, the card and the form. */
async function layout(page: Page) {
  return page.evaluate((valueLine) => {
    const header = document.querySelector("header") as HTMLElement;
    const main = document.querySelector("main") as HTMLElement;
    const h1 = main.querySelector("h1") as HTMLElement;
    const card = h1.parentElement as HTMLElement;
    const form = main.querySelector("form") as HTMLElement;
    const leaf = (text: string) =>
      [...header.querySelectorAll<HTMLElement>("*")].find(
        (el) => el.children.length === 0 && el.textContent?.trim() === text,
      ) as HTMLElement;
    const wordmark = leaf("Lesson Ledger");
    const value = leaf(valueLine);
    const box = (el: Element) => el.getBoundingClientRect();
    const css = (el: Element) => getComputedStyle(el);
    // `measure` (68ch) resolved in the value line's own font.
    const probe = document.createElement("div");
    probe.style.position = "absolute";
    probe.style.width = "var(--container-measure)";
    value.append(probe);
    const measure = probe.getBoundingClientRect().width;
    probe.remove();
    const visibleSvgs = [...document.querySelectorAll("svg")].filter(
      (svg) => svg.checkVisibility() && box(svg).width > 0 && box(svg).height > 0,
    );
    const positions = [header, main, ...header.querySelectorAll("*")].map((el) => css(el).position);
    return {
      headerBeforeMain: Boolean(
        header.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING,
      ),
      headers: document.querySelectorAll("header").length,
      mains: document.querySelectorAll("main").length,
      header: box(header).toJSON() as DOMRect,
      main: box(main).toJSON() as DOMRect,
      headerBackground: css(header).backgroundColor,
      stuck: positions.filter((p) => p === "fixed" || p === "sticky"),
      wordmarkSize: parseFloat(css(wordmark).fontSize),
      wordmarkColour: css(wordmark).color,
      wordmarkVisible: wordmark.checkVisibility(),
      valueColour: css(value).color,
      valueWidth: box(value).width,
      valueVisible: value.checkVisibility(),
      measure,
      visibleSvgs: visibleSvgs.length,
      svgsOutsideHeader: visibleSvgs.filter((svg) => !header.contains(svg)).length,
      mainBackground: css(main).backgroundColor,
      card: box(card).toJSON() as DOMRect,
      cardBackground: css(card).backgroundColor,
      cardRadius: css(card).borderTopLeftRadius,
      cardTop: { colour: css(card).borderTopColor, width: parseFloat(css(card).borderTopWidth) },
      cardPadding: parseFloat(css(card).paddingLeft) + parseFloat(css(card).paddingRight),
      form: box(form).toJSON() as DOMRect,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    };
  }, VALUE_LINE);
}

test.describe("F09 AC-1 wide layout", () => {
  for (const viewport of [
    { width: 1024, height: 768 },
    { width: 1280, height: 800 },
    { width: 1920, height: 1080 },
  ]) {
    for (const p of PAGES) {
      test(`AC-1 ${p.path} at ${viewport.width}x${viewport.height}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await open(page, p.path);
        const l = await layout(page);
        const at = `${p.path} ${viewport.width}`;
        const form = await themeLength(page, "--container-form");
        const panelRadius = await page.evaluate(() => {
          const probe = document.createElement("div");
          probe.style.borderRadius = "var(--radius-panel)";
          document.body.append(probe);
          const value = getComputedStyle(probe).borderTopLeftRadius;
          probe.remove();
          return value;
        });

        // (a) header (panel) on the left, at least as tall as the viewport, then main.
        expect([l.headers, l.mains, l.headerBeforeMain], at).toEqual([1, 1, true]);
        expect(l.headerBackground, at).toBe(SHELL);
        expect(l.header.left, at).toBeLessThanOrEqual(0.5);
        expect(l.header.right, at).toBeLessThanOrEqual(l.main.left + 0.5);
        expect(l.header.height, at).toBeGreaterThanOrEqual(viewport.height - 0.5);
        expect(l.stuck, at).toEqual([]);

        // (b, c) mark, wordmark, value line and illustration are shown: two drawings.
        await expect(page.locator("header")).toHaveText(`Lesson Ledger${VALUE_LINE}`);
        expect(l.visibleSvgs, at).toBe(2);
        expect(l.svgsOutsideHeader, at).toBe(0);

        // (d) the wordmark is larger than the shell's 18 px; both texts >= 4.5:1 on shell.
        expect(l.wordmarkSize, at).toBeGreaterThan(18);
        expect(contrast(l.wordmarkColour, l.headerBackground), at).toBeGreaterThanOrEqual(4.5);
        expect(contrast(l.valueColour, l.headerBackground), at).toBeGreaterThanOrEqual(4.5);
        await expect(page.locator("body").getByText("Lesson Ledger", { exact: true })).toHaveCount(
          1,
        );

        // (e) a white card with the panel radius and a paid top bar, no wider than the form
        // plus its padding, inside the viewport; controls keep their F08 look.
        expect(l.cardBackground, at).toBe(CANVAS);
        expect(l.cardRadius, at).toBe(panelRadius);
        expect(l.cardTop.colour, at).toBe(PAID);
        expect(l.cardTop.width, at).toBeGreaterThanOrEqual(3);
        expect(l.card.width, at).toBeLessThanOrEqual(form + l.cardPadding + 0.5);
        expect(l.card.left, at).toBeGreaterThanOrEqual(l.main.left - 0.5);
        expect(l.card.right, at).toBeLessThanOrEqual(l.innerWidth + 0.5);
        expect(l.form.width, at).toBeLessThanOrEqual(form + 0.5);
        const button = await page
          .getByRole("button", { name: p.submit })
          .evaluate((el) => [getComputedStyle(el).backgroundColor, getComputedStyle(el).color]);
        expect(button, at).toEqual(["rgb(0, 0, 0)", CANVAS]);
        const field = await page
          .getByLabel("Email")
          .evaluate((el) => getComputedStyle(el).borderTopColor);
        expect(field, at).toBe("rgb(134, 141, 152)");

        // (f) the value line keeps to the measure; no horizontal scroll.
        expect(l.valueWidth, at).toBeLessThanOrEqual(l.measure + 0.5);
        await expectNoHorizontalScroll(page, at);
      });
    }
  }
});

test.describe("F09 AC-2 narrow layout", () => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 375, height: 667 },
    { width: 768, height: 1024 },
    { width: 667, height: 375 },
  ]) {
    for (const p of PAGES) {
      test(`AC-2 ${p.path} at ${viewport.width}x${viewport.height}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await open(page, p.path);
        const l = await layout(page);
        const at = `${p.path} ${viewport.width}x${viewport.height}`;
        const form = await themeLength(page, "--container-form");

        // (a) a full-width shell strip first, with mark, wordmark and value line, no drawing
        // other than the mark anywhere on the page.
        expect([l.headers, l.mains, l.headerBeforeMain], at).toEqual([1, 1, true]);
        expect(l.headerBackground, at).toBe(SHELL);
        expect(l.header.top, at).toBeLessThanOrEqual(0.5);
        expect(l.header.left, at).toBeLessThanOrEqual(0.5);
        expect(l.header.width, at).toBeGreaterThanOrEqual(l.innerWidth - 0.5);
        expect(l.header.bottom, at).toBeLessThanOrEqual(l.main.top + 0.5);
        expect(l.wordmarkVisible && l.valueVisible, at).toBe(true);
        expect(l.visibleSvgs, at).toBe(1);
        expect(l.svgsOutsideHeader, at).toBe(0);
        expect(contrast(l.wordmarkColour, l.headerBackground), at).toBeGreaterThanOrEqual(4.5);
        expect(contrast(l.valueColour, l.headerBackground), at).toBeGreaterThanOrEqual(4.5);
        await expect(page.locator("body").getByText("Lesson Ledger", { exact: true })).toHaveCount(
          1,
        );

        // (b) the h1 and the form in the form column on the white page: no card.
        expect(l.mainBackground, at).toBe(CANVAS);
        expect(l.form.width, at).toBeLessThanOrEqual(form + 0.5);
        expect(l.cardTop.width, at).toBe(0);
        expect(["rgba(0, 0, 0, 0)", CANVAS], at).toContain(l.cardBackground);

        // (c) nothing fixed or sticky, no horizontal scroll.
        expect(l.stuck, at).toEqual([]);
        await expectNoHorizontalScroll(page, at);
        if (viewport.width === 667) {
          await focusFromTop(page);
          const stops = await tabThrough(page, "body", 12);
          expect(stops.length, at).toBe(4);
          for (const stop of stops) expect(stop.covered, `${at}: ${stop.name}`).toBe(false);
        }
      });
    }
  }
});

test.describe("F09 AC-5 F01 behaviour, accessibility and devices", () => {
  for (const width of [375, 1280]) {
    for (const p of PAGES) {
      test(`AC-5a ${p.path} at ${width}: one main, one h1, no nav, title and Tab order`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 800 });
        await open(page, p.path);
        await expect(page).toHaveTitle(p.title);
        await expect(page.getByRole("main")).toHaveCount(1);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(p.heading);
        await expect(page.getByRole("heading")).toHaveCount(1);
        await expect(page.getByRole("navigation")).toHaveCount(0);
        await expect(page.getByRole("textbox", { name: "Email", exact: true })).toBeVisible();
        await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: p.submit, exact: true })).toBeVisible();
        const link = LINKS[p.path] ?? "";
        await expect(page.getByRole("link", { name: link, exact: true })).toBeVisible();
        await focusFromTop(page);
        const stops = await tabThrough(page, "body", 12);
        expect(stops.map((s) => s.name)).toEqual([
          'INPUT "email"',
          'INPUT "password"',
          `BUTTON "${p.submit}"`,
          `A "${link}"`,
        ]);
      });
    }
  }

  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 375, height: 667 },
  ]) {
    for (const p of PAGES) {
      test(`AC-5d ${p.path} at ${viewport.width} with 200% text: wraps, no clipping or overlap`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await open(page, p.path);
        await page.evaluate(() => {
          document.documentElement.style.fontSize = "200%";
        });
        const problems = await page.evaluate(() => {
          const found: string[] = [];
          const header = document.querySelector("header") as HTMLElement;
          const parts = [...header.querySelectorAll<Element>("svg, span, p")].filter(
            (el) => el.checkVisibility() && el.getBoundingClientRect().width > 0,
          );
          for (const el of parts) {
            const r = el.getBoundingClientRect();
            if (r.left < -0.5 || r.right > window.innerWidth + 0.5)
              found.push(`${el.tagName} outside`);
            if (el instanceof HTMLElement && el.scrollWidth > el.clientWidth + 1)
              found.push(`${el.tagName} overflows`);
            for (const other of parts) {
              if (other === el || other.contains(el) || el.contains(other)) continue;
              const o = other.getBoundingClientRect();
              const x = Math.min(r.right, o.right) - Math.max(r.left, o.left);
              const y = Math.min(r.bottom, o.bottom) - Math.max(r.top, o.top);
              if (x > 1 && y > 1) found.push(`${el.tagName} over ${other.tagName}`);
            }
          }
          const form = document.querySelector("form")?.getBoundingClientRect();
          if (!form || form.left < -0.5 || form.right > window.innerWidth + 0.5)
            found.push("form outside");
          return found;
        });
        expect(problems).toEqual([]);
        await expectNoHorizontalScroll(page, `${p.path} 200%`);
      });
    }
  }

  test("AC-5e app pages show no brand panel, strip, value line or new illustration", async ({
    page,
  }) => {
    await page.route("**/api/sessions/current", (route) => route.fulfill({ status: 503 }));
    await page.goto("/");
    await expect(page.getByText("We couldn't reach Lesson Ledger.")).toBeVisible();
    await expect(page.getByText(VALUE_LINE)).toHaveCount(0);
    await expect(page.locator("header")).toHaveCount(0);
    await page.unrouteAll();

    await logIn(page, ALICE.email, ALICE.password);
    for (const width of [375, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      for (const path of APP_PAGES) {
        await page.goto(path);
        await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
        await expect(page.getByText(VALUE_LINE), path).toHaveCount(0);
        await expect(page.locator("svg[data-brand-illustration]"), path).toHaveCount(0);
        await expect(page.locator("header"), path).toHaveCount(1);
      }
    }
  });
});
