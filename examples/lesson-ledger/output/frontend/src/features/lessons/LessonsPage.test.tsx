import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deferred, fakeApi, notAuthenticated } from "../../test/api";
import {
  LIST_LESSONS,
  LIST_STUDENTS,
  RECORD_LESSON,
  lesson,
  ledgerRoutes,
  page,
  student,
  validationError,
  type FakeLesson,
  type FakeStudent,
} from "../../test/ledger";
import { renderApp } from "../../test/renderApp";

const ZOE = student(12, "Zoe Park");
const ADAM = student(13, "adam Lee");

async function openLessons(
  students: FakeStudent[] = [ZOE],
  lessons: FakeLesson[] = [],
  routes = {},
) {
  const api = fakeApi({ ...ledgerRoutes(students, lessons), ...routes });
  const view = renderApp("/lessons");
  await screen.findByRole("heading", { level: 1, name: "Lessons" });
  return { api, view };
}

const field = {
  student: () => screen.getByRole("combobox", { name: "Student" }),
  date: () => screen.getByLabelText("Date") as HTMLInputElement,
  duration: () => screen.getByRole("textbox", { name: "Duration (minutes)" }),
  price: () => screen.getByRole("textbox", { name: "Price (USD)" }),
  submit: () => screen.getByRole("button", { name: /^(Record lesson|Recording…)$/ }),
};

function rows(): string[][] {
  const table = screen.getByRole("table", { name: "Your lessons, newest first" });
  return within(table)
    .getAllByRole("row")
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole("cell")
        .map((cell) => cell.textContent ?? ""),
    );
}

async function fillLesson(
  user: ReturnType<typeof userEvent.setup>,
  values: { student?: string; date?: string; duration?: string; price?: string },
) {
  if (values.student !== undefined) await user.selectOptions(field.student(), values.student);
  if (values.date !== undefined) fireEvent.change(field.date(), { target: { value: values.date } });
  if (values.duration !== undefined) {
    await user.clear(field.duration());
    if (values.duration) await user.type(field.duration(), values.duration);
  }
  if (values.price !== undefined) {
    await user.clear(field.price());
    if (values.price) await user.type(field.price(), values.price);
  }
}

describe("AC-2 lessons page", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 17, 23, 30));
  });
  afterEach(() => vi.useRealTimers());

  it("shows the heading, title, form and the table headers", async () => {
    await openLessons([ZOE], [lesson(1, ZOE, "2026-11-03")]);
    await screen.findByRole("table");

    expect(document.title).toBe("Lessons · Lesson Ledger");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2, name: "Record a lesson" })).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: "Your lessons" })).toBeVisible();
    const headers = within(screen.getByRole("table")).getAllByRole("columnheader");
    expect(headers.map((h) => h.textContent)).toEqual([
      "Student",
      "Date",
      "Duration",
      "Price",
      "Status",
    ]);
    expect(field.submit()).toHaveTextContent("Record lesson");
  });

  it("wraps the table in a focusable, named scroll region so narrow screens scroll the table, not the page (UI-1)", async () => {
    await openLessons([ZOE], [lesson(1, ZOE, "2026-11-03")]);
    const table = await screen.findByRole("table");

    const region = screen.getByRole("region", { name: "Your lessons, newest first" });
    expect(region).toContainElement(table);
    expect(region).toHaveAttribute("tabindex", "0");
  });

  it("defaults the date to the browser's local today and lists students in order", async () => {
    await openLessons([ZOE, ADAM]);
    await screen.findByRole("combobox", { name: "Student" });

    expect(field.date()).toHaveValue("2026-11-17");
    expect(field.date()).toHaveAttribute("type", "date");
    expect(field.duration()).toHaveAttribute("inputmode", "numeric");
    const options = within(field.student()).getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["Choose a student", "adam Lee", "Zoe Park"]);
    expect(field.student()).toHaveValue("");
  });

  it("records a lesson, announces it and shows the new row without a reload", async () => {
    const user = userEvent.setup();
    const { api } = await openLessons([ZOE]);
    await screen.findByText("No lessons recorded yet.");

    await fillLesson(user, {
      student: "Zoe Park",
      date: "2026-11-03",
      duration: "45",
      price: "42.5",
    });
    await user.click(field.submit());

    expect(await screen.findByText("Lesson recorded.")).toHaveAttribute("role", "status");
    await waitFor(() =>
      expect(rows()).toEqual([["Zoe Park", "Nov 3, 2026", "45 min", "$42.50", "Unpaid"]]),
    );
    expect(api.calls(RECORD_LESSON).map((r) => r.body)).toEqual([
      {
        student_id: 12,
        date: "2026-11-03",
        duration_minutes: 45,
        price: { amount: 4250, currency: "USD" },
      },
    ]);
    const time = screen.getByText("Nov 3, 2026");
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("datetime", "2026-11-03");
    expect(field.student()).toHaveValue("");
    expect(field.student()).toHaveFocus();
    expect(field.date()).toHaveValue("2026-11-03");
    expect(field.duration()).toHaveValue("");
    expect(field.price()).toHaveValue("");
    expect(screen.queryByText("No lessons recorded yet.")).toBeNull();
  });

  it("accepts the next lesson while the table is still reloading", async () => {
    const user = userEvent.setup();
    const { api } = await openLessons([ZOE]);
    await screen.findByText("No lessons recorded yet.");
    const reload = deferred<{ status: number; body?: unknown }>();
    api.route(LIST_LESSONS, { pending: reload.promise });

    await fillLesson(user, { student: "Zoe Park", duration: "45", price: "45" });
    await user.click(field.submit());
    await screen.findByText("Lesson recorded.");
    expect(field.submit()).toHaveTextContent("Record lesson");
    await fillLesson(user, { student: "Zoe Park", duration: "30", price: "30" });
    await user.click(field.submit());

    await waitFor(() => expect(api.calls(RECORD_LESSON)).toHaveLength(2));
    reload.resolve(page([lesson(1, ZOE, "2026-11-17")]));
    await waitFor(() => expect(rows()).toHaveLength(1));
  });

  it("lists lessons newest first with formatted prices", async () => {
    await openLessons(
      [ZOE],
      [
        lesson(1, ZOE, "2026-11-03", 45, 125000),
        lesson(2, ZOE, "2026-10-28", 30, 0),
        lesson(3, ZOE, "2026-11-10", 60, 4250),
      ],
    );
    await screen.findByRole("table");

    expect(rows()).toEqual([
      ["Zoe Park", "Nov 10, 2026", "60 min", "$42.50", "Unpaid"],
      ["Zoe Park", "Nov 3, 2026", "45 min", "$1,250.00", "Unpaid"],
      ["Zoe Park", "Oct 28, 2026", "30 min", "$0.00", "Unpaid"],
    ]);
  });

  it("shows No lessons recorded yet. for a teacher with students but no lessons", async () => {
    await openLessons([ZOE], []);

    expect(await screen.findByText("No lessons recorded yet.")).toBeVisible();
    expect(screen.queryByRole("table")).toBeNull();
    expect(field.submit()).toBeVisible();
  });

  it("disables the button while recording, so a double click sends one request", async () => {
    const user = userEvent.setup();
    const reply = deferred<{ status: number; body?: unknown }>();
    const { api } = await openLessons([ZOE], [], { [RECORD_LESSON]: { pending: reply.promise } });
    await screen.findByText("No lessons recorded yet.");

    await fillLesson(user, { student: "Zoe Park", duration: "45", price: "45" });
    await user.dblClick(field.submit());

    expect(field.submit()).toBeDisabled();
    expect(field.submit()).toHaveTextContent("Recording…");
    expect(api.calls(RECORD_LESSON)).toHaveLength(1);
    reply.resolve({ status: 201, body: lesson(5, ZOE, "2026-11-17") });
    await waitFor(() => expect(field.submit()).toBeEnabled());
  });

  it("shows Loading… and no form until the students have loaded", async () => {
    const reply = deferred<{ status: number; body?: unknown }>();
    await openLessons([], [], { [LIST_STUDENTS]: { pending: reply.promise } });

    expect(screen.getAllByText("Loading…")[0]).toHaveAttribute("role", "status");
    expect(screen.queryByRole("combobox", { name: "Student" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Record lesson" })).toBeNull();
    reply.resolve(page([ZOE]));
    expect(await screen.findByRole("combobox", { name: "Student" })).toBeVisible();
  });

  it.each([LIST_LESSONS, LIST_STUDENTS] as const)(
    "offers Try again when %s fails",
    async (route) => {
      const user = userEvent.setup();
      const { api } = await openLessons([ZOE], [lesson(1, ZOE, "2026-11-03")], {
        [route]: { network: true },
      });

      expect(await screen.findByText("We couldn't reach Lesson Ledger.")).toBeVisible();
      api.route(route, ledgerRoutes([ZOE], [lesson(1, ZOE, "2026-11-03")])[route]);
      await user.click(screen.getByRole("button", { name: "Try again" }));

      await waitFor(() =>
        expect(screen.queryByText("We couldn't reach Lesson Ledger.")).toBeNull(),
      );
      expect(await screen.findByRole("table")).toBeVisible();
      expect(field.student()).toBeVisible();
    },
  );

  it("ends the table with a truncation message when total exceeds the items", async () => {
    const many = Array.from({ length: 500 }, (_, i) => lesson(i + 1, ZOE, "2026-11-03"));
    await openLessons([ZOE], [], { [LIST_LESSONS]: page(many, 512) });

    expect(await screen.findByText("Showing the 500 most recent of 512 lessons.")).toBeVisible();
  });

  it("marks Lessons as the current page in the Main navigation", async () => {
    await openLessons();

    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "Lessons" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(nav).getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
  });

  it("goes to /login when a list answers 401", async () => {
    const { api } = await openLessons([ZOE], [], { [LIST_LESSONS]: notAuthenticated });
    api.route("GET /api/sessions/current", notAuthenticated);

    expect(await screen.findByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
  });
});

const MESSAGES = {
  student: "Choose a student.",
  date: "Enter the lesson date.",
  dateRange: "Enter a date between Jan 1, 2000 and Dec 31, 2099.",
  duration: "Enter the duration in whole minutes, from 1 to 600.",
  price: "Enter a price in dollars, like 45 or 45.50.",
  priceMax: "Price must be $10,000.00 or less.",
  unreachable: "We couldn't reach Lesson Ledger. Please try again.",
  notFound: "That student could not be found. Reload the page and try again.",
};

const VALID = { student: "Zoe Park", date: "2026-11-03", duration: "45", price: "42.5" };

describe("AC-3 lesson form errors", () => {
  it.each([
    ["no student", { student: "" }, "student", MESSAGES.student],
    ["an empty date", { date: "" }, "date", MESSAGES.date],
    ["a date before 2000", { date: "1999-12-31" }, "date", MESSAGES.dateRange],
    ["a date after 2099", { date: "2100-01-01" }, "date", MESSAGES.dateRange],
    ["duration 0", { duration: "0" }, "duration", MESSAGES.duration],
    ["duration -5", { duration: "-5" }, "duration", MESSAGES.duration],
    ["duration 45.5", { duration: "45.5" }, "duration", MESSAGES.duration],
    ["duration 601", { duration: "601" }, "duration", MESSAGES.duration],
    ["an empty duration", { duration: "" }, "duration", MESSAGES.duration],
    ["price -1", { price: "-1" }, "price", MESSAGES.price],
    ["price 12.345", { price: "12.345" }, "price", MESSAGES.price],
    ["price abc", { price: "abc" }, "price", MESSAGES.price],
    ["price $45", { price: "$45" }, "price", MESSAGES.price],
    ["price 1,000", { price: "1,000" }, "price", MESSAGES.price],
    ["price 1e3", { price: "1e3" }, "price", MESSAGES.price],
    ["an empty price", { price: "" }, "price", MESSAGES.price],
    ["price 10000.01", { price: "10000.01" }, "price", MESSAGES.priceMax],
  ] as const)("rejects %s without a request", async (_, override, name, message) => {
    const user = userEvent.setup();
    const { api } = await openLessons([ZOE]);
    await screen.findByText("No lessons recorded yet.");
    const values = { ...VALID, ...override };

    if (values.student) await user.selectOptions(field.student(), values.student);
    await fillLesson(user, { date: values.date, duration: values.duration, price: values.price });
    await user.click(field.submit());

    const input = field[name]();
    const error = screen.getByText(message);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toContain(error.id);
    expect(input).toHaveFocus();
    expect(api.calls(RECORD_LESSON)).toHaveLength(0);

    if (name === "student") await user.selectOptions(input, "Zoe Park");
    else if (name === "date") fireEvent.change(input, { target: { value: "2026-11-04" } });
    else await user.type(input, "1");
    expect(screen.queryByText(message)).toBeNull();
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("accepts the bounds and trims whitespace", async () => {
    const user = userEvent.setup();
    const { api } = await openLessons([ZOE]);
    await screen.findByText("No lessons recorded yet.");

    await fillLesson(user, {
      student: "Zoe Park",
      date: "2099-12-31",
      duration: " 600 ",
      price: " 10000.00 ",
    });
    await user.click(field.submit());

    await waitFor(() => expect(api.calls(RECORD_LESSON)).toHaveLength(1));
    expect(api.calls(RECORD_LESSON)[0]?.body).toMatchObject({
      date: "2099-12-31",
      duration_minutes: 600,
      price: { amount: 1_000_000, currency: "USD" },
    });
  });

  it("shows every invalid field, focuses the first, and keeps other errors on change", async () => {
    const user = userEvent.setup();
    await openLessons([ZOE]);
    await screen.findByText("No lessons recorded yet.");

    await fillLesson(user, { duration: "0", price: "abc" });
    await user.click(field.submit());

    expect(field.student()).toHaveFocus();
    expect(screen.getByText(MESSAGES.student)).toBeVisible();
    expect(screen.getByText(MESSAGES.duration)).toBeVisible();
    expect(screen.getByText(MESSAGES.price)).toBeVisible();

    await user.type(field.duration(), "5");
    expect(screen.queryByText(MESSAGES.duration)).toBeNull();
    expect(screen.getByText(MESSAGES.student)).toBeVisible();
    expect(screen.getByText(MESSAGES.price)).toBeVisible();
  });

  it.each([
    [["duration_minutes"], "duration", MESSAGES.duration],
    [["price", "amount"], "price", MESSAGES.price],
    [["price", "currency"], "price", MESSAGES.price],
    [["date"], "date", MESSAGES.dateRange],
    [["student_id"], "student", MESSAGES.student],
  ] as const)("shows the server's 422 on %j as the field's message", async (loc, name, message) => {
    const user = userEvent.setup();
    await openLessons([ZOE], [], { [RECORD_LESSON]: validationError([...loc], "invalid") });
    await screen.findByText("No lessons recorded yet.");

    await fillLesson(user, VALID);
    await user.click(field.submit());

    expect(await screen.findByText(message)).toBeVisible();
    expect(field[name]()).toHaveAttribute("aria-invalid", "true");
    expect(field[name]()).toHaveFocus();
  });

  it.each([
    ["a network error", { network: true } as const, MESSAGES.unreachable],
    ["a 5xx", { status: 502 }, MESSAGES.unreachable],
    [
      "a 404 (student no longer visible)",
      { status: 404, body: { error: { code: "not_found", message: "Not found", details: {} } } },
      MESSAGES.notFound,
    ],
  ])("keeps every value and focuses Record lesson on %s", async (_, reply, message) => {
    const user = userEvent.setup();
    await openLessons([ZOE], [], { [RECORD_LESSON]: reply });
    await screen.findByText("No lessons recorded yet.");

    await fillLesson(user, VALID);
    await user.click(field.submit());

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    await waitFor(() => expect(field.submit()).toHaveFocus());
    expect(document.activeElement).not.toBe(document.body);
    expect(field.student()).toHaveValue("12");
    expect(field.date()).toHaveValue("2026-11-03");
    expect(field.duration()).toHaveValue("45");
    expect(field.price()).toHaveValue("42.5");
    expect(screen.queryByText("Lesson recorded.")).toBeNull();
  });

  it("clears the alert on the next successful submit", async () => {
    const user = userEvent.setup();
    const { api } = await openLessons([ZOE], [], { [RECORD_LESSON]: { status: 500 } });
    await screen.findByText("No lessons recorded yet.");
    await fillLesson(user, VALID);
    await user.click(field.submit());
    await screen.findByRole("alert");

    api.route(RECORD_LESSON, ledgerRoutes([ZOE])[RECORD_LESSON]);
    await user.click(field.submit());

    expect(await screen.findByText("Lesson recorded.")).toBeVisible();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("AC-4 lessons page without students", () => {
  it("replaces the form with a link to add a student", async () => {
    const user = userEvent.setup();
    await openLessons([], []);

    expect(await screen.findByText("Add a student before recording a lesson.")).toBeVisible();
    expect(await screen.findByText("No lessons recorded yet.")).toBeVisible();
    expect(screen.queryByRole("combobox", { name: "Student" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Record lesson" })).toBeNull();

    const link = screen.getByRole("link", { name: "Add a student" });
    expect(link).toHaveAttribute("href", "/students");
    await user.click(link);
    expect(await screen.findByRole("heading", { level: 1, name: "Students" })).toBeVisible();
  });
});
