/**
 * F04 AC-6: the restyled parts (/login, /signup, the app shell header and page layout) across
 * accessibility, widths, reflow, wide screens, touch, text resize and short landscape.
 * Checks on app pages are scoped to the header (and the page layout where the spec says so);
 * the content of the pages F05 restyles is checked in F05.
 */
import { expect, test, type Page } from "@playwright/test";
import {
  APP_PAGES,
  NAV_LINKS,
  elementsOutside,
  expectNoAxeViolations,
  expectNoClipOrOverlap,
  expectNoHorizontalScroll,
  longestMotion,
  overlappingElements,
  smallTargets,
  tabThrough,
  themeLength,
  visibleControls,
  visibleSignature,
  wideTextBlocks,
} from "./support/layout";
import { ALICE, PASSWORD, forgetTeacher, logIn, uniqueEmail } from "./support/stack";

interface PublicState {
  path: "/login" | "/signup";
  state: string;
  /** Brings the page from its default state into this state. */
  reach: (page: Page) => Promise<void>;
}

const submit = (page: Page, name: string) => page.getByRole("button", { name }).click();

const PUBLIC_STATES: PublicState[] = [
  { path: "/login", state: "default", reach: async () => {} },
  {
    path: "/login",
    state: "field errors",
    reach: async (page) => {
      await submit(page, "Log in");
      await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
    },
  },
  {
    path: "/login",
    state: "server error",
    reach: async (page) => {
      await page.route("**/api/sessions", (route) => route.fulfill({ status: 503, body: "" }));
      await page.getByLabel("Email").fill(ALICE.email);
      await page.getByLabel("Password").fill(ALICE.password);
      await submit(page, "Log in");
      await expect(page.getByRole("alert")).toHaveText("Something went wrong. Please try again.");
    },
  },
  { path: "/signup", state: "default", reach: async () => {} },
  {
    path: "/signup",
    state: "field errors",
    reach: async (page) => {
      await submit(page, "Create account");
      await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
    },
  },
  {
    path: "/signup",
    state: "server error",
    reach: async (page) => {
      await page.route("**/api/teachers", (route) => route.fulfill({ status: 502, body: "" }));
      await page.getByLabel("Email").fill("someone-new@example.com");
      await page.getByLabel("Password").fill(PASSWORD);
      await submit(page, "Create account");
      await expect(page.getByRole("alert")).toHaveText("Something went wrong. Please try again.");
    },
  },
];

async function openState(page: Page, { path, reach }: PublicState): Promise<void> {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await reach(page);
}

async function openAppPage(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Loading…" })).toHaveCount(0);
}

/** Puts the sequential focus starting point at the top of the page, before the header. */
async function focusFromTop(page: Page): Promise<void> {
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo(0, 0);
  });
  await page.mouse.click(1, 1);
}

async function expectNavLinksShown(page: Page, state: string): Promise<void> {
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link")).toHaveText(NAV_LINKS);
  for (const name of NAV_LINKS) {
    await expect(nav.getByRole("link", { name, exact: true }), `${state}: ${name}`).toBeVisible();
  }
  await expect(nav.getByRole("button"), `${state}: no menu toggle`).toHaveCount(0);
  expect(await overlappingElements(page, "header"), `${state}: header overlap`).toEqual([]);
}

test.describe("AC-6a accessibility of the restyled parts", () => {
  for (const state of PUBLIC_STATES) {
    test(`AC-6a ${state.path} ${state.state}: WCAG 2.2 AA, target size, focus, motion`, async ({
      page,
    }) => {
      const name = `${state.path} ${state.state}`;
      await openState(page, state);
      await expectNoAxeViolations(page, name);
      expect(await smallTargets(page, "body"), `${name}: small targets`).toEqual([]);

      await page.getByRole("heading", { level: 1 }).focus();
      const stops = await tabThrough(page, "body");
      expect(stops.length, `${name}: tab stops`).toBeGreaterThanOrEqual(4);
      for (const stop of stops) {
        expect(stop.indicator, `${name}: focus indicator on ${stop.name}`).toBe(true);
        expect(stop.covered, `${name}: ${stop.name} covered`).toBe(false);
      }
    });
  }

  test("AC-6a with reduced motion nothing on /login or /signup transitions or animates", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const state of PUBLIC_STATES) {
      await openState(page, state);
      expect(await longestMotion(page), `${state.path} ${state.state}`).toBeLessThanOrEqual(0.01);
      await page.unrouteAll();
    }
  });

  test("AC-6a the app shell header on every app page", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await logIn(page, ALICE.email, ALICE.password);
    for (const path of APP_PAGES) {
      await openAppPage(page, path);
      await expectNoAxeViolations(page, `${path} header`, "header");
      expect(await smallTargets(page, "header"), `${path}: small targets`).toEqual([]);
      expect(await longestMotion(page), `${path}: motion`).toBeLessThanOrEqual(0.01);

      await focusFromTop(page);
      const stops = (await tabThrough(page, "header", 8)).filter((stop) => stop.inScope);
      expect(
        stops.map((s) => s.name.split('"')[1]),
        `${path}: header tab order`,
      ).toEqual([...NAV_LINKS, "Log out"]); // F06 AC-2a: Log out moved into the shell.
      for (const stop of stops) {
        expect(stop.indicator, `${path}: focus indicator on ${stop.name}`).toBe(true);
        expect(stop.covered, `${path}: ${stop.name} covered`).toBe(false);
      }
    }
  });
});

test.describe("AC-6b common widths", () => {
  test("AC-6b at 375, 768 and 1280 px no page scrolls sideways and the five links show", async ({
    page,
  }) => {
    for (const path of ["/login", "/signup"]) {
      await page.goto(path);
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        await expectNoHorizontalScroll(page, `${path} at ${width}`);
      }
    }
    await logIn(page, ALICE.email, ALICE.password);
    for (const path of APP_PAGES) {
      await openAppPage(page, path);
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        await expectNoHorizontalScroll(page, `${path} at ${width}`);
        await expectNavLinksShown(page, `${path} at ${width}`);
      }
    }
  });
});

test.describe("AC-6c reflow at 320 x 568", () => {
  test.use({ viewport: { width: 320, height: 568 } });

  for (const state of PUBLIC_STATES) {
    test(`AC-6c ${state.path} ${state.state} reflows into 320 px`, async ({ page }) => {
      const name = `${state.path} ${state.state}`;
      await openState(page, state);
      await expectNoHorizontalScroll(page, name);
      expect(await elementsOutside(page, "body", 320), `${name}: outside 0-320`).toEqual([]);
      await expectNoClipOrOverlap(page, "body", name);
    });
  }

  test("AC-6c the app header and page layout reflow into 320 px", async ({ page }) => {
    await logIn(page, ALICE.email, ALICE.password);
    for (const path of APP_PAGES) {
      await openAppPage(page, path);
      expect(await elementsOutside(page, "header", 320), `${path}: header`).toEqual([]);
      expect(await elementsOutside(page, "main > h1", 320), `${path}: page heading`).toEqual([]);
      await expectNoClipOrOverlap(page, "header", `${path} header`);
      await expectNavLinksShown(page, `${path} at 320`);
    }
  });
});

test.describe("AC-6d wide screen at 1920 x 1080", () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test("AC-6d regions stop at the maximum content width and text stays under 80ch", async ({
    page,
  }) => {
    const width = async (selector: string) =>
      (await page.locator(selector).first().boundingBox())?.width ?? Infinity;
    await page.goto("/login");
    const max = await themeLength(page, "--container-content");
    expect(max).toBeGreaterThan(0);
    expect(max).toBeLessThanOrEqual(1600);

    for (const state of PUBLIC_STATES) {
      const name = `${state.path} ${state.state}`;
      await openState(page, state);
      expect(await width("main"), `${name}: main`).toBeLessThanOrEqual(max);
      expect(await width("form"), `${name}: form`).toBeLessThanOrEqual(max);
      expect(await wideTextBlocks(page, "body", 80), `${name}: lines over 80ch`).toEqual([]);
      await page.unrouteAll();
    }

    await logIn(page, ALICE.email, ALICE.password);
    for (const path of APP_PAGES) {
      await openAppPage(page, path);
      expect(await width("header > div"), `${path}: header content`).toBeLessThanOrEqual(max);
      expect(await width("main"), `${path}: main`).toBeLessThanOrEqual(max);
      expect(await wideTextBlocks(page, "header", 80), `${path}: header text`).toEqual([]);
    }
  });
});

test.describe("AC-6e touch at 375 x 667", () => {
  test.use({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });

  async function expectHoverRevealsNothing(page: Page, scope: string, state: string) {
    const targets = page.locator(scope).locator("a[href], button, input, select");
    const count = await targets.count();
    expect(count, `${state}: interactive elements`).toBeGreaterThan(0);
    const before = await visibleSignature(page);
    for (let i = 0; i < count; i++) {
      await targets.nth(i).hover();
      const after = await visibleSignature(page);
      expect(after, `${state}: hovering element ${i}`).toEqual(before);
    }
  }

  test("AC-6e the device reports no hover and a coarse pointer", async ({ page }) => {
    await page.goto("/login");
    expect(await page.evaluate(() => matchMedia("(hover: none)").matches)).toBe(true);
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
  });

  test("AC-6e log in and sign up with taps only", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").tap();
    await page.keyboard.type(ALICE.email);
    await page.getByLabel("Password").tap();
    await page.keyboard.type(ALICE.password);
    await page.getByRole("button", { name: "Log in" }).tap();
    await expect(page.getByText(`Signed in as ${ALICE.email}`)).toBeVisible();

    await page.context().clearCookies();
    const email = uniqueEmail();
    try {
      await page.goto("/login");
      await page.getByRole("link", { name: "Create an account" }).tap();
      await expect(page).toHaveURL(/\/signup$/);
      await page.getByLabel("Email").tap();
      await page.keyboard.type(email);
      await page.getByLabel("Password").tap();
      await page.keyboard.type(PASSWORD);
      await page.getByRole("button", { name: "Create account" }).tap();
      await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
    } finally {
      forgetTeacher(email);
    }
  });

  test("AC-6e hovering reveals nothing on /login, /signup or the app header", async ({ page }) => {
    for (const path of ["/login", "/signup"]) {
      await page.goto(path);
      await expectHoverRevealsNothing(page, "body", path);
    }
    await logIn(page, ALICE.email, ALICE.password);
    await openAppPage(page, "/");
    await expectHoverRevealsNothing(page, "header", "app header");
  });
});

test.describe("AC-6f text resized to 200% at 1280 x 800", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  const resizeText = (page: Page) =>
    page.evaluate(() => {
      // CSSOM, not a style attribute in the markup, so the CSP is unaffected.
      document.documentElement.style.fontSize = "200%";
    });

  for (const path of ["/login", "/signup"] as const) {
    test(`AC-6f ${path} at 200% text keeps everything visible, unclipped and unscrolled`, async ({
      page,
    }) => {
      await page.goto(path);
      const before = await visibleControls(page);
      await resizeText(page);
      await expectNoHorizontalScroll(page, `${path} 200%`);
      await expectNoClipOrOverlap(page, "body", `${path} 200%`);
      expect(await visibleControls(page)).toEqual(before);

      if (path === "/login") {
        await submit(page, "Log in");
        await expect(page.getByText("Enter your email.")).toBeVisible();
        await expect(page.getByText("Enter your password.")).toBeVisible();
        await expectNoClipOrOverlap(page, "body", "/login 200% field errors");
      }
    });
  }

  test("AC-6f the app header at 200% text keeps the five links visible", async ({ page }) => {
    await logIn(page, ALICE.email, ALICE.password);
    for (const path of APP_PAGES) {
      await openAppPage(page, path);
      await resizeText(page);
      await expectNavLinksShown(page, `${path} 200%`);
      await expectNoClipOrOverlap(page, "header", `${path} 200% header`);
      expect(await elementsOutside(page, "header", 1280), `${path}: header`).toEqual([]);
    }
  });
});

test.describe("AC-6g short landscape at 667 x 375", () => {
  test.use({ viewport: { width: 667, height: 375 } });

  test("AC-6g a fixed or sticky header is at most 25% of the viewport height", async ({ page }) => {
    await logIn(page, ALICE.email, ALICE.password);
    for (const path of APP_PAGES) {
      await openAppPage(page, path);
      const header = await page.locator("header").evaluate((el) => ({
        position: getComputedStyle(el).position,
        height: el.getBoundingClientRect().height,
      }));
      if (header.position === "fixed" || header.position === "sticky") {
        expect(header.height, path).toBeLessThanOrEqual(375 * 0.25);
      }
    }
  });

  test("AC-6g every focused element is fully in view and uncovered", async ({ page }) => {
    for (const state of PUBLIC_STATES) {
      const name = `${state.path} ${state.state}`;
      await openState(page, state);
      await page.getByRole("heading", { level: 1 }).focus();
      for (const stop of await tabThrough(page, "body")) {
        expect(stop.inViewport, `${name}: ${stop.name} in view`).toBe(true);
        expect(stop.covered, `${name}: ${stop.name} covered`).toBe(false);
      }
      await page.unrouteAll();
    }
    await logIn(page, ALICE.email, ALICE.password);
    for (const path of APP_PAGES) {
      await openAppPage(page, path);
      await focusFromTop(page);
      const stops = (await tabThrough(page, "header", 8)).filter((stop) => stop.inScope);
      expect(stops).toHaveLength(NAV_LINKS.length + 1); // F06 AC-2a: plus Log out.
      for (const stop of stops) {
        expect(stop.inViewport, `${path}: ${stop.name} in view`).toBe(true);
        expect(stop.covered, `${path}: ${stop.name} covered`).toBe(false);
      }
    }
  });

  test("AC-6g log in and sign up with the keyboard only", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.type(ALICE.email);
    await page.keyboard.press("Tab");
    await page.keyboard.type(ALICE.password);
    await page.keyboard.press("Enter");
    await expect(page.getByText(`Signed in as ${ALICE.email}`)).toBeVisible();

    await page.context().clearCookies();
    const email = uniqueEmail();
    try {
      await page.goto("/login");
      await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeFocused();
      for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
      await expect(page.getByRole("link", { name: "Create an account" })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("heading", { level: 1, name: "Create your account" }),
      ).toBeFocused();
      await page.keyboard.press("Tab");
      await page.keyboard.type(email);
      await page.keyboard.press("Tab");
      await page.keyboard.type(PASSWORD);
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "Create account" })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
    } finally {
      forgetTeacher(email);
    }
  });
});
