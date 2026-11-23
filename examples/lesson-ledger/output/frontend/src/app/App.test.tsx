import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("AC-5 application shell", () => {
  it("renders a single h1 'Lesson Ledger' inside the main landmark", () => {
    render(<App />);

    const main = screen.getByRole("main");
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(within(main).getByRole("heading", { level: 1 })).toHaveTextContent(/^Lesson Ledger$/);
  });

  it("has no navigation and shows no data", () => {
    render(<App />);

    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.queryByRole("table")).toBeNull();
  });
});
