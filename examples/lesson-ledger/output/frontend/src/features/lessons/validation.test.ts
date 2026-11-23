import { describe, expect, it } from "vitest";
import { LESSON_MESSAGES, lessonErrors, priceToCents } from "./validation";

const VALID = { studentId: "12", date: "2026-11-03", duration: "45", price: "42.50" };

describe("AC-3 lesson field rules", () => {
  it.each([
    ["0", 0],
    ["45", 4500],
    ["45.5", 4550],
    ["45.50", 4550],
    ["0.01", 1],
    [" 19.99 ", 1999],
    ["10000", 1_000_000],
    ["0010.10", 1010],
  ])("converts price %j to %i cents exactly", (raw, cents) => {
    expect(priceToCents(raw)).toBe(cents);
  });

  it.each(["", "-1", "+1", "12.345", "abc", "$45", "1,000", "1e3", "45.", ".5", "4 5"])(
    "rejects price %j",
    (raw) => {
      expect(priceToCents(raw)).toBeUndefined();
    },
  );

  it("has no errors for valid values", () => {
    expect(lessonErrors(VALID)).toEqual({});
  });

  it.each([
    [{ studentId: "" }, { student: LESSON_MESSAGES.student }],
    [{ date: "" }, { date: LESSON_MESSAGES.date }],
    [{ date: "1999-12-31" }, { date: LESSON_MESSAGES.dateRange }],
    [{ date: "2100-01-01" }, { date: LESSON_MESSAGES.dateRange }],
    [{ date: "20000-01-01" }, { date: LESSON_MESSAGES.dateRange }],
    [{ date: "2000-01-01" }, {}],
    [{ date: "2099-12-31" }, {}],
    [{ duration: "1" }, {}],
    [{ duration: "600" }, {}],
    [{ duration: "0" }, { duration: LESSON_MESSAGES.duration }],
    [{ duration: "601" }, { duration: LESSON_MESSAGES.duration }],
    [{ duration: "4.0" }, { duration: LESSON_MESSAGES.duration }],
    [{ duration: "99999999999999999999" }, { duration: LESSON_MESSAGES.duration }],
    [{ price: "10000.00" }, {}],
    [{ price: "10000.01" }, { price: LESSON_MESSAGES.priceMax }],
    [{ price: "99999999999999999999" }, { price: LESSON_MESSAGES.priceMax }],
    [{ price: "-1" }, { price: LESSON_MESSAGES.price }],
  ])("%j gives %j", (override, errors) => {
    expect(lessonErrors({ ...VALID, ...override })).toEqual(errors);
  });
});
