import type { ReactNode } from "react";
import { Icon } from "./Icon";

/** An error the teacher must notice: announced at once, marked by a thick danger bar and the
 * alert icon (decorative; the text carries the message). */
export function Alert({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-control border border-l-4 border-danger bg-danger-wash px-4 py-3 font-medium text-danger"
    >
      <Icon name="alert" />
      {children}
    </p>
  );
}
