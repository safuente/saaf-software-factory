import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { Page } from "./Page";

function renderPage(nav: boolean) {
  return render(
    <MemoryRouter>
      <Page title="Lessons" heading="Lessons" nav={nav}>
        <p>Body</p>
      </Page>
    </MemoryRouter>,
  );
}

describe("AC-3 Page", () => {
  it("AC-3 sets the document title and focuses the single h1 inside main", () => {
    renderPage(false);
    expect(document.title).toBe("Lessons · Lesson Ledger");
    const heading = screen.getByRole("heading", { level: 1, name: "Lessons" });
    expect(screen.getByRole("main")).toContainElement(heading);
    expect(heading).toHaveFocus();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("AC-3 app pages get a header with the Main navigation", () => {
    renderPage(true);
    expect(screen.getByRole("banner")).toContainElement(
      screen.getByRole("navigation", { name: "Main" }),
    );
  });

  it("AC-3 public pages have no header landmark and no navigation (F06 AC-2g)", () => {
    renderPage(false);
    expect(screen.queryByRole("banner")).toBeNull();
    expect(screen.queryByRole("navigation")).toBeNull();
  });
});
