import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert } from "./Alert";
import { Alert as AlertFromPage } from "./Page";

describe("AC-3 Alert", () => {
  it("AC-3 renders an error message as an alert", () => {
    render(<Alert>Email or password is incorrect.</Alert>);
    expect(screen.getByRole("alert")).toHaveTextContent("Email or password is incorrect.");
  });

  it("AC-3 stays importable from Page for the pages F05 restyles", () => {
    expect(AlertFromPage).toBe(Alert);
  });
});
