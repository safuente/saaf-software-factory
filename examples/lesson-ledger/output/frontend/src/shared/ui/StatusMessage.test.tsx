import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusMessage } from "./StatusMessage";

describe("AC-3 StatusMessage", () => {
  it("AC-3 is always rendered as a status region, empty until there is a message", () => {
    const { rerender } = render(<StatusMessage />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    rerender(<StatusMessage>Lesson recorded.</StatusMessage>);
    expect(screen.getByRole("status")).toHaveTextContent("Lesson recorded.");
  });
});
