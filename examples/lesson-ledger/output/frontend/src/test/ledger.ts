/** In-memory fake of the students and lessons endpoints, behind the fetch fake of ./api. */
import { session } from "./api";

export const CURRENT = "GET /api/sessions/current";
export const LIST_STUDENTS = "GET /api/students?page=1&page_size=500";
export const ADD_STUDENT = "POST /api/students";
export const LIST_LESSONS = "GET /api/lessons?page=1&page_size=500";
export const RECORD_LESSON = "POST /api/lessons";

export interface FakeStudent {
  id: number;
  name: string;
  created_at: string;
}

export interface FakeLesson {
  id: number;
  student: { id: number; name: string };
  date: string;
  duration_minutes: number;
  price: { amount: number; currency: "USD" };
  paid: boolean;
  created_at: string;
}

const CREATED = "2026-11-17T10:00:00Z";

export function student(id: number, name: string): FakeStudent {
  return { id, name, created_at: CREATED };
}

export function lesson(
  id: number,
  who: FakeStudent,
  date: string,
  duration = 45,
  amount = 4250,
): FakeLesson {
  return {
    id,
    student: { id: who.id, name: who.name },
    date,
    duration_minutes: duration,
    price: { amount, currency: "USD" },
    paid: false,
    created_at: CREATED,
  };
}

export const page = <T>(items: T[], total = items.length) => ({
  status: 200,
  body: { items, total, page: 1, page_size: 500 },
});

/** Routes for a logged-in alice whose students and lessons live in the given arrays: POSTs
 * append (with the server's ordering on the next GET). */
export function ledgerRoutes(students: FakeStudent[], lessons: FakeLesson[] = []) {
  let nextId = 1000;
  const sortedStudents = () =>
    [...students].sort(
      (a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()) || a.id - b.id,
    );
  const sortedLessons = () =>
    [...lessons].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  return {
    [CURRENT]: { status: 200, body: session("alice@example.com") },
    [LIST_STUDENTS]: () => page(sortedStudents()),
    [LIST_LESSONS]: () => page(sortedLessons()),
    [ADD_STUDENT]: (request: { body: unknown }) => {
      const { name } = request.body as { name: string };
      const added = student(nextId++, name.trim());
      students.push(added);
      return { status: 201, body: added };
    },
    [RECORD_LESSON]: (request: { body: unknown }) => {
      const body = request.body as {
        student_id: number;
        date: string;
        duration_minutes: number;
        price: { amount: number };
      };
      const who = students.find((s) => s.id === body.student_id);
      if (!who) {
        return {
          status: 404,
          body: { error: { code: "not_found", message: "Not found", details: {} } },
        };
      }
      const added = lesson(nextId++, who, body.date, body.duration_minutes, body.price.amount);
      lessons.push(added);
      return { status: 201, body: added };
    },
  };
}

export const validationError = (field: string[], type: string) => ({
  status: 422,
  body: {
    error: {
      code: "validation_error",
      message: "Request validation failed",
      details: { errors: [{ loc: ["body", ...field], msg: "invalid", type }] },
    },
  },
});

export const PENDING_PATH = "/api/pending-lessons?page=1&page_size=500";
export const summaryPath = (month: string) => `/api/monthly-summaries/${month}`;
export const monthLessonsPath = (month: string) =>
  `/api/lessons?month=${month}&page=1&page_size=500`;

const notFound = {
  status: 404,
  body: { error: { code: "not_found", message: "Not found", details: {} } },
};

const usd = (amount: number) => ({ amount, currency: "USD" as const });

/** F03: summaries, the month filter, the pending list and PATCH /api/lessons/{id} over the
 * given lessons, answered by the "*" route. PATCH changes the lesson in place, as the server
 * would, so later loads see it. */
export function paymentRoutes(lessons: FakeLesson[]) {
  const newestFirst = (a: FakeLesson, b: FakeLesson) => b.date.localeCompare(a.date) || b.id - a.id;
  const oldestFirst = (a: FakeLesson, b: FakeLesson) => a.date.localeCompare(b.date) || a.id - b.id;
  const sum = (items: FakeLesson[]) => items.reduce((total, l) => total + l.price.amount, 0);
  return {
    [CURRENT]: { status: 200, body: session("alice@example.com") },
    "*": (request: { method: string; path: string; body: unknown }) => {
      const summary = /^\/api\/monthly-summaries\/(\d{4}-\d{2})$/.exec(request.path);
      if (request.method === "GET" && summary) {
        const month = summary[1] ?? "";
        const inMonth = lessons.filter((l) => l.date.startsWith(month));
        return {
          status: 200,
          body: {
            month,
            lesson_count: inMonth.length,
            collected: usd(sum(inMonth.filter((l) => l.paid))),
            pending: usd(sum(inMonth.filter((l) => !l.paid))),
          },
        };
      }
      const monthList = /^\/api\/lessons\?month=(\d{4}-\d{2})&page=1&page_size=500$/.exec(
        request.path,
      );
      if (request.method === "GET" && monthList) {
        const month = monthList[1] ?? "";
        const inMonth = lessons.filter((l) => l.date.startsWith(month)).sort(newestFirst);
        return page(inMonth.slice(0, 500), inMonth.length);
      }
      if (request.method === "GET" && request.path === PENDING_PATH) {
        const unpaid = lessons.filter((l) => !l.paid).sort(oldestFirst);
        return {
          status: 200,
          body: {
            ...page(unpaid.slice(0, 500), unpaid.length).body,
            amount_pending: usd(sum(unpaid)),
          },
        };
      }
      const patch = /^\/api\/lessons\/(\d+)$/.exec(request.path);
      if (request.method === "PATCH" && patch) {
        const found = lessons.find((l) => l.id === Number(patch[1]));
        if (!found) return notFound;
        found.paid = (request.body as { paid: boolean }).paid;
        return { status: 200, body: { ...found } };
      }
      throw new Error(`Unexpected request ${request.method} ${request.path}`);
    },
  };
}

export const paidLesson = (l: FakeLesson): FakeLesson => ({ ...l, paid: true });

const pagedPath = (resource: string) => new RegExp(`^/api/${resource}\\?page=1&page_size=(\\d+)$`);

/** F07 Home: the paged reads of Home (any `page_size`) over the given students and lessons,
 * plus every route of `paymentRoutes` (summaries, PATCH). Lessons are changed in place by
 * PATCH, so later loads see the change, as the server would. */
export function homeRoutes(
  students: FakeStudent[],
  lessons: FakeLesson[],
  email = "alice@example.com",
) {
  const payments = paymentRoutes(lessons);
  const newestFirst = (a: FakeLesson, b: FakeLesson) => b.date.localeCompare(a.date) || b.id - a.id;
  const oldestFirst = (a: FakeLesson, b: FakeLesson) => a.date.localeCompare(b.date) || a.id - b.id;
  const sized = <T>(items: T[], size: number) => ({
    status: 200,
    body: { items: items.slice(0, size), total: items.length, page: 1, page_size: size },
  });
  return {
    [CURRENT]: { status: 200, body: session(email) },
    "*": (request: { method: string; path: string; body: unknown }) => {
      if (request.method === "GET") {
        const studentsPage = pagedPath("students").exec(request.path);
        if (studentsPage) return sized(students, Number(studentsPage[1]));
        const lessonsPage = pagedPath("lessons").exec(request.path);
        if (lessonsPage) return sized([...lessons].sort(newestFirst), Number(lessonsPage[1]));
        const pendingPage = pagedPath("pending-lessons").exec(request.path);
        if (pendingPage) {
          const unpaid = lessons.filter((l) => !l.paid).sort(oldestFirst);
          const response = sized(unpaid, Number(pendingPage[1]));
          const amount = unpaid.reduce((total, l) => total + l.price.amount, 0);
          return {
            ...response,
            body: { ...response.body, amount_pending: { amount, currency: "USD" as const } },
          };
        }
      }
      return payments["*"](request);
    },
  };
}
