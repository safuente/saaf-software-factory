/**
 * F05 AC-6: every app page, checked on the whole page in the states of the spec's "Checked
 * states": default (alice), empty (bob), many items (carol), field errors, load errors.
 * Flows that write data (AC-6 e, g) use teachers created by the test; seed accounts are read
 * only. Tab-through checks run on the default and error states only.
 */
import { expect, test, type Browser, type Page } from "@playwright/test";
import { expectNoClipOrOverlap, tabThrough, visibleSignature } from "./support/layout";
import { checkPageState, focusFromTop } from "./support/pageChecks";
import { ALICE, BOB, PASSWORD, forgetTeacher, signUp, uniqueEmail } from "./support/stack";

const CAROL = { email: "carol@example.com", password: "carol-ledger-pass" };
const ACCOUNTS = { alice: ALICE, bob: BOB, carol: CAROL };
type Account = keyof typeof ACCOUNTS;

interface AppState {
  path: string;
  account: Account;
  state: string;
  /** Runs before the page is opened (API failures). */
  before?: (page: Page) => Promise<void>;
  /** Brings the opened page into this state. */
  reach?: (page: Page) => Promise<void>;
  /** Tab-through checks of AC-6 a and g (default and error states only). */
  tab: boolean;
}

const failApi = (pattern: string) => async (page: Page) => {
  await page.route(pattern, (route) => route.fulfill({ status: 503, body: "" }));
};

const LOAD_ERROR = async (page: Page) => {
  await expect(page.getByRole("button", { name: "Try again" }).first()).toBeVisible();
};

const STATES: AppState[] = [
  ...["/", "/students", "/lessons", "/summary", "/pending"].map((path) => ({
    path,
    account: "alice" as const,
    state: "default",
    tab: true,
  })),
  ...["/students", "/lessons", "/summary", "/pending"].map((path) => ({
    path,
    account: "bob" as const,
    state: "empty",
    tab: false,
  })),
  ...["/students", "/lessons", "/summary", "/pending"].map((path) => ({
    path,
    account: "carol" as const,
    state: "many items",
    tab: false,
  })),
  {
    path: "/students",
    account: "alice",
    state: "field errors",
    tab: true,
    reach: async (page) => {
      await page.getByRole("button", { name: "Add student" }).click();
      await expect(page.getByLabel("Name")).toHaveAttribute("aria-invalid", "true");
    },
  },
  {
    path: "/lessons",
    account: "alice",
    state: "field errors",
    tab: true,
    reach: async (page) => {
      await page.getByLabel("Date").fill("");
      await page.getByRole("button", { name: "Record lesson" }).click();
      await expect(page.getByLabel("Student", { exact: true })).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    },
  },
  {
    path: "/students",
    account: "alice",
    state: "load error",
    tab: true,
    before: failApi("**/api/students?*"),
    reach: LOAD_ERROR,
  },
  {
    path: "/lessons",
    account: "alice",
    state: "load error",
    tab: true,
    before: failApi("**/api/lessons?*"),
    reach: LOAD_ERROR,
  },
  {
    path: "/summary",
    account: "alice",
    state: "load error",
    tab: true,
    before: failApi("**/api/monthly-summaries/*"),
    reach: LOAD_ERROR,
  },
  {
    path: "/pending",
    account: "alice",
    state: "load error",
    tab: true,
    before: failApi("**/api/pending-lessons?*"),
    reach: LOAD_ERROR,
  },
];

const nameOf = (s: AppState) => `${s.path} ${s.state} (${s.account})`;

/** One logged-in browser state per seed account, so each test starts signed in. */
const storage: Partial<Record<Account, Storage>> = {};

type Storage = Awaited<ReturnType<ReturnType<Page["context"]>["storageState"]>>;

async function storageFor(browser: Browser, account: Account): Promise<Storage> {
  const saved = storage[account];
  if (saved) return saved;
  const context = await browser.newContext();
  const page = await context.newPage();
  const { email, password } = ACCOUNTS[account];
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
  const state = await context.storageState();
  storage[account] = state;
  await context.close();
  return state;
}

async function signedInPage(browser: Browser, account: Account): Promise<Page> {
  const context = await browser.newContext({ storageState: await storageFor(browser, account) });
  return context.newPage();
}

async function openState(page: Page, state: AppState): Promise<void> {
  await state.before?.(page);
  await page.goto(state.path);
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Loading…" })).toHaveCount(0);
  await state.reach?.(page);
  await page.evaluate(() => document.fonts.ready);
}

/** Month navigation of /summary (F03 UI-1): boxes of Previous, the month heading and Next. */
async function monthNav(page: Page) {
  const box = async (name: string, role: "button" | "heading") => {
    const locator =
      role === "button"
        ? page.getByRole("button", { name, exact: true })
        : page.getByRole("heading", { level: 2 });
    const b = await locator.boundingBox();
    if (!b) throw new Error(`${name} has no box`);
    return b;
  };
  return {
    previous: await box("Previous month", "button"),
    heading: await box("month", "heading"),
    next: await box("Next month", "button"),
  };
}

type Box = { x: number; y: number; width: number; height: number };
const intersects = (a: Box, b: Box) =>
  Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 &&
  Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1;
const sameRow = (a: Box, b: Box) => {
  const centre = b.y + b.height / 2;
  return centre >= a.y && centre <= a.y + a.height;
};

async function expectMonthNav(page: Page, width: number): Promise<void> {
  const { previous, heading, next } = await monthNav(page);
  expect(Math.abs(previous.y - next.y), `${width}: equal tops`).toBeLessThanOrEqual(1);
  expect(intersects(previous, heading), `${width}: Previous over heading`).toBe(false);
  expect(intersects(next, heading), `${width}: Next over heading`).toBe(false);
  if (width >= 768) {
    expect(sameRow(previous, heading) && sameRow(next, heading), `${width}: one row`).toBe(true);
  }
}

for (const state of STATES) {
  const name = nameOf(state);

  test(`AC-6 a-d, f, g ${name}`, async ({ browser }) => {
    test.slow();
    const page = await signedInPage(browser, state.account);
    try {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await openState(page, state);
      await checkPageState(page, name, {
        tab: state.tab,
        layout: state.path === "/summary" ? (width) => expectMonthNav(page, width) : undefined,
      });
    } finally {
      await page.context().close();
    }
  });
}

test("AC-6f at 200% text the empty Add a student form still shows its field error", async ({
  browser,
}) => {
  const page = await signedInPage(browser, "alice");
  try {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openState(page, STATES[1] as AppState);
    await page.evaluate(() => {
      const size = parseFloat(getComputedStyle(document.documentElement).fontSize);
      document.documentElement.style.fontSize = `${size * 2}px`;
    });
    await page.getByRole("button", { name: "Add student" }).click();
    await expect(page.getByText("Enter the student's name.")).toBeVisible();
    await expectNoClipOrOverlap(page, "body", "/students 200% field error");
  } finally {
    await page.context().close();
  }
});

test.describe("AC-6e touch at 375 x 667", () => {
  test.use({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });

  test("AC-6e the device reports no hover", async ({ page }) => {
    await page.goto("/login");
    expect(await page.evaluate(() => matchMedia("(hover: none)").matches)).toBe(true);
  });

  for (const state of STATES) {
    test(`AC-6e hovering reveals nothing: ${nameOf(state)}`, async ({ browser }) => {
      test.slow();
      const context = await browser.newContext({
        viewport: { width: 375, height: 667 },
        hasTouch: true,
        isMobile: true,
        storageState: await storageFor(browser, state.account),
      });
      const page = await context.newPage();
      try {
        await openState(page, state);
        const targets = page.locator("body").locator("a[href], button, input, select");
        const count = await targets.count();
        const before = await visibleSignature(page);
        for (let i = 0; i < count; i++) {
          await targets.nth(i).hover();
          expect(await visibleSignature(page), `${nameOf(state)}: hovering ${i}`).toEqual(before);
        }
      } finally {
        await context.close();
      }
    });
  }

  test("AC-6e add a student, record a lesson, change month, mark and undo, mark on pending, log out: taps only", async ({
    page,
  }) => {
    const email = uniqueEmail();
    try {
      await signUp(page, email, PASSWORD);
      const nav = page.getByRole("navigation", { name: "Main" });

      await nav.getByRole("link", { name: "Students" }).tap();
      await page.getByLabel("Name").tap();
      await page.keyboard.type("Zed Keys");
      await page.getByRole("button", { name: "Add student" }).tap();
      await expect(page.getByRole("status").filter({ hasText: "Student added." })).toBeVisible();

      await nav.getByRole("link", { name: "Lessons" }).tap();
      await page.getByLabel("Student", { exact: true }).tap();
      await page.getByLabel("Student", { exact: true }).selectOption({ label: "Zed Keys" });
      await page.getByLabel("Duration (minutes)").tap();
      await page.keyboard.type("45");
      await page.getByLabel("Price (USD)").tap();
      await page.keyboard.type("40");
      await page.getByRole("button", { name: "Record lesson" }).tap();
      await expect(page.getByRole("status").filter({ hasText: "Lesson recorded." })).toBeVisible();

      await nav.getByRole("link", { name: "Monthly summary" }).tap();
      await expect(page.getByRole("heading", { level: 1, name: "Monthly summary" })).toBeFocused();
      const month = page.getByRole("heading", { level: 2 });
      const current = await month.textContent();
      await page.getByRole("button", { name: "Previous month" }).tap();
      await expect(month).not.toHaveText(current ?? "");
      await page.getByRole("button", { name: "Next month" }).tap();
      await expect(month).toHaveText(current ?? "");
      await page.getByRole("button", { name: /^Mark as paid: Zed Keys/ }).tap();
      await expect(page.getByRole("status").filter({ hasText: "Marked as paid." })).toBeVisible();
      await page.getByRole("button", { name: /^Undo paid: Zed Keys/ }).tap();
      await expect(page.getByRole("status").filter({ hasText: "Marked as unpaid." })).toBeVisible();

      await nav.getByRole("link", { name: "Pending payments" }).tap();
      await page.getByRole("button", { name: /^Mark as paid: Zed Keys/ }).tap();
      await expect(page.getByText("Nothing pending. Every lesson is paid.")).toBeVisible();

      await nav.getByRole("link", { name: "Home" }).tap();
      await page.getByRole("button", { name: "Log out" }).tap();
      await expect(page).toHaveURL(/\/login$/);
    } finally {
      forgetTeacher(email);
    }
  });
});

test.describe("AC-6g short landscape at 667 x 375", () => {
  test.use({ viewport: { width: 667, height: 375 } });

  /** Presses Tab (or Shift+Tab) until `target` has focus. */
  async function tabTo(page: Page, target: ReturnType<Page["getByRole"]>, back = false) {
    for (let i = 0; i < 80; i++) {
      if (await target.evaluate((el) => el === document.activeElement).catch(() => false)) return;
      await page.keyboard.press(back ? "Shift+Tab" : "Tab");
    }
    await expect(target).toBeFocused();
  }

  test("AC-6g the flows of AC-6e with the keyboard only", async ({ page }) => {
    const email = uniqueEmail();
    try {
      await signUp(page, email, PASSWORD);
      const nav = page.getByRole("navigation", { name: "Main" });
      const go = async (link: string) => {
        await tabTo(page, nav.getByRole("link", { name: link }), true);
        await page.keyboard.press("Enter");
        await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
      };

      await go("Students");
      await tabTo(page, page.getByLabel("Name"));
      await page.keyboard.type("Zed Keys");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("status").filter({ hasText: "Student added." })).toBeVisible();

      await go("Lessons");
      await tabTo(page, page.getByLabel("Student", { exact: true }));
      await page.keyboard.type("Z");
      await expect(page.getByLabel("Student", { exact: true })).toHaveValue(/\d+/);
      await tabTo(page, page.getByLabel("Duration (minutes)"));
      await page.keyboard.type("45");
      await page.keyboard.press("Tab");
      await page.keyboard.type("40");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("status").filter({ hasText: "Lesson recorded." })).toBeVisible();

      await go("Monthly summary");
      const month = page.getByRole("heading", { level: 2 });
      const current = await month.textContent();
      await tabTo(page, page.getByRole("button", { name: "Previous month" }));
      await page.keyboard.press("Enter");
      await expect(month).not.toHaveText(current ?? "");
      await tabTo(page, page.getByRole("button", { name: "Next month" }));
      await page.keyboard.press("Enter");
      await expect(month).toHaveText(current ?? "");
      await tabTo(page, page.getByRole("button", { name: /^Mark as paid: Zed Keys/ }));
      await page.keyboard.press("Enter");
      await expect(page.getByRole("status").filter({ hasText: "Marked as paid." })).toBeVisible();
      const undo = page.getByRole("button", { name: /^Undo paid: Zed Keys/ });
      await expect(undo).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("status").filter({ hasText: "Marked as unpaid." })).toBeVisible();

      await go("Pending payments");
      await tabTo(page, page.getByRole("button", { name: /^Mark as paid: Zed Keys/ }));
      await page.keyboard.press("Enter");
      await expect(page.getByText("Nothing pending. Every lesson is paid.")).toBeVisible();

      await go("Home");
      await tabTo(page, page.getByRole("button", { name: "Log out" }));
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/login$/);
    } finally {
      forgetTeacher(email);
    }
  });
});

test.describe("UI-2 a focused control scrolled to the viewport edge shows its whole focus ring", () => {
  for (const viewport of [
    { width: 320, height: 568 },
    // UI-3: a table region shorter than the viewport keeps its whole ring too.
    { width: 375, height: 667 },
    { width: 667, height: 375 },
  ]) {
    for (const path of ["/", "/lessons", "/students", "/summary", "/pending"]) {
      test(`UI-2 ${path} at ${viewport.width} x ${viewport.height}`, async ({ browser }) => {
        const page = await signedInPage(browser, "alice");
        await page.setViewportSize(viewport);
        await openState(page, { path, account: "alice", state: "default", tab: true });
        await focusFromTop(page);
        const stops = await tabThrough(page, "body");
        expect(stops.length).toBeGreaterThan(0);
        expect(stops.filter((s) => !s.ringInViewport).map((s) => s.name)).toEqual([]);
        await page.context().close();
      });
    }
  }
});
