/** F08 AC-1: icons on the pages' action buttons and Home's quick actions; none while a button
 * reads another text ("Saving…", "Adding…"), and none in table cells or the payment status. */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { deferred, fakeApi } from "../test/api";
import { onNovember18, openHome } from "../test/home";
import { expectLeadingIcon, expectNoIcon, svgsIn } from "../test/icons";
import {
  ADD_STUDENT,
  ledgerRoutes,
  lesson,
  paidLesson,
  paymentRoutes,
  student,
} from "../test/ledger";
import { renderApp } from "../test/renderApp";

onNovember18();

const ZOE = student(12, "Zoe Park");
const ADAM = student(13, "Adam Lee");

/** Icons inside a table may only sit in its row buttons (AC-1 b). */
function expectIconsOnlyInButtons(table: HTMLElement): void {
  for (const svg of svgsIn(table)) {
    expect(svg.closest("button"), "icon outside a button in a table").not.toBeNull();
  }
  for (const cell of within(table).getAllByRole("cell")) {
    if (!cell.querySelector("button")) expectNoIcon(cell);
  }
}

describe("F08 AC-1 icons on page actions", () => {
  it("AC-1a,c,d Mark as paid and Undo paid on /summary show their icons; Saving… shows none", async () => {
    const user = userEvent.setup();
    const reply = deferred<{ status: number; body?: unknown }>();
    const lessons = [
      paidLesson(lesson(1, ZOE, "2026-11-03", 45, 4250)),
      lesson(2, ADAM, "2026-11-10", 45, 6000),
    ];
    fakeApi({ ...paymentRoutes(lessons), "PATCH /api/lessons/2": { pending: reply.promise } });
    renderApp("/summary?month=2026-11");
    const table = await screen.findByRole("table");

    const undo = screen.getByRole("button", { name: "Undo paid: Zoe Park, Nov 3, 2026" });
    const mark = screen.getByRole("button", {
      name: "Mark as paid: Adam Lee, Nov 10, 2026",
    });
    expectLeadingIcon(undo, "undo-2", "Undo paid");
    expectLeadingIcon(mark, "check", "Mark as paid");
    expectIconsOnlyInButtons(table);

    await user.click(mark);
    expect(mark).toHaveTextContent(/^Saving…$/);
    expectNoIcon(mark);

    lessons[1] = paidLesson(lessons[1] as (typeof lessons)[number]);
    reply.resolve({ status: 200, body: lessons[1] });
    const undone = await screen.findByRole("button", {
      name: "Undo paid: Adam Lee, Nov 10, 2026",
    });
    await waitFor(() => expect(undone).toBeEnabled());
    expectLeadingIcon(undone, "undo-2", "Undo paid");
  });

  it("AC-1a Mark as paid on /pending shows the check icon", async () => {
    fakeApi(paymentRoutes([lesson(2, ADAM, "2026-10-10", 45, 4500)]));
    renderApp("/pending");
    const table = await screen.findByRole("table");
    expectLeadingIcon(
      within(table).getByRole("button", { name: "Mark as paid: Adam Lee, Oct 10, 2026" }),
      "check",
      "Mark as paid",
    );
    expectIconsOnlyInButtons(table);
  });

  it("AC-1a,c Home's quick actions and Mark as paid show their icons with unchanged names", async () => {
    await openHome();
    expectLeadingIcon(
      screen.getByRole("link", { name: "Record lesson on the Lessons page" }),
      "calendar-plus",
      "Record lesson",
    );
    expectLeadingIcon(
      screen.getByRole("link", { name: "Add student on the Students page" }),
      "user-plus",
      "Add student",
    );
    const marks = await screen.findAllByRole("button", { name: /^Mark as paid: / });
    for (const mark of marks) expectLeadingIcon(mark, "check", "Mark as paid");
    for (const table of screen.getAllByRole("table")) expectIconsOnlyInButtons(table);
    for (const link of screen.getAllByRole("link", { name: /^View all/ })) expectNoIcon(link);
  });

  it("AC-1a,c,d Add student shows its icon, none while Adding…, and again after", async () => {
    const user = userEvent.setup();
    const reply = deferred<{ status: number; body?: unknown }>();
    fakeApi({ ...ledgerRoutes([]), [ADD_STUDENT]: { pending: reply.promise } });
    renderApp("/students");
    const submit = await screen.findByRole("button", { name: "Add student" });
    expectLeadingIcon(submit, "user-plus", "Add student");

    await user.type(screen.getByRole("textbox", { name: "Name" }), "Zoe Park");
    await user.click(submit);
    expect(submit).toHaveTextContent(/^Adding…$/);
    expectNoIcon(submit);

    reply.resolve({ status: 201, body: ZOE });
    await waitFor(() => expect(submit).toHaveTextContent(/^Add student$/));
    expectLeadingIcon(submit, "user-plus", "Add student");
  });

  it("AC-1a,b Record lesson shows its icon; the form's fields show none", async () => {
    fakeApi(ledgerRoutes([ZOE]));
    renderApp("/lessons");
    const submit = await screen.findByRole("button", { name: "Record lesson" });
    expectLeadingIcon(submit, "calendar-plus", "Record lesson");
    const form = submit.closest("form") as HTMLFormElement;
    expect(svgsIn(form)).toHaveLength(1);
  });
});
