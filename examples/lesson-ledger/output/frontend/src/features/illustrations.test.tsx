/** F08 AC-3: one small original illustration above Home's "Get started" and the four list
 * empty states; none in any other state. Message texts and elements stay as before F08. */
import { screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { deferred, fakeApi } from "../test/api";
import { onNovember18, openHome } from "../test/home";
import {
  LIST_LESSONS,
  LIST_STUDENTS,
  ledgerRoutes,
  lesson,
  paidLesson,
  paymentRoutes,
  student,
} from "../test/ledger";
import { renderApp } from "../test/renderApp";

onNovember18();

const ZOE = student(12, "Zoe Park");
const CSS = readFileSync(resolve(__dirname, "../shared/styles/app.css"), "utf8");
const COLOURS = new Set([...CSS.matchAll(/--color-([a-z-]+):/g)].map((m) => m[1]));

const illustrations = () => [...document.querySelectorAll<SVGSVGElement>("svg[data-illustration]")];
const allSvgsOutsideShellAndControls = () =>
  [...document.querySelectorAll("main svg")].filter(
    (svg) => !svg.closest("button, a, [role=alert], [data-metrics-panel]"),
  );

/** Exactly one illustration, right before `message`, outside any table, hidden, untitled, and
 * painted with theme colour names only (AC-3 a). */
function expectIllustrationAbove(message: HTMLElement): void {
  const found = illustrations();
  expect(found).toHaveLength(1);
  expect(allSvgsOutsideShellAndControls()).toHaveLength(1);
  const svg = found[0] as SVGSVGElement;
  expect(svg.nextElementSibling).toBe(message);
  expect(svg.closest("table")).toBeNull();
  expect(svg.getAttribute("aria-hidden")).toBe("true");
  expect(svg.getAttribute("focusable")).toBe("false");
  expect(svg.querySelector("title, desc")).toBeNull();
  expect(svg.outerHTML).not.toMatch(/\bstyle=|<style|<script|data:|href=|url\(/);
  for (const part of svg.querySelectorAll("*")) {
    for (const paint of ["fill", "stroke"]) {
      const literal = part.getAttribute(paint);
      if (literal !== null) expect(literal, `${paint} attribute`).toBe("none");
    }
    const classes = (part.getAttribute("class") ?? "").split(/\s+/).filter(Boolean);
    for (const name of classes) {
      const colour = /^(?:fill|stroke)-([a-z-]+)$/.exec(name)?.[1];
      if (colour) expect(COLOURS.has(colour), name).toBe(true);
    }
    const painted = classes.some((c) => /^(fill|stroke)-/.test(c));
    if (
      ["rect", "circle", "ellipse", "path", "line", "polyline", "polygon"].includes(part.tagName)
    ) {
      expect(painted || part.getAttribute("fill") === "none", `${part.tagName} painted`).toBe(true);
    }
  }
}

const expectNoIllustration = () => expect(allSvgsOutsideShellAndControls()).toEqual([]);

describe("F08 AC-3 illustrated states", () => {
  it("AC-3a,b Home 'Get started' has the illustration above its steps", async () => {
    await openHome({ students: [], lessons: [] });
    const heading = await screen.findByRole("heading", { level: 2, name: "Get started" });
    const steps = document.querySelector("main ol") as HTMLElement;
    expect(steps.textContent).toContain("Add your students.");
    expect(heading.compareDocumentPosition(steps) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expectIllustrationAbove(steps);
  });

  it("AC-3a,b Students: the empty message keeps its text and element, illustration above", async () => {
    fakeApi(ledgerRoutes([]));
    renderApp("/students");
    const message = await screen.findByText(
      "You have no students yet. Add your first student with the form above.",
    );
    expect(message.tagName).toBe("P");
    expectIllustrationAbove(message);
  });

  it("AC-3a,b,c Lessons: 'No lessons recorded yet.' illustrated; 'Add a student before…' not", async () => {
    fakeApi(ledgerRoutes([]));
    renderApp("/lessons");
    const message = await screen.findByText("No lessons recorded yet.");
    await screen.findByText("Add a student before recording a lesson.");
    expect(message.tagName).toBe("P");
    expectIllustrationAbove(message);
  });

  it("AC-3a,b Monthly summary: 'No lessons in November 2026.' illustrated", async () => {
    fakeApi(paymentRoutes([]));
    renderApp("/summary?month=2026-11");
    const message = await screen.findByText("No lessons in November 2026.");
    expect(message.tagName).toBe("P");
    expectIllustrationAbove(message);
  });

  it("AC-3a,b Pending payments: 'Nothing pending. Every lesson is paid.' illustrated", async () => {
    fakeApi(paymentRoutes([paidLesson(lesson(1, ZOE, "2026-11-03"))]));
    renderApp("/pending");
    const message = await screen.findByText("Nothing pending. Every lesson is paid.");
    expect(message.tagName).toBe("P");
    expectIllustrationAbove(message);
  });
});

describe("F08 AC-3c no illustration in any other state", () => {
  it("AC-3c Home's in-section messages: no lessons this month, nothing pending", async () => {
    await openHome({ students: [ZOE], lessons: [paidLesson(lesson(1, ZOE, "2026-10-01"))] });
    await screen.findByText("No lessons in November 2026.");
    await screen.findByText("Nothing pending. Every lesson is paid.");
    expectNoIllustration();
  });

  it("AC-3c Home with students but no lessons: 'Nothing pending.', 'No lessons recorded yet.'", async () => {
    await openHome({ students: [ZOE], lessons: [] });
    await screen.findByText("Nothing pending.");
    await screen.findByText("No lessons recorded yet.");
    expectNoIllustration();
  });

  it("AC-3c loading shows no illustration", async () => {
    const reply = deferred<{ status: number; body?: unknown }>();
    fakeApi({ ...ledgerRoutes([ZOE]), [LIST_LESSONS]: { pending: reply.promise } });
    renderApp("/lessons");
    await screen.findByRole("heading", { level: 1, name: "Lessons" });
    expect(screen.getAllByText("Loading…").length).toBeGreaterThan(0);
    expectNoIllustration();
  });

  it("AC-3c a load error shows no illustration", async () => {
    fakeApi({ ...ledgerRoutes([]), [LIST_STUDENTS]: { network: true } });
    renderApp("/students");
    await screen.findByText("We couldn't reach Lesson Ledger.");
    expectNoIllustration();
  });

  it("AC-3c the students list with a student shows no illustration", async () => {
    fakeApi(ledgerRoutes([ZOE]));
    renderApp("/students");
    await screen.findByText("Zoe Park");
    expectNoIllustration();
  });
});
