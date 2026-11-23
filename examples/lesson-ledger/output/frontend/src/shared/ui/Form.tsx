import type { ComponentProps, ReactNode } from "react";
import { Link } from "react-router";

/** A single-column form of `form` width. Validation is the page's job, so the browser's is off. */
export function Form({ children, ...props }: Omit<ComponentProps<"form">, "className">) {
  return (
    <form {...props} noValidate className="flex max-w-form flex-col gap-5">
      {children}
    </form>
  );
}

/** Secondary text under a form, such as the link to the other account page. */
export function Note({ children }: { children: ReactNode }) {
  return <p className="text-slate">{children}</p>;
}

/** An in-app link. Inline-block, so its target is a full line (24 px) tall. */
export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="motion-interaction inline-block font-medium text-graphite underline underline-offset-4 hover:decoration-2 focus-visible:decoration-2"
    >
      {children}
    </Link>
  );
}
