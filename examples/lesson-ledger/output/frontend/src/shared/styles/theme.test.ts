/** F04 AC-2: Tailwind is part of the build and its theme is the design system of docs/design.md. */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { sectionTable } from "../../test/designDoc";

const FRONTEND = resolve(__dirname, "../../..");
const SRC = join(FRONTEND, "src");
const MAIN_CSS = join(SRC, "shared/styles/app.css");
const read = (path: string) => readFileSync(path, "utf8");

function filesUnder(dir: string, pattern: RegExp): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .map((name) => join(dir, name))
    .filter((path) => pattern.test(path));
}

/** The declarations of the `@theme { ... }` block as [name, value] pairs, in order. */
function themeDeclarations(): [string, string][] {
  const css = read(MAIN_CSS);
  const block = /@theme\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? "";
  return [...block.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(--[\w*-]+)\s*:\s*([^;]+);/g)].map(
    (m) => [m[1] ?? "", (m[2] ?? "").trim()],
  );
}

// F06: the dashboard plan's table names (ADR-006).
const DESIGN_TABLES = [
  "Palette",
  "Typefaces",
  "Type scale",
  "Spacing",
  "Radii",
  "Breakpoints and widths",
  // F08 (ADR-007): icon sizes and motion tokens.
  "Icons",
  "Motion",
];

/** Every theme variable docs/design.md names, with the value it gives. */
function designTokens(): { theme: string; value: string; row: Record<string, string> }[] {
  const doc = read(resolve(FRONTEND, "../docs/design.md"));
  return DESIGN_TABLES.flatMap((table) =>
    sectionTable(doc, table).map((row) => ({
      theme: (row.Theme ?? "").replace(/`/g, ""),
      value: (row.Value ?? row.Size ?? "").replace(/`/g, ""),
      row,
    })),
  );
}

/** Restyled parts: since F05 (AC-2 b) every non-test source file of the frontend. */
const RESTYLED = filesUnder(SRC, /\.tsx?$/).filter(
  (p) => !/\.test\.tsx?$|\.d\.ts$/.test(p) && !p.startsWith(join(SRC, "test")),
);

describe("AC-2 Tailwind CSS in the build", () => {
  it("AC-2a Tailwind and its Vite plugin are exact-pinned dependencies in the lock file", () => {
    const pkg = JSON.parse(read(join(FRONTEND, "package.json")));
    const lock = JSON.parse(read(join(FRONTEND, "package-lock.json")));
    for (const name of ["tailwindcss", "@tailwindcss/vite"]) {
      const declared = pkg.devDependencies?.[name] ?? pkg.dependencies?.[name];
      expect(declared, name).toMatch(/^\d+\.\d+\.\d+$/);
      const locked = lock.packages[`node_modules/${name}`];
      expect(locked?.version, `${name} in package-lock.json`).toBe(declared);
      expect(locked?.integrity, `${name} integrity`).toMatch(/^sha512-/);
    }
  });

  it("AC-2a the Vite build runs the Tailwind plugin on the main stylesheet", () => {
    expect(read(join(FRONTEND, "vite.config.ts"))).toMatch(
      /import tailwindcss from "@tailwindcss\/vite"[\s\S]*plugins:\s*\[[^\]]*tailwindcss\(\)/,
    );
    expect(read(join(SRC, "main.tsx"))).toContain('import "./shared/styles/app.css";');
    expect(read(MAIN_CSS)).toMatch(/^@import "tailwindcss";/m);
  });

  it("AC-2a nothing loads a stylesheet, font or script from a CDN or another origin", () => {
    const sources = [
      join(FRONTEND, "index.html"),
      ...filesUnder(SRC, /\.(css|tsx?|html)$/).filter((p) => !p.endsWith(".test.ts")),
    ];
    for (const path of sources) {
      const text = read(path);
      expect(text, relative(FRONTEND, path)).not.toMatch(
        /cdn\.|unpkg|jsdelivr|googleapis|gstatic|cdnjs|<link[^>]+https?:|url\(\s*["']?https?:|@import\s+["']?https?:/i,
      );
    }
  });
});

describe("AC-2 the theme implements docs/design.md", () => {
  it("AC-2b every name in docs/design.md is defined once in the theme, with its value", () => {
    const declarations = themeDeclarations();
    const tokens = designTokens();
    expect(tokens.length).toBeGreaterThan(20);
    for (const { theme, value, row } of tokens) {
      const matches = declarations.filter(([name]) => name === theme);
      expect(matches.length, `${theme} defined once`).toBe(1);
      const defined = matches[0]?.[1] ?? "";
      if (theme.startsWith("--font-")) {
        expect(defined, theme).toMatch(new RegExp(`^"${row.Family}",[^;]*sans-serif$`));
      } else {
        expect(defined.toLowerCase(), theme).toBe(value.toLowerCase());
      }
      if (row["Line height"]) {
        const lineHeight = declarations.find(([name]) => name === `${theme}--line-height`);
        expect(lineHeight?.[1], `${theme}--line-height`).toBe(row["Line height"].replace(/`/g, ""));
      }
    }
  });

  it("AC-2b the theme clears Tailwind's defaults, so only the design's names exist", () => {
    const declarations = themeDeclarations();
    const named = new Set(designTokens().map((token) => token.theme));
    const namespaces = [
      "color",
      "font",
      "text",
      "spacing",
      "radius",
      "breakpoint",
      "container",
      // F08 (ADR-007): easings are theme tokens too.
      "ease",
    ];
    for (const ns of namespaces) {
      expect(declarations, `--${ns}-* reset`).toContainEqual([`--${ns}-*`, "initial"]);
    }
    const extra = declarations
      .map(([name]) => name)
      .filter((name) => namespaces.some((ns) => name.startsWith(`--${ns}-`)))
      .filter((name) => !name.endsWith("-*") && !name.endsWith("--line-height"))
      .filter((name) => !named.has(name));
    expect(extra, "theme names not in docs/design.md").toEqual([]);
  });
});

describe("AC-2 restyled parts use only theme names", () => {
  it("AC-2c restyled files import no CSS module or tokens file and use no style attribute", () => {
    for (const path of RESTYLED) {
      const text = read(path);
      const file = relative(FRONTEND, path);
      expect(text, file).not.toMatch(/\.module\.css|tokens/);
      expect(text, file).not.toMatch(/\bstyle=/);
    }
  });

  it("AC-2c class names in restyled files have no literal colour, pixel size or arbitrary value", () => {
    for (const path of RESTYLED) {
      const literals = [...read(path).matchAll(/"([^"\n]*)"|`([^`]*)`/g)].map(
        (m) => m[1] ?? m[2] ?? "",
      );
      const offending = literals
        .flatMap((literal) => literal.split(/\s+/))
        .filter(
          (token) =>
            /^[\w:-]*\[.*\]$/.test(token) ||
            /#[0-9a-f]{3,8}\b/i.test(token) ||
            /\d+px\b/.test(token) ||
            /^[\w:-]+-px$/.test(token) ||
            /\b(rgb|hsl|oklch)\(/.test(token),
        );
      expect(offending, relative(FRONTEND, path)).toEqual([]);
    }
  });

  it("AC-2d custom CSS lives in the shared styles area and references only theme variables", () => {
    const cssFiles = filesUnder(SRC, /\.css$/).map((p) => relative(FRONTEND, p));
    // F05 AC-2a: the shared styles file of F04 is the only stylesheet.
    expect(cssFiles).toEqual(["src/shared/styles/app.css"]);

    const themeNames = new Set(themeDeclarations().map(([name]) => name));
    const custom = read(MAIN_CSS)
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/@theme\s*\{[\s\S]*?\n\}/, "")
      .replace(/@font-face\s*\{[^}]*\}/g, "");
    expect(custom).not.toMatch(/#[0-9a-f]{3,8}\b|\d+(\.\d+)?(px|rem|em)\b|\b(rgb|hsl|oklch)\(/i);
    const referenced = [...custom.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1] ?? "");
    expect(referenced.filter((name) => !themeNames.has(name))).toEqual([]);
  });

  it("F05 AC-2a no CSS module or tokens file exists or is imported", () => {
    expect(existsSync(join(SRC, "shared/ui/ui.module.css"))).toBe(false);
    expect(existsSync(join(SRC, "shared/styles/tokens.css"))).toBe(false);
    expect(read(MAIN_CSS)).not.toMatch(/@import\s+["'][^"']*tokens/);
    for (const path of filesUnder(SRC, /\.(tsx?|css)$/).filter((p) => !/\.test\.tsx?$/.test(p))) {
      expect(read(path), relative(FRONTEND, path)).not.toMatch(/\.module\.css|tokens\.css/);
    }
  });

  it("F05 AC-2b no source file under src uses a style attribute", () => {
    const sources = filesUnder(SRC, /\.tsx$/).filter((p) => !p.startsWith(join(SRC, "test")));
    for (const path of sources) {
      expect(read(path), relative(FRONTEND, path)).not.toMatch(/\bstyle=\{/);
    }
  });

  it("F05 AC-2d the design-doc parser sits with the test support code; no app module imports it", () => {
    expect(existsSync(join(SRC, "shared/styles/designDocParser.ts"))).toBe(false);
    expect(existsSync(join(SRC, "test/designDoc.ts"))).toBe(true);
    const appModules = filesUnder(SRC, /\.tsx?$/).filter(
      (p) => !/\.test\.tsx?$/.test(p) && !p.startsWith(join(SRC, "test")),
    );
    for (const path of appModules) {
      expect(read(path), relative(FRONTEND, path)).not.toMatch(
        /from\s+["'][^"']*(\/test\/|designDoc)/,
      );
    }
  });

  it("AC-2d the old app stylesheet and the global stylesheet are gone", () => {
    expect(existsSync(join(SRC, "app/App.module.css"))).toBe(false);
    expect(existsSync(join(SRC, "shared/styles/global.css"))).toBe(false);
  });
});

/** F06 AC-1c: what the manuscript identity of F04/F05 left in the code. */
const MANUSCRIPT =
  /stave|note.?head|piano|bar.?line|white.?key|alegreya|rounded-note|radius-(key|note)|\b(paper|sheet|ink|pencil|verdigris|verdigris-deep|brass|correction|correction-wash)\b/i;

describe("F06 AC-1c no manuscript identity in the source tree or the theme", () => {
  it("AC-1c no app source file, stylesheet or index.html names the manuscript identity", () => {
    const sources = [join(FRONTEND, "index.html"), ...RESTYLED, MAIN_CSS];
    for (const path of sources) {
      expect(read(path), relative(FRONTEND, path)).not.toMatch(MANUSCRIPT);
    }
  });

  it("AC-1c every font file in the frontend is referenced by the theme, and only one family exists", () => {
    const PUBLIC = join(FRONTEND, "public");
    const fontFiles = [SRC, ...(existsSync(PUBLIC) ? [PUBLIC] : [])]
      .flatMap((dir) => filesUnder(dir, /\.(woff2?|ttf|otf)$/))
      .map((p) => relative(join(SRC, "shared/styles"), p));
    expect(fontFiles.length).toBeGreaterThan(0);
    const css = read(MAIN_CSS);
    const referenced = [...css.matchAll(/url\("\.\/([^"]+)"\)/g)].map((m) => m[1]);
    expect(new Set(fontFiles)).toEqual(new Set(referenced));
    const families = new Set([...css.matchAll(/font-family:\s*"([^"]+)"/g)].map((m) => m[1]));
    expect(families.size).toBe(1);
    expect(existsSync(join(SRC, "shared/styles/fonts/alegreya"))).toBe(false);
    expect(existsSync(join(SRC, "shared/styles/fonts/alegreya-sans"))).toBe(false);
  });
});
