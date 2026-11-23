import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fakeApi, notAuthenticated, session } from "../../test/api";
import { renderApp, visitedPaths } from "../../test/renderApp";

const CURRENT = "GET /api/sessions/current";

describe("AC-5 session survives reload and expires on the server's word", () => {
  it("a fresh load of / with a valid session cookie shows home without passing /login", async () => {
    fakeApi({ [CURRENT]: { status: 200, body: session("alice@example.com") } });
    renderApp("/");

    expect(await screen.findByText("Signed in as alice@example.com")).toBeVisible();
    expect(visitedPaths).toEqual(["/"]);
  });

  it("a fresh load of / with an expired session goes to /login", async () => {
    fakeApi({ [CURRENT]: notAuthenticated });
    renderApp("/");

    expect(await screen.findByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
    expect(screen.queryByText(/Signed in as/)).toBeNull();
  });
});
