import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StudentName } from "./StudentName";

describe("F06 AC-3b StudentName", () => {
  it("AC-3b shows the initials circle before the name; the text and accessible name stay the name", () => {
    const { container } = render(
      <ul>
        <li>
          <StudentName name="Zoe Park" />
        </li>
      </ul>,
    );
    const item = screen.getByRole("listitem");
    expect(item.textContent).toBe("Zoe Park");
    const name = container.querySelector("[data-initials]");
    expect(name).toHaveAttribute("data-initials", "ZP");
    expect(name?.className.split(/\s+/)).toContain("initials");
    // No element carries the initials as text, so assistive technology never reads them.
    expect(screen.queryByText("ZP")).toBeNull();
  });
});
