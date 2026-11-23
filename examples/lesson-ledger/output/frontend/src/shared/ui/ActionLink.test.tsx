import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { ActionLink } from "./ActionLink";

const renderLink = (variant: "primary" | "secondary") =>
  render(
    <MemoryRouter>
      <ActionLink to="/lessons" label="Record lesson on the Lessons page" variant={variant}>
        Record lesson
      </ActionLink>
    </MemoryRouter>,
  );

describe("ActionLink", () => {
  it("is a link named by its label, showing its text", () => {
    renderLink("primary");
    const link = screen.getByRole("link", { name: "Record lesson on the Lessons page" });
    expect(link).toHaveAttribute("href", "/lessons");
    expect(link).toHaveTextContent(/^Record lesson$/);
  });

  it("primary is black with white text; secondary is white and outlined; neither underlined", () => {
    renderLink("primary");
    renderLink("secondary");
    const [primary, secondary] = screen
      .getAllByRole("link")
      .map((link) => link.className.split(/\s+/));
    expect(primary).toEqual(expect.arrayContaining(["bg-black", "text-canvas", "no-underline"]));
    expect(secondary).toEqual(
      expect.arrayContaining(["bg-canvas", "border-outline", "text-graphite", "no-underline"]),
    );
    expect(primary).toEqual(
      expect.arrayContaining(["hover:bg-shell-raised", "focus-visible:bg-shell-raised"]),
    );
  });
});
