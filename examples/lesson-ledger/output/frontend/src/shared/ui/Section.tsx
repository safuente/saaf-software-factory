import type { ReactNode } from "react";

/** A titled region of a page: an h2 in the heading size, then its content. `headingId` names
 * the section (and anything else the page labels by the same heading). Sections after the
 * first start further down the page (spacing 10, between page regions). A `label` heading is
 * grey (`slate`), like table header text, for a section whose heading labels a list. A
 * `focusable` heading can take focus from script (not from Tab), like the page's h1, for when
 * the content focus was in goes away. */
export function Section({
  headingId,
  heading,
  label = false,
  focusable = false,
  children,
}: {
  headingId: string;
  heading: string;
  label?: boolean;
  focusable?: boolean;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={headingId} className="not-first-of-type:mt-10">
      <h2
        id={headingId}
        tabIndex={focusable ? -1 : undefined}
        className={label ? "mb-4 text-slate" : "mb-4 focus:outline-none"}
      >
        {heading}
      </h2>
      {children}
    </section>
  );
}
