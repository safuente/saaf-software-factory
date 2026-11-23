/** F06 AC-4: the month chip and the metrics panel of /summary, built from the summary the page
 * already loads (F03 AC-1 data: November 2026, collected 4250, pending 6000, 3 lessons). */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { deferred, fakeApi } from "../../test/api";
import {
  CURRENT,
  lesson,
  monthLessonsPath,
  paidLesson,
  paymentRoutes,
  student,
  summaryPath,
  type FakeLesson,
} from "../../test/ledger";
import { renderApp } from "../../test/renderApp";
import { averagePerLesson, paidPercent } from "./metrics";

const ZOE = student(12, "Zoe Park");
const ADAM = student(13, "Adam Lee");

/** F03 AC-1: A (paid), B and C in November 2026, plus one lesson on each side of the month. */
function ac1Lessons(): FakeLesson[] {
  return [
    paidLesson(lesson(1, ZOE, "2026-11-03", 45, 4250)),
    lesson(2, ADAM, "2026-11-10", 60, 6000),
    lesson(3, ZOE, "2026-11-10", 30, 0),
    lesson(4, ADAM, "2026-10-31", 45, 3000),
    lesson(5, ZOE, "2026-12-01", 45, 5000),
  ];
}

async function openSummary(month: string, routes = {}) {
  const api = fakeApi({ ...paymentRoutes(ac1Lessons()), ...routes });
  renderApp(`/summary?month=${month}`);
  await screen.findByRole("heading", { level: 1, name: "Monthly summary" });
  return api;
}

const panel = () => document.querySelector<HTMLElement>("[data-metrics-panel]");

function panelPairs(): string[][] {
  const list = panel()?.querySelector("dl");
  if (!list) throw new Error("No totals list in the panel");
  return [...list.children].map((pair) => [
    pair.querySelector("dt")?.textContent ?? "",
    pair.querySelector("dd")?.textContent ?? "",
  ]);
}

/** Width of the bar's paid segment, as a share of the bar's width in percent. */
function paidShare(): number | undefined {
  const bar = panel()?.querySelector("svg");
  const paid = bar?.querySelector("[data-segment=paid]");
  if (!bar || !paid) return undefined;
  const width = Number(bar.getAttribute("viewBox")?.split(" ")[2]);
  return (Number(paid.getAttribute("width")) / width) * 100;
}

describe("F06 AC-4 metrics", () => {
  it.each([
    [4250, 6000, 41],
    [10250, 0, 100],
    [0, 6000, 0],
    [1, 7, 13], // 12.5 rounds half up
    [1, 2, 33],
  ])("AC-4 paid share of %i collected and %i pending is %i%%", (collected, pending, share) => {
    expect(paidPercent(collected, pending)).toBe(share);
  });

  it("AC-4d no amounts gives no share", () => {
    expect(paidPercent(0, 0)).toBeUndefined();
  });

  it.each([
    [10250, 3, 3417], // 3416.67
    [5, 2, 3], // 2.5 rounds half up
    [0, 3, 0], // $0 lessons count
    [1000, 4, 250],
  ])("AC-4 average of %i cents over %i lessons is %i cents", (total, count, average) => {
    expect(averagePerLesson(total, count)).toBe(average);
  });

  it("AC-4d no lessons gives no average", () => {
    expect(averagePerLesson(0, 0)).toBeUndefined();
  });
});

describe("F06 AC-4 the month chip and metrics panel on /summary", () => {
  it("AC-4a the month heading is a rounded outlined chip between the two buttons, in DOM order", async () => {
    await openSummary("2026-11");
    const heading = await screen.findByRole("heading", { level: 2, name: "November 2026" });
    expect(heading.className.split(/\s+/)).toEqual(
      expect.arrayContaining(["rounded-pill", "border", "border-outline"]),
    );
    const previous = screen.getByRole("button", { name: "Previous month" });
    const next = screen.getByRole("button", { name: "Next month" });
    expect(
      previous.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(heading.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    for (const button of [previous, next]) {
      expect(button.className.split(/\s+/)).toEqual(
        expect.arrayContaining(["rounded-pill", "bg-canvas", "border-outline"]),
      );
    }
  });

  it("AC-4b the panel holds the totals, a hidden 41% bar, the percentages and the average, before the table", async () => {
    await openSummary("2026-11");
    const table = await screen.findByRole("table", { name: /^Lessons in November 2026/ });
    const box = panel();
    expect(box).not.toBeNull();
    expect(panelPairs()).toEqual([
      ["Lessons:", "3"],
      ["Collected:", "$42.50"],
      ["Pending:", "$60.00"],
    ]);
    expect(document.querySelectorAll("main dl")).toHaveLength(1);
    const bar = box?.querySelector("svg");
    expect(bar).toHaveAttribute("aria-hidden", "true");
    expect(paidShare()).toBe(41);
    expect(within(box as HTMLElement).getByText("41% paid · 59% pending")).toBeVisible();
    expect(within(box as HTMLElement).getByText("Average per lesson: $34.17")).toBeVisible();
    expect(
      (box?.compareDocumentPosition(table) ?? 0) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(box?.closest("section, aside, [role]")).toBeNull();
  });

  it("AC-4c after Mark as paid on lesson B the panel updates in place; the average and the announcement stay", async () => {
    const user = userEvent.setup();
    await openSummary("2026-11");
    await screen.findByRole("table");

    await user.click(screen.getByRole("button", { name: "Mark as paid: Adam Lee, Nov 10, 2026" }));

    await waitFor(() =>
      expect(panelPairs()).toEqual([
        ["Lessons:", "3"],
        ["Collected:", "$102.50"],
        ["Pending:", "$0.00"],
      ]),
    );
    expect(paidShare()).toBe(100);
    expect(screen.getByText("100% paid · 0% pending")).toBeVisible();
    expect(screen.getByText("Average per lesson: $34.17")).toBeVisible();
    expect(
      screen.getAllByRole("status").find((s) => s.textContent?.startsWith("Marked")),
    ).toHaveTextContent("Marked as paid. Collected: $102.50, pending: $0.00.");
  });

  it("AC-4d an empty month shows zeros, an empty bar, no percentages and a dash for the average", async () => {
    await openSummary("2026-08");
    expect(await screen.findByText("No lessons in August 2026.")).toBeVisible();
    expect(panelPairs()).toEqual([
      ["Lessons:", "0"],
      ["Collected:", "$0.00"],
      ["Pending:", "$0.00"],
    ]);
    expect(panel()?.querySelectorAll("[data-segment]")).toHaveLength(0);
    expect(screen.getByText("No amounts this month.")).toBeVisible();
    expect(screen.queryByText(/% paid/)).toBeNull();
    expect(screen.getByText("Average per lesson: —")).toBeVisible();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("AC-4f while loading, only the chip and Loading… show; no panel", async () => {
    const reply = deferred<{ status: number; body?: unknown }>();
    await openSummary("2026-11", { [`GET ${summaryPath("2026-11")}`]: { pending: reply.promise } });
    expect(await screen.findByText("Loading…")).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: "November 2026" })).toBeVisible();
    expect(panel()).toBeNull();
    reply.resolve({ status: 500 });
  });

  it("AC-4f on load error, Try again and no panel", async () => {
    await openSummary("2026-11", { [`GET ${summaryPath("2026-11")}`]: { status: 500 } });
    expect(await screen.findByRole("button", { name: "Try again" })).toBeVisible();
    expect(panel()).toBeNull();
  });

  it("AC-4g the page makes only F03's requests: the session, the summary and the month's lessons", async () => {
    const api = await openSummary("2026-11");
    await screen.findByRole("table");
    expect(new Set(api.requests.map((r) => `${r.method} ${r.path}`))).toEqual(
      new Set([CURRENT, `GET ${summaryPath("2026-11")}`, `GET ${monthLessonsPath("2026-11")}`]),
    );
  });
});
