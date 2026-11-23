/** F09 AC-6 b, c, d: docs/design.md records the branded signed-out pages (ADR-008), the agent
 * notes state the new placements and motion, and the 6 F09 screenshots exist. */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { section, sectionTable } from "../../test/designDoc";

const FRONTEND = resolve(__dirname, "../../..");
const DESIGN_DOC = resolve(FRONTEND, "../docs/design.md");
const doc = () => readFileSync(DESIGN_DOC, "utf8");
const VALUE_LINE = "Lessons, payments and pending fees in one place";

describe("F09 AC-6b docs/design.md records the signed-out brand", () => {
  it("AC-6b Layout: the split layout from lg and the brand strip below it", () => {
    const layout = section(doc(), "Layout");
    expect(layout).toMatch(/Log in and Sign up/);
    expect(layout).toMatch(/brand panel/i);
    expect(layout).toMatch(/brand strip/i);
    expect(layout).toMatch(/`lg`/);
    expect(layout).toMatch(/card/);
  });

  it("AC-6b Brand: mark and wordmark on Log in and Sign up, size name, colours, contrast, value line", () => {
    const brand = section(doc(), "Brand");
    expect(brand).toMatch(/Log in and Sign up/);
    expect(brand).toContain("`display`");
    expect(brand).toContain("`shell-text`");
    expect(brand).toContain("`shell-muted`");
    expect(brand).toMatch(/15\.02:1/);
    expect(brand).toMatch(/8\.47:1/);
    expect(brand).toContain(VALUE_LINE);
    expect(brand).toMatch(/ADR-008/);
    expect(brand).not.toMatch(/log in and sign-up show neither/i);
  });

  it("AC-6b Illustrations: the brand-panel drawing", () => {
    const illustrations = section(doc(), "Illustrations");
    expect(illustrations).toMatch(/brand panel/i);
    expect(illustrations).toMatch(/ADR-008/);
  });

  it("AC-6b Motion: the entrance, its token and rules, as ADR-008's addition", () => {
    const motion = section(doc(), "Motion");
    const rows = sectionTable(doc(), "Motion");
    expect(rows.map((r) => r.Theme)).toContain("`--duration-entrance`");
    expect(motion).toMatch(/ADR-008/);
    expect(motion).toMatch(/entrance/i);
    expect(motion).toContain("motion-entrance");
  });

  it("AC-6b Components: the logged-out notice", () => {
    const components = section(doc(), "Components");
    expect(components).toMatch(/^- \*\*Logged-out notice\*\*/m);
    expect(components).toContain("You have logged out.");
  });

  it("AC-6b Reference elements: Product logo mentions the signed-out pages", () => {
    const logo = sectionTable(doc(), "Reference elements").find(
      (r) => r.Element === "Product logo",
    );
    expect(logo?.["WCAG 2.2 AA"] ?? "").toMatch(/\d\.\d+\.\d+/);
    expect(`${logo?.Decision} ${logo?.["WCAG 2.2 AA"]}`).toMatch(/Log in and Sign up/);
  });
});

describe("F09 AC-6c agent notes", () => {
  it("AC-6c state the ADR-008 placements and the entrance; no 'shell only'", () => {
    const notes = readFileSync(resolve(FRONTEND, "../CLAUDE.md"), "utf8");
    expect(notes).not.toMatch(/shell only/i);
    expect(notes).not.toMatch(/four list empty states only/i);
    expect(notes).toMatch(/ADR-008/);
    expect(notes).toMatch(/SignedOutPage/);
    expect(notes).toMatch(/motion-entrance/);
    expect(notes).toMatch(/You have logged out\./);
  });
});

describe("F09 AC-6d screenshots", () => {
  it("AC-6d lists the 6 F09 files from the production build with reduced motion, and they exist", () => {
    const shots = section(doc(), "Screenshots");
    const f09 = shots.slice(shots.indexOf("F09"));
    expect(f09).toMatch(/production build/i);
    expect(f09).toMatch(/reduced motion/i);
    expect(f09).toMatch(/alice@example\.com/);
    const files = [...f09.matchAll(/`(design\/f09-[^`]+\.png)`/g)].map((m) => m[1] ?? "");
    expect(new Set(files)).toEqual(
      new Set([
        "design/f09-login-375.png",
        "design/f09-login-1280.png",
        "design/f09-signup-375.png",
        "design/f09-signup-1280.png",
        "design/f09-login-notice-1280.png",
        "design/f09-login-errors-1280.png",
      ]),
    );
    for (const file of files) {
      expect(existsSync(resolve(DESIGN_DOC, "..", file)), file).toBe(true);
    }
  });
});
