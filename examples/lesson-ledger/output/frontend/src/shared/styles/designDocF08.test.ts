/** F08 AC-6 c, d, e: the icon package pin, docs/design.md's icons, brand, illustrations and
 * motion sections, the agent notes, and the 18 F08 screenshots. */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { section, sectionTable } from "../../test/designDoc";

const FRONTEND = resolve(__dirname, "../../..");
const DESIGN_DOC = resolve(FRONTEND, "../docs/design.md");
const doc = () => readFileSync(DESIGN_DOC, "utf8");
const css = () => readFileSync(resolve(FRONTEND, "src/shared/styles/app.css"), "utf8");

const ICON_MAP: [string, string][] = [
  ["Home", "house"],
  ["Lessons", "music"],
  ["Students", "users"],
  ["Monthly summary", "chart-column"],
  ["Pending payments", "clock"],
  ["Record lesson", "calendar-plus"],
  ["Add student", "user-plus"],
  ["Mark as paid", "check"],
  ["Undo paid", "undo-2"],
  ["Log out", "log-out"],
  ["Alerts", "circle-alert"],
];

describe("F08 AC-6c the icon package", () => {
  it("AC-6c lucide-react is an exact-pinned dependency with its lock entry", () => {
    const pkg = JSON.parse(readFileSync(resolve(FRONTEND, "package.json"), "utf8"));
    const lock = JSON.parse(readFileSync(resolve(FRONTEND, "package-lock.json"), "utf8"));
    const declared = pkg.dependencies?.["lucide-react"];
    expect(declared).toMatch(/^\d+\.\d+\.\d+$/);
    const locked = lock.packages["node_modules/lucide-react"];
    expect(locked?.version).toBe(declared);
    expect(locked?.integrity).toMatch(/^sha512-/);
    expect(locked?.license).toBe("ISC");
  });
});

describe("F08 AC-6d docs/design.md records icons, brand, illustrations and motion", () => {
  it("AC-6d Icons: the set, its version and ISC licence, the icon map and the size names", () => {
    const icons = section(doc(), "Icons");
    const pkg = JSON.parse(readFileSync(resolve(FRONTEND, "package.json"), "utf8"));
    expect(icons).toMatch(/Lucide/);
    expect(icons).toContain(`lucide-react\` ${pkg.dependencies["lucide-react"]}`);
    expect(icons).toMatch(/ISC/);
    const map = section(doc(), "Icon map");
    for (const [element, glyph] of ICON_MAP) {
      expect(map, element).toMatch(new RegExp(`\\| ${element}[^|]*\\| \`${glyph}\` \\|`));
    }
    const sizes = sectionTable(doc(), "Icons").filter((row) => row.Theme);
    expect(sizes.map((r) => r.Theme)).toContain("`--icon-size`");
  });

  it("AC-6d Brand and Illustrations: original, theme colours, favicon", () => {
    const brand = section(doc(), "Brand");
    expect(brand).toMatch(/original/i);
    expect(brand).toMatch(/favicon\.svg/);
    expect(brand).toMatch(/Lesson Ledger/);
    for (const name of ["canvas", "outline", "graphite", "paid"])
      expect(brand).toContain(`\`${name}\``);
    const illustrations = section(doc(), "Illustrations");
    expect(illustrations).toMatch(/original/i);
    expect(illustrations).toMatch(/Get started/);
    expect(illustrations).toMatch(/theme/i);
  });

  it("AC-6d Motion: duration, easing and highlight tokens with their theme values, and the rules", () => {
    const text = doc();
    const rows = sectionTable(text, "Motion");
    const themeCss = css();
    expect(rows.length).toBeGreaterThanOrEqual(6);
    for (const row of rows) {
      const name = (row.Theme ?? "").replace(/`/g, "");
      const value = (row.Value ?? "").replace(/`/g, "");
      expect(themeCss, name).toContain(`${name}: ${value};`);
    }
    const motion = section(text, "Motion");
    expect(motion).toMatch(/paid-wash/);
    expect(motion).toMatch(/prefers-reduced-motion/);
    expect(motion).toMatch(/focus-visible/);
    expect(motion).toMatch(/ADR-007/);
    expect(motion).not.toMatch(/no motion/i);
  });

  it("AC-6d Reference elements: Product logo adopted, customer photos still left out", () => {
    const rows = sectionTable(doc(), "Reference elements");
    const logo = rows.find((r) => /^Product logo$/.test(r.Element ?? ""));
    expect(logo?.Decision).toBe("Adopted");
    expect(logo?.["WCAG 2.2 AA"]).toMatch(/\d\.\d+\.\d+/);
    expect(rows.find((r) => /customer photos/i.test(r.Element ?? ""))?.Decision).toBe("Left out");
  });

  it("AC-6d the agent notes state the ADR-007 rules and no longer say no motion", () => {
    const notes = readFileSync(resolve(FRONTEND, "../CLAUDE.md"), "utf8");
    expect(notes).not.toMatch(/no motion/i);
    expect(notes).toMatch(/ADR-007/);
    expect(notes).toMatch(/prefers-reduced-motion/);
    expect(notes).toMatch(/motion-interaction/);
    expect(notes).toMatch(/lucide-react/);
  });
});

describe("F08 AC-6e screenshots", () => {
  it("AC-6e Screenshots list 18 F08 files from the production build with reduced motion", () => {
    const shots = section(doc(), "Screenshots");
    const f08 = shots.slice(shots.indexOf("F08"));
    expect(f08).toMatch(/production build/i);
    expect(f08).toMatch(/reduced motion/i);
    const files = [...f08.matchAll(/`(design\/f08-[^`]+\.png)`/g)].map((m) => m[1] ?? "");
    expect(new Set(files).size).toBe(18);
    for (const page of ["login", "signup", "home", "lessons", "students", "summary", "pending"]) {
      for (const width of [375, 1280]) {
        expect(files, `${page} ${width}`).toContain(`design/f08-${page}-${width}.png`);
      }
    }
    for (const page of ["home", "students"]) {
      for (const width of [375, 1280]) {
        expect(files).toContain(`design/f08-${page}-bob-${width}.png`);
      }
    }
    for (const file of files) {
      expect(existsSync(resolve(DESIGN_DOC, "..", file)), file).toBe(true);
    }
  });
});
