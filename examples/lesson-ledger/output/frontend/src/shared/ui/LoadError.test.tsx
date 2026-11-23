import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LoadError } from "./LoadError";

describe("AC-3 LoadError", () => {
  it("AC-3 says the app could not be reached and offers Try again", async () => {
    const onRetry = vi.fn();
    render(<LoadError onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("We couldn't reach Lesson Ledger.");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
