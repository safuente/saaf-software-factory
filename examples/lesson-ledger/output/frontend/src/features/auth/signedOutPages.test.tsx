/** F09 AC-1, AC-2, AC-5 a: Log in and Sign up carry the brand (ADR-008): a `header` brand panel
 * (strip below 1024 px) with the logo mark, the wordmark, the value line and, from 1024 px, one
 * illustration; `main` keeps the h1 and the F01 form on a card. Layout and colours are measured
 * in the browser (e2e/f09-signed-out.spec.ts); this file checks structure and SVG hygiene. */
import { render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { fakeApi, notAuthenticated } from "../../test/api";
import { renderApp } from "../../test/renderApp";
import { Brand } from "../../shared/ui/Brand";
import { Illustration, type IllustrationName } from "../../shared/ui/Illustration";

const CURRENT = "GET /api/sessions/current";
const VALUE_LINE = "Lessons, payments and pending fees in one place";
const CSS = readFileSync(resolve(__dirname, "../../shared/styles/app.css"), "utf8");
const COLOURS = new Set([...CSS.matchAll(/--color-([a-z-]+):/g)].map((m) => m[1]));
const PAGES = [
  ["/login", "Log in"],
  ["/signup", "Create your account"],
] as const;

async function open(path: string, heading: string) {
  fakeApi({ [CURRENT]: notAuthenticated });
  renderApp(path);
  await screen.findByRole("heading", { level: 1, name: heading });
}

/** Drawing elements of an SVG: tag and geometry, without paint or classes. */
function shapes(svg: Element): string {
  const geometry = ["x", "y", "width", "height", "rx", "ry", "cx", "cy", "r", "d", "transform"];
  return JSON.stringify(
    [...svg.querySelectorAll("rect, circle, ellipse, path, line, polyline, polygon")].map((el) => [
      el.tagName.toLowerCase(),
      ...geometry.map((a) => el.getAttribute(a)),
    ]),
  );
}

/** AC-1 (c): decorative, hidden, clean under the CSP, painted by theme colour classes only. */
function expectCleanDecorativeSvg(svg: Element, what: string): void {
  expect(svg.getAttribute("aria-hidden"), what).toBe("true");
  expect(svg.getAttribute("focusable"), what).toBe("false");
  expect(svg.hasAttribute("tabindex"), what).toBe(false);
  expect(svg.querySelector("title, desc"), what).toBeNull();
  expect(svg.outerHTML, what).not.toMatch(/\bstyle\s*=|<style|<script|data:|href\s*=|url\(/i);
  for (const part of svg.querySelectorAll("*")) {
    for (const paint of ["fill", "stroke"]) {
      const literal = part.getAttribute(paint);
      if (literal !== null) expect(["none", "currentColor"], `${what} ${paint}`).toContain(literal);
    }
    const classes = (part.getAttribute("class") ?? "").split(/\s+/).filter(Boolean);
    for (const name of classes) {
      const colour = /^(?:fill|stroke)-([a-z-]+)$/.exec(name)?.[1];
      if (colour) expect(COLOURS.has(colour), `${what} ${name}`).toBe(true);
    }
    if (
      ["rect", "circle", "ellipse", "path", "line", "polyline", "polygon"].includes(part.tagName)
    ) {
      const painted = classes.some((c) => /^fill-/.test(c)) || part.getAttribute("fill") === "none";
      expect(painted, `${what} ${part.tagName} fill`).toBe(true);
    }
  }
}

describe("F09 AC-1 / AC-2 the brand panel on Log in and Sign up", () => {
  it.each(PAGES)(
    "AC-1a %s: a header (the brand panel), then one main; no nav",
    async (path, heading) => {
      await open(path, heading);
      const banner = screen.getByRole("banner");
      const main = screen.getByRole("main");
      expect(screen.getAllByRole("banner")).toHaveLength(1);
      expect(screen.getAllByRole("main")).toHaveLength(1);
      expect(screen.queryByRole("navigation")).toBeNull();
      expect(banner.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(banner.contains(main) || main.contains(banner)).toBe(false);
      for (const el of [banner, main, ...banner.querySelectorAll("*")]) {
        expect(el.getAttribute("class") ?? "", el.tagName).not.toMatch(/\b(fixed|sticky)\b/);
      }
    },
  );

  it.each(PAGES)(
    "AC-1b %s: the panel holds the mark, 'Lesson Ledger', the value line and one illustration, in order",
    async (path, heading) => {
      await open(path, heading);
      const banner = screen.getByRole("banner");
      const svgs = [...banner.querySelectorAll("svg")];
      expect(svgs).toHaveLength(2);
      const [mark, illustration] = svgs as [SVGSVGElement, SVGSVGElement];
      const wordmark = within(banner).getByText("Lesson Ledger", { exact: true });
      const value = within(banner).getByText(VALUE_LINE, { exact: true });
      const order = [mark, wordmark, value, illustration];
      for (let i = 1; i < order.length; i++) {
        expect(
          (order[i - 1] as Element).compareDocumentPosition(order[i] as Element) &
            Node.DOCUMENT_POSITION_FOLLOWING,
          `item ${i} follows item ${i - 1}`,
        ).toBeTruthy();
      }
      expect(banner.textContent).toBe(`Lesson Ledger${VALUE_LINE}`);
      expect(
        banner.querySelectorAll("a, button, input, select, textarea, [tabindex]"),
      ).toHaveLength(0);
    },
  );

  it.each(PAGES)(
    "AC-1c %s: the mark is the shell's drawing; mark and illustration are clean decorative SVGs",
    async (path, heading) => {
      await open(path, heading);
      const [mark, illustration] = [...screen.getByRole("banner").querySelectorAll("svg")] as [
        SVGSVGElement,
        SVGSVGElement,
      ];
      expectCleanDecorativeSvg(mark, "mark");
      expectCleanDecorativeSvg(illustration, "illustration");

      const shell = render(<Brand />).container.querySelector("svg") as SVGSVGElement;
      expect(mark.getAttribute("viewBox")).toBe(shell.getAttribute("viewBox"));
      expect(shapes(mark)).toBe(shapes(shell));
      expect(mark.innerHTML).toBe(shell.innerHTML);
    },
  );

  it("AC-1c the illustration is a new drawing: not any F08 illustration's shapes, nor the mark's", async () => {
    await open("/login", "Log in");
    const [mark, illustration] = [...screen.getByRole("banner").querySelectorAll("svg")] as [
      SVGSVGElement,
      SVGSVGElement,
    ];
    const drawn = shapes(illustration);
    expect(JSON.parse(drawn).length).toBeGreaterThan(5);
    expect(drawn).not.toBe(shapes(mark));
    const names: IllustrationName[] = ["start", "students", "lessons", "month", "paid"];
    for (const name of names) {
      const other = render(
        <MemoryRouter>
          <Illustration name={name} />
        </MemoryRouter>,
      ).container.querySelector("svg") as SVGSVGElement;
      expect(drawn, name).not.toBe(shapes(other));
      const shared = (JSON.parse(drawn) as string[][]).filter((s) =>
        (JSON.parse(shapes(other)) as string[][]).some(
          (o) => JSON.stringify(o) === JSON.stringify(s),
        ),
      );
      expect(shared, `${name}: shapes copied`).toEqual([]);
    }
  });

  it.each(PAGES)(
    "AC-1d %s: the wordmark is plain text, not in a heading, link or button; once in body",
    async (path, heading) => {
      await open(path, heading);
      const wordmark = within(screen.getByRole("banner")).getByText("Lesson Ledger", {
        exact: true,
      });
      expect(wordmark.closest("h1, h2, h3, h4, h5, h6, a, button, [tabindex]")).toBeNull();
      expect(wordmark.querySelector("*")).toBeNull();
      expect(screen.getAllByText("Lesson Ledger", { exact: true })).toHaveLength(1);
      expect(screen.getAllByRole("heading")).toHaveLength(1);
    },
  );

  it.each(PAGES)(
    "AC-1e %s: main holds the card with the h1 and the F01 form",
    async (path, heading) => {
      await open(path, heading);
      const main = screen.getByRole("main");
      const h1 = within(main).getByRole("heading", { level: 1, name: heading });
      const form = main.querySelector("form") as HTMLFormElement;
      expect(form).not.toBeNull();
      const card = h1.parentElement as HTMLElement;
      expect(card.contains(form)).toBe(true);
      expect(card).not.toBe(main);
    },
  );
});
