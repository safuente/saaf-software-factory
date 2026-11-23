/** AC-6: load failures with "Try again", failed mark/undo in an alert with focus kept on the
 * button, 404 on mark/undo; spec Behavior: Failures. */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { apiError, fakeApi, notAuthenticated } from "../../test/api";
import {
  PENDING_PATH,
  lesson,
  monthLessonsPath,
  paidLesson,
  paymentRoutes,
  student,
  summaryPath,
  type FakeLesson,
} from "../../test/ledger";
import { renderApp } from "../../test/renderApp";

const ZOE = student(12, "Zoe Park");
const UNREACHABLE = "We couldn't reach Lesson Ledger. Please try again.";
const NOT_FOUND_MESSAGE = "That lesson could not be found. Reload the page and try again.";
const serverError = apiError(500, "internal_error", "Internal server error");
const notFound = apiError(404, "not_found", "Not found");

function lessons(): FakeLesson[] {
  return [
    paidLesson(lesson(1, ZOE, "2026-10-03", 45, 9900)),
    lesson(2, ZOE, "2026-10-10", 45, 4500),
    lesson(3, ZOE, "2026-10-12", 45, 3000),
  ];
}

function totals(): string[] {
  const list = document.querySelector("main dl");
  if (!list) throw new Error("No totals list");
  return [...list.children].map((pair) => pair.textContent ?? "");
}

describe("AC-6 load failures", () => {
  it.each([
    ["summary", { network: true } as const],
    ["summary", serverError],
    ["lessons", { network: true } as const],
    ["lessons", serverError],
  ])(
    "/summary shows the load error when the %s load fails, and Try again reloads",
    async (failing, reply) => {
      const user = userEvent.setup();
      const key = `GET ${failing === "summary" ? summaryPath("2026-10") : monthLessonsPath("2026-10")}`;
      const api = fakeApi({ ...paymentRoutes(lessons()), [key]: reply });
      renderApp("/summary?month=2026-10");

      expect(await screen.findByText("We couldn't reach Lesson Ledger.")).toHaveAttribute(
        "role",
        "alert",
      );
      expect(screen.queryByRole("table")).toBeNull();
      expect(document.querySelector("main dl")).toBeNull();
      expect(screen.getByRole("heading", { level: 2, name: "October 2026" })).toBeVisible();

      const before = api.calls(key).length;
      api.route(key, paymentRoutes(lessons())["*"]);
      await user.click(screen.getByRole("button", { name: "Try again" }));

      expect(await screen.findByRole("table")).toBeVisible();
      expect(api.calls(key).length).toBe(before + 1);
      expect(totals()).toEqual(["Lessons: 3", "Collected: $99.00", "Pending: $75.00"]);
    },
  );

  it.each([[{ network: true } as const], [serverError]])(
    "/pending shows the load error and Try again reloads (%#)",
    async (reply) => {
      const user = userEvent.setup();
      const key = `GET ${PENDING_PATH}`;
      const api = fakeApi({ ...paymentRoutes(lessons()), [key]: reply });
      renderApp("/pending");

      expect(await screen.findByText("We couldn't reach Lesson Ledger.")).toBeVisible();
      api.route(key, paymentRoutes(lessons())["*"]);
      await user.click(screen.getByRole("button", { name: "Try again" }));

      expect(await screen.findByText("Total pending: $75.00 across 2 lessons")).toBeVisible();
    },
  );

  it.each(["/summary?month=2026-10", "/pending"])(
    "a 401 while loading %s sends the teacher to /login",
    async (path) => {
      fakeApi({
        ...paymentRoutes(lessons()),
        [`GET ${summaryPath("2026-10")}`]: notAuthenticated,
        [`GET ${PENDING_PATH}`]: notAuthenticated,
      });
      renderApp(path);

      await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/login"));
    },
  );
});

describe("AC-6 mark and undo failures", () => {
  it.each([
    [{ network: true } as const, UNREACHABLE],
    [serverError, UNREACHABLE],
    [notFound, NOT_FOUND_MESSAGE],
  ])(
    "on /summary leave row and totals unchanged, alert and keep focus (%#)",
    async (reply, message) => {
      const user = userEvent.setup();
      fakeApi({
        ...paymentRoutes(lessons()),
        "PATCH /api/lessons/2": reply,
        "PATCH /api/lessons/1": reply,
      });
      renderApp("/summary?month=2026-10");
      await screen.findByRole("table");

      const mark = screen.getByRole("button", { name: "Mark as paid: Zoe Park, Oct 10, 2026" });
      await user.click(mark);

      expect(await screen.findByRole("alert")).toHaveTextContent(message);
      expect(mark).toBeEnabled();
      expect(mark).toHaveTextContent("Mark as paid");
      expect(mark).toHaveFocus();
      expect(mark.closest("tr")?.children[4]).toHaveTextContent("Unpaid");
      expect(totals()).toEqual(["Lessons: 3", "Collected: $99.00", "Pending: $75.00"]);

      const undo = screen.getByRole("button", { name: "Undo paid: Zoe Park, Oct 3, 2026" });
      await user.click(undo);

      await waitFor(() => expect(undo).toHaveFocus());
      expect(screen.getByRole("alert")).toHaveTextContent(message);
      expect(undo).toHaveTextContent("Undo paid");
      expect(totals()).toEqual(["Lessons: 3", "Collected: $99.00", "Pending: $75.00"]);
    },
  );

  it.each([
    [{ network: true } as const, UNREACHABLE],
    [serverError, UNREACHABLE],
    [notFound, NOT_FOUND_MESSAGE],
  ])("on /pending keep the row, alert and keep focus (%#)", async (reply, message) => {
    const user = userEvent.setup();
    fakeApi({ ...paymentRoutes(lessons()), "PATCH /api/lessons/2": reply });
    renderApp("/pending");
    await screen.findByRole("table");

    const mark = screen.getByRole("button", { name: "Mark as paid: Zoe Park, Oct 10, 2026" });
    await user.click(mark);

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(mark).toBeEnabled();
    expect(mark).toHaveFocus();
    expect(screen.getByText("Total pending: $75.00 across 2 lessons")).toBeVisible();
    expect(screen.getAllByRole("button", { name: /^Mark as paid/ })).toHaveLength(2);
  });

  it("a later success clears the alert", async () => {
    const user = userEvent.setup();
    const api = fakeApi({ ...paymentRoutes(lessons()), "PATCH /api/lessons/2": serverError });
    renderApp("/pending");
    await screen.findByRole("table");
    await user.click(screen.getByRole("button", { name: "Mark as paid: Zoe Park, Oct 10, 2026" }));
    await screen.findByRole("alert");

    api.route("PATCH /api/lessons/2", paymentRoutes(lessons())["*"]);
    await user.click(screen.getByRole("button", { name: "Mark as paid: Zoe Park, Oct 10, 2026" }));

    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });
});
