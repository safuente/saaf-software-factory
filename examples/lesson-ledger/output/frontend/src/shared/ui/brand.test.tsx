/** F08 AC-2: the logo mark and wordmark in the shell, the favicon, and their SVG hygiene under
 * the CSP. */
import { render, screen, within } from "@testing-library/react";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { Page } from "./Page";
import { ShellContext } from "./shell";

const FRONTEND = resolve(__dirname, "../../..");
const FAVICON = resolve(FRONTEND, "public/favicon.svg");
const CSS = readFileSync(resolve(FRONTEND, "src/shared/styles/app.css"), "utf8");

function renderPage(nav: boolean) {
  return render(
    <MemoryRouter>
      <ShellContext.Provider value={{ logOut: () => {}, loggingOut: false, logOutFailed: false }}>
        <Page title="Lessons" heading="Lessons" nav={nav}>
          <p>Body</p>
        </Page>
      </ShellContext.Provider>
    </MemoryRouter>,
  );
}

/** The theme value of a colour name, e.g. `paid` -> `#17803d`. */
function themeColour(name: string): string {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6});`, "i").exec(CSS);
  return (match?.[1] ?? "").toLowerCase();
}

/** Drawing elements of an SVG: tag and geometry attributes, without colours or classes. */
function shapes(svg: Element) {
  const geometry = ["x", "y", "width", "height", "rx", "cx", "cy", "r", "d", "transform"];
  return [...svg.querySelectorAll("rect, circle, ellipse, path, line, polyline")].map((el) => ({
    tag: el.tagName.toLowerCase(),
    ...Object.fromEntries(
      geometry.filter((a) => el.hasAttribute(a)).map((a) => [a, el.getAttribute(a)]),
    ),
  }));
}

/** AC-2 (c): no style, script, data: URI or reference to another origin. */
function expectCleanSvg(markup: string, what: string): void {
  expect(markup, what).not.toMatch(/\bstyle\s*=|<style|<script|data:|\bhref\s*=|url\(/i);
  const urls = markup.match(/https?:\/\/[^\s"']+/g) ?? [];
  expect(
    urls.filter((url) => url !== "http://www.w3.org/2000/svg"),
    what,
  ).toEqual([]);
}

describe("F08 AC-2 brand", () => {
  it("AC-2a the shell's first content is the mark then the plain-text wordmark, above the nav", () => {
    renderPage(true);
    const header = screen.getByRole("banner");
    const brand = header.querySelector("[data-brand]");
    expect(brand).not.toBeNull();
    const nav = within(header).getByRole("navigation", { name: "Main" });
    expect(brand?.compareDocumentPosition(nav) ?? 0).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    const first = header.querySelector("*");
    expect(first?.contains(brand ?? null) ?? false).toBe(true);
    expect(header.textContent?.startsWith("Lesson Ledger")).toBe(true);

    const mark = brand?.firstElementChild;
    expect(mark?.tagName.toLowerCase()).toBe("svg");
    expect(mark?.getAttribute("aria-hidden")).toBe("true");
    expect(mark?.getAttribute("focusable")).toBe("false");
    expect(brand?.textContent).toBe("Lesson Ledger");
    expect(brand?.querySelector("a, button, h1, h2, h3, h4, h5, h6, [tabindex]")).toBeNull();
    expect(brand?.closest("a, button, h1, h2, h3, h4, h5, h6")).toBeNull();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
  });

  it("AC-2b log-in and sign-up pages show no logo and no wordmark", () => {
    renderPage(false);
    expect(document.querySelector("[data-brand]")).toBeNull();
    expect(screen.queryByText("Lesson Ledger")).toBeNull();
    expect(document.querySelectorAll("svg")).toHaveLength(0);
  });

  it("AC-2c index.html links the SVG favicon", () => {
    const html = readFileSync(resolve(FRONTEND, "index.html"), "utf8");
    const doc = new DOMParser().parseFromString(html, "text/html");
    const icons = doc.querySelectorAll('link[rel="icon"]');
    expect(icons).toHaveLength(1);
    expect(icons[0]?.getAttribute("type")).toBe("image/svg+xml");
    expect(icons[0]?.getAttribute("href")).toBe("/favicon.svg");
  });

  it("AC-2c the favicon and the inline logo carry no style, script, data: URI or other origin", () => {
    expect(existsSync(FAVICON)).toBe(true);
    expectCleanSvg(readFileSync(FAVICON, "utf8"), "favicon.svg");
    renderPage(true);
    const mark = document.querySelector("[data-brand] svg");
    expect(mark).not.toBeNull();
    expectCleanSvg(mark?.outerHTML ?? "", "inline logo");
    expect(
      mark?.querySelectorAll("[style], style, script, image, use, foreignObject"),
    ).toHaveLength(0);
  });

  it("AC-2d the favicon draws the logo's mark in the colours of its theme names", () => {
    renderPage(true);
    const mark = document.querySelector("[data-brand] svg") as SVGSVGElement;
    const favicon = new DOMParser()
      .parseFromString(readFileSync(FAVICON, "utf8"), "image/svg+xml")
      .querySelector("svg") as SVGSVGElement;
    expect(favicon.getAttribute("viewBox")).toBe(mark.getAttribute("viewBox"));
    const drawn = shapes(mark);
    expect(drawn.length).toBeGreaterThan(2);
    expect(shapes(favicon)).toEqual(drawn);

    const markParts = [...mark.querySelectorAll("rect, circle, ellipse, path, line, polyline")];
    const iconParts = [...favicon.querySelectorAll("rect, circle, ellipse, path, line, polyline")];
    markParts.forEach((part, i) => {
      const classes = part.getAttribute("class") ?? "";
      const icon = iconParts[i] as Element;
      for (const paint of ["fill", "stroke"] as const) {
        const name = new RegExp(`\\b${paint}-([a-z-]+)\\b`).exec(classes)?.[1];
        const literal = (icon.getAttribute(paint) ?? "none").toLowerCase();
        if (name) {
          expect(literal, `${paint} of part ${i}`).toBe(themeColour(name));
          expect(themeColour(name), name).toMatch(/^#[0-9a-f]{6}$/);
        } else {
          expect(literal, `${paint} of part ${i}`).toBe("none");
        }
      }
    });
  });
});
