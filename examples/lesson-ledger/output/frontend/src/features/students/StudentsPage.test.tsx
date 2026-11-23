import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { deferred, fakeApi, notAuthenticated } from "../../test/api";
import {
  ADD_STUDENT,
  LIST_STUDENTS,
  ledgerRoutes,
  page,
  student,
  validationError,
  type FakeStudent,
} from "../../test/ledger";
import { renderApp } from "../../test/renderApp";

const EMPTY = "You have no students yet. Add your first student with the form above.";
const UNREACHABLE = "We couldn't reach Lesson Ledger. Please try again.";

async function openStudents(students: FakeStudent[] = [], routes = {}) {
  const api = fakeApi({ ...ledgerRoutes(students), ...routes });
  const view = renderApp("/students");
  await screen.findByRole("heading", { level: 1, name: "Students" });
  return { api, view };
}

const nameField = () => screen.getByRole("textbox", { name: "Name" });
const addButton = () => screen.getByRole("button", { name: /^(Add student|Adding…)$/ });
const listedNames = () =>
  within(screen.getByRole("list", { name: "Your students" }))
    .getAllByRole("listitem")
    .map((item) => item.textContent);

describe("AC-1 students page", () => {
  it("shows the heading, title, add form and empty state", async () => {
    await openStudents();

    expect(document.title).toBe("Students · Lesson Ledger");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2, name: "Add a student" })).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: "Your students" })).toBeVisible();
    expect(nameField()).toBeVisible();
    expect(addButton()).toHaveTextContent("Add student");
    expect(await screen.findByText(EMPTY)).toBeVisible();
  });

  it("adds students, empties and focuses Name, announces success and keeps name order", async () => {
    const user = userEvent.setup();
    const { api } = await openStudents();
    await screen.findByText(EMPTY);

    await user.type(nameField(), " Zoe Park ");
    await user.click(addButton());
    expect(await screen.findByText("Student added.")).toBeVisible();
    await waitFor(() => expect(listedNames()).toEqual(["Zoe Park"]));
    expect(screen.getByText("Student added.")).toHaveAttribute("role", "status");
    expect(nameField()).toHaveValue("");
    expect(nameField()).toHaveFocus();

    await user.type(nameField(), "adam Lee{Enter}");
    await waitFor(() => expect(listedNames()).toEqual(["adam Lee", "Zoe Park"]));
    expect(nameField()).toHaveValue("");
    expect(nameField()).toHaveFocus();

    expect(api.calls(ADD_STUDENT).map((r) => r.body)).toEqual([
      { name: "Zoe Park" },
      { name: "adam Lee" },
    ]);
    expect(screen.queryByText(EMPTY)).toBeNull();
  });

  it.each([
    ["empty", "", "Enter the student's name."],
    ["whitespace only", "   ", "Enter the student's name."],
    ["101 characters", "x".repeat(101), "Name must be 100 characters or fewer."],
    ["101 code points", "😀".repeat(101), "Name must be 100 characters or fewer."],
    ["a tab", "Zoe\tPark", "Name can't contain tabs or line breaks."],
    // A text input drops pasted line breaks itself; other control characters reach the check.
    ["a control character", "Zoe\u0007Park", "Name can't contain tabs or line breaks."],
  ])("rejects a name that is %s without a request", async (_, value, message) => {
    const user = userEvent.setup();
    const { api } = await openStudents();
    await screen.findByText(EMPTY);

    if (value) {
      await user.click(nameField());
      await user.paste(value);
    }
    await user.click(addButton());

    const error = screen.getByText(message);
    expect(nameField()).toHaveAttribute("aria-invalid", "true");
    expect(nameField().getAttribute("aria-describedby")).toContain(error.id);
    expect(nameField()).toHaveFocus();
    expect(api.calls(ADD_STUDENT)).toHaveLength(0);

    await user.type(nameField(), "a");
    expect(screen.queryByText(message)).toBeNull();
    expect(nameField()).not.toHaveAttribute("aria-invalid");
  });

  it("accepts 100 code points", async () => {
    const user = userEvent.setup();
    const { api } = await openStudents();
    await screen.findByText(EMPTY);

    await user.click(nameField());
    await user.paste("😀".repeat(100));
    await user.click(addButton());

    await waitFor(() => expect(api.calls(ADD_STUDENT)).toHaveLength(1));
  });

  it("shows the server's 422 as the field's message", async () => {
    const user = userEvent.setup();
    await openStudents([], { [ADD_STUDENT]: validationError(["name"], "name_too_long") });
    await screen.findByText(EMPTY);

    await user.type(nameField(), "Zoe{Enter}");

    expect(await screen.findByText("Name must be 100 characters or fewer.")).toBeVisible();
    expect(nameField()).toHaveAttribute("aria-invalid", "true");
    expect(nameField()).toHaveFocus();
  });

  it("accepts the next student while the list is still reloading", async () => {
    const user = userEvent.setup();
    const { api } = await openStudents();
    await screen.findByText(EMPTY);
    const reload = deferred<{ status: number; body?: unknown }>();
    api.route(LIST_STUDENTS, { pending: reload.promise });

    await user.type(nameField(), "Zoe Park{Enter}");
    await screen.findByText("Student added.");
    expect(addButton()).toHaveTextContent("Add student");
    await user.type(nameField(), "adam Lee{Enter}");

    await waitFor(() => expect(api.calls(ADD_STUDENT)).toHaveLength(2));
    reload.resolve(page([student(1, "adam Lee"), student(2, "Zoe Park")]));
    await waitFor(() => expect(listedNames()).toEqual(["adam Lee", "Zoe Park"]));
  });

  it("disables the button while adding, so a double click sends one request", async () => {
    const user = userEvent.setup();
    const reply = deferred<{ status: number; body?: unknown }>();
    const { api } = await openStudents([], { [ADD_STUDENT]: { pending: reply.promise } });
    await screen.findByText(EMPTY);

    await user.type(nameField(), "Zoe");
    await user.dblClick(addButton());

    expect(addButton()).toBeDisabled();
    expect(addButton()).toHaveTextContent("Adding…");
    expect(api.calls(ADD_STUDENT)).toHaveLength(1);
    reply.resolve({ status: 201, body: student(1, "Zoe") });
    await waitFor(() => expect(addButton()).toBeEnabled());
  });

  it.each([
    ["a network error", { network: true } as const],
    ["a 5xx", { status: 503 }],
  ])("keeps the name and focuses Add student when adding fails with %s", async (_, reply) => {
    const user = userEvent.setup();
    await openStudents([], { [ADD_STUDENT]: reply });
    await screen.findByText(EMPTY);

    await user.type(nameField(), "Zoe Park{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent(UNREACHABLE);
    expect(nameField()).toHaveValue("Zoe Park");
    await waitFor(() => expect(addButton()).toHaveFocus());
    expect(addButton()).toBeEnabled();
    expect(screen.queryByText("Student added.")).toBeNull();
  });

  it("shows Loading… while the list loads, with the form already usable", async () => {
    const reply = deferred<{ status: number; body?: unknown }>();
    fakeApi({ ...ledgerRoutes([]), [LIST_STUDENTS]: { pending: reply.promise } });
    renderApp("/students");
    await screen.findByRole("heading", { level: 1, name: "Students" });

    expect(screen.getByText("Loading…")).toHaveAttribute("role", "status");
    expect(nameField()).toBeVisible();
    reply.resolve(page([student(1, "Zoe Park")]));
    expect(await screen.findByText("Zoe Park")).toBeVisible();
    expect(screen.queryByText("Loading…")).toBeNull();
  });

  it("offers Try again when the list fails to load", async () => {
    const user = userEvent.setup();
    const { api } = await openStudents([], { [LIST_STUDENTS]: { status: 500 } });

    expect(await screen.findByText("We couldn't reach Lesson Ledger.")).toBeVisible();
    api.route(LIST_STUDENTS, page([student(1, "Zoe Park")]));
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Zoe Park")).toBeVisible();
    expect(screen.queryByText("We couldn't reach Lesson Ledger.")).toBeNull();
  });

  it("ends the list with a truncation message when total exceeds the items", async () => {
    const many = Array.from({ length: 500 }, (_, i) => student(i + 1, `S${i}`));
    await openStudents([], { [LIST_STUDENTS]: page(many, 734) });

    expect(await screen.findByText("Showing the first 500 of 734 students.")).toBeVisible();
  });

  it("renders names as text, never as HTML", async () => {
    await openStudents([student(1, "<b>Bold</b> & co")]);

    expect(await screen.findByText("<b>Bold</b> & co")).toBeVisible();
    expect(document.querySelector("b")).toBeNull();
  });

  it("goes to /login when the list answers 401", async () => {
    const api = fakeApi({ ...ledgerRoutes([]), [LIST_STUDENTS]: notAuthenticated });
    renderApp("/students");
    await screen.findByRole("heading", { level: 1, name: "Students" });
    api.route("GET /api/sessions/current", notAuthenticated);

    expect(await screen.findByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
  });

  it("goes to /login without a session", async () => {
    fakeApi({ "GET /api/sessions/current": notAuthenticated });
    renderApp("/students");

    expect(await screen.findByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
  });
});

describe("Main navigation (spec Behavior: Pages; links extended by F03 Behavior: Pages)", () => {
  it.each([
    ["/", "Home"],
    ["/students", "Students"],
  ])("on %s marks %s as the current page", async (path, current) => {
    fakeApi(ledgerRoutes([]));
    renderApp(path);

    const nav = await screen.findByRole("navigation", { name: "Main" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((l) => [l.textContent, l.getAttribute("href")])).toEqual([
      ["Home", "/"],
      ["Lessons", "/lessons"],
      ["Students", "/students"],
      ["Monthly summary", "/summary"],
      ["Pending payments", "/pending"],
    ]);
    for (const link of links) {
      if (link.textContent === current) expect(link).toHaveAttribute("aria-current", "page");
      else expect(link).not.toHaveAttribute("aria-current");
    }
  });

  it("moves between pages without a reload", async () => {
    const user = userEvent.setup();
    fakeApi(ledgerRoutes([student(1, "Zoe Park")]));
    renderApp("/");
    const nav = await screen.findByRole("navigation", { name: "Main" });

    await user.click(within(nav).getByRole("link", { name: "Students" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Students" })).toBeVisible();
    expect(screen.getByTestId("location")).toHaveTextContent("/students");
  });
});
