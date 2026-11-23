import { Alert } from "./Alert";
import { Button } from "./Button";

/** Something failed to load (network or 5xx), with a button that repeats the load. */
export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <Alert>We couldn&apos;t reach Lesson Ledger.</Alert>
      <Button variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
