import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TextField } from "./TextField";

describe("AC-3 TextField", () => {
  it("AC-3 labels the input and describes it with its hint", () => {
    render(
      <TextField
        id="email"
        label="Email"
        type="email"
        hint="Example: name@example.com"
        value=""
        onChange={() => {}}
      />,
    );
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAccessibleDescription("Example: name@example.com");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("AC-3 marks an invalid input and associates the error after the hint", () => {
    render(
      <TextField
        id="email"
        label="Email"
        type="email"
        hint="Example: name@example.com"
        error="Enter your email."
        value=""
        onChange={() => {}}
      />,
    );
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Example: name@example.com Enter your email.");
  });

  it("AC-3 reports each change", async () => {
    const onChange = vi.fn();
    render(<TextField id="name" label="Name" type="text" value="" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText("Name"), "A");
    expect(onChange).toHaveBeenCalledWith("A");
  });
});
