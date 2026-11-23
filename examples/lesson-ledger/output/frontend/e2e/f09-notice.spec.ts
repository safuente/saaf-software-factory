/**
 * F09 AC-3: "You have logged out." after a log out the server confirmed (204), and on no other
 * appearance of Log in. Seed teacher alice logs in and out (no data changes); the expired-session
 * case uses a teacher created by the test (F01 AC-5 pattern).
 */
import { expect, test, type Page } from "@playwright/test";
import { contrast } from "./support/f08";
import {
  ALICE,
  PASSWORD,
  SESSION_COOKIE,
  ageSessions,
  forgetTeacher,
  logIn,
  signUp,
  uniqueEmail,
} from "./support/stack";

const NOTICE = "You have logged out.";
const DANGER = ["rgb(196, 43, 43)", "rgb(253, 240, 239)"];

/** Cookie names and browser storage keys of the page. */
async function stored(page: Page) {
  const cookies = (await page.context().cookies()).map((c) => c.name).sort();
  const storage = await page.evaluate(() => ({
    local: Object.keys(localStorage).sort(),
    session: Object.keys(sessionStorage).sort(),
  }));
  return { cookies, ...storage };
}

async function logOut(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
}

const notice = (page: Page) => page.getByText(NOTICE, { exact: true });

/** The opaque background colour behind an element. */
async function background(page: Page, selector: string): Promise<string> {
  return page.locator(selector).evaluate((el) => {
    for (let e: Element | null = el; e; e = e.parentElement) {
      const colour = getComputedStyle(e).backgroundColor;
      if (colour !== "rgba(0, 0, 0, 0)") return colour;
    }
    return "rgb(255, 255, 255)";
  });
}

test.describe("F09 AC-3 the logged-out notice", () => {
  test("AC-3a-e after Log out (204): a polite status on /login that stays on the page", async ({
    page,
  }) => {
    await logIn(page, ALICE.email, ALICE.password);
    const before = await stored(page);
    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().endsWith("/api/sessions/current") && r.request().method() === "DELETE",
      ),
      logOut(page),
    ]);
    expect(response.status()).toBe(204);

    // (a) on /login without query or hash; a polite status between the h1 and the form.
    expect(new URL(page.url()).pathname).toBe("/login");
    expect(new URL(page.url()).search).toBe("");
    expect(new URL(page.url()).hash).toBe("");
    const status = page.getByRole("status").filter({ hasText: NOTICE });
    await expect(status).toHaveText(NOTICE);
    await expect(page.getByRole("main").getByRole("status")).toHaveText(NOTICE);
    expect(await status.getAttribute("aria-live")).not.toBe("assertive");
    await expect(page.getByRole("alert")).toHaveCount(0);
    const order = await status.evaluate((el) => {
      const h1 = document.querySelector("h1") as Element;
      const form = document.querySelector("form") as Element;
      return {
        afterH1: Boolean(h1.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING),
        beforeForm: Boolean(el.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING),
        inForm: form.contains(el),
      };
    });
    expect(order).toEqual({ afterH1: true, beforeForm: true, inForm: false });

    // (b) not an error: no danger colours, no icon, no control, not focusable, >= 4.5:1.
    const look = await status.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        colour: s.color,
        background: s.backgroundColor,
        border: [s.borderTopColor, s.borderLeftColor],
        svgs: el.querySelectorAll("svg, img").length,
        controls: el.querySelectorAll("a, button, input, [tabindex]").length,
        tabindex: el.getAttribute("tabindex"),
      };
    });
    for (const colour of [look.colour, look.background, ...look.border]) {
      expect(DANGER).not.toContain(colour);
    }
    expect([look.svgs, look.controls, look.tabindex]).toEqual([0, 0, null]);
    const ground = await background(page, "main [role=status]");
    expect(contrast(look.colour, ground)).toBeGreaterThanOrEqual(4.5);

    // (c) focus on the h1, as on every page appearance.
    await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeFocused();

    // (d) no cookie name added; the same storage keys.
    const after = await stored(page);
    expect(after.cookies.filter((name) => !before.cookies.includes(name))).toEqual([]);
    expect([after.local, after.session]).toEqual([before.local, before.session]);

    // (e) the notice stays after a field error and after a failed log in.
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Enter your email.")).toBeVisible();
    await expect(notice(page)).toBeVisible();
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByRole("alert")).toHaveText("Email or password is incorrect.");
    await expect(notice(page)).toBeVisible();

    // (f) reloading /login shows none.
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
    await expect(notice(page)).toHaveCount(0);
  });

  test("AC-3f none after Back to the app page, its redirect, and Forward to /login", async ({
    page,
  }) => {
    await logIn(page, ALICE.email, ALICE.password);
    await logOut(page);
    await expect(notice(page)).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
    await expect(notice(page)).toHaveCount(0);
    await page.goForward();
    await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
    await expect(notice(page)).toHaveCount(0);
  });

  test("AC-3f none after Create an account then Log in", async ({ page }) => {
    await logIn(page, ALICE.email, ALICE.password);
    await logOut(page);
    await expect(notice(page)).toBeVisible();
    await page.getByRole("link", { name: "Create an account" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Create your account" }),
    ).toBeVisible();
    await expect(notice(page)).toHaveCount(0);
    await page.getByRole("link", { name: "Log in" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
    await expect(notice(page)).toHaveCount(0);
  });

  test("AC-3f none on /login opened directly or reached without a valid session", async ({
    page,
    context,
  }) => {
    const reach = async (path: string) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
      await expect(notice(page), path).toHaveCount(0);
    };
    await reach("/login");
    await reach("/");
    await reach("/lessons");
    const url = new URL(page.url());
    await context.addCookies([
      { name: SESSION_COOKIE, value: "not-a-real-token", domain: url.hostname, path: "/" },
    ]);
    await reach("/");
    await reach("/lessons");

    const email = uniqueEmail();
    try {
      await signUp(page, email, PASSWORD);
      ageSessions(email, "15 days");
      await reach("/");
    } finally {
      forgetTeacher(email);
    }
  });

  test("AC-3f none after a Log out whose DELETE returns 401", async ({ page }) => {
    await logIn(page, ALICE.email, ALICE.password);
    // The session ends elsewhere first (same cookie jar), so Log out's DELETE gets a real 401.
    expect((await page.request.delete("/api/sessions/current")).status()).toBe(204);
    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().endsWith("/api/sessions/current") && r.request().method() === "DELETE",
      ),
      logOut(page),
    ]);
    expect(response.status()).toBe(401);
    await expect(page).toHaveURL(/\/login$/);
    await expect(notice(page)).toHaveCount(0);
  });

  for (const failure of ["500", "network"] as const) {
    test(`AC-3g a Log out failing with ${failure} stays on the page with no notice`, async ({
      page,
    }) => {
      await logIn(page, ALICE.email, ALICE.password);
      await page.route("**/api/sessions/current", (route) => {
        if (route.request().method() !== "DELETE") return route.fallback();
        return failure === "500" ? route.fulfill({ status: 500, body: "" }) : route.abort();
      });
      await page.getByRole("button", { name: "Log out" }).click();
      await expect(page.getByRole("alert")).toHaveText("Couldn't log out. Please try again.");
      expect(new URL(page.url()).pathname).toBe("/");
      await expect(notice(page)).toHaveCount(0);
      expect(await page.evaluate((text) => document.body.innerHTML.includes(text), NOTICE)).toBe(
        false,
      );
    });
  }
});
