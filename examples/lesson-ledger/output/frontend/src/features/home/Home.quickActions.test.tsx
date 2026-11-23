import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { onNovember18, openHome } from "../../test/home";

onNovember18();

const RECORD = "Record lesson on the Lessons page";
const ADD = "Add student on the Students page";

describe("F07 AC-4 quick actions", () => {
  it("AC-4a,b,c two links whose names start with their visible text", async () => {
    await openHome();

    const record = screen.getByRole("link", { name: RECORD });
    const add = screen.getByRole("link", { name: ADD });
    expect(record).toHaveTextContent(/^Record lesson$/);
    expect(add).toHaveTextContent(/^Add student$/);
    expect(record).toHaveAttribute("href", "/lessons");
    expect(add).toHaveAttribute("href", "/students");
    expect(screen.queryByRole("button", { name: /Record lesson|Add student/ })).toBeNull();
  });

  it("AC-4a Record lesson is the primary style (black fill, white text); Add student is outlined", async () => {
    await openHome();

    const record = screen.getByRole("link", { name: RECORD }).className.split(/\s+/);
    const add = screen.getByRole("link", { name: ADD }).className.split(/\s+/);
    expect(record).toEqual(expect.arrayContaining(["bg-black", "text-canvas", "no-underline"]));
    expect(add).toEqual(
      expect.arrayContaining(["bg-canvas", "border-outline", "text-graphite", "no-underline"]),
    );
  });

  it("AC-4a the links sit in the title row, after the h1 and before the overview", async () => {
    await openHome();

    const h1 = screen.getByRole("heading", { level: 1 });
    const record = screen.getByRole("link", { name: RECORD });
    const month = await screen.findByRole("heading", { level: 2, name: "November 2026" });
    expect(h1.compareDocumentPosition(record) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(record.compareDocumentPosition(month) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it.each([
    [RECORD, "/lessons", "Lessons"],
    [ADD, "/students", "Students"],
  ])("AC-4d %s goes to %s inside the app", async (name, path, heading) => {
    const user = userEvent.setup();
    await openHome();

    await user.click(screen.getByRole("link", { name }));

    expect(screen.getByTestId("location")).toHaveTextContent(path);
    expect(await screen.findByRole("heading", { level: 1, name: heading })).toBeVisible();
  });
});
