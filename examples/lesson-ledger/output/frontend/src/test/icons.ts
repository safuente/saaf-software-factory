/** Test support for F08 AC-1: the decorative Lucide icon of a control or alert. */
import { expect } from "vitest";

/** Every inline SVG inside `element`. */
export const svgsIn = (element: Element): SVGSVGElement[] => [...element.querySelectorAll("svg")];

/** `element` shows exactly one icon, the Lucide `glyph`, as its first child, immediately before
 * its text, hidden from assistive technology and never focusable (AC-1 a, c). */
export function expectLeadingIcon(element: Element, glyph: string, text?: string): void {
  const svgs = svgsIn(element);
  expect(svgs, `${element.textContent}: one icon`).toHaveLength(1);
  const svg = svgs[0] as SVGSVGElement;
  expect(element.firstChild, `${element.textContent}: icon first`).toBe(svg);
  expect(svg.nextSibling?.nodeType, `${element.textContent}: text after the icon`).toBe(
    Node.TEXT_NODE,
  );
  expect([...svg.classList], `${element.textContent}: glyph`).toContain(`lucide-${glyph}`);
  expect(svg.getAttribute("aria-hidden")).toBe("true");
  expect(svg.getAttribute("focusable")).toBe("false");
  expect(svg.hasAttribute("tabindex")).toBe(false);
  expect(svg.hasAttribute("style")).toBe(false);
  expect(svg.querySelector("title, desc")).toBeNull();
  if (text !== undefined) expect(element.textContent).toBe(text);
}

/** `element` shows no icon (AC-1 b, d). */
export function expectNoIcon(element: Element): void {
  expect(svgsIn(element), `${element.textContent}: no icon`).toEqual([]);
}
