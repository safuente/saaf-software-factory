/** F06 AC-3: initials before every student's name on /lessons, /summary, /pending and
 * /students; worded payment status with a decorative tick. Text content stays as F02/F03. */
import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fakeApi } from "../test/api";
import { ledgerRoutes, lesson, paidLesson, paymentRoutes, student } from "../test/ledger";
import { renderApp } from "../test/renderApp";

const ZOE = student(12, "Zoe Park");
const ADAM = student(13, "adam Lee");
const LESSONS = [
  paidLesson(lesson(1, ZOE, "2026-11-03", 45, 4250)),
  lesson(2, ADAM, "2026-11-10", 60, 6000),
];

/** The first cell of every body row: its text and the initials it shows. */
function studentCells(tableName: string | RegExp) {
  const table = screen.getByRole("table", { name: tableName });
  return within(table)
    .getAllByRole("row")
    .slice(1)
    .map((row) => {
      const cell = within(row).getAllByRole("cell")[0];
      return [
        cell?.textContent,
        cell?.querySelector("[data-initials]")?.getAttribute("data-initials"),
      ];
    });
}

describe("F06 AC-3b initials in the Student column", () => {
  it("AC-3b /lessons", async () => {
    fakeApi(ledgerRoutes([ZOE, ADAM], LESSONS));
    renderApp("/lessons");
    await screen.findByRole("table", { name: "Your lessons, newest first" });
    expect(studentCells("Your lessons, newest first")).toEqual([
      ["adam Lee", "AL"],
      ["Zoe Park", "ZP"],
    ]);
  });

  it("AC-3b /summary", async () => {
    fakeApi(paymentRoutes(LESSONS));
    renderApp("/summary?month=2026-11");
    await screen.findByRole("table", { name: "Lessons in November 2026, newest first" });
    expect(studentCells(/^Lessons in November 2026/)).toEqual([
      ["adam Lee", "AL"],
      ["Zoe Park", "ZP"],
    ]);
  });

  it("AC-3b /pending", async () => {
    fakeApi(paymentRoutes(LESSONS));
    renderApp("/pending");
    await screen.findByRole("table", { name: "Unpaid lessons, oldest first" });
    expect(studentCells("Unpaid lessons, oldest first")).toEqual([["adam Lee", "AL"]]);
  });
});

describe("F06 AC-3c worded status with a decorative tick", () => {
  it("AC-3c Paid carries the tick class and reads exactly Paid; Unpaid reads exactly Unpaid", async () => {
    fakeApi(paymentRoutes(LESSONS));
    renderApp("/summary?month=2026-11");
    const table = await screen.findByRole("table", { name: /^Lessons in November 2026/ });
    const status = within(table)
      .getAllByRole("row")
      .slice(1)
      .map((row) => within(row).getAllByRole("cell")[4]);
    expect(status.map((cell) => cell?.textContent)).toEqual(["Unpaid", "Paid"]);
    const [unpaid, paid] = status.map((cell) => cell?.firstElementChild?.className.split(/\s+/));
    expect(paid).toContain("check-mark");
    expect(paid).toContain("text-paid");
    expect(unpaid).not.toContain("check-mark");
    expect(unpaid).toContain("text-unpaid");
  });
});

describe("F06 AC-3d the students list", () => {
  it("AC-3d each student is a ruled row with initials; the list text is the names", async () => {
    fakeApi(ledgerRoutes([ZOE, ADAM]));
    renderApp("/students");
    const list = await screen.findByRole("list", { name: "Your students" });
    const items = within(list).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual(["adam Lee", "Zoe Park"]);
    expect(
      items.map((item) => item.querySelector("[data-initials]")?.getAttribute("data-initials")),
    ).toEqual(["AL", "ZP"]);
    expect(list.className.split(/\s+/)).toContain("list-none");
    for (const item of items) {
      expect(item.className.split(/\s+/)).toEqual(
        expect.arrayContaining(["border-b", "border-rule"]),
      );
    }
  });

  it('AC-3d the list\'s label, the existing heading "Your students", is grey (slate), text and level unchanged', async () => {
    fakeApi(ledgerRoutes([ZOE, ADAM]));
    renderApp("/students");
    await screen.findByRole("list", { name: "Your students" });
    const label = screen.getByRole("heading", { level: 2, name: "Your students" });
    expect(label.className.split(/\s+/)).toContain("text-slate");
  });
});
