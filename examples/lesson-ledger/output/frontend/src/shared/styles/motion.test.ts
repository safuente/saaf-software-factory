/** F08 AC-4, AC-6 b: the ADR-007 motion rules, replacing the project's former "no motion" rule.
 * Durations and easings are theme tokens; keyframes are defined once in the shared styles;
 * every transition and animation sits behind `prefers-reduced-motion: no-preference`;
 * components use only the shared motion utilities, never Tailwind's own motion classes or
 * JavaScript animation. */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const FRONTEND = resolve(__dirname, "../../..");
const SRC = join(FRONTEND, "src");
const CSS = readFileSync(join(SRC, "shared/styles/app.css"), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);

const SOURCES = readdirSync(SRC, { recursive: true, encoding: "utf8" })
  .map((name) => join(SRC, name))
  .filter((p) => /\.tsx?$/.test(p) && !/\.test\.tsx?$|\.d\.ts$/.test(p))
  .filter((p) => !p.startsWith(join(SRC, "test")));

/** Theme declaration `--name: value;` of the @theme block. */
function theme(name: string): string | undefined {
  const block = /@theme\s*\{([\s\S]*?)\n\}/.exec(CSS)?.[1] ?? "";
  const escaped = name.replace(/[*]/g, "\\*");
  return new RegExp(`${escaped}:\\s*([^;]+);`).exec(block)?.[1]?.trim();
}

const ms = (value: string | undefined) =>
  value === undefined ? NaN : value.endsWith("ms") ? parseFloat(value) : parseFloat(value) * 1000;

/** Each declaration in the stylesheet with the chain of block preludes it sits in. */
function declarations(): { property: string; value: string; within: string[] }[] {
  const found: { property: string; value: string; within: string[] }[] = [];
  const stack: string[] = [];
  let buffer = "";
  for (const char of CSS) {
    if (char === "{") {
      stack.push(buffer.trim());
      buffer = "";
    } else if (char === "}") {
      const rest = buffer.trim();
      if (rest.includes(":")) {
        const [property = "", ...value] = rest.split(":");
        found.push({
          property: property.trim(),
          value: value.join(":").trim(),
          within: [...stack],
        });
      }
      stack.pop();
      buffer = "";
    } else if (char === ";") {
      const [property = "", ...value] = buffer.split(":");
      found.push({ property: property.trim(), value: value.join(":").trim(), within: [...stack] });
      buffer = "";
    } else {
      buffer += char;
    }
  }
  return found;
}

const MOTION = /^(transition|animation)(-|$)/;

describe("F08 ADR-007 motion rules in the shared styles", () => {
  it("AC-4 durations are theme tokens within ADR-007's limits", () => {
    const interaction = ms(theme("--duration-interaction"));
    expect(interaction).toBeGreaterThanOrEqual(150);
    expect(interaction).toBeLessThanOrEqual(200);
    expect(ms(theme("--duration-grow"))).toBeLessThanOrEqual(600);
    expect(ms(theme("--duration-fade"))).toBeLessThanOrEqual(300);
    expect(ms(theme("--duration-highlight"))).toBeLessThanOrEqual(1000);
    for (const [, value] of CSS.matchAll(/--duration-[\w-]+:\s*([^;]+);/g)) {
      expect(ms(value), value).toBeLessThanOrEqual(1000);
    }
    expect(theme("--ease-*")).toBe("initial");
  });

  it("AC-4,AC-5 every transition and animation sits behind prefers-reduced-motion: no-preference", () => {
    const motion = declarations().filter((d) => MOTION.test(d.property));
    expect(motion.length).toBeGreaterThan(3);
    for (const d of motion) {
      expect(
        d.within.some((prelude) =>
          /@media\s*\(prefers-reduced-motion:\s*no-preference\)/.test(prelude),
        ),
        `${d.property}: ${d.value}`,
      ).toBe(true);
    }
  });

  it("AC-4 timings come from theme tokens only; one iteration; transitions never touch focus", () => {
    for (const d of declarations().filter((x) => MOTION.test(x.property))) {
      const text = `${d.property}: ${d.value}`;
      expect(d.value, text).not.toMatch(/\d+(\.\d+)?m?s\b/);
      expect(d.value, text).not.toMatch(/infinite|alternate/);
      if (d.property === "transition-property") {
        for (const property of d.value.split(",").map((p) => p.trim())) {
          expect(
            ["color", "background-color", "border-color", "text-decoration-color"],
            text,
          ).toContain(property);
        }
      }
      if (d.property === "transition-duration") expect(d.value).toMatch(/^var\(--duration-/);
      if (d.property === "transition-timing-function") expect(d.value).toMatch(/^var\(--ease-/);
      if (d.property === "animation") {
        expect(d.value, text).toMatch(/var\(--duration-[\w-]+\)/);
        expect(d.value, text).toMatch(/var\(--ease-[\w-]+\)/);
        expect(d.value, text).toMatch(/\s1$/);
      }
    }
    expect(CSS).not.toMatch(/transition:\s*all|transition-property:\s*all/);
  });

  it("AC-4 keyframes are defined once each, in the shared styles, and each is used", () => {
    const names = [...CSS.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1] ?? "");
    expect(names.length).toBeGreaterThan(0);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) {
      expect(CSS, name).toMatch(new RegExp(`animation:\\s*${name}\\s`));
    }
    for (const path of SOURCES) {
      expect(readFileSync(path, "utf8"), relative(FRONTEND, path)).not.toMatch(/@keyframes/);
    }
  });

  it("AC-4 the highlight colour keeps row text >= 4.5:1, borders and the focus ring >= 3:1", () => {
    const wash = theme("--color-paid-wash") ?? "";
    expect(wash).toMatch(/^#[0-9a-f]{6}$/i);
    for (const name of ["graphite", "slate", "paid"]) {
      expect(contrast(theme(`--color-${name}`) ?? "", wash), name).toBeGreaterThanOrEqual(4.5);
    }
    for (const name of ["outline", "focus"]) {
      expect(contrast(theme(`--color-${name}`) ?? "", wash), name).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("F09 ADR-008 entrance of the signed-out brand panel", () => {
  it("AC-4a the entrance is a theme duration under a second, with an easing token", () => {
    expect(ms(theme("--duration-entrance"))).toBeLessThanOrEqual(1000);
    expect(ms(theme("--duration-entrance"))).toBeGreaterThan(0);
  });

  it("AC-4a its keyframes change only opacity and transform; motion-entrance runs them once", () => {
    const frames = /@keyframes\s+brand-enter\s*\{([\s\S]*?)\n\}/.exec(CSS)?.[1] ?? "";
    expect(frames).not.toBe("");
    const properties = [...frames.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]);
    expect(properties.length).toBeGreaterThan(0);
    for (const property of properties) expect(["opacity", "transform"]).toContain(property);
    const entrance = declarations().filter(
      (d) => d.property === "animation" && d.within.some((w) => /motion-entrance/.test(w)),
    );
    expect(entrance.map((d) => d.value)).toEqual([
      "brand-enter var(--duration-entrance) var(--ease-decelerate) 1",
    ]);
  });

  it("AC-4a,d only the brand panel's content uses it, and only from lg", () => {
    const users = SOURCES.filter((p) => /motion-entrance/.test(readFileSync(p, "utf8")));
    expect(users.map((p) => relative(SRC, p))).toEqual(["shared/ui/SignedOutPage.tsx"]);
    const source = readFileSync(join(SRC, "shared/ui/SignedOutPage.tsx"), "utf8");
    expect(source.match(/[\w:-]*motion-entrance/g)).toEqual(["lg:motion-entrance"]);
  });
});

describe("F08 ADR-007 motion rules in components", () => {
  it("AC-6b components use only the shared motion utilities, no Tailwind motion classes", () => {
    const utilities = new Set([...CSS.matchAll(/@utility\s+(motion-[\w-]+)/g)].map((m) => m[1]));
    expect(utilities.size).toBeGreaterThanOrEqual(4);
    for (const path of SOURCES) {
      const tokens = [...readFileSync(path, "utf8").matchAll(/"([^"\n]*)"|`([^`]*)`/g)]
        .flatMap((m) => (m[1] ?? m[2] ?? "").split(/\s+/))
        .map((token) => token.split(":").at(-1) ?? "");
      const file = relative(FRONTEND, path);
      expect(
        tokens.filter((t) => /^(transition(-[\w-]+)?|(duration|ease|delay|animate)-\S+)$/.test(t)),
        file,
      ).toEqual([]);
      for (const token of tokens.filter((t) => /^motion-[a-z-]+$/.test(t))) {
        expect(utilities.has(token), `${file}: ${token}`).toBe(true);
      }
    }
  });

  it("AC-6b no JavaScript animation: no animation library, Web Animations or frame loops", () => {
    const pkg = JSON.parse(readFileSync(join(FRONTEND, "package.json"), "utf8"));
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    expect(deps.filter((d) => /motion|gsap|anime|spring|animate/.test(d))).toEqual([]);
    for (const path of SOURCES) {
      expect(readFileSync(path, "utf8"), relative(FRONTEND, path)).not.toMatch(
        /requestAnimationFrame|setInterval|\.animate\(|behavior:\s*"smooth"/,
      );
    }
  });

  it("AC-5c Playwright runs every test with reduced motion; only f08-motion.spec.ts overrides it", () => {
    const config = readFileSync(join(FRONTEND, "playwright.config.ts"), "utf8");
    expect(config).toMatch(/use:\s*\{[^}]*reducedMotion:\s*"reduce"/);
    const E2E = join(FRONTEND, "e2e");
    const overriding = readdirSync(E2E, { recursive: true, encoding: "utf8" })
      .filter((name) => /\.ts$/.test(name))
      .filter((name) =>
        /reducedMotion:\s*"no-preference"/.test(readFileSync(join(E2E, name), "utf8")),
      );
    expect(overriding).toEqual(["f08-motion.spec.ts"]);
  });

  it("AC-6d no source comment says the design has no motion", () => {
    for (const path of [...SOURCES, join(SRC, "shared/styles/app.css")]) {
      expect(readFileSync(path, "utf8"), relative(FRONTEND, path)).not.toMatch(/no motion/i);
    }
  });
});

/** WCAG contrast of two #rrggbb colours. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const s = parseInt(hex.slice(i, i + 2), 16) / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (bl ?? 0);
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}
