import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Table, TableCell, TableRow } from "./Table";

describe("AC-3 Table", () => {
  it("AC-3 renders a native table with a caption and th scope=col headers in column order", () => {
    render(
      <Table
        caption="Your lessons"
        columns={[{ label: "Date" }, { label: "Student" }, { label: "Price", numeric: true }]}
      >
        <TableRow>
          <TableCell>Mar 3</TableCell>
          <TableCell>Ana</TableCell>
          <TableCell numeric>$45.00</TableCell>
        </TableRow>
      </Table>,
    );
    const table = screen.getByRole("table", { name: "Your lessons" });
    expect(table.tagName).toBe("TABLE");
    const headers = within(table).getAllByRole("columnheader");
    expect(headers.map((h) => [h.tagName, h.getAttribute("scope"), h.textContent])).toEqual([
      ["TH", "col", "Date"],
      ["TH", "col", "Student"],
      ["TH", "col", "Price"],
    ]);
    const cells = within(table).getAllByRole("cell");
    expect(cells.map((c) => c.textContent)).toEqual(["Mar 3", "Ana", "$45.00"]);
    expect(table.querySelector("tbody tr:nth-child(1) td:nth-child(3)")).toHaveTextContent(
      "$45.00",
    );
  });

  it("AC-3 aligns numeric columns to the right and lets a wide table scroll inside its own container", () => {
    render(
      <Table caption="Totals" columns={[{ label: "Amount", numeric: true }]}>
        <TableRow>
          <TableCell numeric>$1.00</TableCell>
        </TableRow>
      </Table>,
    );
    expect(screen.getByRole("columnheader").className).toContain("text-right");
    expect(screen.getByRole("cell").className).toContain("text-right");
    expect(screen.getByRole("table").parentElement?.className).toContain("overflow-x-auto");
  });
});

describe("F05 AC-3 Table", () => {
  it("F05 AC-3d pins the first column (header and cells) to the left edge on an opaque ground", () => {
    render(
      <Table caption="Your lessons" columns={[{ label: "Student" }, { label: "Date" }]}>
        <TableRow>
          <TableCell pinned>Ana</TableCell>
          <TableCell>Mar 3</TableCell>
        </TableRow>
      </Table>,
    );
    const [studentHeader, dateHeader] = screen.getAllByRole("columnheader");
    const [student, date] = screen.getAllByRole("cell");
    for (const pinned of [studentHeader, student]) {
      expect(pinned?.className).toMatch(/\bsticky\b/);
      expect(pinned?.className).toMatch(/\bleft-0\b/);
      expect(pinned?.className).toMatch(/\bbg-canvas\b/);
    }
    for (const free of [dateHeader, date]) expect(free?.className).not.toMatch(/\bsticky\b/);
  });

  it("F05 AC-3a the region is focusable and named by the caption", () => {
    render(
      <Table caption="Your lessons" columns={[{ label: "Student" }]}>
        <TableRow>
          <TableCell>Ana</TableCell>
        </TableRow>
      </Table>,
    );
    const region = screen.getByRole("region", { name: "Your lessons" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region).toContainElement(screen.getByRole("table", { name: "Your lessons" }));
  });
});
