/**
 * The F05 AC-6 (a) to (d), (f) and (g) checks of one page state, shared by the F05 pages spec
 * and the F07 Home spec (moved here from f05-pages.spec.ts unchanged).
 */
import { expect, type Page } from "@playwright/test";
import {
  elementsOutside,
  expectNoAxeViolations,
  expectNoClipOrOverlap,
  expectNoHorizontalScroll,
  longestMotion,
  smallTargets,
  tabThrough,
  themeLength,
  wideTextBlocks,
} from "./layout";

/** Puts the sequential focus starting point at the top of the page, before the header. */
export async function focusFromTop(page: Page): Promise<void> {
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo(0, 0);
  });
  await page.mouse.click(1, 1);
}

/** Headings, labels, fields, buttons, links, messages, captions and table headers shown. */
async function shownControls(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        "h1, h2, label, input, select, button, a, [role=alert], [role=status], p, caption, th",
      ),
    ]
      .filter((el) => (el.checkVisibility?.() ?? true) && el.getClientRects().length > 0)
      .map((el) => `${el.tagName}:${(el.textContent || el.id).trim()}`)
      .filter((name) => !name.endsWith(":")),
  );
}

/** Fixed elements, and sticky elements that stick vertically (a top or bottom offset). */
async function verticallyStuck(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((el) => {
        const style = getComputedStyle(el);
        if (style.position === "fixed") return true;
        return style.position === "sticky" && (style.top !== "auto" || style.bottom !== "auto");
      })
      .map((el) => `${el.tagName} ${Math.round(el.getBoundingClientRect().height)}`),
  );
}

/** Runs the checks on the opened page, which is at 1280 x 800 with reduced motion. `tab` adds
 * the tab-through checks of (a) and (g); `layout` runs page-specific layout checks at each
 * width of (b) and (c). Leaves the root font size doubled. F09: `minStops` (default 6) lets
 * the four-control signed-out pages run the tab checks; `motion: "on"` runs them without
 * reduced motion, where ADR-007/ADR-008 motion is bounded by a second instead of being off. */
export async function checkPageState(
  page: Page,
  name: string,
  options: {
    tab: boolean;
    layout?: (width: number) => Promise<void>;
    minStops?: number;
    motion?: "reduced" | "on";
  },
): Promise<void> {
  // (a) at 1280 x 800 with reduced motion: axe, targets, motion, focus.
  await expectNoAxeViolations(page, `${name} AC-6a`);
  expect(await smallTargets(page, "body"), `${name}: small targets`).toEqual([]);
  expect(await longestMotion(page), `${name}: motion`).toBeLessThanOrEqual(
    options.motion === "on" ? 1000 : 0.01,
  );
  if (options.tab) {
    await focusFromTop(page);
    const stops = await tabThrough(page, "body", 80);
    expect(stops.length, `${name}: tab stops`).toBeGreaterThanOrEqual(options.minStops ?? 6);
    for (const stop of stops) {
      expect(stop.indicator, `${name}: focus indicator on ${stop.name}`).toBe(true);
      expect(stop.covered, `${name}: ${stop.name} covered`).toBe(false);
    }
  }

  // (b) common widths.
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await expectNoHorizontalScroll(page, `${name} at ${width}`);
    await expectNoClipOrOverlap(page, "body", `${name} at ${width}`);
    await options.layout?.(width);
  }

  // (c) reflow at 320 x 568.
  await page.setViewportSize({ width: 320, height: 568 });
  await expectNoHorizontalScroll(page, `${name} at 320`);
  expect(await elementsOutside(page, "body", 320), `${name}: outside 0-320`).toEqual([]);
  await expectNoClipOrOverlap(page, "body", `${name} at 320`);
  await options.layout?.(320);

  // (d) wide screen at 1920 x 1080.
  await page.setViewportSize({ width: 1920, height: 1080 });
  const max = await themeLength(page, "--container-content");
  for (const selector of ["main", "header > div"]) {
    const width = (await page.locator(selector).boundingBox())?.width ?? Infinity;
    expect(width, `${name}: ${selector} at 1920`).toBeLessThanOrEqual(max);
  }
  expect(await wideTextBlocks(page, "body", 80), `${name}: lines over 80ch`).toEqual([]);

  // (g) short landscape at 667 x 375.
  await page.setViewportSize({ width: 667, height: 375 });
  for (const stuck of await verticallyStuck(page)) {
    expect(Number(stuck.split(" ")[1]), `${name}: ${stuck}`).toBeLessThanOrEqual(375 * 0.25);
  }
  if (options.tab) {
    await focusFromTop(page);
    for (const stop of await tabThrough(page, "body", 80)) {
      expect(stop.inViewportWhereItFits, `${name}: ${stop.name} in view`).toBe(true);
      expect(stop.covered, `${name}: ${stop.name} covered`).toBe(false);
    }
  }

  // (f) text resized to 200% at 1280 x 800, through the CSSOM.
  await page.setViewportSize({ width: 1280, height: 800 });
  const before = await shownControls(page);
  const root = await page.evaluate(() => {
    const size = parseFloat(getComputedStyle(document.documentElement).fontSize);
    document.documentElement.style.fontSize = `${size * 2}px`;
    return parseFloat(getComputedStyle(document.documentElement).fontSize);
  });
  // Twice the root at load: 16 px since F06 (was 18 px with the F04 identity).
  expect(root).toBe(32);
  await expectNoHorizontalScroll(page, `${name} 200%`);
  await expectNoClipOrOverlap(page, "body", `${name} 200%`);
  expect(await shownControls(page), `${name}: shown at 200%`).toEqual(before);
}
