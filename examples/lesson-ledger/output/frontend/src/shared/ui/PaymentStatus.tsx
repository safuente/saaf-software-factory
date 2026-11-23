/** A lesson's payment state, always in words (docs/design.md: Payment status): "✓ Paid" in
 * green, "Unpaid" in amber, so it is not mistaken for an error. The tick is generated content
 * with empty alternative text (`check-mark` in app.css), so the status reads exactly "Paid". */
export function PaymentStatus({ paid }: { paid: boolean }) {
  return paid ? (
    <span className="check-mark font-medium text-paid">Paid</span>
  ) : (
    <span className="font-medium text-unpaid">Unpaid</span>
  );
}
