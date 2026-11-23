/** Calendar months `YYYY-MM` of the summary page (F03 Behavior: Month selection). */

export const FIRST_MONTH = "2000-01";
export const LAST_MONTH = "2099-12";

const MONTH = /^20\d{2}-(0[1-9]|1[0-2])$/;

const MONTH_NAME = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** A `YYYY-MM` value within 2000-01 to 2099-12. */
export function isMonth(value: string | null): value is string {
  return value !== null && MONTH.test(value);
}

/** The browser's local current month. */
export function currentMonth(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** The month `delta` months after `month`. */
export function shiftMonth(month: string, delta: number): string {
  const [year = 0, number = 1] = month.split("-").map(Number);
  const index = year * 12 + number - 1 + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** "November 2026" for "2026-11". */
export function formatMonth(month: string): string {
  const [year = 0, number = 1] = month.split("-").map(Number);
  return MONTH_NAME.format(new Date(Date.UTC(year, number - 1, 1)));
}
