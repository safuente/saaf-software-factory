/** F09 AC-3: "You have logged out." on the Log in page that directly follows a log out the server
 * confirmed (204), and on no other appearance of Log in. Frontend only: no cookie, URL part or
 * browser storage carries it. */
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { apiError, fakeApi, notAuthenticated } from "../../test/api";
import { CURRENT, lesson, paymentRoutes, student } from "../../test/ledger";
import { renderApp } from "../../test/renderApp";

const LOGOUT = "DELETE /api/sessions/current";
const LOGIN = "POST /api/sessions";
const NOTICE = "You have logged out.";

/** Opens /pending signed in, then presses Log out with the given reply to its DELETE. */
async function logOutWith(reply: { status: number; body?: unknown } | { network: true }) {
  const user = userEvent.setup();
  const lessons = [lesson(1, student(1, "Zoe Park"), "2026-11-03", 45, 4250)];
  const api = fakeApi({ ...paymentRoutes(lessons), [LOGOUT]: reply });
  renderApp("/pending");
  await screen.findByRole("navigation", { name: "Main" });
  api.route(CURRENT, notAuthenticated);
  await user.click(screen.getByRole("button", { name: "Log out" }));
  return { user, api };
}

const loginHeading = () => screen.findByRole("heading", { level: 1, name: "Log in" });

describe("F09 AC-3 the logged-out notice", () => {
  it("AC-3a,b,c after a 204 log out: a polite status between the h1 and the form; focus on the h1", async () => {
    await logOutWith({ status: 204 });
    const h1 = await loginHeading();
    expect(screen.getByTestId("location")).toHaveTextContent("/login");
    expect(screen.getByTestId("search")).toBeEmptyDOMElement();

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent(NOTICE);
    expect(status.textContent).toBe(NOTICE);
    expect(status.getAttribute("aria-live")).not.toBe("assertive");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(status.querySelector("svg, button, a")).toBeNull();
    expect(status.hasAttribute("tabindex")).toBe(false);
    expect(status.className).not.toMatch(/danger/);

    const main = screen.getByRole("main");
    const form = main.querySelector("form") as HTMLFormElement;
    expect(main.contains(status)).toBe(true);
    expect(form.contains(status)).toBe(false);
    expect(h1.compareDocumentPosition(status) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(status.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(h1).toHaveFocus();
  });

  it("AC-3d no cookie and no browser storage key is added", async () => {
    localStorage.setItem("kept", "1");
    const before = {
      cookie: document.cookie,
      local: Object.keys(localStorage).sort(),
      session: Object.keys(sessionStorage).sort(),
    };
    await logOutWith({ status: 204 });
    await loginHeading();
    expect(await screen.findByText(NOTICE)).toBeVisible();
    expect({
      cookie: document.cookie,
      local: Object.keys(localStorage).sort(),
      session: Object.keys(sessionStorage).sort(),
    }).toEqual(before);
    localStorage.removeItem("kept");
  });

  it("AC-3e the notice stays after a field error and after a failed log in", async () => {
    const { user, api } = await logOutWith({ status: 204 });
    await loginHeading();
    await screen.findByText(NOTICE);

    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByText("Enter your email.")).toBeVisible();
    expect(screen.getByText(NOTICE)).toBeVisible();

    api.route(LOGIN, apiError(401, "invalid_credentials", "Invalid credentials"));
    await user.type(screen.getByLabelText("Email"), "alice@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password-1");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is incorrect.");
    expect(screen.getByRole("status")).toHaveTextContent(NOTICE);
  });

  it("AC-3f none after moving to Sign up and back to Log in", async () => {
    const { user } = await logOutWith({ status: 204 });
    await loginHeading();
    await screen.findByText(NOTICE);
    await user.click(screen.getByRole("link", { name: "Create an account" }));
    await screen.findByRole("heading", { level: 1, name: "Create your account" });
    await user.click(screen.getByRole("link", { name: "Log in" }));
    await loginHeading();
    expect(screen.queryByText(NOTICE)).toBeNull();
  });

  it("AC-3f none when /login is opened directly, and the region stays empty", async () => {
    fakeApi({ [CURRENT]: notAuthenticated });
    renderApp("/login");
    await loginHeading();
    expect(screen.queryByText(NOTICE)).toBeNull();
    expect(within(screen.getByRole("main")).getByRole("status")).toBeEmptyDOMElement();
  });

  it("AC-3f none when an app page is opened without a session", async () => {
    fakeApi({ [CURRENT]: notAuthenticated });
    renderApp("/lessons");
    await loginHeading();
    expect(screen.queryByText(NOTICE)).toBeNull();
  });

  it("AC-3f none after a log out whose DELETE returns 401", async () => {
    await logOutWith(notAuthenticated);
    await loginHeading();
    expect(screen.getByTestId("location")).toHaveTextContent("/login");
    expect(screen.queryByText(NOTICE)).toBeNull();
  });

  it.each([
    ["500", { status: 500, body: undefined }],
    ["a network error", { network: true as const }],
  ])("AC-3g a log out failing with %s keeps the page and shows no notice", async (_, reply) => {
    await logOutWith(reply);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't log out. Please try again.",
    );
    expect(screen.getByTestId("location")).toHaveTextContent("/pending");
    expect(screen.queryByText(NOTICE)).toBeNull();
  });
});
