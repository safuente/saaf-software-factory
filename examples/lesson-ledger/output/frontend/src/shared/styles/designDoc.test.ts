/** F06 AC-1: docs/design.md describes the dashboard direction of ADR-006 (it replaces the F04/F05
 * manuscript plan and the tests of its contents, as F06 AC-5 b allows). */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { section, sectionTable } from "../../test/designDoc";

const DESIGN_DOC = resolve(__dirname, "../../../../docs/design.md");

function doc(): string {
  expect(existsSync(DESIGN_DOC), "docs/design.md exists").toBe(true);
  return readFileSync(DESIGN_DOC, "utf8");
}

const TOKEN_TABLES = ["Type scale", "Spacing", "Radii", "Breakpoints and widths"];

/** The root font size the document says the app renders, in px. */
function statedRoot(text: string): number {
  const match = /root font size[^.]*?\b(\d+(?:\.\d+)?) px\b/i.exec(section(text, "Rendered sizes"));
  return Number(match?.[1]);
}

/** Every theme name the token tables define. */
function themeNames(text: string): Set<string> {
  return new Set(
    ["Palette", "Typefaces", ...TOKEN_TABLES]
      .flatMap((heading) => sectionTable(text, heading))
      .map((row) => (row.Name ?? "").replace(/`/g, "")),
  );
}

describe("F06 AC-1a docs/design.md describes the dashboard direction", () => {
  it("AC-1a has every required section", () => {
    const text = doc();
    for (const heading of [
      "Direction",
      "Palette",
      "Typefaces",
      "Type scale",
      "Spacing",
      "Radii",
      "Breakpoints and widths",
      "Rendered sizes",
      "Layout",
      "Components",
      "Reference elements",
      "Screenshots",
    ]) {
      expect(section(text, heading), `section "${heading}"`).not.toBe("");
    }
    expect(section(text, "Direction")).toMatch(/ADR-006/);
  });

  it("AC-1a palette gives every colour a theme name, value, role and contrast ratio", () => {
    const rows = sectionTable(doc(), "Palette");
    expect(rows.length).toBeGreaterThanOrEqual(4);
    for (const row of rows) {
      expect(row.Name, "theme name in backticks").toMatch(/^`[a-z-]+`$/);
      expect(row.Theme).toBe(`\`--color-${(row.Name ?? "").replace(/`/g, "")}\``);
      expect(row.Value).toMatch(/^`#[0-9A-F]{6}`$/);
      expect((row.Role ?? "").length, `role of ${row.Name}`).toBeGreaterThan(10);
      expect(row.Contrast, `contrast of ${row.Name}`).toMatch(/\d+(\.\d+)?:1/);
    }
  });

  it("AC-1a one self-hosted sans-serif family under the SIL Open Font License", () => {
    const rows = sectionTable(doc(), "Typefaces");
    expect(rows).toHaveLength(1);
    const [row] = rows;
    expect(row?.Name).toBe("`sans`");
    expect(row?.Classification).toMatch(/sans-serif/i);
    expect(row?.Weights).toMatch(/\d{3}/);
    expect(row?.License).toMatch(/SIL Open Font License/);
    expect(row?.Hosting).toMatch(/self-hosted/i);
  });

  it("AC-1a type scale, spacing, radii and widths are tables of theme names with rendered px", () => {
    const text = doc();
    const root = statedRoot(text);
    let checked = 0;
    for (const heading of TOKEN_TABLES) {
      const rows = sectionTable(text, heading);
      expect(rows.length, heading).toBeGreaterThanOrEqual(2);
      for (const row of rows) {
        expect(row.Name, heading).toMatch(/^`[a-z0-9-]+`$/);
        const rem = /^`([\d.]+)rem`$/.exec(row.Value ?? "");
        if (!rem || (row.Theme ?? "").includes("--breakpoint-")) continue;
        checked++;
        expect(row.Rendered, `${heading} ${row.Name}`).toBe(`${Number(rem[1]) * root} px`);
      }
    }
    expect(checked).toBeGreaterThan(15);
  });

  it("AC-1a breakpoints render at 640, 768, 1024 and 1280 px; content is at most 1600 px", () => {
    const rows = sectionTable(doc(), "Breakpoints and widths");
    const rendered = (theme: string) => rows.find((r) => r.Theme === `\`${theme}\``)?.Rendered;
    expect(rendered("--breakpoint-sm")).toBe("640 px");
    expect(rendered("--breakpoint-md")).toBe("768 px");
    expect(rendered("--breakpoint-lg")).toBe("1024 px");
    expect(rendered("--breakpoint-xl")).toBe("1280 px");
    expect(parseFloat(rendered("--container-content") ?? "")).toBeLessThanOrEqual(1600);
  });

  it("AC-1a the layout covers the sidebar shell, the top bar below 1024 px and the title row", () => {
    const layout = section(doc(), "Layout");
    expect(layout).toMatch(/sidebar/i);
    expect(layout).toMatch(/top bar[^.]*1024 px|1024 px[^.]*top bar/i);
    expect(layout).toMatch(/title row/i);
    expect(layout).toMatch(/log in|sign-up|sign up/i);
  });

  it("AC-1a buttons, tables, initials, payment status, month chip and metrics panel use theme names only", () => {
    const text = doc();
    const components = section(text, "Components");
    for (const name of [
      "Buttons",
      "Tables",
      "Initials",
      "Payment status",
      "Month chip",
      "Metrics panel",
    ]) {
      expect(components, name).toMatch(new RegExp(`^- \\*\\*${name}\\*\\*`, "m"));
    }
    expect(components).not.toMatch(/#[0-9a-f]{3,8}\b|\d+(\.\d+)?\s?(rem|em)\b/i);
    const named = [...components.matchAll(/`([^`]+)`/g)].map((m) => m[1] ?? "");
    expect(named.length).toBeGreaterThan(15);
    const known = themeNames(text);
    expect(named.filter((name) => !known.has(name))).toEqual([]);
  });

  it("AC-1a lists the reference elements adopted and left out, each with how it meets WCAG 2.2 AA", () => {
    const rows = sectionTable(doc(), "Reference elements");
    const decided = (decision: string) =>
      rows.filter((r) => r.Decision === decision).map((r) => r.Element ?? "");
    expect(decided("Adopted").join(" | ")).toMatch(
      /sidebar[\s\S]*title[\s\S]*button[\s\S]*table[\s\S]*initials[\s\S]*status[\s\S]*metrics[\s\S]*chip/i,
    );
    const leftOut = decided("Left out").join(" | ");
    for (const element of [
      /search/i,
      /filter/i,
      /checkbox/i,
      /popover/i,
      /import/i,
      /notification/i,
      /Inventory/,
    ]) {
      expect(leftOut).toMatch(element);
    }
    expect(rows.length).toBe(decided("Adopted").length + decided("Left out").length);
    for (const row of rows) {
      expect(row["WCAG 2.2 AA"], row.Element).toMatch(/\d\.\d+\.\d+|not shown/i);
    }
  });
});

describe("F06 AC-1b docs/design.md states the rendered sizes", () => {
  it("AC-1b states the root font size and the px size of each measured element", () => {
    const text = doc();
    expect(statedRoot(text)).toBe(16);
    const rows = sectionTable(text, "Rendered sizes");
    expect(rows.map((r) => r.Element)).toEqual([
      "`h1`",
      "Body text",
      "Label",
      "Text field",
      "Button",
      "Table cell",
      "Sidebar link",
    ]);
    for (const row of rows) expect(row["Font size"], row.Element).toMatch(/^\d+(\.\d+)? px$/);
  });
});

describe("F06 AC-1c no manuscript identity in docs/design.md", () => {
  it("AC-1c names no stave, note head, piano key, bar line, F04 palette name or Alegreya", () => {
    expect(doc()).not.toMatch(
      /stave|note head|piano|bar line|white key|alegreya|\b(paper|sheet|ink|pencil|verdigris|brass|correction)\b/i,
    );
  });
});

describe("F06 AC-1d screenshots", () => {
  const PAGES = ["/login", "/signup", "/", "/lessons", "/students", "/summary", "/pending"];

  it("AC-1d lists the seven pages at 375 and 1280 px, 14 files that exist", () => {
    const text = doc();
    const shots = section(text, "Screenshots");
    expect(shots).toMatch(/F06/);
    expect(shots).toMatch(/production build/i);
    expect(shots).toMatch(/alice@example\.com/);
    expect(shots).toMatch(/current month/i);
    const rows = sectionTable(text, "Screenshots");
    expect(rows.map((r) => (r.Page ?? "").replace(/`/g, ""))).toEqual(PAGES);
    const files = rows.flatMap((row) =>
      ["375 px", "1280 px"].map((width) => (row[width] ?? "").replace(/`/g, "")),
    );
    expect(new Set(files).size).toBe(14);
    for (const file of files) {
      expect(file).toMatch(/^design\/f06-.+\.png$/);
      expect(existsSync(resolve(DESIGN_DOC, "..", file)), file).toBe(true);
    }
  });
});
