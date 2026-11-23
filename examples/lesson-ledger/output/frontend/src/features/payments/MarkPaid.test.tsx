/** AC-3: mark as paid from /pending and /summary, undo from /summary; spec Behavior: Mark /
 * undo, In flight, Button names. */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { deferred, fakeApi } from "../../test/api";
import { lesson, paidLesson, paymentRoutes, student, type FakeLesson } from "../../test/ledger";
import { renderApp } from "../../test/renderApp";

const ZOE = student(12, "Zoe Park");
const ADAM = student(13, "Adam Lee");

function ac2Lessons(): FakeLesson[] {
  return [
    lesson(1, ZOE, "2026-11-03", 45, 4250),
    lesson(2, ADAM, "2026-10-10", 45, 4500),
    lesson(3, ZOE, "2026-10-10", 90, 125000),
    paidLesson(lesson(4, ADAM, "2026-10-01", 45, 9900)),
    lesson(5, ADAM, "2026-09-05", 30, 3375),
  ];
}

async function open(path: string, lessons = ac2Lessons(), routes = {}) {
  const api = fakeApi({ ...paymentRoutes(lessons), ...routes });
  renderApp(path);
  await screen.findByRole("table");
  return { api, lessons };
}

const announcement = () =>
  screen.getAllByRole("status").find((region) => region.textContent !== "Loading…");

function rowNames(): string[] {
  return within(screen.getByRole("table"))
    .getAllByRole("button")
    .map((button) => button.getAttribute("aria-label") ?? "");
}

function totals(): string[] {
  const list = document.querySelector("main dl");
  if (!list) throw new Error("No totals list");
  return [...list.children].map((pair) => pair.textContent ?? "");
}

describe("AC-3 mark as paid on /pending", () => {
  it("removes the row, updates the total, announces it and focuses the next row", async () => {
    const user = userEvent.setup();
    const { api } = await open("/pending");

    await user.click(screen.getByRole("button", { name: "Mark as paid: Adam Lee, Oct 10, 2026" }));

    await waitFor(() => expect(rowNames()).toHaveLength(3));
    expect(api.calls("PATCH /api/lessons/2").map((r) => r.body)).toEqual([{ paid: true }]);
    expect(screen.getByText("Total pending: $1,326.25 across 3 lessons")).toBeVisible();
    expect(announcement()).toHaveTextContent(
      "Marked Adam Lee's lesson on Oct 10, 2026 as paid. Total pending: $1,326.25.",
    );
    expect(rowNames()).toEqual([
      "Mark as paid: Adam Lee, Sep 5, 2026",
      "Mark as paid: Zoe Park, Oct 10, 2026",
      "Mark as paid: Zoe Park, Nov 3, 2026",
    ]);
    expect(
      screen.getByRole("button", { name: "Mark as paid: Zoe Park, Oct 10, 2026" }),
    ).toHaveFocus();
  });

  it("focuses the previous row when the last row is marked", async () => {
    const user = userEvent.setup();
    await open("/pending");

    await user.click(screen.getByRole("button", { name: "Mark as paid: Zoe Park, Nov 3, 2026" }));

    await waitFor(() => expect(rowNames()).toHaveLength(3));
    expect(
      screen.getByRole("button", { name: "Mark as paid: Zoe Park, Oct 10, 2026" }),
    ).toHaveFocus();
  });

  it("focuses the h1 when the list becomes empty", async () => {
    const user = userEvent.setup();
    await open("/pending", [lesson(1, ZOE, "2026-11-03", 45, 4250)]);

    await user.click(screen.getByRole("button", { name: "Mark as paid: Zoe Park, Nov 3, 2026" }));

    expect(await screen.findByText("Nothing pending. Every lesson is paid.")).toBeVisible();
    expect(screen.getByRole("heading", { level: 1, name: "Pending payments" })).toHaveFocus();
    expect(announcement()).toHaveTextContent(
      "Marked Zoe Park's lesson on Nov 3, 2026 as paid. Total pending: $0.00.",
    );
  });

  it("disables the button as Saving… so a double click sends one request; other rows stay usable", async () => {
    const user = userEvent.setup();
    const reply = deferred<{ status: number; body?: unknown }>();
    const lessons = ac2Lessons();
    const { api } = await open("/pending", lessons, {
      "PATCH /api/lessons/2": { pending: reply.promise },
    });

    await user.dblClick(
      screen.getByRole("button", { name: "Mark as paid: Adam Lee, Oct 10, 2026" }),
    );

    const saving = screen.getByRole("button", { name: "Mark as paid: Adam Lee, Oct 10, 2026" });
    expect(saving).toBeDisabled();
    expect(saving).toHaveTextContent("Saving…");
    expect(api.calls("PATCH /api/lessons/2")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Mark as paid: Adam Lee, Sep 5, 2026" }),
    ).toBeEnabled();

    lessons[1] = paidLesson(lessons[1] as FakeLesson);
    reply.resolve({ status: 200, body: lessons[1] });
    await waitFor(() => expect(rowNames()).toHaveLength(3));
  });
});

describe("AC-3 mark as paid and undo on /summary", () => {
  it("toggles status and button, keeps focus, updates totals and announces both ways", async () => {
    const user = userEvent.setup();
    const { api } = await open("/summary?month=2026-10");
    expect(totals()).toEqual(["Lessons: 3", "Collected: $99.00", "Pending: $1,295.00"]);

    await user.click(screen.getByRole("button", { name: "Mark as paid: Adam Lee, Oct 10, 2026" }));

    const undo = await screen.findByRole("button", { name: "Undo paid: Adam Lee, Oct 10, 2026" });
    expect(undo).toHaveTextContent("Undo paid");
    expect(undo).toHaveFocus();
    expect(undo.closest("tr")?.children[4]).toHaveTextContent("Paid");
    expect(totals()).toEqual(["Lessons: 3", "Collected: $144.00", "Pending: $1,250.00"]);
    expect(announcement()).toHaveTextContent(
      "Marked as paid. Collected: $144.00, pending: $1,250.00.",
    );

    await user.click(undo);

    const mark = await screen.findByRole("button", {
      name: "Mark as paid: Adam Lee, Oct 10, 2026",
    });
    expect(mark).toHaveFocus();
    expect(mark.closest("tr")?.children[4]).toHaveTextContent("Unpaid");
    expect(totals()).toEqual(["Lessons: 3", "Collected: $99.00", "Pending: $1,295.00"]);
    expect(announcement()).toHaveTextContent(
      "Marked as unpaid. Collected: $99.00, pending: $1,295.00.",
    );
    expect(api.calls("PATCH /api/lessons/2").map((r) => r.body)).toEqual([
      { paid: true },
      { paid: false },
    ]);
  });

  it("a message of one month is not shown on another month", async () => {
    const user = userEvent.setup();
    await open("/summary?month=2026-10");
    await user.click(screen.getByRole("button", { name: "Mark as paid: Adam Lee, Oct 10, 2026" }));
    await waitFor(() => expect(announcement()).toHaveTextContent("Marked as paid."));

    await user.click(screen.getByRole("button", { name: "Previous month" }));

    await screen.findByRole("table", { name: "Lessons in September 2026, newest first" });
    expect(screen.queryByText(/^Marked as paid/)).toBeNull();
  });

  it("refreshes the totals and lists from the server after a change", async () => {
    const user = userEvent.setup();
    const { api } = await open("/summary?month=2026-10");
    const loads = api.calls(`GET /api/monthly-summaries/2026-10`).length;

    await user.click(screen.getByRole("button", { name: "Mark as paid: Adam Lee, Oct 10, 2026" }));

    await waitFor(() =>
      expect(api.calls(`GET /api/monthly-summaries/2026-10`).length).toBeGreaterThan(loads),
    );
  });
});
