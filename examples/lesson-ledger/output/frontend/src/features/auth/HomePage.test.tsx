import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { deferred, fakeApi, notAuthenticated, session } from "../../test/api";
import { homeRoutes } from "../../test/ledger";
import { renderApp } from "../../test/renderApp";

const CURRENT = "GET /api/sessions/current";
const LOGOUT = "DELETE /api/sessions/current";
const ALICE = session("alice@example.com");

async function openHome(routes: Parameters<typeof fakeApi>[0] = {}) {
  // F07: Home also loads its overview; a new teacher's, so the page shows no other alert.
  const api = fakeApi({
    ...homeRoutes([], []),
    [CURRENT]: { status: 200, body: ALICE },
    ...routes,
  });
  const view = renderApp("/");
  await screen.findByText("Signed in as alice@example.com");
  return { api, view };
}

describe("AC-3 home page and log out", () => {
  it("shows the heading, the email and a Log out button", async () => {
    await openHome();

    expect(document.title).toBe("Lesson Ledger");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/^Lesson Ledger$/);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("main")).toHaveTextContent("Signed in as alice@example.com");
    expect(screen.getByRole("button", { name: "Log out" })).toBeEnabled();
  });

  it("logs out by keyboard, lands on /login and does not show the email again", async () => {
    const user = userEvent.setup();
    const { api } = await openHome({ [LOGOUT]: { status: 204 } });
    api.route(CURRENT, notAuthenticated);

    // F06: Log out moved into the shell, right before main, so it is one Shift+Tab from the h1.
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Log out" })).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(await screen.findByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
    expect(screen.getByTestId("location")).toHaveTextContent("/login");
    expect(api.calls(LOGOUT)).toHaveLength(1);
    expect(screen.queryByText(/alice@example.com/)).toBeNull();
  });

  it("discards all cached server data on log out, so Back cannot show it", async () => {
    const user = userEvent.setup();
    const { api, view } = await openHome({ [LOGOUT]: { status: 204 } });
    api.route(CURRENT, notAuthenticated);

    await user.click(screen.getByRole("button", { name: "Log out" }));
    await screen.findByRole("heading", { level: 1, name: "Log in" });

    const cached = view.queryClient.getQueryCache().getAll();
    expect(cached.map((query) => query.state.data)).not.toContainEqual(ALICE);
  });

  it("disables Log out while the request is in flight", async () => {
    const user = userEvent.setup();
    const reply = deferred<{ status: number; body?: unknown }>();
    const { api } = await openHome({ [LOGOUT]: { pending: reply.promise } });

    await user.dblClick(screen.getByRole("button", { name: "Log out" }));

    expect(screen.getByRole("button", { name: "Log out" })).toBeDisabled();
    expect(api.calls(LOGOUT)).toHaveLength(1);
    api.route(CURRENT, notAuthenticated);
    reply.resolve({ status: 204 });
    expect(await screen.findByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
  });

  it.each([
    ["a network error", { network: true } as const],
    ["a 5xx", { status: 500 }],
  ])("stays on / with an alert when log out fails with %s", async (_, reply) => {
    const user = userEvent.setup();
    await openHome({ [LOGOUT]: reply });

    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't log out. Please try again.",
    );
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
    expect(screen.getByText("Signed in as alice@example.com")).toBeVisible();
    expect(screen.getByRole("button", { name: "Log out" })).toBeEnabled();
  });

  it("goes to /login when log out answers 401 (session already gone)", async () => {
    const user = userEvent.setup();
    const { api } = await openHome({ [LOGOUT]: notAuthenticated });
    api.route(CURRENT, notAuthenticated);

    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
    expect(screen.queryByText(/alice@example.com/)).toBeNull();
  });
});
