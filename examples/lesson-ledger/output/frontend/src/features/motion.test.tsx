/** F08 AC-4: which elements carry the shared motion utilities. The media query that turns them
 * off under reduced motion and the computed timings are checked in e2e/f08-motion.spec.ts. */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { fakeApi } from "../test/api";
import { onNovember18, openHome } from "../test/home";
import { lesson, paidLesson, paymentRoutes, student, type FakeLesson } from "../test/ledger";
import { renderApp } from "../test/renderApp";
import { ActionLink } from "../shared/ui/ActionLink";
import { Button } from "../shared/ui/Button";
import { TextLink } from "../shared/ui/Form";
import { MainNav } from "../shared/ui/MainNav";

onNovember18();

const ZOE = student(12, "Zoe Park");
const ADAM = student(13, "Adam Lee");
const classes = (el: Element | null | undefined) => (el?.getAttribute("class") ?? "").split(/\s+/);

/** The F03 AC-1 data: A paid 42.50, B 60.00 and C 0.00 unpaid, in November 2026. */
function f03(): FakeLesson[] {
  return [
    paidLesson(lesson(1, ZOE, "2026-11-03", 45, 4250)),
    lesson(2, ADAM, "2026-11-10", 45, 6000),
    lesson(3, ZOE, "2026-11-10", 45, 0),
  ];
}

const row = (name: string) => screen.getByRole("button", { name }).closest("tr");
const highlighted = () => document.querySelectorAll("tr.motion-highlight");

describe("F08 AC-4a interaction transitions", () => {
  it("AC-4a buttons of every variant, sidebar links, page actions and text links transition", () => {
    render(
      <MemoryRouter>
        <MainNav />
        <Button>Save</Button>
        <Button variant="secondary">Try again</Button>
        <Button variant="secondary" pill>
          Next month
        </Button>
        <ActionLink to="/lessons" label="Record lesson on the Lessons page" variant="primary">
          Record lesson
        </ActionLink>
        <ActionLink to="/students" label="Add student on the Students page">
          Add student
        </ActionLink>
        <TextLink to="/signup">Create an account</TextLink>
      </MemoryRouter>,
    );
    const elements = [...screen.getAllByRole("button"), ...screen.getAllByRole("link")];
    expect(elements).toHaveLength(3 + 5 + 3);
    for (const el of elements)
      expect(classes(el), el.textContent ?? "").toContain("motion-interaction");
  });
});

describe("F08 AC-4b,c load motion", () => {
  it("AC-4b,c /summary: the paid segment grows, the panel's values fade in", async () => {
    fakeApi(paymentRoutes(f03()));
    renderApp("/summary?month=2026-11");
    await screen.findByRole("table");
    const panel = document.querySelector("[data-metrics-panel]");
    expect(classes(panel?.querySelector("[data-segment=paid]"))).toContain("motion-grow");
    expect(classes(panel?.querySelector("[data-segment=pending]"))).not.toContain("motion-grow");
    const values = [...(panel?.querySelectorAll("dd") ?? [])];
    expect(values).toHaveLength(3);
    for (const dd of values) expect(classes(dd)).toContain("motion-fade");
    const percent = within(panel as HTMLElement).getByText("41% paid · 59% pending");
    const average = within(panel as HTMLElement).getByText(/^Average per lesson:/);
    expect(classes(percent)).toContain("motion-fade");
    expect(classes(average)).toContain("motion-fade");
    expect(classes(panel?.querySelector("dt"))).not.toContain("motion-fade");
  });

  it("AC-4c Home's four figure values fade in; their terms do not", async () => {
    await openHome();
    await screen.findByRole("heading", { level: 2, name: "November 2026" });
    const values = [...document.querySelectorAll("main dd")];
    expect(values).toHaveLength(4);
    for (const dd of values) expect(classes(dd)).toContain("motion-fade");
    for (const dt of document.querySelectorAll("main dt")) {
      expect(classes(dt)).not.toContain("motion-fade");
    }
  });

  it("AC-4b,c after a mark the bar and the figures are the same elements, so nothing replays", async () => {
    const user = userEvent.setup();
    fakeApi(paymentRoutes(f03()));
    renderApp("/summary?month=2026-11");
    await screen.findByRole("table");
    const bar = document.querySelector("[data-segment=paid]");
    const values = [
      ...document.querySelectorAll("[data-metrics-panel] dd, [data-metrics-panel] p"),
    ];
    await user.click(screen.getByRole("button", { name: "Mark as paid: Adam Lee, Nov 10, 2026" }));
    await screen.findByText("100% paid · 0% pending");
    expect(document.querySelector("[data-segment=paid]")).toBe(bar);
    expect([
      ...document.querySelectorAll("[data-metrics-panel] dd, [data-metrics-panel] p"),
    ]).toEqual(values);
  });
});

describe("F08 AC-4d the just-paid highlight", () => {
  it("AC-4d marking lesson B on /summary highlights its row once; the status reads Paid", async () => {
    const user = userEvent.setup();
    fakeApi(paymentRoutes(f03()));
    renderApp("/summary?month=2026-11");
    await screen.findByRole("table");
    expect(highlighted()).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Mark as paid: Adam Lee, Nov 10, 2026" }));
    const undo = await screen.findByRole("button", { name: "Undo paid: Adam Lee, Nov 10, 2026" });
    const tr = undo.closest("tr");
    await waitFor(() => expect(classes(tr)).toContain("motion-highlight"));
    expect(highlighted()).toHaveLength(1);
    expect(within(tr as HTMLElement).getByText("Paid")).toBeVisible();
    await waitFor(() => expect(undo).toHaveFocus());

    // React listens for the vendor-prefixed name where the DOM (jsdom) lacks AnimationEvent.
    fireEvent.animationEnd(tr as HTMLElement, { animationName: "paid-highlight" });
    fireEvent(tr as HTMLElement, new Event("webkitAnimationEnd", { bubbles: true }));
    expect(classes(tr)).not.toContain("motion-highlight");
  });

  it("AC-4d Undo paid and a failed mark produce no highlight", async () => {
    const user = userEvent.setup();
    fakeApi({ ...paymentRoutes(f03()), "PATCH /api/lessons/3": { status: 503 } });
    renderApp("/summary?month=2026-11");
    await screen.findByRole("table");

    await user.click(screen.getByRole("button", { name: "Undo paid: Zoe Park, Nov 3, 2026" }));
    await screen.findByRole("button", { name: "Mark as paid: Zoe Park, Nov 3, 2026" });
    expect(highlighted()).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Mark as paid: Zoe Park, Nov 10, 2026" }));
    await screen.findByRole("alert");
    expect(highlighted()).toHaveLength(0);
    expect(classes(row("Mark as paid: Zoe Park, Nov 10, 2026"))).not.toContain("motion-highlight");
  });

  it("AC-4d a second mark after undo highlights again", async () => {
    const user = userEvent.setup();
    fakeApi(paymentRoutes(f03()));
    renderApp("/summary?month=2026-11");
    await screen.findByRole("table");
    await user.click(screen.getByRole("button", { name: "Mark as paid: Adam Lee, Nov 10, 2026" }));
    await user.click(
      await screen.findByRole("button", { name: "Undo paid: Adam Lee, Nov 10, 2026" }),
    );
    await screen.findByRole("button", { name: "Mark as paid: Adam Lee, Nov 10, 2026" });
    expect(highlighted()).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Mark as paid: Adam Lee, Nov 10, 2026" }));
    await screen.findByRole("button", { name: "Undo paid: Adam Lee, Nov 10, 2026" });
    await waitFor(() => expect(highlighted()).toHaveLength(1));
  });

  it("AC-4d Mark as paid on /pending and on Home: the row leaves, nothing is highlighted", async () => {
    const user = userEvent.setup();
    fakeApi(paymentRoutes(f03()));
    const { unmount } = renderApp("/pending");
    await screen.findByRole("table");
    await user.click(screen.getByRole("button", { name: "Mark as paid: Adam Lee, Nov 10, 2026" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Mark as paid: Adam Lee, Nov 10, 2026" }),
      ).toBeNull(),
    );
    expect(highlighted()).toHaveLength(0);
    unmount();

    await openHome();
    const [mark] = await screen.findAllByRole("button", { name: /^Mark as paid: / });
    const name = mark?.getAttribute("aria-label") ?? "";
    await user.click(mark as HTMLElement);
    await waitFor(() => expect(screen.queryByRole("button", { name })).toBeNull());
    expect(highlighted()).toHaveLength(0);
  });
});
