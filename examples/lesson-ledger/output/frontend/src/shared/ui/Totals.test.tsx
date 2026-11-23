import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Totals } from "./Totals";

describe("F05 Totals", () => {
  it("F05 AC-3c renders a description list of term and figure, one group per total", () => {
    const { container } = render(
      <Totals
        items={[
          { term: "Lessons:", value: 3 },
          { term: "Collected:", value: "$42.50" },
        ]}
      />,
    );
    const groups = [...container.querySelectorAll("dl > div")];
    expect(groups.map((g) => g.textContent)).toEqual(["Lessons: 3", "Collected: $42.50"]);
    expect(screen.getAllByRole("term").map((t) => t.textContent)).toEqual([
      "Lessons:",
      "Collected:",
    ]);
    expect(screen.getAllByRole("definition").map((d) => d.textContent)).toEqual(["3", "$42.50"]);
  });
});
