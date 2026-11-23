import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SelectField } from "./SelectField";

const OPTIONS = [
  { value: "1", label: "Ana" },
  { value: "2", label: "Ben" },
];

describe("AC-3 SelectField", () => {
  it("AC-3 offers a placeholder first, then the options, and reports the choice", async () => {
    const onChange = vi.fn();
    render(
      <SelectField
        id="student"
        label="Student"
        placeholder="Choose a student"
        options={OPTIONS}
        value=""
        onChange={onChange}
      />,
    );
    const select = screen.getByLabelText("Student");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Choose a student",
      "Ana",
      "Ben",
    ]);
    await userEvent.selectOptions(select, "2");
    expect(onChange).toHaveBeenCalledWith("2");
  });

  it("AC-3 marks an invalid select and associates its error", () => {
    render(
      <SelectField
        id="student"
        label="Student"
        placeholder="Choose a student"
        options={OPTIONS}
        value=""
        onChange={() => {}}
        error="Choose a student."
      />,
    );
    const select = screen.getByLabelText("Student");
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAccessibleDescription("Choose a student.");
  });
});
