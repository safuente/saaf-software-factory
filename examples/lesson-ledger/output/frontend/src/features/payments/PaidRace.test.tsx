/** F03 AC-3 under a race (F05 fix round 2, owner-authorised behaviour change): the refetch
 * started by "Mark as paid" lands while the "Undo paid" request is still in flight, with one
 * of the summary and the lesson list read before the undo and the other after it. The undo must
 * still revert the totals and announce them correctly. */
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { deferred, fakeApi } from "../../test/api";
import { lesson, paidLesson, paymentRoutes, student, type FakeLesson } from "../../test/ledger";
import { renderApp } from "../../test/renderApp";

type Reply = { status: number; body?: unknown };

const ADAM = student(13, "Adam Lee");
const SUMMARY = "/api/monthly-summaries/2026-10";
const MONTH_LESSONS = "/api/lessons?month=2026-10&page=1&page_size=500";

function totals(): string[] {
  const list = document.querySelector("main dl");
  if (!list) throw new Error("No totals list");
  return [...list.children].map((pair) => pair.textContent ?? "");
}

const announcement = () =>
  screen.getAllByRole("status").find((region) => region.textContent !== "Loading…");

it.each([
  { before: SUMMARY, after: MONTH_LESSONS },
  { before: MONTH_LESSONS, after: SUMMARY },
])(
  "AC-3 race: undo announces and shows reverted totals when the mark's refetch lands mid-undo (read before the undo: $before)",
  async ({ before, after }) => {
    const user = userEvent.setup();
    const lessons: FakeLesson[] = [
      lesson(2, ADAM, "2026-10-10", 45, 4500),
      paidLesson(lesson(4, ADAM, "2026-10-01", 45, 9900)),
    ];
    const routes = paymentRoutes(lessons);
    const server = routes["*"];
    const held = new Map<string, ReturnType<typeof deferred<Reply>>>();
    let hold = false;
    const api = fakeApi({
      ...routes,
      "*": (request) => {
        if (hold && request.method === "GET" && [SUMMARY, MONTH_LESSONS].includes(request.path)) {
          const reply = deferred<Reply>();
          held.set(request.path, reply);
          return { pending: reply.promise };
        }
        return server(request);
      },
    });
    renderApp("/summary?month=2026-10");
    await screen.findByRole("table");
    expect(totals()).toEqual(["Lessons: 2", "Collected: $99.00", "Pending: $45.00"]);

    hold = true;
    await user.click(screen.getByRole("button", { name: "Mark as paid: Adam Lee, Oct 10, 2026" }));
    const undo = await screen.findByRole("button", { name: "Undo paid: Adam Lee, Oct 10, 2026" });
    await waitFor(() => expect(held.size).toBe(2));
    expect(totals()).toEqual(["Lessons: 2", "Collected: $144.00", "Pending: $0.00"]);

    // The server answers one read before the undo is applied ...
    const readBeforeUndo = structuredClone(
      server({ method: "GET", path: before, body: undefined }),
    );
    const undoReply = deferred<Reply>();
    api.route("PATCH /api/lessons/2", { pending: undoReply.promise });
    hold = false;
    await user.click(undo);
    await waitFor(() => expect(api.calls("PATCH /api/lessons/2")).toHaveLength(2));
    const undone = server({ method: "PATCH", path: "/api/lessons/2", body: { paid: false } });
    // ... and the other after it; both land before the undo response.
    const readAfterUndo = server({ method: "GET", path: after, body: undefined });
    await act(async () => {
      held.get(before)?.resolve(readBeforeUndo as Reply);
      held.get(after)?.resolve(readAfterUndo as Reply);
      // Let the responses settle (React Query notifies on a 0 ms timer).
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    await act(async () => {
      undoReply.resolve(undone as Reply);
    });

    await screen.findByRole("button", { name: "Mark as paid: Adam Lee, Oct 10, 2026" });
    expect(announcement()).toHaveTextContent(
      "Marked as unpaid. Collected: $99.00, pending: $45.00.",
    );
    expect(totals()).toEqual(["Lessons: 2", "Collected: $99.00", "Pending: $45.00"]);
  },
);
