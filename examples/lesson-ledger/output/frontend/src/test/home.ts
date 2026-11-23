/** Test data for the Home tests (F07): a teacher's students and lessons, and helpers that read
 * Home's figures and tables the way a teacher sees them. */
import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { fakeApi } from "./api";
import {
  homeRoutes,
  lesson,
  paidLesson,
  student,
  type FakeLesson,
  type FakeStudent,
} from "./ledger";
import { renderApp } from "./renderApp";

export const ZOE = student(12, "Zoe Park");
export const ADAM = student(13, "Adam Lee");
export const MIA = student(14, "Mia Chen");

/** Runs every test of the file on 2026-11-18 (browser local time); only Date is faked. */
export function onNovember18(): void {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 18, 9, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });
}

/** Like seed teacher alice: November 2026 has 4 lessons, 1 paid ($45.00 collected, $136.25
 * pending), and 9 lessons are unpaid over three months. */
export function aliceLike(): { students: FakeStudent[]; lessons: FakeLesson[] } {
  return {
    students: [ADAM, MIA, ZOE],
    lessons: [
      lesson(1, ZOE, "2026-09-02", 45, 4000),
      lesson(2, ADAM, "2026-09-09", 45, 4000),
      lesson(3, MIA, "2026-09-16", 45, 4000),
      lesson(4, ZOE, "2026-09-23", 45, 4000),
      lesson(5, ADAM, "2026-10-03", 60, 6000),
      lesson(6, MIA, "2026-10-10", 90, 125000),
      paidLesson(lesson(7, ZOE, "2026-10-17", 45, 4500)),
      paidLesson(lesson(8, ADAM, "2026-10-24", 45, 4500)),
      paidLesson(lesson(9, MIA, "2026-11-02", 45, 4500)),
      lesson(10, ZOE, "2026-11-05", 60, 6000),
      lesson(11, ADAM, "2026-11-05", 30, 0),
      lesson(12, MIA, "2026-11-12", 75, 7625),
    ],
  };
}

/** F03 AC-2: four unpaid lessons over three months and one paid lesson. */
export function f03Lessons(): FakeLesson[] {
  return [
    lesson(1, ZOE, "2026-11-03", 45, 4250),
    lesson(2, ADAM, "2026-10-10", 45, 4500),
    lesson(3, ZOE, "2026-10-10", 90, 125000),
    paidLesson(lesson(4, ADAM, "2026-10-01", 45, 9900)),
    lesson(5, ADAM, "2026-09-05", 30, 3375),
  ];
}

export async function openHome(
  data: { students: FakeStudent[]; lessons: FakeLesson[] } = aliceLike(),
  routes: Parameters<typeof fakeApi>[0] = {},
) {
  const api = fakeApi({ ...homeRoutes(data.students, data.lessons), ...routes });
  const view = renderApp("/");
  await screen.findByText("Signed in as alice@example.com");
  return { api, view, ...data };
}

/** The month figures as [term, value] pairs, in order. */
export function figures(): [string, string][] {
  const list = screen.getByRole("heading", { level: 2, name: /^\w+ \d{4}$/ }).closest("section");
  if (!list) throw new Error("no month section");
  return [...list.querySelectorAll("dl > div")].map((pair) => [
    pair.querySelector("dt")?.textContent ?? "",
    pair.querySelector("dd")?.textContent ?? "",
  ]);
}

/** Body rows of the table named `caption`, as cell texts. */
export function rows(caption: string): string[][] {
  const table = screen.getByRole("table", { name: caption });
  return within(table)
    .getAllByRole("row")
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole("cell")
        .map((cell) => cell.textContent ?? ""),
    );
}

export const OLDEST = "Oldest unpaid lessons, oldest first";
export const LATEST = "Latest lessons, newest first";
