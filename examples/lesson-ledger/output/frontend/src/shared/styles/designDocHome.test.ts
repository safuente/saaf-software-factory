/** F07 AC-6 f: docs/design.md describes Home's sections and the page-action link style with
 * theme names only, and lists the four Home screenshots of the F07 production build. */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { section, sectionTable } from "../../test/designDoc";

const DESIGN_DOC = resolve(__dirname, "../../../../docs/design.md");
const doc = () => readFileSync(DESIGN_DOC, "utf8");

/** Theme names the token tables define. */
function themeNames(text: string): Set<string> {
  return new Set(
    ["Palette", "Typefaces", "Type scale", "Spacing", "Radii", "Breakpoints and widths"]
      .flatMap((heading) => sectionTable(text, heading))
      .map((row) => (row.Name ?? "").replace(/`/g, "")),
  );
}

/** One bullet of the Components section, from its bold name to the next bullet. */
function component(text: string, name: string): string {
  const components = section(text, "Components");
  const start = components.indexOf(`- **${name}**`);
  if (start === -1) return "";
  const next = components.indexOf("\n- **", start + 1);
  return components.slice(start, next === -1 ? undefined : next);
}

describe("F07 AC-6f docs/design.md describes Home", () => {
  it("AC-6f Components describe Home's sections and page actions with theme names only", () => {
    const text = doc();
    const known = themeNames(text);
    const home = component(text, "Home");
    const actions = component(text, "Page actions");
    for (const [name, body] of [
      ["Home", home],
      ["Page actions", actions],
    ] as const) {
      expect(body, name).not.toBe("");
      expect(body, name).not.toMatch(/#[0-9a-f]{3,8}\b|\d+(\.\d+)?\s?(rem|em|px)\b/i);
      const named = [...body.matchAll(/`([^`]+)`/g)].map((m) => m[1] ?? "");
      expect(named.length, name).toBeGreaterThan(3);
      expect(
        named.filter((n) => !known.has(n)),
        name,
      ).toEqual([]);
    }
    for (const part of ["title row", "Get started", "Oldest unpaid lessons", "Latest lessons"]) {
      expect(home, part).toContain(part);
    }
    expect(actions).toMatch(/Record lesson/);
    expect(actions).toMatch(/link/i);
  });

  it("AC-6f the layout puts page actions right of the title from lg", () => {
    const layout = section(doc(), "Layout");
    expect(layout).not.toMatch(/No page has a page-level action/);
    expect(layout).toMatch(/page actions/i);
  });

  it("AC-6f Screenshots list / at 375 and 1280 px for alice and bob: 4 F07 files that exist", () => {
    const text = doc();
    const shots = section(text, "Screenshots");
    expect(shots).toMatch(/F07/);
    const listed = shots
      .split("\n")
      .filter((line) => line.startsWith("- `/` as "))
      .map((line) => ({
        teacher: /^- `\/` as `([^`]+)`/.exec(line)?.[1],
        files: [...line.matchAll(/`(design\/[^`]+)` at (\d+) px/g)].map((m) => [m[2], m[1]]),
      }));
    expect(listed.map((s) => s.teacher)).toEqual(["alice@example.com", "bob@example.com"]);
    for (const shot of listed) {
      expect(shot.files.map(([width]) => width)).toEqual(["375", "1280"]);
    }
    const files = listed.flatMap((s) => s.files.map(([, file]) => file ?? ""));
    expect(new Set(files).size).toBe(4);
    for (const file of files) {
      expect(file).toMatch(/^design\/f07-home-.+\.png$/);
      expect(existsSync(resolve(DESIGN_DOC, "..", file)), file).toBe(true);
    }
  });
});
