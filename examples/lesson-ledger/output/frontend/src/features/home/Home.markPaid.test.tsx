import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { apiError, deferred } from "../../test/api";
import {
  ADAM,
  LATEST,
  OLDEST,
  ZOE,
  f03Lessons,
  figures,
  onNovember18,
  openHome,
  rows,
} from "../../test/home";
import { lesson } from "../../test/ledger";

onNovember18();

const F03 = () => ({ students: [ADAM, ZOE], lessons: f03Lessons() });
const mark = (name: string) => screen.getByRole("button", { name: `Mark as paid: ${name}` });
const announcement = () =>
  screen
    .getAllByRole("status")
    .map((s) => s.textContent)
    .join("");

describe("F07 AC-3 mark as paid on Home", () => {
  it("AC-3a lists the F03 AC-2 unpaid lessons oldest first, with November 2026's figures", async () => {
    await openHome(F03());
    await screen.findByRole("table", { name: OLDEST });

    expect(rows(OLDEST).map(([student, date]) => [student, date])).toEqual([
      ["Adam Lee", "Sep 5, 2026"],
      ["Adam Lee", "Oct 10, 2026"],
      ["Zoe Park", "Oct 10, 2026"],
      ["Zoe Park", "Nov 3, 2026"],
    ]);
    expect(screen.getByRole("heading", { level: 2, name: "November 2026" })).toBeVisible();
  });

  it("AC-3b marking removes the row, updates the total, announces it and focuses the next row; figures stay (AC-3c)", async () => {
    const user = userEvent.setup();
    const { api } = await openHome(F03());
    await screen.findByRole("table", { name: OLDEST });
    const before = figures();

    await user.click(mark("Adam Lee, Oct 10, 2026"));

    await waitFor(() => expect(mark("Zoe Park, Oct 10, 2026")).toHaveFocus());
    expect(api.calls("PATCH /api/lessons/2").map((r) => r.body)).toEqual([{ paid: true }]);
    expect(rows(OLDEST).map(([student, date]) => `${student} ${date}`)).toEqual([
      "Adam Lee Sep 5, 2026",
      "Zoe Park Oct 10, 2026",
      "Zoe Park Nov 3, 2026",
    ]);
    expect(screen.getByText("Total pending: $1,326.25 across 3 lessons")).toBeVisible();
    expect(announcement()).toBe(
      "Marked Adam Lee's lesson on Oct 10, 2026 as paid. Total pending: $1,326.25.",
    );
    expect(figures()).toEqual(before);
    expect(screen.queryByRole("button", { name: /^Undo paid/ })).toBeNull();
  });

  it("AC-3b marking the last row focuses the previous row's button", async () => {
    const user = userEvent.setup();
    await openHome(F03());
    await screen.findByRole("table", { name: OLDEST });

    await user.click(mark("Zoe Park, Nov 3, 2026"));

    await waitFor(() => expect(mark("Zoe Park, Oct 10, 2026")).toHaveFocus());
  });

  it("AC-3b when the table empties, focus goes to the section heading", async () => {
    const user = userEvent.setup();
    await openHome({ students: [ZOE], lessons: [lesson(1, ZOE, "2026-10-10", 45, 4500)] });
    await screen.findByRole("table", { name: OLDEST });

    await user.click(mark("Zoe Park, Oct 10, 2026"));

    const heading = screen.getByRole("heading", { level: 2, name: "Oldest unpaid lessons" });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.getByText("Nothing pending. Every lesson is paid.")).toBeVisible();
    expect(screen.queryByRole("table", { name: OLDEST })).toBeNull();
  });

  it("AC-3c marking a lesson of this month moves Collected and Pending and its status in Latest lessons", async () => {
    const user = userEvent.setup();
    await openHome(F03());
    await screen.findByRole("table", { name: OLDEST });
    expect(figures().slice(0, 2)).toEqual([
      ["Collected", "$0.00"],
      ["Pending", "$42.50"],
    ]);

    await user.click(mark("Zoe Park, Nov 3, 2026"));

    await waitFor(() =>
      expect(figures().slice(0, 2)).toEqual([
        ["Collected", "$42.50"],
        ["Pending", "$0.00"],
      ]),
    );
    expect(rows(LATEST)[0]).toEqual(["Zoe Park", "Nov 3, 2026", "45 min", "$42.50", "Paid"]);
  });

  it("AC-3 refill: after a mark the table refills from the server, the 6th oldest at the end", async () => {
    const user = userEvent.setup();
    await openHome();
    await screen.findByRole("table", { name: OLDEST });

    await user.click(mark("Zoe Park, Sep 2, 2026"));

    await waitFor(() =>
      expect(rows(OLDEST).map(([student, date]) => `${student} ${date}`)).toEqual([
        "Adam Lee Sep 9, 2026",
        "Mia Chen Sep 16, 2026",
        "Zoe Park Sep 23, 2026",
        "Adam Lee Oct 3, 2026",
        "Mia Chen Oct 10, 2026",
      ]),
    );
    expect(mark("Adam Lee, Sep 9, 2026")).toHaveFocus();
  });

  it("AC-3d while saving the button is disabled and reads Saving…", async () => {
    const user = userEvent.setup();
    const reply = deferred<{ status: number; body?: unknown }>();
    await openHome(F03(), { "PATCH /api/lessons/2": { pending: reply.promise } });
    await screen.findByRole("table", { name: OLDEST });

    await user.click(mark("Adam Lee, Oct 10, 2026"));

    const button = mark("Adam Lee, Oct 10, 2026");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Saving…");
    reply.resolve({ status: 503 });
    await waitFor(() => expect(button).toBeEnabled());
  });

  it.each([
    ["a 5xx", { status: 503 }, "We couldn't reach Lesson Ledger. Please try again."],
    [
      "a network failure",
      { network: true } as const,
      "We couldn't reach Lesson Ledger. Please try again.",
    ],
    [
      "a 404",
      apiError(404, "not_found", "Not found"),
      "That lesson could not be found. Reload the page and try again.",
    ],
  ])(
    "AC-3d on %s an alert explains it; row, figures and total stay; focus returns",
    async (_, reply, text) => {
      const user = userEvent.setup();
      await openHome(F03(), { "PATCH /api/lessons/2": reply });
      await screen.findByRole("table", { name: OLDEST });
      const before = { figures: figures(), rows: rows(OLDEST) };

      await user.click(mark("Adam Lee, Oct 10, 2026"));

      expect(await screen.findByRole("alert")).toHaveTextContent(text);
      await waitFor(() => expect(mark("Adam Lee, Oct 10, 2026")).toHaveFocus());
      expect(mark("Adam Lee, Oct 10, 2026")).toBeEnabled();
      expect(figures()).toEqual(before.figures);
      expect(rows(OLDEST)).toEqual(before.rows);
      expect(screen.getByText("Total pending: $1,371.25 across 4 lessons")).toBeVisible();
      const oldest = screen.getByRole("region", { name: "Oldest unpaid lessons" });
      expect(within(oldest).getByRole("alert")).toBeVisible();
    },
  );
});
