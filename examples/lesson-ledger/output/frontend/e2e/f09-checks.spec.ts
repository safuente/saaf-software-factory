/**
 * F09 AC-5 (c): the F05 AC-6 (a)-(g) per-state checks, as extended by F06 AC-6 and F08 AC-6 (a),
 * on /login and /signup in their default, field-error and form-error states and on Log in with
 * the logged-out notice, with and without reduced motion. The notice state logs seed teacher
 * alice in and out (no data changes); the other states need no account.
 * AC-5 (f) (CSP and no violation on /login and /signup, both motion settings) is
 * e2e/f08-checks.spec.ts "AC-6c", whose header is unchanged by F09.
 */
import { expect, test, type Page } from "@playwright/test";
import { checkPageState } from "./support/pageChecks";
import { ALICE, PASSWORD, logIn } from "./support/stack";

interface SignedOutState {
  path: "/login" | "/signup";
  state: string;
  /** Brings the page into this state; the page ends on `path` with its h1 shown. */
  reach: (page: Page) => Promise<void>;
}

const open = (path: string) => async (page: Page) => {
  await page.goto(path);
};

const STATES: SignedOutState[] = [
  { path: "/login", state: "default", reach: open("/login") },
  {
    path: "/login",
    state: "field errors",
    reach: async (page) => {
      await page.goto("/login");
      await page.getByRole("button", { name: "Log in" }).click();
      await expect(page.getByText("Enter your password.")).toBeVisible();
    },
  },
  {
    path: "/login",
    state: "form error",
    reach: async (page) => {
      await page.goto("/login");
      await page.getByLabel("Email").fill("nobody@example.com");
      await page.getByLabel("Password").fill(PASSWORD);
      await page.getByRole("button", { name: "Log in" }).click();
      await expect(page.getByRole("alert")).toHaveText("Email or password is incorrect.");
    },
  },
  {
    path: "/login",
    state: "logged-out notice",
    reach: async (page) => {
      await logIn(page, ALICE.email, ALICE.password);
      await page.getByRole("button", { name: "Log out" }).click();
      await expect(page.getByText("You have logged out.", { exact: true })).toBeVisible();
    },
  },
  { path: "/signup", state: "default", reach: open("/signup") },
  {
    path: "/signup",
    state: "field errors",
    reach: async (page) => {
      await page.goto("/signup");
      await page.getByRole("button", { name: "Create account" }).click();
      await expect(page.getByText("Password must be at least 12 characters.")).toBeVisible();
    },
  },
  {
    path: "/signup",
    state: "form error",
    reach: async (page) => {
      await page.route("**/api/teachers", (route) => route.fulfill({ status: 503, body: "" }));
      await page.goto("/signup");
      await page.getByLabel("Email").fill("nobody@example.com");
      await page.getByLabel("Password").fill(PASSWORD);
      await page.getByRole("button", { name: "Create account" }).click();
      await expect(page.getByRole("alert")).toHaveText("Something went wrong. Please try again.");
    },
  },
];

const MOTION = [
  ["reduce", "reduced"],
  ["no-preference", "on"],
] as const;

test.describe("F09 AC-5c per-state checks on the signed-out pages", () => {
  for (const [reducedMotion, motion] of MOTION) {
    for (const state of STATES) {
      const name = `${state.path} ${state.state} (${reducedMotion})`;
      test(`AC-5c ${name}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion });
        await page.setViewportSize({ width: 1280, height: 800 });
        await state.reach(page);
        await expect(page).toHaveURL(new RegExp(`${state.path}$`));
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await page.evaluate(async () => {
          await document.fonts.ready;
          // The checks read the final state: end the entrance at once.
          document.getAnimations().forEach((a) => a.finish());
        });
        await checkPageState(page, name, { tab: true, minStops: 4, motion });
      });
    }
  }
});
