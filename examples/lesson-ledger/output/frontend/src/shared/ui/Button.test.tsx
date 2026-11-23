import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("AC-3 Button", () => {
  it("AC-3 renders a native button that is not a submit button unless asked", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Try again</Button>);
    const button = screen.getByRole("button", { name: "Try again" });
    expect(button).toHaveAttribute("type", "button");
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("AC-3 a disabled submit button does not fire", async () => {
    const onClick = vi.fn();
    render(
      <Button type="submit" disabled onClick={onClick}>
        Logging in…
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Logging in…" });
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("AC-3 gives every hover cue a keyboard-focus equivalent", () => {
    render(<Button>Save</Button>);
    const classes = screen.getByRole("button").className.split(/\s+/);
    for (const hover of classes.filter((c) => c.startsWith("hover:"))) {
      expect(classes).toContain(hover.replace(/^hover:/, "focus-visible:"));
    }
  });
});

describe("F06 AC-2h Button variants", () => {
  const classesOf = () => screen.getByRole("button").className.split(/\s+/);

  it("AC-2h the secondary button is white and outlined with dark text, on one line, its hover cue on focus", () => {
    render(<Button variant="secondary">Mark as paid</Button>);
    const classes = classesOf();
    for (const name of [
      "bg-canvas",
      "border",
      "border-outline",
      "text-graphite",
      "whitespace-nowrap",
    ]) {
      expect(classes).toContain(name);
    }
    for (const hover of classes.filter((c) => c.startsWith("hover:"))) {
      expect(classes).toContain(hover.replace(/^hover:/, "focus-visible:"));
    }
  });

  it("AC-2h the primary button is the default: black fill with white text", () => {
    render(<Button>Add student</Button>);
    const classes = classesOf();
    expect(classes).toContain("bg-black");
    expect(classes).toContain("text-canvas");
  });
});
