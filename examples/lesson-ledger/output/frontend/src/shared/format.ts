/** Display formats of the F02 spec (Behavior: Display formats), en-US. */

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const LESSON_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** US dollars with two decimals and thousands separators, from integer cents. */
export function formatCents(cents: number): string {
  return USD.format(cents / 100);
}

/** "Nov 3, 2026" for "2026-11-03". The date has no time zone: it is formatted in UTC so no
 * conversion can move it to another day. */
export function formatLessonDate(iso: string): string {
  const [year = 0, month = 1, day = 1] = iso.split("-").map(Number);
  return LESSON_DATE.format(new Date(Date.UTC(year, month - 1, day)));
}

/** The browser's local calendar date as YYYY-MM-DD. */
export function localToday(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** A student's initials (F06): the first character of the first word and of the last word of
 * the trimmed name, uppercased; one character for a one-word name. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = [...(words[0] ?? "")][0] ?? "";
  const last = words.length > 1 ? ([...(words.at(-1) ?? "")][0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}
