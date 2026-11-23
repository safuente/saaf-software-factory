/** F06 AC-2: the dashboard shell on every app page, with Log out moved into it (F01's request,
 * navigation, disabled state and failure alert). */
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { deferred, fakeApi, notAuthenticated } from "../../test/api";
import { CURRENT, lesson, paymentRoutes, student } from "../../test/ledger";
import { renderApp } from "../../test/renderApp";

const LOGOUT = "DELETE /api/sessions/current";
const APP_PAGES = [
  ["/", "Lesson Ledger"],
  ["/lessons", "Lessons"],
  ["/students", "Students"],
  ["/summary", "Monthly summary"],
  ["/pending", "Pending payments"],
] as const;

async function open(path: string, heading: string, routes = {}) {
  const lessons = [lesson(1, student(1, "Zoe Park"), "2026-11-03", 45, 4250)];
  const api = fakeApi({ ...paymentRoutes(lessons), ...routes });
  const view = renderApp(path);
  await screen.findByRole("heading", { level: 1, name: heading });
  // The session gate's own loading page has no shell; wait for the app page.
  await screen.findByRole("navigation", { name: "Main" });
  return { api, view };
}

describe("F06 AC-2 the shell on every app page", () => {
  it.each(APP_PAGES)(
    "AC-2a %s: the header holds the Main navigation, then one Log out button below the links",
    async (path, heading) => {
      await open(path, heading);
      const banner = screen.getByRole("banner");
      const nav = within(banner).getByRole("navigation", { name: "Main" });
      const logOut = within(banner).getByRole("button", { name: "Log out" });
      expect(screen.getAllByRole("button", { name: "Log out" })).toHaveLength(1);
      expect(nav.contains(logOut)).toBe(false);
      expect(nav.compareDocumentPosition(logOut) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(
        within(screen.getByRole("main")).queryByRole("button", { name: "Log out" }),
      ).toBeNull();
    },
  );

  it("AC-2a,e the header is the dark shell; main is white with the h1 at the title step", async () => {
    await open("/lessons", "Lessons");
    const banner = screen.getByRole("banner");
    expect(banner.className).toMatch(/\bbg-shell\b/);
    expect(banner.className).toMatch(/\blg:w-sidebar\b/);
    // At least viewport tall through the shell row; the inner column fills the whole header,
    // so Log out reaches the sidebar's bottom on long pages too (APR-1).
    expect(banner.parentElement?.className).toMatch(/\blg:min-h-screen\b/);
    expect(banner.className).toMatch(/\blg:flex-col\b/);
    expect(banner.querySelector(":scope > div")?.className).toMatch(/\blg:flex-1\b/);
    const main = screen.getByRole("main");
    expect(main.className).toMatch(/\bbg-canvas\b/);
    expect(screen.getByRole("heading", { level: 1 }).className).toMatch(/\btext-title\b/);
  });

  it("AC-2c neither the header nor anything in it is fixed or sticky", async () => {
    await open("/", "Lesson Ledger");
    const banner = screen.getByRole("banner");
    for (const el of [banner, ...banner.querySelectorAll("*")]) {
      expect(el.getAttribute("class") ?? "", el.tagName).not.toMatch(/\b(fixed|sticky)\b/);
    }
  });

  it.each(APP_PAGES.filter(([path]) => path !== "/"))(
    "AC-2f %s: Log out sends DELETE once, is disabled while it runs and lands on /login",
    async (path, heading) => {
      const user = userEvent.setup();
      const reply = deferred<{ status: number; body?: unknown }>();
      const { api } = await open(path, heading, { [LOGOUT]: { pending: reply.promise } });

      await user.dblClick(screen.getByRole("button", { name: "Log out" }));
      expect(screen.getByRole("button", { name: "Log out" })).toBeDisabled();
      expect(api.calls(LOGOUT)).toHaveLength(1);

      api.route(CURRENT, notAuthenticated);
      reply.resolve({ status: 204 });
      expect(await screen.findByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
      expect(screen.getByTestId("location")).toHaveTextContent("/login");
    },
  );

  it("AC-2f a failed log out shows the alert at the top of main and keeps the page", async () => {
    const user = userEvent.setup();
    await open("/pending", "Pending payments", { [LOGOUT]: { status: 503 } });

    await user.click(screen.getByRole("button", { name: "Log out" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Couldn't log out. Please try again.");
    const main = screen.getByRole("main");
    expect(main.firstElementChild).toBe(alert);
    expect(screen.getByTestId("location")).toHaveTextContent("/pending");
    expect(screen.getByRole("button", { name: "Log out" })).toBeEnabled();
  });

  it("AC-2f log out clears the cached data of the page it was used on", async () => {
    const user = userEvent.setup();
    const { api, view } = await open("/summary", "Monthly summary", { [LOGOUT]: { status: 204 } });
    api.route(CURRENT, notAuthenticated);

    await user.click(screen.getByRole("button", { name: "Log out" }));
    await screen.findByRole("heading", { level: 1, name: "Log in" });

    expect(
      view.queryClient
        .getQueryCache()
        .getAll()
        .filter((q) => q.state.data),
    ).toEqual([]);
  });
});
