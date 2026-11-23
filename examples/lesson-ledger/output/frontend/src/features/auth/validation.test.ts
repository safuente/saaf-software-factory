import { describe, expect, it } from "vitest";
import { isValidEmail, isValidSignupPassword } from "./validation";

describe("AC-1 email rule (spec Behavior: Email rules)", () => {
  it.each([
    "a@b.c",
    "first.last+tag@sub.example.org",
    "  padded@example.com\t",
    `${"a".repeat(64)}@${"b".repeat(180)}.com`,
  ])("accepts %j", (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each([
    "",
    "   ",
    "carol@",
    "@example.com",
    "no-at-sign.example.com",
    "two@@example.com",
    "a@b@example.com",
    "a b@example.com",
    "a@example",
    "a@.example",
    "a@example.",
    `${"a".repeat(64)}@${"b".repeat(186)}.com`,
  ])("rejects %j", (email) => {
    expect(isValidEmail(email)).toBe(false);
  });
});

describe("AC-1 password rule (spec Behavior: Password rules)", () => {
  it.each(["x".repeat(12), "x".repeat(128), " ".repeat(12), "😀".repeat(12)])(
    "accepts %j",
    (password) => {
      expect(isValidSignupPassword(password)).toBe(true);
    },
  );

  it.each(["", "x".repeat(11), "😀".repeat(11), "x".repeat(129)])("rejects %j", (password) => {
    expect(isValidSignupPassword(password)).toBe(false);
  });
});
