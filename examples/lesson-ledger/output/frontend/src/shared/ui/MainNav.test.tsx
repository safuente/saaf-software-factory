import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { MainNav } from "./MainNav";

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <MainNav />
    </MemoryRouter>,
  );
  return screen.getByRole("navigation", { name: "Main" });
}

describe("AC-3 MainNav", () => {
  it("AC-3 keeps the five links, labels and order", () => {
    const links = within(renderAt("/")).getAllByRole("link");
    expect(links.map((l) => [l.textContent, l.getAttribute("href")])).toEqual([
      ["Home", "/"],
      ["Lessons", "/lessons"],
      ["Students", "/students"],
      ["Monthly summary", "/summary"],
      ["Pending payments", "/pending"],
    ]);
  });

  it("AC-3 marks only the current page with aria-current and a different style", () => {
    const nav = renderAt("/summary");
    const current = within(nav).getByRole("link", { name: "Monthly summary" });
    const other = within(nav).getByRole("link", { name: "Lessons" });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(other).not.toHaveAttribute("aria-current");
    expect(current.className).not.toBe(other.className);
  });

  it("AC-3 has no menu toggle at any width", () => {
    expect(within(renderAt("/")).queryByRole("button")).toBeNull();
  });

  it("F06 AC-2d the current link differs in weight and shape, not only colour", () => {
    const nav = renderAt("/lessons");
    const current = within(nav).getByRole("link", { name: "Lessons" }).className.split(/\s+/);
    const other = within(nav).getByRole("link", { name: "Students" }).className.split(/\s+/);
    expect(current).toContain("font-semibold");
    expect(other).toContain("font-normal");
    expect(current).toContain("bg-shell-raised");
    expect(other).not.toContain("bg-shell-raised");
  });
});
