import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { deferred, fakeApi, notAuthenticated, session } from "../../test/api";
import { renderApp, visitedPaths } from "../../test/renderApp";

const CURRENT = "GET /api/sessions/current";

describe("AC-4 pages require a session", () => {
  it.each(["/", "/some/other/path"])(
    "sends a visitor without a session from %s to /login without rendering home",
    async (path) => {
      fakeApi({ [CURRENT]: notAuthenticated });
      renderApp(path);

      expect(await screen.findByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
      expect(screen.getByTestId("location")).toHaveTextContent("/login");
      expect(visitedPaths).toEqual([path, "/login"]);
      expect(screen.queryByText(/Signed in as/)).toBeNull();
      expect(screen.queryByRole("button", { name: "Log out" })).toBeNull();
    },
  );

  it.each(["/login", "/signup"])("sends a logged-in teacher from %s to /", async (path) => {
    fakeApi({ [CURRENT]: { status: 200, body: session("alice@example.com") } });
    renderApp(path);

    expect(await screen.findByText("Signed in as alice@example.com")).toBeVisible();
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
  });

  it("sends a logged-in teacher from an unknown app path to /", async () => {
    fakeApi({ [CURRENT]: { status: 200, body: session("alice@example.com") } });
    renderApp("/no/such/page");

    expect(await screen.findByText("Signed in as alice@example.com")).toBeVisible();
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
  });

  it("shows Loading… in a status region and no email while the check runs", async () => {
    const reply = deferred<{ status: number; body?: unknown }>();
    fakeApi({ [CURRENT]: { pending: reply.promise } });
    renderApp("/");

    expect(screen.getByRole("main")).toContainElement(screen.getByRole("status"));
    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
    expect(screen.queryByText(/Signed in as/)).toBeNull();
    expect(document.title).toBe("Lesson Ledger");

    reply.resolve({ status: 200, body: session("alice@example.com") });
    expect(await screen.findByText("Signed in as alice@example.com")).toBeVisible();
  });

  it.each([
    ["a network error", { network: true } as const],
    ["a 5xx", { status: 503 }],
  ])("shows a retryable error on %s instead of redirecting", async (_, reply) => {
    const user = userEvent.setup();
    const api = fakeApi({ [CURRENT]: reply });
    renderApp("/");

    expect(await screen.findByText("We couldn't reach Lesson Ledger.")).toBeVisible();
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);

    api.route(CURRENT, { status: 200, body: session("alice@example.com") });
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Signed in as alice@example.com")).toBeVisible();
    expect(api.calls(CURRENT)).toHaveLength(2);
  });

  it("checks the session with the server again each time an app page opens", async () => {
    const api = fakeApi({ [CURRENT]: { status: 200, body: session("alice@example.com") } });
    renderApp("/");

    await screen.findByText("Signed in as alice@example.com");
    await waitFor(() => expect(api.calls(CURRENT)).toHaveLength(1));
  });
});

describe("Non-functional: focus moves to the new page's heading after navigation", () => {
  it("focuses the h1 of the page it lands on", async () => {
    fakeApi({ [CURRENT]: notAuthenticated });
    renderApp("/");

    const heading = await screen.findByRole("heading", { level: 1, name: "Log in" });
    await waitFor(() => expect(heading).toHaveFocus());
  });
});
