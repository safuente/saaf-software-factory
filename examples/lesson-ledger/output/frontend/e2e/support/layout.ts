/**
 * Layout checks of F04 AC-6, run in the page. Terms as in the spec:
 * - no horizontal page scroll: document scrollWidth <= viewport width;
 * - clipped: a text element with scrollWidth > clientWidth or scrollHeight > clientHeight whose
 *   computed overflow is not `visible`;
 * - overlap: bounding boxes of two visible, non-nested interactive elements, labels, headings or
 *   messages intersecting by more than 1 CSS px.
 * `scope` is a CSS selector for the restyled part being checked (`body` on /login and /signup,
 * `header` on app pages).
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export const NAV_LINKS = ["Home", "Lessons", "Students", "Monthly summary", "Pending payments"];
export const APP_PAGES = ["/", "/lessons", "/students", "/summary", "/pending"];

/** Interactive elements, labels, headings and messages (the spec's overlap set). */
const OVERLAP_SET =
  "a, button, input, select, textarea, label, h1, h2, h3, [role=alert], [role=status], p";
/** Elements that carry text and could be clipped. */
const TEXT_SET = "a, button, label, h1, h2, h3, p, li, legend, caption, th, td, span";
const INTERACTIVE = "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])";

export async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

export async function expectNoHorizontalScroll(page: Page, state: string): Promise<void> {
  expect(await horizontalOverflow(page), `${state}: horizontal page scroll`).toBeLessThanOrEqual(0);
}

/** Clipped text elements inside `scope`, described for the failure message. */
export async function clippedElements(page: Page, scope: string): Promise<string[]> {
  return page.evaluate(
    ({ scope, textSet }) => {
      const visible = (el: Element) => (el as HTMLElement).checkVisibility?.() ?? true;
      const clipped: string[] = [];
      for (const root of document.querySelectorAll(scope)) {
        for (const el of root.querySelectorAll<HTMLElement>(textSet)) {
          if (!visible(el) || !el.textContent?.trim()) continue;
          const style = getComputedStyle(el);
          const hidesX = style.overflowX !== "visible";
          const hidesY = style.overflowY !== "visible";
          if (
            (hidesX && el.scrollWidth > el.clientWidth) ||
            (hidesY && el.scrollHeight > el.clientHeight)
          ) {
            clipped.push(`${el.tagName} "${el.textContent.trim().slice(0, 40)}"`);
          }
        }
      }
      return clipped;
    },
    { scope, textSet: TEXT_SET },
  );
}

/** Pairs of overlapping elements inside `scope`. */
export async function overlappingElements(page: Page, scope: string): Promise<string[]> {
  return page.evaluate(
    ({ scope, overlapSet }) => {
      const label = (el: Element) =>
        `${el.tagName}"${(el.textContent || el.getAttribute("aria-label") || el.id).trim().slice(0, 30)}"`;
      const els = [...document.querySelectorAll(scope)]
        .flatMap((root) => [...root.querySelectorAll<HTMLElement>(overlapSet)])
        .filter((el) => (el.checkVisibility?.() ?? true) && el.getClientRects().length > 0)
        .filter((el) => el.tagName !== "P" || el.textContent?.trim())
        // F05 AC-6: cells inside a table's scroll region are excluded (AC-3 d covers them).
        .filter((el) => !el.closest("div")?.querySelector(":scope > table"));
      const overlaps: string[] = [];
      for (let i = 0; i < els.length; i++) {
        for (let j = i + 1; j < els.length; j++) {
          const a = els[i] as HTMLElement;
          const b = els[j] as HTMLElement;
          if (a.contains(b) || b.contains(a)) continue;
          const ra = a.getBoundingClientRect();
          const rb = b.getBoundingClientRect();
          const x = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          const y = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (x > 1 && y > 1) overlaps.push(`${label(a)} / ${label(b)}`);
        }
      }
      return overlaps;
    },
    { scope, overlapSet: OVERLAP_SET },
  );
}

export async function expectNoClipOrOverlap(page: Page, scope: string, state: string) {
  expect(await clippedElements(page, scope), `${state}: clipped`).toEqual([]);
  expect(await overlappingElements(page, scope), `${state}: overlapping`).toEqual([]);
}

/** Visible elements of `scope` that reach outside 0..width horizontally, except content inside a
 * table's own scroll container. */
export async function elementsOutside(page: Page, scope: string, width: number): Promise<string[]> {
  return page.evaluate(
    ({ scope, width }) => {
      const outside: string[] = [];
      for (const root of document.querySelectorAll(scope)) {
        for (const el of [root, ...root.querySelectorAll<HTMLElement>("*")]) {
          if (!(el.checkVisibility?.() ?? true) || el.getClientRects().length === 0) continue;
          const scroller = el.closest("div");
          if (scroller?.querySelector(":scope > table") && el !== scroller) continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) continue;
          if (r.left < -0.5 || r.right > width + 0.5) {
            outside.push(`${el.tagName} ${Math.round(r.left)}..${Math.round(r.right)}`);
          }
        }
      }
      return outside;
    },
    { scope, width },
  );
}

/** Targets smaller than 24x24 CSS px that do not meet the WCAG 2.5.8 spacing exception: a
 * 24 px circle centred on the target must not intersect another target or another undersized
 * target's circle. */
export async function smallTargets(page: Page, scope: string): Promise<string[]> {
  return page.evaluate(
    ({ scope, interactive }) => {
      const targets = [...document.querySelectorAll(scope)]
        .flatMap((root) => [...root.querySelectorAll<HTMLElement>(interactive)])
        .filter((el) => (el.checkVisibility?.() ?? true) && el.getClientRects().length > 0)
        .map((el) => ({ el, r: el.getBoundingClientRect() }));
      const small = targets.filter(({ r }) => r.width < 24 || r.height < 24);
      const centre = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      const distanceToRect = (p: { x: number; y: number }, r: DOMRect) =>
        Math.hypot(
          Math.max(r.left - p.x, 0, p.x - r.right),
          Math.max(r.top - p.y, 0, p.y - r.bottom),
        );
      const failing: string[] = [];
      for (const target of small) {
        const c = centre(target.r);
        const clash = targets.some(
          (other) =>
            other !== target &&
            (distanceToRect(c, other.r) < 12 ||
              (small.includes(other) &&
                Math.hypot(c.x - centre(other.r).x, c.y - centre(other.r).y) < 24)),
        );
        if (clash) {
          failing.push(
            `${target.el.tagName} "${target.el.textContent?.trim()}" ${Math.round(target.r.width)}x${Math.round(target.r.height)}`,
          );
        }
      }
      return failing;
    },
    { scope, interactive: INTERACTIVE },
  );
}

/** Body-text blocks whose rendered width is over `limit` "0" glyphs of their own font. */
export async function wideTextBlocks(page: Page, scope: string, limit: number): Promise<string[]> {
  return page.evaluate(
    ({ scope, limit }) => {
      const canvas = document.createElement("canvas").getContext("2d");
      if (!canvas) return ["no canvas"];
      const wide: string[] = [];
      for (const root of document.querySelectorAll(scope)) {
        for (const el of root.querySelectorAll<HTMLElement>(
          // F05 AC-6d adds list items and totals (description lists).
          "p, label, li, dl, [role=alert], [role=status]",
        )) {
          if (!(el.checkVisibility?.() ?? true) || el.getClientRects().length === 0) continue;
          canvas.font = getComputedStyle(el).font;
          const zero = canvas.measureText("0").width;
          const ch = el.getBoundingClientRect().width / zero;
          if (ch > limit)
            wide.push(`${el.tagName} "${el.textContent?.trim().slice(0, 30)}" ${ch.toFixed(1)}ch`);
        }
      }
      return wide;
    },
    { scope, limit },
  );
}

/** Width in CSS px of a theme length variable such as --container-content (rem based). */
export async function themeLength(page: Page, name: string): Promise<number> {
  return page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.style.width = `var(${name})`;
    probe.style.position = "absolute";
    document.body.append(probe);
    const width = probe.getBoundingClientRect().width;
    probe.remove();
    return width;
  }, name);
}

export async function expectNoAxeViolations(page: Page, state: string, scope?: string) {
  let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]);
  if (scope) builder = builder.include(scope);
  const results = await builder.analyze();
  const summary = results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`);
  expect(summary, `${state}: axe`).toEqual([]);
}

interface FocusStop {
  name: string;
  inScope: boolean;
  indicator: boolean;
  covered: boolean;
  inViewport: boolean;
  /** Fully in view on every axis where it fits in the viewport; on an axis where it is larger
   * than the viewport (a tall table region in short landscape), it fills the viewport, so as
   * much of it as can be shown is shown. */
  inViewportWhereItFits: boolean;
  /** The focus ring (outline width plus offset around the box) is fully in the viewport, for
   * an element that fits in it (UI-2). Elements larger than the viewport report true. */
  ringInViewport: boolean;
}

/** Presses Tab until focus leaves the page or cycles, describing each focused element. */
export async function tabThrough(page: Page, scope: string, max = 60): Promise<FocusStop[]> {
  const stops: FocusStop[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    const stop = await page.evaluate((scope) => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      const indicator =
        (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0) ||
        style.boxShadow !== "none";
      const r = el.getBoundingClientRect();
      const covered = [...document.querySelectorAll<HTMLElement>("body *")].some((other) => {
        const position = getComputedStyle(other).position;
        if (position !== "fixed" && position !== "sticky") return false;
        // A sticky cell inside a focused table region is part of it, not covering it.
        if (other.contains(el) || el.contains(other)) return false;
        const o = other.getBoundingClientRect();
        return o.left < r.right && o.right > r.left && o.top < r.bottom && o.bottom > r.top;
      });
      // Half a CSS px of tolerance: scrolling into view lands on whole pixels while text boxes
      // end on fractions (18 px x 1.55 line height).
      const inViewport =
        r.left >= -0.5 &&
        r.top >= -0.5 &&
        r.right <= window.innerWidth + 0.5 &&
        r.bottom <= window.innerHeight + 0.5;
      const fitsX = r.width <= window.innerWidth;
      const fitsY = r.height <= window.innerHeight;
      const inX = fitsX
        ? r.left >= -0.5 && r.right <= window.innerWidth + 0.5
        : r.left <= 0.5 && r.right >= window.innerWidth - 0.5;
      const inY = fitsY
        ? r.top >= -0.5 && r.bottom <= window.innerHeight + 0.5
        : r.top <= 0.5 && r.bottom >= window.innerHeight - 0.5;
      const ring =
        style.outlineStyle !== "none"
          ? parseFloat(style.outlineWidth) + Math.max(0, parseFloat(style.outlineOffset))
          : 0;
      const ringInViewport =
        !fitsX ||
        !fitsY ||
        (r.left - ring >= -0.5 &&
          r.top - ring >= -0.5 &&
          r.right + ring <= window.innerWidth + 0.5 &&
          r.bottom + ring <= window.innerHeight + 0.5);
      const index = [...document.querySelectorAll("*")].indexOf(el);
      return {
        key: `${index}`,
        name: `${el.tagName} "${(el.textContent || el.getAttribute("aria-label") || el.id).trim().slice(0, 30)}"`,
        inScope: Boolean(el.closest(scope)),
        indicator,
        covered,
        inViewport,
        inViewportWhereItFits: inX && inY,
        ringInViewport,
      };
    }, scope);
    if (!stop || seen.has(stop.key)) break;
    seen.add(stop.key);
    stops.push(stop);
  }
  return stops;
}

/** Longest transition or animation duration on any element or pseudo-element, in ms. */
export async function longestMotion(page: Page): Promise<number> {
  return page.evaluate(() => {
    const ms = (value: string) =>
      Math.max(
        ...value
          .split(",")
          .map((v) => (v.trim().endsWith("ms") ? parseFloat(v) : parseFloat(v) * 1000)),
      );
    let longest = 0;
    for (const el of document.querySelectorAll("*")) {
      for (const pseudo of [null, "::before", "::after"]) {
        const style = getComputedStyle(el, pseudo);
        longest = Math.max(longest, ms(style.transitionDuration), ms(style.animationDuration));
      }
    }
    return longest;
  });
}

/** Signature of what is visible: each visible element and the text it shows. */
export async function visibleSignature(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("body *")]
      .filter(
        (el) =>
          (el.checkVisibility?.({ opacityProperty: true, visibilityProperty: true }) ?? true) &&
          el.getClientRects().length > 0,
      )
      .map(
        (el) =>
          `${el.tagName}:${[...el.childNodes]
            .filter((n) => n.nodeType === 3)
            .map((n) => n.textContent?.trim())
            .join("")}`,
      ),
  );
}

/** Accessible names of the headings, labels, fields, buttons, links and messages that are visible. */
export async function visibleControls(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        "h1, h2, label, input, select, button, a, [role=alert], [role=status], p",
      ),
    ]
      .filter((el) => (el.checkVisibility?.() ?? true) && el.getClientRects().length > 0)
      .map((el) => `${el.tagName}:${(el.textContent || el.id).trim()}`)
      .filter((name) => !name.endsWith(":")),
  );
}
