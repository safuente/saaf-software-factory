import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PaymentStatus } from "./PaymentStatus";

describe("F05 PaymentStatus", () => {
  it("F05 AC-3b says Paid or Unpaid in words; F06: paid is green, unpaid amber", () => {
    const { rerender } = render(<PaymentStatus paid={false} />);
    expect(screen.getByText("Unpaid").className).toMatch(/\btext-unpaid\b/);

    rerender(<PaymentStatus paid />);
    expect(screen.getByText("Paid").className).toMatch(/\btext-paid\b/);
  });
});
