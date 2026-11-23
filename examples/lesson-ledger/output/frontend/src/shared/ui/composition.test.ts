/** F04 AC-3: the shared UI area provides the components, and the restyled pages use only them. */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = resolve(__dirname, "../..");
const COMPONENTS = [
  "Button",
  "TextField",
  "SelectField",
  "Table",
  "StatusMessage",
  "Alert",
  "LoadError",
  "Page",
  "MainNav",
  "Form",
];
const RESTYLED_PAGES = [
  "features/auth/LoginPage.tsx",
  "features/auth/SignupPage.tsx",
  "features/auth/SessionGate.tsx",
];
/** F05 AC-2c: home, students, lessons, summary and pending, and the row button of the last two. */
const F05_PAGES = [
  "features/auth/HomePage.tsx",
  "features/students/StudentsPage.tsx",
  "features/lessons/LessonsPage.tsx",
  "features/payments/SummaryPage.tsx",
  "features/payments/PendingPage.tsx",
  "features/payments/PaidButton.tsx",
  "features/payments/MetricsPanel.tsx",
];

describe("AC-3 shared components", () => {
  it("AC-3 every shared component exists with its own unit test", () => {
    for (const name of COMPONENTS) {
      expect(existsSync(join(SRC, `shared/ui/${name}.tsx`)), name).toBe(true);
      expect(existsSync(join(SRC, `shared/ui/${name}.test.tsx`)), `${name} test`).toBe(true);
    }
  });

  it("AC-3 login, sign-up and the session gate render no HTML element of their own", () => {
    for (const page of RESTYLED_PAGES) {
      const source = readFileSync(join(SRC, page), "utf8");
      // JSX elements only: `<p` after a space, bracket or brace, not a type argument like useState<string>.
      expect(source.match(/(^|[\s({>])<[a-z][a-z0-9]*[\s>/]/gm), page).toBeNull();
      expect(source, page).not.toMatch(/className=/);
    }
  });
});

describe("F05 AC-2c the remaining pages use the shared components", () => {
  /** Elements and roles that only the shared components may render. */
  const SHARED_ONLY =
    /<(button|input|select|textarea|form|table|caption|thead|tbody|tr|th|td|label)[\s>/]|role="(status|alert|region)"/g;

  it("F05 AC-2c buttons, fields, tables, status messages, alerts and load errors come from shared/ui", () => {
    for (const page of F05_PAGES) {
      const source = readFileSync(join(SRC, page), "utf8");
      expect(source.match(SHARED_ONLY), page).toBeNull();
    }
  });

  it("F05 AC-2c each page imports the shared components it renders", () => {
    const uses: Record<string, string[]> = {
      // F06: Home's Log out button and its alert moved into the shell that Page renders.
      "features/auth/HomePage.tsx": ["Page"],
      "shared/ui/Page.tsx": ["Button", "Alert", "MainNav"],
      "features/students/StudentsPage.tsx": [
        "Button",
        "TextField",
        "Form",
        "StatusMessage",
        "LoadError",
        "Alert",
      ],
      "features/lessons/LessonsPage.tsx": [
        "Button",
        "TextField",
        "SelectField",
        "Form",
        "Table",
        "StatusMessage",
        "LoadError",
        "Alert",
        "PaymentStatus",
      ],
      "features/payments/SummaryPage.tsx": [
        "Button",
        "Table",
        "StatusMessage",
        "LoadError",
        "Alert",
        "PaymentStatus",
        // F06: the totals moved into the metrics panel.
        "MetricsPanel",
      ],
      "features/payments/MetricsPanel.tsx": ["Totals"],
      "features/payments/PendingPage.tsx": ["Table", "StatusMessage", "LoadError", "Alert"],
      "features/payments/PaidButton.tsx": ["Button"],
    };
    for (const [page, components] of Object.entries(uses)) {
      const source = readFileSync(join(SRC, page), "utf8");
      for (const name of components) {
        expect(source, `${page} renders <${name}`).toMatch(new RegExp(`<${name}[\\s>]`));
      }
    }
  });
});

describe("AC-6e hover parity (inspection, automated)", () => {
  const files = [
    ...COMPONENTS.map((name) => `shared/ui/${name}.tsx`),
    ...RESTYLED_PAGES,
    ...F05_PAGES,
  ];

  it("AC-6e every hover: class has a focus-visible: or focus: twin in the same file", () => {
    for (const file of files) {
      const source = readFileSync(join(SRC, file), "utf8");
      for (const [, cue] of source.matchAll(/(?<![\w:-])hover:([\w:-]+)/g)) {
        const twins = [`focus-visible:${cue}`, `focus:${cue}`];
        expect(
          twins.some((twin) => source.includes(twin)),
          `${file}: hover:${cue}`,
        ).toBe(true);
      }
    }
  });

  it("AC-6e no information is given only by a title attribute", () => {
    for (const file of files) {
      // A title attribute on an HTML element; Page's `title` prop sets the document title.
      expect(readFileSync(join(SRC, file), "utf8"), file).not.toMatch(
        /<[a-z][\w-]*\s[^>]*\btitle=/,
      );
    }
  });
});
