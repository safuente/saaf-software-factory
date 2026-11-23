import { useContext, useEffect, useRef, type ReactNode } from "react";
import { Alert } from "./Alert";
import { Brand } from "./Brand";
import { Button } from "./Button";
import { MainNav } from "./MainNav";
import { ShellContext } from "./shell";

export { Alert } from "./Alert";

const APP_NAME = "Lesson Ledger";

/** The document title of a page: "<title> · Lesson Ledger", or the app name alone. */
export function documentTitle(title?: string): string {
  return title ? `${title} · ${APP_NAME}` : APP_NAME;
}

/** A ref for the page's h1, which takes focus when the page mounts (see Page). */
export function useHeadingFocus() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);
  return headingRef;
}

/** One page: document title, the main landmark and its single h1. The h1 takes focus when
 * the page mounts, so after a client-side navigation keyboard and screen reader users start
 * at the top of the new page instead of where the previous page's focused element was.
 *
 * App pages (`nav`) sit in the dashboard shell (docs/design.md: Layout): a dark sidebar from
 * the `lg` breakpoint, a dark top bar below it, never fixed or sticky. Without `nav` (the
 * session check's own states) the title and content sit on the white page alone; Log in and
 * Sign up use `SignedOutPage`. */
export function Page({
  title,
  heading,
  nav = false,
  lead,
  actions,
  children,
}: {
  title?: string;
  heading: string;
  /** App pages show the "Main" navigation in the shell's header. */
  nav?: boolean;
  /** A line under the h1, in the title row. */
  lead?: ReactNode;
  /** Page actions (`ActionLink`s), right of the h1 from `lg`, wrapping below it before. */
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const headingRef = useHeadingFocus();
  const shell = useContext(ShellContext);
  const h1 = (className: string) => (
    <h1 ref={headingRef} tabIndex={-1} className={className}>
      {heading}
    </h1>
  );
  const content = (
    <>
      <title>{documentTitle(title)}</title>
      {/* The title row: the h1, with an optional lead line under it and page actions beside it.
          The h1 is focused by script on page change only; not a control, so it shows no focus
          ring. */}
      {lead || actions ? (
        <div className="mb-8 flex flex-col gap-4 not-first:mt-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            {h1("text-title focus:outline-none")}
            {lead && <p className="mt-2 text-slate">{lead}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
        </div>
      ) : (
        h1("mb-8 text-title not-first:mt-6 focus:outline-none")
      )}
      {children}
    </>
  );
  if (!nav) {
    return (
      <main className="mx-auto box-content max-w-form bg-canvas px-4 pt-12 pb-16 sm:pt-20">
        {content}
      </main>
    );
  }
  return (
    <div className="lg:flex lg:min-h-screen">
      {/* From lg the header is a column as tall as the row (at least the viewport, or main if
          taller); its inner column fills it, so Log out's mt-auto reaches the sidebar's bottom. */}
      <header className="bg-shell text-shell-text lg:flex lg:w-sidebar lg:shrink-0 lg:flex-col">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-8 lg:flex-1 lg:flex-col lg:flex-nowrap lg:items-stretch lg:justify-start lg:px-4 lg:py-8">
          <Brand />
          <MainNav />
          {shell && (
            <div className="lg:mt-auto">
              <Button
                variant="secondary"
                icon="logOut"
                disabled={shell.loggingOut}
                onClick={shell.logOut}
              >
                Log out
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="w-full min-w-0 max-w-content bg-canvas px-4 pt-8 pb-12 sm:px-8 lg:pt-10">
        {shell?.logOutFailed && <Alert>Couldn&apos;t log out. Please try again.</Alert>}
        {content}
      </main>
    </div>
  );
}
