/** Lesson form rules of the F02 spec (Behavior: Lesson fields, Form inputs), matching the
 * backend's bounds. */
import type { Errors } from "../../shared/ui/useFormErrors";
import type { RecordLessonRequest } from "./api";

export interface LessonFormValues {
  studentId: string;
  date: string;
  duration: string;
  price: string;
}

export type LessonField = "student" | "date" | "duration" | "price";

export const LESSON_MESSAGES = {
  student: "Choose a student.",
  date: "Enter the lesson date.",
  dateRange: "Enter a date between Jan 1, 2000 and Dec 31, 2099.",
  duration: "Enter the duration in whole minutes, from 1 to 600.",
  price: "Enter a price in dollars, like 45 or 45.50.",
  priceMax: "Price must be $10,000.00 or less.",
};

const DATE_MIN = "2000-01-01";
const DATE_MAX = "2099-12-31";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const WHOLE_NUMBER = /^\d+$/;
const PRICE = /^(\d+)(?:\.(\d{1,2}))?$/;
const DURATION_MAX = 600;
const PRICE_MAX_CENTS = 1_000_000;

/** Exact dollars-to-cents conversion of "45", "45.5" or "45.50", without floating point;
 * undefined when the text is not such a price. Prices too large to be exact still compare as
 * above the maximum. */
export function priceToCents(raw: string): number | undefined {
  const match = PRICE.exec(raw.trim());
  if (!match) return undefined;
  const [, dollars = "", fraction = ""] = match;
  return Number(dollars) * 100 + Number(fraction.padEnd(2, "0"));
}

function durationMinutes(raw: string): number | undefined {
  const text = raw.trim();
  if (!WHOLE_NUMBER.test(text)) return undefined;
  const minutes = Number(text);
  return minutes >= 1 && minutes <= DURATION_MAX ? minutes : undefined;
}

/** Field errors of the lesson form; empty when the values can be sent. A date input gives ""
 * or YYYY-MM-DD, so string comparison checks the range. */
export function lessonErrors(values: LessonFormValues): Errors<LessonField> {
  const errors: Errors<LessonField> = {};
  if (!values.studentId) errors.student = LESSON_MESSAGES.student;
  if (!values.date) errors.date = LESSON_MESSAGES.date;
  else if (!ISO_DATE.test(values.date) || values.date < DATE_MIN || values.date > DATE_MAX) {
    errors.date = LESSON_MESSAGES.dateRange;
  }
  if (durationMinutes(values.duration) === undefined) errors.duration = LESSON_MESSAGES.duration;
  const cents = priceToCents(values.price);
  if (cents === undefined) errors.price = LESSON_MESSAGES.price;
  else if (cents > PRICE_MAX_CENTS) errors.price = LESSON_MESSAGES.priceMax;
  return errors;
}

/** The request for values without errors. */
export function toRequest(values: LessonFormValues): RecordLessonRequest {
  return {
    student_id: Number(values.studentId),
    date: values.date,
    duration_minutes: Number(values.duration.trim()),
    price: { amount: priceToCents(values.price) ?? 0, currency: "USD" },
  };
}

const SERVER_FIELDS: Record<string, LessonField> = {
  student_id: "student",
  date: "date",
  duration_minutes: "duration",
  price: "price",
};

const SERVER_MESSAGES: Record<LessonField, string> = {
  student: LESSON_MESSAGES.student,
  date: LESSON_MESSAGES.dateRange,
  duration: LESSON_MESSAGES.duration,
  price: LESSON_MESSAGES.price,
};

/** Client messages for the fields a 422 names, e.g. "price.amount" -> price. */
export function serverLessonErrors(fields: Iterable<string>): Errors<LessonField> {
  const errors: Errors<LessonField> = {};
  for (const path of fields) {
    const field = SERVER_FIELDS[path.split(".")[0] ?? ""];
    if (field) errors[field] = SERVER_MESSAGES[field];
  }
  return errors;
}
