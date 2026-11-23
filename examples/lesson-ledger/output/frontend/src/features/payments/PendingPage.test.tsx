import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { deferred, fakeApi } from "../../test/api";
import {
  PENDING_PATH,
  lesson,
  paidLesson,
  paymentRoutes,
  student,
  type FakeLesson,
} from "../../test/ledger";
import { renderApp } from "../../test/renderApp";

const ZOE = student(12, "Zoe Park");
const ADAM = student(13, "Adam Lee");

/** AC-2: four unpaid lessons over three months and one paid lesson. */
function ac2Lessons(): FakeLesson[] {
  return [
    lesson(1, ZOE, "2026-11-03", 45, 4250),
    lesson(2, ADAM, "2026-10-10", 45, 4500),
    lesson(3, ZOE, "2026-10-10", 90, 125000),
    paidLesson(lesson(4, ADAM, "2026-10-01", 45, 9900)),
    lesson(5, ADAM, "2026-09-05", 30, 3375),
  ];
}

async function openPending(lessons = ac2Lessons(), routes = {}) {
  const api = fakeApi({ ...paymentRoutes(lessons), ...routes });
  const view = renderApp("/pending");
  await screen.findByRole("heading", { level: 1, name: "Pending payments" });
  return { api, view, lessons };
}

function pendingRows(): string[][] {
  const table = screen.getByRole("table", { name: "Unpaid lessons, oldest first" });
  return within(table)
    .getAllByRole("row")
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole("cell")
        .map((cell) => cell.textContent ?? ""),
    );
}

describe("AC-2 pending payments", () => {
  it("lists every unpaid lesson oldest first with the total pending", async () => {
    await openPending();
    const table = await screen.findByRole("table", { name: "Unpaid lessons, oldest first" });

    expect(document.title).toBe("Pending payments · Lesson Ledger");
    expect(screen.getByText("Total pending: $1,371.25 across 4 lessons")).toBeVisible();
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((h) => h.textContent),
    ).toEqual(["Student", "Date", "Duration", "Price", "Action"]);
    expect(pendingRows()).toEqual([
      ["Adam Lee", "Sep 5, 2026", "30 min", "$33.75", "Mark as paid"],
      ["Adam Lee", "Oct 10, 2026", "45 min", "$45.00", "Mark as paid"],
      ["Zoe Park", "Oct 10, 2026", "90 min", "$1,250.00", "Mark as paid"],
      ["Zoe Park", "Nov 3, 2026", "45 min", "$42.50", "Mark as paid"],
    ]);
    expect(
      screen.getByRole("button", { name: "Mark as paid: Adam Lee, Sep 5, 2026" }),
    ).toBeVisible();
  });

  it("one pending lesson is singular", async () => {
    await openPending([lesson(1, ZOE, "2026-11-03", 45, 4250)]);

    expect(await screen.findByText("Total pending: $42.50 across 1 lesson")).toBeVisible();
  });

  it.each([[[]], [[paidLesson(lesson(1, ZOE, "2026-11-03"))]]])(
    "nothing pending shows the empty message and no table",
    async (lessons) => {
      await openPending(lessons);

      expect(await screen.findByText("Nothing pending. Every lesson is paid.")).toBeVisible();
      expect(screen.queryByRole("table")).toBeNull();
      expect(screen.queryByText(/Total pending/)).toBeNull();
    },
  );

  it("shows Loading… in a status region while loading", async () => {
    const reply = deferred<{ status: number; body?: unknown }>();
    await openPending(ac2Lessons(), { [`GET ${PENDING_PATH}`]: { pending: reply.promise } });

    expect(await screen.findByText("Loading…")).toHaveAttribute("role", "status");
  });

  it("more than 500 pending lessons ends with the truncation message", async () => {
    const many = Array.from({ length: 502 }, (_, n) => lesson(n + 1, ZOE, "2026-11-03", 45, 100));
    await openPending(many);

    expect(await screen.findByText("Showing the 500 oldest of 502 pending lessons.")).toBeVisible();
    expect(screen.getByText("Total pending: $502.00 across 502 lessons")).toBeVisible();
  });
});
