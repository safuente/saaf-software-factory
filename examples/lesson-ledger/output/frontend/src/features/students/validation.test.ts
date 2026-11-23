import { describe, expect, it } from "vitest";
import { nameError, nameMessageForServerError, NAME_MESSAGES } from "./validation";

describe("AC-1 student name rule", () => {
  it.each([
    ["Zoe Park", undefined],
    [" Zoe   Park ", undefined],
    ["x".repeat(100), undefined],
    ["😀".repeat(100), undefined],
    [" A ", undefined],
    ["", NAME_MESSAGES.required],
    [" \t ", NAME_MESSAGES.required],
    ["x".repeat(101), NAME_MESSAGES.tooLong],
    [` ${"x".repeat(100)} `, undefined],
    ["Zoe\tPark", NAME_MESSAGES.control],
    ["Zoe\nPark", NAME_MESSAGES.control],
    ["Zoe\u0000Park", NAME_MESSAGES.control],
  ])("%j gives %s", (name, message) => {
    expect(nameError(name)).toBe(message);
  });

  it("maps the server's 422 types to the client messages", () => {
    expect(nameMessageForServerError("name_too_long")).toBe(NAME_MESSAGES.tooLong);
    expect(nameMessageForServerError("name_control_characters")).toBe(NAME_MESSAGES.control);
    expect(nameMessageForServerError("name_required")).toBe(NAME_MESSAGES.required);
    expect(nameMessageForServerError("missing")).toBe(NAME_MESSAGES.required);
  });
});
