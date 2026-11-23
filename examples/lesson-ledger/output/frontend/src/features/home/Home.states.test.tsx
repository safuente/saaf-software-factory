import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { deferred, fakeApi, notAuthenticated } from "../../test/api";
import { LATEST, OLDEST, ZOE, aliceLike, figures, onNovember18, openHome } from "../../test/home";
import { CURRENT, homeRoutes, paidLesson } from "../../test/ledger";
import { renderApp } from "../../test/renderApp";

onNovember18();

const RECORD = "Record lesson on the Lessons page";
const ADD = "Add student on the Students page";

function expectTitleRow() {
  expect(screen.getByRole("heading", { level: 1, name: "Lesson Ledger" })).toBeVisible();
  expect(screen.getByText("Signed in as alice@example.com")).toBeVisible();
  expect(screen.getByRole("link", { name: RECORD })).toBeVisible();
  expect(screen.getByRole("link", { name: ADD })).toBeVisible();
}

const READS = [
  "/api/monthly-summaries/2026-11",
  "/api/pending-lessons?page=1&page_size=5",
  "/api/lessons?page=1&page_size=5",
  "/api/students?page=1&page_size=1",
];

describe("F07 AC-5 empty, partial and error states", () => {
  it("AC-5a a new teacher sees 'Get started' with two steps instead of figures and lists", async () => {
    await openHome({ students: [], lessons: [] });

    const heading = await screen.findByRole("heading", { level: 2, name: "Get started" });
    const steps = within(heading.closest("section") as HTMLElement).getAllByRole("listitem");
    expect(steps.map((step) => step.textContent)).toEqual([
      "Add your students. Add your first student",
      "Record each lesson; Home then shows how the month is going and what is unpaid. Record your first lesson",
    ]);
    expect(heading.closest("section")?.querySelector("ol")).not.toBeNull();
    expect(
      within(steps[0] as HTMLElement).getByRole("link", { name: "Add your first student" }),
    ).toHaveAttribute("href", "/students");
    expect(
      within(steps[1] as HTMLElement).getByRole("link", { name: "Record your first lesson" }),
    ).toHaveAttribute("href", "/lessons");
    expectTitleRow();
    expect(screen.queryByRole("table")).toBeNull();
    expect(document.querySelector("main dl")).toBeNull();
    expect(screen.getByRole("main")).not.toHaveTextContent(/\$0\.00|—/);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
  });

  it("AC-5b one student and no lessons: zero figures and the empty messages, no 'Get started'", async () => {
    await openHome({ students: [ZOE], lessons: [] });

    await screen.findByRole("heading", { level: 2, name: "November 2026" });
    expect(figures()).toEqual([
      ["Collected", "$0.00"],
      ["Pending", "$0.00"],
      ["Lessons", "0"],
      ["Average per lesson", "—"],
    ]);
    expect(screen.getByText("No lessons in November 2026.")).toBeVisible();
    const oldest = screen.getByRole("region", { name: "Oldest unpaid lessons" });
    expect(within(oldest).getByText("Nothing pending.", { exact: true })).toBeVisible();
    const latest = screen.getByRole("region", { name: "Latest lessons" });
    expect(within(latest).getByText("No lessons recorded yet.")).toBeVisible();
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByText("Get started")).toBeNull();
  });

  it("AC-5c every lesson paid: 'Nothing pending. Every lesson is paid.', figures and latest lessons shown", async () => {
    const data = aliceLike();
    data.lessons = data.lessons.map(paidLesson);
    await openHome(data);

    const oldest = await screen.findByRole("region", { name: "Oldest unpaid lessons" });
    expect(within(oldest).getByText("Nothing pending. Every lesson is paid.")).toBeVisible();
    expect(screen.queryByRole("table", { name: OLDEST })).toBeNull();
    expect(screen.getByRole("table", { name: LATEST })).toBeVisible();
    expect(figures()).toHaveLength(4);
  });

  it.each(
    READS.flatMap((path) => [
      [path, "a 5xx"],
      [path, "a network error"],
    ]),
  )(
    "AC-5d %s failing with %s shows only the load error; Try again loads the default state",
    async (path, failure) => {
      const user = userEvent.setup();
      const data = aliceLike();
      let failing = true;
      const ok = homeRoutes(data.students, data.lessons);
      fakeApi({
        ...ok,
        [`GET ${path}`]: (request) => {
          if (!failing) return ok["*"](request);
          return failure === "a 5xx" ? { status: 503 } : { network: true };
        },
      });
      renderApp("/");

      expect(await screen.findByRole("alert")).toHaveTextContent(
        /^We couldn't reach Lesson Ledger\.$/,
      );
      expectTitleRow();
      expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
      expect(screen.queryAllByRole("heading", { level: 2 })).toEqual([]);
      expect(screen.queryByRole("table")).toBeNull();
      expect(screen.queryByText("Get started")).toBeNull();

      failing = false;
      await user.click(screen.getByRole("button", { name: "Try again" }));

      expect(await screen.findByRole("table", { name: LATEST })).toBeVisible();
      expect(screen.getByRole("table", { name: OLDEST })).toBeVisible();
      expect(figures()).toHaveLength(4);
      expect(screen.queryByRole("alert")).toBeNull();
    },
  );

  it("AC-5e while loading, one 'Loading…' status replaces the figures and lists; never 'Get started'", async () => {
    const reply = deferred<{ status: number; body?: unknown }>();
    const routes = homeRoutes([], []);
    fakeApi({
      ...routes,
      "GET /api/students?page=1&page_size=1": { pending: reply.promise },
    });
    renderApp("/");

    await screen.findByText("Signed in as alice@example.com");
    await waitFor(() =>
      expect(
        screen.getAllByRole("status").filter((s) => s.textContent === "Loading…"),
      ).toHaveLength(1),
    );
    expect(screen.queryByText("Get started")).toBeNull();
    expect(screen.queryAllByRole("heading", { level: 2 })).toEqual([]);
    expectTitleRow();

    reply.resolve({ status: 200, body: { items: [], total: 0, page: 1, page_size: 1 } });
    expect(await screen.findByRole("heading", { level: 2, name: "Get started" })).toBeVisible();
    expect(screen.queryByText("Loading…")).toBeNull();
  });

  it("AC-5f without a session / goes to /login", async () => {
    fakeApi({ [CURRENT]: notAuthenticated });
    renderApp("/");

    expect(await screen.findByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
    expect(screen.getByTestId("location")).toHaveTextContent("/login");
  });
});
