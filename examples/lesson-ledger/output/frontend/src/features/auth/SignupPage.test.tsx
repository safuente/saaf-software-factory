import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { apiError, deferred, fakeApi, notAuthenticated, session } from "../../test/api";
import { renderApp, visitedPaths } from "../../test/renderApp";

const SIGNUP = "POST /api/teachers";
const CURRENT = "GET /api/sessions/current";

function fields() {
  return {
    email: screen.getByLabelText("Email"),
    password: screen.getByLabelText("Password"),
    submit: screen.getByRole("button", { name: "Create account" }),
  };
}

async function openSignup(routes: Parameters<typeof fakeApi>[0] = {}) {
  const api = fakeApi({ [CURRENT]: notAuthenticated, ...routes });
  renderApp("/signup");
  await screen.findByRole("heading", { level: 1, name: "Create your account" });
  return api;
}

describe("AC-1 sign-up page", () => {
  it("shows the form with rules before any submission", async () => {
    await openSignup();
    const { email, password } = fields();

    expect(document.title).toBe("Create your account · Lesson Ledger");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("main")).toContainElement(email);
    expect(email).toHaveAttribute("autocomplete", "username");
    expect(email).toHaveAccessibleDescription("Example: name@example.com");
    expect(password).toHaveAttribute("type", "password");
    expect(password).toHaveAttribute("autocomplete", "new-password");
    expect(password).toHaveAccessibleDescription("At least 12 characters.");
    expect(screen.getByText("Already have an account?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  });

  it("signs up with the trimmed email and lands on / showing the normalized email", async () => {
    const user = userEvent.setup();
    const api = await openSignup({
      [SIGNUP]: { status: 201, body: session("carol@example.com") },
    });
    api.route(CURRENT, { status: 200, body: session("carol@example.com") });

    await user.type(fields().email, " Carol@Example.com ");
    await user.type(fields().password, "correct-horse-1");
    await user.click(fields().submit);

    expect(await screen.findByText("Signed in as carol@example.com")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/");
    const [request] = api.calls(SIGNUP);
    expect(request?.body).toEqual({ email: "Carol@Example.com", password: "correct-horse-1" });
    expect(request?.headers["content-type"]).toBe("application/json");
    expect(visitedPaths).not.toContain("/login");
    expect(localStorage.length + sessionStorage.length).toBe(0);
  });

  it("shows the duplicate-email error on the Email field and stays on /signup", async () => {
    const user = userEvent.setup();
    await openSignup({
      [SIGNUP]: apiError(409, "email_taken", "An account with this email already exists."),
    });

    await user.type(fields().email, "CAROL@example.com");
    await user.type(fields().password, "another-valid-password");
    await user.click(fields().submit);

    const message = "An account with this email already exists.";
    await waitFor(() =>
      expect(fields().email).toHaveAccessibleDescription(expect.stringContaining(message)),
    );
    expect(fields().email).toHaveAttribute("aria-invalid", "true");
    expect(fields().email).toHaveFocus();
    expect(screen.getByTestId("location")).toHaveTextContent("/signup");
  });

  it("rejects an invalid email without a request and focuses the field", async () => {
    const user = userEvent.setup();
    const api = await openSignup();

    await user.type(fields().email, "carol@");
    await user.type(fields().password, "correct-horse-1");
    await user.click(fields().submit);

    expect(fields().email).toHaveAccessibleDescription(
      expect.stringContaining("Enter a valid email address, like name@example.com."),
    );
    expect(fields().email).toHaveAttribute("aria-invalid", "true");
    expect(fields().email).toHaveFocus();
    expect(api.calls(SIGNUP)).toHaveLength(0);
  });

  it("rejects an 11-character password without a request and focuses the field", async () => {
    const user = userEvent.setup();
    const api = await openSignup();

    await user.type(fields().email, "carol@example.com");
    await user.type(fields().password, "x".repeat(11));
    await user.click(fields().submit);

    expect(fields().password).toHaveAccessibleDescription(
      expect.stringContaining("Password must be at least 12 characters."),
    );
    expect(fields().password).toHaveAttribute("aria-invalid", "true");
    expect(fields().password).toHaveFocus();
    expect(fields().email).not.toHaveAttribute("aria-invalid");
    expect(api.calls(SIGNUP)).toHaveLength(0);
  });

  it("focuses the first invalid field when both are invalid", async () => {
    const user = userEvent.setup();
    await openSignup();

    await user.click(fields().submit);

    expect(fields().email).toHaveFocus();
    expect(fields().password).toHaveAttribute("aria-invalid", "true");
  });

  it("disables the button while submitting so a double click sends one request", async () => {
    const user = userEvent.setup();
    const reply = deferred<{ status: number; body?: unknown }>();
    const api = await openSignup({ [SIGNUP]: { pending: reply.promise } });

    await user.type(fields().email, "carol@example.com");
    await user.type(fields().password, "correct-horse-1");
    await user.dblClick(fields().submit);

    const busy = screen.getByRole("button", { name: "Creating account…" });
    expect(busy).toBeDisabled();
    expect(api.calls(SIGNUP)).toHaveLength(1);
    reply.resolve(apiError(409, "email_taken", "An account with this email already exists."));
    expect(await screen.findByRole("button", { name: "Create account" })).toBeEnabled();
  });

  it.each([
    ["a network error", { network: true } as const],
    ["a 5xx", { status: 502 }],
  ])("shows a generic alert on %s and keeps the email", async (_, reply) => {
    const user = userEvent.setup();
    await openSignup({ [SIGNUP]: reply });

    await user.type(fields().email, "carol@example.com");
    await user.type(fields().password, "correct-horse-1");
    await user.click(fields().submit);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again.",
    );
    expect(fields().email).toHaveValue("carol@example.com");
    expect(screen.getByTestId("location")).toHaveTextContent("/signup");
  });
});
