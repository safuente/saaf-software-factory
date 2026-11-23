import { describe, expect, it } from "vitest";
import { formatCents, formatLessonDate, initials, localToday } from "./format";

describe("AC-2 display formats", () => {
  it.each([
    [4250, "$42.50"],
    [125000, "$1,250.00"],
    [0, "$0.00"],
    [5, "$0.05"],
    [1_000_000, "$10,000.00"],
  ])("formats %i cents as %s", (cents, text) => {
    expect(formatCents(cents)).toBe(text);
  });

  it.each([
    ["2026-11-03", "Nov 3, 2026"],
    ["2026-01-01", "Jan 1, 2026"],
    ["2099-12-31", "Dec 31, 2099"],
    ["2000-02-29", "Feb 29, 2000"],
  ])("formats %s as %s without time zone conversion", (iso, text) => {
    expect(formatLessonDate(iso)).toBe(text);
  });

  it("gives the local calendar date as YYYY-MM-DD", () => {
    expect(localToday(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
    expect(localToday(new Date(2026, 10, 17, 0, 1))).toBe("2026-11-17");
  });
});

describe("F06 AC-3b initials", () => {
  it.each([
    ["Zoe Park", "ZP"],
    ["adam Lee", "AL"],
    ["  Cher  ", "C"],
    ["Mary Ann Smith", "MS"],
    ["chloé dubois", "CD"],
    ["Émile  Zola", "ÉZ"],
  ])("%j gives %s", (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});
