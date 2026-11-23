import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deferred, fakeApi } from "../../test/api";
import {
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
const ADAM = student(13, "Adam Lee");

/** AC-1: A (paid), B and C in November 2026, plus one lesson on each side of the month. */
function ac1Lessons(): FakeLesson[] {
  return [
    paidLesson(lesson(1, ZOE, "2026-11-03", 45, 4250)),
    lesson(2, ADAM, "2026-11-10", 60, 6000),
    lesson(3, ZOE, "2026-11-10", 30, 0),
    lesson(4, ADAM, "2026-10-31", 45, 3000),
    lesson(5, ZOE, "2026-12-01", 45, 5000),
  ];
}

async function openSummary(path = "/summary", lessons = ac1Lessons(), routes = {}) {
  const api = fakeApi({ ...paymentRoutes(lessons), ...routes });
  const view = renderApp(path);
  await screen.findByRole("heading", { level: 1, name: "Monthly summary" });
  return { api, view, lessons };
}

/** The totals description list, one "Term: value" string per pair. */
function totals(): string[] {
  const list = document.querySelector("main dl");
  if (!list) throw new Error("No totals list");
  return [...list.children].map((pair) => pair.textContent ?? "");
}

function summaryRows(month: string): string[][] {
  const table = screen.getByRole("table", { name: `Lessons in ${month}, newest first` });
  return within(table)
    .getAllByRole("row")
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole("cell")
        .map((cell) => cell.textContent ?? ""),
    );
}

async function shown(month: string) {
  return screen.findByRole("heading", { level: 2, name: month });
}

describe("AC-1 monthly summary", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 18, 9, 0));
  });
  afterEach(() => vi.useRealTimers());

  it("defaults to the browser's month with totals and the month's lessons newest first", async () => {
    await openSummary();
    await shown("November 2026");
    await screen.findByRole("table");

    expect(document.title).toBe("Monthly summary · Lesson Ledger");
    expect(totals()).toEqual(["Lessons: 3", "Collected: $42.50", "Pending: $60.00"]);
    const table = screen.getByRole("table", { name: "Lessons in November 2026, newest first" });
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((h) => h.textContent),
    ).toEqual(["Student", "Date", "Duration", "Price", "Status", "Action"]);
    expect(summaryRows("November 2026")).toEqual([
      ["Zoe Park", "Nov 10, 2026", "30 min", "$0.00", "Unpaid", "Mark as paid"],
      ["Adam Lee", "Nov 10, 2026", "60 min", "$60.00", "Unpaid", "Mark as paid"],
      ["Zoe Park", "Nov 3, 2026", "45 min", "$42.50", "Paid", "Undo paid"],
    ]);
    expect(within(table).getAllByRole("cell")[1]?.querySelector("time")).toHaveAttribute(
      "datetime",
      "2026-11-10",
    );
  });

  it("names each action button after its row", async () => {
    await openSummary();
    await screen.findByRole("table");

    expect(
      screen.getByRole("button", { name: "Undo paid: Zoe Park, Nov 3, 2026" }),
    ).toHaveTextContent("Undo paid");
    expect(
      screen.getByRole("button", { name: "Mark as paid: Adam Lee, Nov 10, 2026" }),
    ).toHaveTextContent("Mark as paid");
  });

  it("previous and next month change the URL, heading, totals and lessons", async () => {
    const user = userEvent.setup();
    const { api } = await openSummary();
    await screen.findByRole("table");

    await user.click(screen.getByRole("button", { name: "Previous month" }));

    expect(await shown("October 2026")).toBeVisible();
    expect(screen.getByTestId("location")).toHaveTextContent("/summary");
    expect(screen.getByTestId("search")).toHaveTextContent("?month=2026-10");
    await screen.findByRole("table", { name: "Lessons in October 2026, newest first" });
    expect(totals()).toEqual(["Lessons: 1", "Collected: $0.00", "Pending: $30.00"]);
    expect(summaryRows("October 2026")).toEqual([
      ["Adam Lee", "Oct 31, 2026", "45 min", "$30.00", "Unpaid", "Mark as paid"],
    ]);
    expect(api.calls(`GET ${summaryPath("2026-10")}`)).toHaveLength(1);
    expect(api.calls(`GET ${monthLessonsPath("2026-10")}`)).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Next month" }));
    await shown("November 2026");
    await user.click(screen.getByRole("button", { name: "Next month" }));

    expect(await shown("December 2026")).toBeVisible();
    expect(screen.getByTestId("search")).toHaveTextContent("?month=2026-12");
    await screen.findByRole("table", { name: "Lessons in December 2026, newest first" });
    expect(totals()).toEqual(["Lessons: 1", "Collected: $0.00", "Pending: $50.00"]);
  });

  it("an empty month shows zero totals and no table", async () => {
    await openSummary("/summary?month=2026-08");

    expect(await screen.findByText("No lessons in August 2026.")).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: "August 2026" })).toBeVisible();
    expect(totals()).toEqual(["Lessons: 0", "Collected: $0.00", "Pending: $0.00"]);
    expect(screen.queryByRole("table")).toBeNull();
  });

  it.each(["2026-13", "2026-1", "1999-12", "2100-01", "abc", ""])(
    "an invalid month %j shows the current month and replaces the URL",
    async (month) => {
      const { api } = await openSummary(`/summary?month=${month}`);

      expect(await shown("November 2026")).toBeVisible();
      expect(screen.getByTestId("search")).toHaveTextContent("?month=2026-11");
      expect(api.requests.some((r) => r.path.includes(`month=${month}&`))).toBe(false);
    },
  );

  it("previous is disabled at January 2000 and next at December 2099", async () => {
    await openSummary("/summary?month=2000-01");
    await shown("January 2000");
    expect(screen.getByRole("button", { name: "Previous month" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next month" })).toBeEnabled();
  });

  it("next is disabled at December 2099", async () => {
    await openSummary("/summary?month=2099-12");
    await shown("December 2099");
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous month" })).toBeEnabled();
  });

  it("shows Loading… in a status region with the month heading while loading", async () => {
    const reply = deferred<{ status: number; body?: unknown }>();
    await openSummary("/summary", ac1Lessons(), {
      [`GET ${summaryPath("2026-11")}`]: { pending: reply.promise },
    });

    expect(await screen.findByText("Loading…")).toHaveAttribute("role", "status");
    expect(screen.getByRole("heading", { level: 2, name: "November 2026" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Previous month" })).toBeVisible();
  });

  it("more than 500 lessons in a month ends with the truncation message", async () => {
    const many = Array.from({ length: 501 }, (_, n) => lesson(n + 1, ZOE, "2026-11-03"));
    await openSummary("/summary", many);

    expect(
      await screen.findByText("Showing the 500 most recent of 501 lessons in November 2026."),
    ).toBeVisible();
    expect(totals()[0]).toBe("Lessons: 501");
  });
});

describe("Main navigation (F03 Behavior: Pages)", () => {
  it.each([
    ["/summary", "Monthly summary"],
    ["/pending", "Pending payments"],
  ])("on %s marks %s as the current page", async (path, current) => {
    fakeApi(paymentRoutes([]));
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
});
