/** F08 AC-3: the illustrated states of Behavior "Illustrated states", with the named seed
 * accounts (read only), and no illustration in other states. */
import { expect, test, type Page } from "@playwright/test";
import { ILLUSTRATED } from "./support/f08";
import { ALICE, logIn } from "./support/stack";

async function illustration(page: Page, selector: string, text: string) {
  return page.evaluate(
    ({ selector, text }) => {
      const svgs = [...document.querySelectorAll("svg[data-illustration]")];
      const message = [...document.querySelectorAll(selector)].find((el) =>
        (el.textContent ?? "").includes(text),
      );
      const svg = svgs[0];
      const sb = svg?.getBoundingClientRect();
      const mb = message?.getBoundingClientRect();
      return {
        count: svgs.length,
        hidden: svg?.getAttribute("aria-hidden"),
        titled: Boolean(svg?.querySelector("title, desc")),
        inTable: Boolean(svg?.closest("table")),
        right: Boolean(svg && message && svg.nextElementSibling === message),
        above: Boolean(sb && mb && sb.bottom <= mb.top + 1),
        visible: Boolean(sb && sb.width > 0 && sb.height > 0),
      };
    },
    { selector, text },
  );
}

test.describe("F08 AC-3 illustrated states", () => {
  for (const state of ILLUSTRATED) {
    test(`AC-3a ${state.who.email} ${state.path}: one illustration above the message`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await logIn(page, state.who.email, state.who.password);
      await page.goto(state.path);
      await expect(page.locator(state.message).filter({ hasText: state.text })).toBeVisible();
      const i = await illustration(page, state.message, state.text);
      expect(i).toEqual({
        count: 1,
        hidden: "true",
        titled: false,
        inTable: false,
        right: true,
        above: true,
        visible: true,
      });
    });
  }

  test("AC-3c alice's pages with data, and Home's in-section messages, show no illustration", async ({
    page,
  }) => {
    await logIn(page, ALICE.email, ALICE.password);
    for (const path of ["/", "/lessons", "/students", "/summary", "/pending"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByText("Loading…", { exact: true })).toHaveCount(0);
      expect(await page.locator("svg[data-illustration]").count(), path).toBe(0);
    }
  });
});
