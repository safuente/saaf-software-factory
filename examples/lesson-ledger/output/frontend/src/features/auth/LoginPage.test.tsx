import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { apiError, deferred, fakeApi, notAuthenticated, session } from "../../test/api";
import { renderApp } from "../../test/renderApp";

const LOGIN = "POST /api/sessions";
const CURRENT = "GET /api/sessions/current";
const INCORRECT = "Email or password is incorrect.";

function fields() {
  return {
    email: screen.getByLabelText("Email"),
    password: screen.getByLabelText("Password"),
    submit: screen.getByRole("button", { name: "Log in" }),
  };
}

async function openLogin(routes: Parameters<typeof fakeApi>[0] = {}) {
  const api = fakeApi({ [CURRENT]: notAuthenticated, ...routes });
  renderApp("/login");
  await screen.findByRole("heading", { level: 1, name: "Log in" });
  return api;
}

describe("AC-2 login page", () => {
  it("shows the login form", async () => {
    await openLogin();
    const { email, password } = fields();

    expect(document.title).toBe("Log in · Lesson Ledger");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(email).toHaveAttribute("type", "email");
    expect(email).toHaveAttribute("autocomplete", "username");
    expect(email).toHaveAccessibleDescription("Example: name@example.com");
    expect(password).toHaveAttribute("type", "password");
    expect(password).toHaveAttribute("autocomplete", "current-password");
    expect(screen.getByText("No account yet?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute(
      "href",
      "/signup",
    );
  });

  it("logs in and lands on / showing the email", async () => {
    const user = userEvent.setup();
    const api = await openLogin({
      [LOGIN]: { status: 200, body: session("alice@example.com") },
    });
    api.route(CURRENT, { status: 200, body: session("alice@example.com") });

    await user.type(fields().email, "ALICE@example.com");
    await user.type(fields().password, "alice-ledger-pass");
    await user.click(fields().submit);

    expect(await screen.findByText("Signed in as alice@example.com")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/");
    expect(api.calls(LOGIN)[0]?.body).toEqual({
      email: "ALICE@example.com",
      password: "alice-ledger-pass",
    });
    expect(localStorage.length + sessionStorage.length).toBe(0);
  });

  it("shows one generic alert, keeps the email and empties the password on 401", async () => {
    const user = userEvent.setup();
    await openLogin({ [LOGIN]: apiError(401, "invalid_credentials", INCORRECT) });

    await user.type(fields().email, "alice@example.com");
    await user.type(fields().password, "wrong-password");
    await user.click(fields().submit);

    expect(await screen.findByRole("alert")).toHaveTextContent(INCORRECT);
    expect(screen.getAllByText(INCORRECT)).toHaveLength(1);
    expect(fields().email).toHaveValue("alice@example.com");
    expect(fields().password).toHaveValue("");
    expect(screen.getByTestId("location")).toHaveTextContent("/login");

    await user.type(fields().password, "still-wrong");
    await user.click(fields().submit);
    expect(await screen.findByRole("alert")).toHaveTextContent(INCORRECT);
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("requires both fields without sending a request and focuses the first empty one", async () => {
    const user = userEvent.setup();
    const api = await openLogin();

    await user.click(fields().submit);

    expect(fields().email).toHaveAccessibleDescription(
      expect.stringContaining("Enter your email."),
    );
    expect(fields().email).toHaveAttribute("aria-invalid", "true");
    expect(fields().password).toHaveAccessibleDescription("Enter your password.");
    expect(fields().password).toHaveAttribute("aria-invalid", "true");
    expect(fields().email).toHaveFocus();

    await user.type(fields().email, "x");
    await user.click(fields().submit);
    expect(fields().password).toHaveFocus();
    expect(fields().email).not.toHaveAttribute("aria-invalid");
    expect(api.calls(LOGIN)).toHaveLength(0);
  });

  it("applies no format or length rule before sending", async () => {
    const user = userEvent.setup();
    const api = await openLogin({ [LOGIN]: apiError(401, "invalid_credentials", INCORRECT) });

    await user.type(fields().email, "not-an-email");
    await user.type(fields().password, "short");
    await user.click(fields().submit);

    expect(await screen.findByRole("alert")).toHaveTextContent(INCORRECT);
    expect(api.calls(LOGIN)).toHaveLength(1);
  });

  it("disables the button while submitting so a double click sends one request", async () => {
    const user = userEvent.setup();
    const reply = deferred<{ status: number; body?: unknown }>();
    const api = await openLogin({ [LOGIN]: { pending: reply.promise } });

    await user.type(fields().email, "alice@example.com");
    await user.type(fields().password, "alice-ledger-pass");
    await user.dblClick(fields().submit);

    expect(screen.getByRole("button", { name: "Logging in…" })).toBeDisabled();
    expect(api.calls(LOGIN)).toHaveLength(1);
    reply.resolve(apiError(401, "invalid_credentials", INCORRECT));
    expect(await screen.findByRole("button", { name: "Log in" })).toBeEnabled();
  });

  it.each([
    ["a network error", { network: true } as const],
    ["a 5xx", { status: 500 }],
  ])("shows a generic alert on %s and keeps the email", async (_, reply) => {
    const user = userEvent.setup();
    await openLogin({ [LOGIN]: reply });

    await user.type(fields().email, "alice@example.com");
    await user.type(fields().password, "alice-ledger-pass");
    await user.click(fields().submit);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again.",
    );
    expect(fields().email).toHaveValue("alice@example.com");
  });
});
