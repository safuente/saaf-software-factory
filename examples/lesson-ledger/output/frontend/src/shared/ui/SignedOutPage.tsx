import type { ReactNode } from "react";
import { LogoMark } from "./Brand";
import { BrandIllustration } from "./BrandIllustration";
import { documentTitle, useHeadingFocus } from "./Page";

export const VALUE_LINE = "Lessons, payments and pending fees in one place";

/** Log in and Sign up (ADR-008, docs/design.md: Layout, Brand). The page's `header` is the
 * brand: from `lg` a `shell` panel on the left, as tall as the page, with the mark, the large
 * wordmark, the value line and the ledger drawing; below `lg` a strip above the form without
 * the drawing. Nothing in it is focusable, and the wordmark is plain text, so the page keeps its
 * single h1 and the F01 Tab order. `main` holds the h1 and the form: on a white card with a
 * `paid` top bar from `lg`, on the white page below it. Neither part is fixed or sticky. */
export function SignedOutPage({
  title,
  heading,
  notice,
  children,
}: {
  title: string;
  heading: string;
  /** Log in's status region, between the h1 and the form: always rendered (empty when there is
   * nothing to say), so its text is announced politely when it appears. */
  notice?: string;
  children: ReactNode;
}) {
  const headingRef = useHeadingFocus();
  return (
    <div className="lg:flex lg:min-h-screen">
      <title>{documentTitle(title)}</title>
      <header className="bg-shell text-shell-text lg:flex lg:flex-1 lg:flex-col">
        <div className="flex flex-col gap-1 px-4 py-3 sm:px-8 lg:flex-1 lg:motion-entrance lg:gap-0 lg:p-12 xl:p-20">
          {/* `data-brand`, like the shell's Brand: the mark and the wordmark, never icons. */}
          <div data-brand className="flex items-center gap-3 lg:flex-col lg:items-start lg:gap-8">
            <LogoMark className="size-8 shrink-0 lg:size-12" />
            <span className="text-heading font-semibold lg:text-display">Lesson Ledger</span>
          </div>
          <p className="text-balance text-shell-muted lg:mt-3 lg:text-heading">{VALUE_LINE}</p>
          {/* Not rendered below lg: the strip has no drawing. */}
          <div data-illustration="brand" className="hidden lg:mt-auto lg:block lg:pt-12">
            <BrandIllustration />
          </div>
        </div>
      </header>
      <main className="bg-canvas px-4 pt-12 pb-16 sm:pt-20 lg:flex lg:flex-1 lg:flex-col lg:items-center lg:px-8 lg:py-12">
        <div className="mx-auto max-w-form lg:my-auto lg:w-full lg:max-w-card lg:rounded-panel lg:border lg:border-t-4 lg:border-rule lg:border-t-paid lg:bg-canvas lg:p-8">
          <h1 ref={headingRef} tabIndex={-1} className="mb-8 text-title focus:outline-none">
            {heading}
          </h1>
          {notice !== undefined && (
            <p
              role="status"
              className="not-empty:mb-6 not-empty:rounded-control not-empty:border not-empty:border-l-4 not-empty:border-paid not-empty:bg-paid-wash not-empty:px-4 not-empty:py-3 not-empty:font-medium not-empty:text-graphite"
            >
              {notice}
            </p>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
