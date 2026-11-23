/** F08 AC-1: decorative Lucide icons on the production build. Seed teacher alice is read only;
 * states that change data use a teacher created by the test. */
import { expect, test, type Page } from "@playwright/test";
import {
  ICON_MAP,
  LESSON_B,
  addF03Data,
  contrast,
  iconColours,
  iconViolations,
} from "./support/f08";
import { APP_PAGES, NAV_LINKS } from "./support/layout";
import { ALICE, PASSWORD, forgetTeacher, logIn, signUp, uniqueEmail } from "./support/stack";

async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Loading…", { exact: true })).toHaveCount(0);
}

test.describe("F08 AC-1 icons as alice", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await logIn(page, ALICE.email, ALICE.password);
  });

  test("AC-1a,b,c every page shows icons only on the listed controls, hidden, names unchanged", async ({
    page,
  }) => {
    for (const path of APP_PAGES) {
      await open(page, path);
      expect(await iconViolations(page), path).toEqual([]);
      const nav = page.getByRole("navigation", { name: "Main" });
      for (const label of NAV_LINKS) {
        await expect(nav.getByRole("link", { name: label, exact: true }), path).toHaveText(label);
      }
      await expect(page.getByRole("button", { name: "Log out", exact: true })).toHaveText(
        "Log out",
      );
      const icons = await page.locator("svg.lucide").count();
      expect(icons, `${path}: icons shown`).toBeGreaterThanOrEqual(NAV_LINKS.length + 1);
    }
    await open(page, "/");
    await expect(
      page.getByRole("link", { name: "Record lesson on the Lessons page", exact: true }),
    ).toHaveText("Record lesson");
    await expect(
      page.getByRole("link", { name: "Add student on the Students page", exact: true }),
    ).toHaveText("Add student");
    await open(page, "/lessons");
    await expect(page.getByRole("button", { name: "Record lesson", exact: true })).toBeVisible();
    await open(page, "/students");
    await expect(page.getByRole("button", { name: "Add student", exact: true })).toBeVisible();
  });

  test("AC-1c icons are never focusable: Tab never stops on an svg", async ({ page }) => {
    await open(page, "/summary");
    const focusable = await page.evaluate(
      () =>
        [...document.querySelectorAll("svg")].filter((svg) => {
          svg.focus();
          return document.activeElement === svg;
        }).length,
    );
    expect(focusable).toBe(0);
  });

  test("AC-1e,f icons take the text colour, >= 3:1 on their ground, normal, hover and focus", async ({
    page,
  }) => {
    await open(page, "/summary");
    const controls = [
      page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Monthly summary" }),
      page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Lessons" }),
      page.getByRole("button", { name: "Log out" }),
      page.getByRole("button", { name: /^(Mark as paid|Undo paid): / }).first(),
    ];
    for (const control of controls) {
      const name = (await control.textContent()) ?? "";
      for (const state of ["normal", "hover", "focus"] as const) {
        await page.mouse.move(1, 1);
        await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
        if (state === "hover") await control.hover();
        if (state === "focus") await control.focus();
        const c = await iconColours(control);
        expect(c.icon, `${name} ${state}: icon in text colour`).toBe(c.text);
        expect(contrast(c.icon, c.ground), `${name} ${state}`).toBeGreaterThanOrEqual(3);
      }
    }
    await open(page, "/");
    for (const name of ["Record lesson on the Lessons page", "Add student on the Students page"]) {
      const link = page.getByRole("link", { name, exact: true });
      for (const state of ["normal", "hover", "focus"] as const) {
        await page.mouse.move(1, 1);
        if (state === "hover") await link.hover();
        if (state === "focus") await link.focus();
        const c = await iconColours(link);
        expect(c.icon, `${name} ${state}`).toBe(c.text);
        expect(contrast(c.icon, c.ground), `${name} ${state}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  test("AC-1e Log out while logging out: disabled, icon stays at >= 3:1", async ({ page }) => {
    await open(page, "/lessons");
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/api/sessions/current", async (route) => {
      if (route.request().method() !== "DELETE") return route.fallback();
      await held;
      await route.fulfill({ status: 503, body: "" });
    });
    const logOut = page.getByRole("button", { name: "Log out", exact: true });
    await logOut.click();
    await expect(logOut).toBeDisabled();
    expect(await iconViolations(page)).toEqual([]);
    const c = await iconColours(logOut);
    expect(c.icon).toBe(c.text);
    expect(contrast(c.icon, c.ground)).toBeGreaterThanOrEqual(3);
    release();
    const alert = page.getByRole("alert");
    await expect(alert).toHaveText("Couldn't log out. Please try again.");
    expect(await iconViolations(page)).toEqual([]);
    const a = await iconColours(alert);
    expect(contrast(a.icon, a.ground)).toBeGreaterThanOrEqual(3);
  });
});

test("AC-1a,c the log-in error alert shows its icon and its exact text", async ({ page }) => {
  await page.goto("/login");
  expect(await iconViolations(page)).toEqual([]);
  await page.getByLabel("Email").fill(ALICE.email);
  await page.getByLabel("Password").fill("not-the-password-1");
  await page.getByRole("button", { name: "Log in" }).click();
  const alert = page.getByRole("alert");
  await expect(alert).toBeVisible();
  const text = (await alert.textContent()) ?? "";
  expect(text.length).toBeGreaterThan(0);
  expect(await iconViolations(page)).toEqual([]);
  expect(await alert.locator("svg").count()).toBe(1);
});

test.describe("F08 AC-1 d with a test teacher", () => {
  const email = uniqueEmail();
  test.beforeEach(async ({ page }) => {
    await signUp(page, email, PASSWORD);
    await addF03Data(page.request);
  });
  test.afterEach(() => forgetTeacher(email));

  test("AC-1d Saving… shows no icon; the label and its icon come back", async ({ page }) => {
    await open(page, "/summary?month=2026-11");
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/api/lessons/*", async (route) => {
      if (route.request().method() !== "PATCH") return route.fallback();
      await held;
      await route.fallback();
    });
    const button = page.getByRole("button", { name: LESSON_B, exact: true });
    await button.click();
    await expect(button).toHaveText("Saving…");
    expect(await button.locator("svg").count()).toBe(0);
    expect(await iconViolations(page)).toEqual([]);
    release();
    const undo = page.getByRole("button", { name: "Undo paid: Adam Lee, Nov 10, 2026" });
    await expect(undo).toHaveText("Undo paid");
    await expect(undo.locator(`svg.lucide-${ICON_MAP["Undo paid"]}`)).toHaveCount(1);
    expect(await iconViolations(page)).toEqual([]);
  });
});
