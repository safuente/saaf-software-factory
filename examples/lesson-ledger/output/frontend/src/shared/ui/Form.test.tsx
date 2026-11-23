import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { Form, Note, TextLink } from "./Form";

describe("AC-3 Form, Note and TextLink", () => {
  it("AC-3 a form leaves validation to the page and passes on submit", () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <Form onSubmit={onSubmit} aria-label="Log in">
        <button type="submit">Go</button>
      </Form>,
    );
    const form = screen.getByRole("form", { name: "Log in" });
    expect(form).toHaveAttribute("novalidate");
    fireEvent.submit(form);
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("AC-3 a note holds secondary text with a router link", () => {
    render(
      <MemoryRouter>
        <Note>
          No account yet? <TextLink to="/signup">Create an account</TextLink>
        </Note>
      </MemoryRouter>,
    );
    expect(screen.getByText(/No account yet\?/).tagName).toBe("P");
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute(
      "href",
      "/signup",
    );
  });
});
