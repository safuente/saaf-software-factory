/** A live region that is always rendered, so screen readers announce the text when it appears.
 * Empty, it takes no space. */
export function StatusMessage({ children }: { children?: string }) {
  return (
    <p role="status" className="font-medium">
      {children}
    </p>
  );
}
