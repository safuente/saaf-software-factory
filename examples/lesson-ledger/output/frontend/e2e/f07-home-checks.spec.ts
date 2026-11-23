/**
 * F07 AC-6: Home (`/`) in every state of the spec's "Seed accounts and states", checked with the
 * F05 AC-6 and F06 AC-6 definitions, plus Home's own layout, headings, CSP and the touch and
 * keyboard flows through Home. Seed accounts are read only; the other states, and every flow
 * that writes, use teachers created by the test.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type APIRequestContext, type Browser, type Page } from "@playwright/test";
import { visibleSignature } from "./support/layout";
import { checkPageState } from "./support/pageChecks";
import { ALICE, BOB, PASSWORD, forgetTeacher, signUp, uniqueEmail } from "./support/stack";

const CAROL = { email: "carol@example.com", password: "carol-ledger-pass" };
const SEED = { alice: ALICE, bob: BOB, carol: CAROL };

const RECORD = "Record lesson on the Lessons page";
const ADD = "Add student on the Students page";

async function addStudent(request: APIRequestContext, name: string): Promise<number> {
  const response = await request.post("/api/students", { data: { name } });
  expect(response.status()).toBe(201);
  return (await response.json()).id;
}

async function addLesson(request: APIRequestContext, studentId: number, paid = false) {
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const response = await request.post("/api/lessons", {
    data: {
      student_id: studentId,
      date,
      duration_minutes: 45,
      price: { amount: 4500, currency: "USD" },
    },
  });
  expect(response.status()).toBe(201);
  if (paid) {
    const id = (await response.json()).id;
    expect((await request.patch(`/api/lessons/${id}`, { data: { paid: true } })).status()).toBe(
      200,
    );
  }
}

interface HomeState {
  name: string;
  /** A seed account, or data for a teacher the test creates. */
  account: keyof typeof SEED | ((request: APIRequestContext) => Promise<void>);
  /** Tab-through checks (default and error states, as in F05). */
  tab: boolean;
  before?: (page: Page) => Promise<void>;
  /** Shown once the state is reached. */
  ready: (page: Page) => ReturnType<Page["getByText"]>;
}

const STATES: HomeState[] = [
  {
    name: "default (alice)",
    account: "alice",
    tab: true,
    ready: (page) => page.getByRole("table", { name: "Latest lessons, newest first" }),
  },
  {
    name: "many items (carol)",
    account: "carol",
    tab: false,
    ready: (page) => page.getByText("Total pending: $23,400.00 across 520 lessons"),
  },
  {
    name: "new teacher (bob)",
    account: "bob",
    tab: false,
    ready: (page) => page.getByRole("heading", { level: 2, name: "Get started" }),
  },
  {
    name: "students, no lessons",
    account: async (request) => {
      await addStudent(request, "Zoe Park");
    },
    tab: false,
    ready: (page) => page.getByText("No lessons recorded yet."),
  },
  {
    name: "all paid",
    account: async (request) => {
      await addLesson(request, await addStudent(request, "Zoe Park"), true);
    },
    tab: false,
    ready: (page) => page.getByText("Nothing pending. Every lesson is paid."),
  },
  {
    name: "load error (alice)",
    account: "alice",
    tab: true,
    before: async (page) => {
      await page.route("**/api/pending-lessons?*", (route) =>
        route.fulfill({ status: 503, body: "" }),
      );
    },
    ready: (page) => page.getByRole("button", { name: "Try again" }),
  },
];

/** A signed-in page for the state's teacher; `done` removes a teacher the test created. */
async function pageFor(
  browser: Browser,
  state: HomeState,
  options: Parameters<Browser["newContext"]>[0] = {},
): Promise<{ page: Page; done: () => Promise<void> }> {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  let email: string;
  if (typeof state.account === "string") {
    ({ email } = SEED[state.account]);
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(SEED[state.account].password);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
  } else {
    email = uniqueEmail();
    await signUp(page, email, PASSWORD);
    await state.account(page.request);
  }
  const created = typeof state.account !== "string";
  return {
    page,
    done: async () => {
      await context.close();
      if (created) forgetTeacher(email);
    },
  };
}

async function openHome(page: Page, state: HomeState): Promise<void> {
  await state.before?.(page);
  await page.goto("/");
  await expect(state.ready(page)).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Loading…" })).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
}

type Box = { x: number; y: number; width: number; height: number };
const overlaps = (a: Box, b: Box) =>
  Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 &&
  Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1;

/** AC-6c: below 1024 px the title row's links sit below the h1 and the sections stack in DOM
 * order; at every width the links never overlap the h1. */
async function expectHomeLayout(page: Page, width: number): Promise<void> {
  const box = async (locator: ReturnType<Page["locator"]>) => {
    const b = await locator.boundingBox();
    if (!b) throw new Error("no box");
    return b;
  };
  const h1 = await box(page.getByRole("heading", { level: 1 }));
  for (const name of [RECORD, ADD]) {
    const link = await box(page.getByRole("link", { name, exact: true }));
    expect(overlaps(h1, link), `${width}: ${name} over the h1`).toBe(false);
    if (width < 1024)
      expect(link.y, `${width}: ${name} below the h1`).toBeGreaterThan(h1.y + h1.height);
  }
  if (width >= 1024) return;
  const sections = page.locator("main > section");
  let bottom = h1.y + h1.height;
  for (let i = 0; i < (await sections.count()); i++) {
    const section = await box(sections.nth(i));
    expect(section.y, `${width}: section ${i + 1} below the one before`).toBeGreaterThanOrEqual(
      bottom - 1,
    );
    bottom = section.y + section.height;
  }
}

for (const state of STATES) {
  test(`AC-6a F05 AC-6 a-d, f, g on / ${state.name}`, async ({ browser }) => {
    test.slow();
    const { page, done } = await pageFor(browser, state);
    try {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await openHome(page, state);
      await checkPageState(page, `/ ${state.name}`, {
        tab: state.tab,
        layout: (width) => expectHomeLayout(page, width),
      });
    } finally {
      await done();
    }
  });

  test(`AC-6a F05 AC-6e touch at 375 x 667, hovering reveals nothing: / ${state.name}`, async ({
    browser,
  }) => {
    test.slow();
    const { page, done } = await pageFor(browser, state, {
      viewport: { width: 375, height: 667 },
      hasTouch: true,
      isMobile: true,
    });
    try {
      await openHome(page, state);
      expect(await page.evaluate(() => matchMedia("(hover: none)").matches)).toBe(true);
      const targets = page.locator("body").locator("a[href], button, input, select");
      const before = await visibleSignature(page);
      for (let i = 0; i < (await targets.count()); i++) {
        await targets.nth(i).hover();
        expect(await visibleSignature(page), `${state.name}: hovering ${i}`).toEqual(before);
      }
    } finally {
      await done();
    }
  });
}

test("AC-6b one h1 and the named h2s; status in words, never colour alone", async ({ browser }) => {
  const { page, done } = await pageFor(browser, STATES[0] as HomeState);
  try {
    await openHome(page, STATES[0] as HomeState);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(["Lesson Ledger"]);
    const month = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
      new Date(),
    );
    await expect(page.getByRole("heading", { level: 2 })).toHaveText([
      month,
      "Oldest unpaid lessons",
      "Latest lessons",
    ]);
    const statuses = page
      .getByRole("table", { name: "Latest lessons, newest first" })
      .locator("td:nth-child(5)");
    for (const text of await statuses.allTextContents()) {
      expect(text.replace("✓", "").trim()).toMatch(/^(Paid|Unpaid)$/);
    }
  } finally {
    await done();
  }
});

test("AC-6a F06 AC-6a the quick actions: text >= 4.5:1, focus ring >= 3:1 on white", async ({
  browser,
}) => {
  const { page, done } = await pageFor(browser, STATES[2] as HomeState);
  try {
    await openHome(page, STATES[2] as HomeState);
    for (const name of [RECORD, ADD]) {
      const link = page.getByRole("link", { name, exact: true });
      await link.focus();
      const colours = await link.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          text: s.color,
          fill: s.backgroundColor,
          ring: s.outlineColor,
          style: s.outlineStyle,
        };
      });
      expect(colours.style, name).not.toBe("none");
      expect(contrast(colours.text, colours.fill), `${name} text`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(colours.ring, "rgb(255, 255, 255)"), `${name} ring`).toBeGreaterThanOrEqual(
        3,
      );
    }
  } finally {
    await done();
  }
});

/** WCAG relative-luminance contrast of two rgb() colours. */
function contrast(a: string, b: string): number {
  const lum = (colour: string) => {
    const [r, g, bl] = (colour.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map((v) => {
      const s = Number(v) / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (bl ?? 0);
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

test("AC-6e the CSP of / is F06's (nginx config), and loading Home fires no violation", async ({
  browser,
}) => {
  const conf = readFileSync(path.resolve(import.meta.dirname, "../nginx/default.conf"), "utf8");
  const configured = /add_header Content-Security-Policy "([^"]+)"/.exec(conf)?.[1];
  expect(configured).toBeTruthy();
  const { page, done } = await pageFor(browser, STATES[0] as HomeState);
  try {
    await page.addInitScript(() => {
      const w = window as unknown as { __violations: string[] };
      w.__violations = [];
      document.addEventListener("securitypolicyviolation", (e) =>
        w.__violations.push(e.violatedDirective),
      );
    });
    const response = await page.goto("/");
    expect(response?.headers()["content-security-policy"]).toBe(configured);
    const other = await page.request.get("/lessons");
    expect(other.headers()["content-security-policy"]).toBe(configured);
    await expect(STATES[0]?.ready(page) as ReturnType<Page["getByText"]>).toBeVisible();
    expect(
      await page.evaluate(() => (window as unknown as { __violations: string[] }).__violations),
    ).toEqual([]);
  } finally {
    await done();
  }
});

test.describe("AC-6a F05 AC-6e touch at 375 x 667 through Home", () => {
  test.use({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });

  test("AC-6a quick actions, add a student, record a lesson, mark as paid on Home, log out: taps only", async ({
    page,
  }) => {
    const email = uniqueEmail();
    try {
      await signUp(page, email, PASSWORD);
      await page.getByRole("link", { name: ADD }).tap();
      await expect(page).toHaveURL(/\/students$/);
      await page.getByLabel("Name").tap();
      await page.keyboard.type("Zed Keys");
      await page.getByRole("button", { name: "Add student" }).tap();
      await expect(page.getByRole("status").filter({ hasText: "Student added." })).toBeVisible();

      await page
        .getByRole("navigation", { name: "Main" })
        .getByRole("link", { name: "Home" })
        .tap();
      await page.getByRole("link", { name: RECORD }).tap();
      await expect(page).toHaveURL(/\/lessons$/);
      await page.getByLabel("Student", { exact: true }).selectOption({ label: "Zed Keys" });
      await page.getByLabel("Duration (minutes)").tap();
      await page.keyboard.type("45");
      await page.getByLabel("Price (USD)").tap();
      await page.keyboard.type("40");
      await page.getByRole("button", { name: "Record lesson" }).tap();
      await expect(page.getByRole("status").filter({ hasText: "Lesson recorded." })).toBeVisible();

      await page
        .getByRole("navigation", { name: "Main" })
        .getByRole("link", { name: "Home" })
        .tap();
      await page.getByRole("button", { name: /^Mark as paid: Zed Keys/ }).tap();
      await expect(page.getByText("Nothing pending. Every lesson is paid.")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 2, name: "Oldest unpaid lessons" }),
      ).toBeFocused();

      await page.getByRole("button", { name: "Log out" }).tap();
      await expect(page).toHaveURL(/\/login$/);
    } finally {
      forgetTeacher(email);
    }
  });
});

test.describe("AC-6a F05 AC-6g short landscape at 667 x 375 through Home", () => {
  test.use({ viewport: { width: 667, height: 375 } });

  async function tabTo(page: Page, target: ReturnType<Page["getByRole"]>, back = false) {
    for (let i = 0; i < 80; i++) {
      if (await target.evaluate((el) => el === document.activeElement).catch(() => false)) return;
      await page.keyboard.press(back ? "Shift+Tab" : "Tab");
    }
    await expect(target).toBeFocused();
  }

  test("AC-6a the flows of the touch test with the keyboard only", async ({ page }) => {
    const email = uniqueEmail();
    try {
      await signUp(page, email, PASSWORD);
      const home = async () => {
        await tabTo(
          page,
          page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Home" }),
          true,
        );
        await page.keyboard.press("Enter");
        await expect(page.getByRole("heading", { level: 1, name: "Lesson Ledger" })).toBeFocused();
      };

      await expect(page.getByRole("heading", { level: 2, name: "Get started" })).toBeVisible();
      await tabTo(page, page.getByRole("link", { name: ADD }));
      await page.keyboard.press("Enter");
      await expect(page.getByRole("heading", { level: 1, name: "Students" })).toBeFocused();
      await tabTo(page, page.getByLabel("Name"));
      await page.keyboard.type("Zed Keys");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("status").filter({ hasText: "Student added." })).toBeVisible();

      await home();
      await tabTo(page, page.getByRole("link", { name: RECORD }));
      await page.keyboard.press("Enter");
      await expect(page.getByRole("heading", { level: 1, name: "Lessons" })).toBeFocused();
      await tabTo(page, page.getByLabel("Student", { exact: true }));
      await page.keyboard.type("Z");
      await expect(page.getByLabel("Student", { exact: true })).toHaveValue(/\d+/);
      await tabTo(page, page.getByLabel("Duration (minutes)"));
      await page.keyboard.type("45");
      await page.keyboard.press("Tab");
      await page.keyboard.type("40");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("status").filter({ hasText: "Lesson recorded." })).toBeVisible();

      await home();
      await tabTo(page, page.getByRole("button", { name: /^Mark as paid: Zed Keys/ }));
      await page.keyboard.press("Enter");
      await expect(page.getByText("Nothing pending. Every lesson is paid.")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 2, name: "Oldest unpaid lessons" }),
      ).toBeFocused();

      await tabTo(page, page.getByRole("button", { name: "Log out" }), true);
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/login$/);
    } finally {
      forgetTeacher(email);
    }
  });
});
