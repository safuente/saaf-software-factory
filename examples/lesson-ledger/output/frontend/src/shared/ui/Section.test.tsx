import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Section } from "./Section";

describe("F05 Section", () => {
  it("F05 AC-2c renders a region named by its h2", () => {
    render(
      <Section headingId="your-students-heading" heading="Your students">
        <p>Ana</p>
      </Section>,
    );
    const region = screen.getByRole("region", { name: "Your students" });
    expect(region.tagName).toBe("SECTION");
    expect(screen.getByRole("heading", { level: 2, name: "Your students" })).toHaveAttribute(
      "id",
      "your-students-heading",
    );
    expect(region).toHaveTextContent("Ana");
  });
});
