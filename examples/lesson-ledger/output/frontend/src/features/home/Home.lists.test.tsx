import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LATEST, OLDEST, onNovember18, openHome, rows, ZOE } from "../../test/home";
import { lesson, type FakeLesson } from "../../test/ledger";

onNovember18();

const section = (name: string) => screen.getByRole("region", { name });

describe("F07 AC-2 oldest unpaid and latest lessons", () => {
  it("AC-2a lists the 5 oldest unpaid lessons with the all-months total and a link to /pending", async () => {
    await openHome();
    const table = await screen.findByRole("table", { name: OLDEST });

    const oldest = section("Oldest unpaid lessons");
    expect(within(oldest).getByRole("heading", { level: 2 })).toHaveTextContent(
      "Oldest unpaid lessons",
    );
    expect(within(oldest).getByText("Total pending: $1,606.25 across 9 lessons")).toBeVisible();
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((h) => h.textContent),
    ).toEqual(["Student", "Date", "Duration", "Price", "Action"]);
    expect(rows(OLDEST)).toEqual([
      ["Zoe Park", "Sep 2, 2026", "45 min", "$40.00", "Mark as paid"],
      ["Adam Lee", "Sep 9, 2026", "45 min", "$40.00", "Mark as paid"],
      ["Mia Chen", "Sep 16, 2026", "45 min", "$40.00", "Mark as paid"],
      ["Zoe Park", "Sep 23, 2026", "45 min", "$40.00", "Mark as paid"],
      ["Adam Lee", "Oct 3, 2026", "60 min", "$60.00", "Mark as paid"],
    ]);
    expect(within(oldest).getByRole("link", { name: "View all pending payments" })).toHaveAttribute(
      "href",
      "/pending",
    );
  });

  it("AC-2b lists the 5 latest lessons with their status in words and a link to /lessons", async () => {
    await openHome();
    const table = await screen.findByRole("table", { name: LATEST });

    const latest = section("Latest lessons");
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((h) => h.textContent),
    ).toEqual(["Student", "Date", "Duration", "Price", "Status"]);
    expect(rows(LATEST)).toEqual([
      ["Mia Chen", "Nov 12, 2026", "75 min", "$76.25", "Unpaid"],
      ["Adam Lee", "Nov 5, 2026", "30 min", "$0.00", "Unpaid"],
      ["Zoe Park", "Nov 5, 2026", "60 min", "$60.00", "Unpaid"],
      ["Mia Chen", "Nov 2, 2026", "45 min", "$45.00", "Paid"],
      ["Adam Lee", "Oct 24, 2026", "45 min", "$45.00", "Paid"],
    ]);
    expect(within(table).getAllByText("Paid")[0]).toHaveClass("text-paid");
    expect(within(table).getAllByText("Unpaid")[0]).toHaveClass("text-unpaid");
    expect(within(latest).getByRole("link", { name: "View all lessons" })).toHaveAttribute(
      "href",
      "/lessons",
    );
  });

  it("AC-2c the email line stays", async () => {
    await openHome();
    await screen.findByRole("table", { name: LATEST });
    expect(screen.getByText("Signed in as alice@example.com")).toBeVisible();
  });

  it("AC-2d many items: 5 rows per table, the full total and no truncation message", async () => {
    const many: FakeLesson[] = Array.from({ length: 520 }, (_, i) =>
      lesson(i + 1, ZOE, "2026-11-02", 45, 4500),
    );
    await openHome({ students: [ZOE], lessons: many });
    await screen.findByRole("table", { name: OLDEST });

    expect(rows(OLDEST)).toHaveLength(5);
    expect(rows(LATEST)).toHaveLength(5);
    expect(screen.getByText("Total pending: $23,400.00 across 520 lessons")).toBeVisible();
    expect(screen.queryByText(/^Showing/)).toBeNull();
  });

  it("AC-2e loading / reads only the month summary and the first page of pending, lessons and students", async () => {
    const { api } = await openHome();
    await screen.findByRole("table", { name: LATEST });

    expect(api.requests.map((r) => `${r.method} ${r.path}`).sort()).toEqual(
      [
        "GET /api/lessons?page=1&page_size=5",
        "GET /api/monthly-summaries/2026-11",
        "GET /api/pending-lessons?page=1&page_size=5",
        "GET /api/sessions/current",
        "GET /api/students?page=1&page_size=1",
      ].sort(),
    );
  });
});
