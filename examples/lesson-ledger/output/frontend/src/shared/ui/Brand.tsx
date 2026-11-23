/** The product's brand at the top of the shell (docs/design.md: Brand, ADR-007): the logo mark
 * and the "Lesson Ledger" wordmark. The mark is an original drawing: a ledger page with three
 * ruled lines, a note sitting on the middle line, and the note's flag drawn as a tick, so it
 * says "lessons, recorded and paid". It is decorative; the wordmark is plain text, not a link
 * or heading. `public/favicon.svg` draws the same shapes with the same theme colours as literal
 * values (the one asset that cannot use theme classes). */
export function Brand() {
  return (
    <div data-brand className="flex items-center gap-3 lg:mb-8 lg:px-3">
      <LogoMark className="size-8 shrink-0" />
      <span className="text-heading font-semibold text-shell-text">Lesson Ledger</span>
    </div>
  );
}

/** The logo mark alone, decorative, sized by the caller (the shell, and the brand panel of the
 * signed-out pages, ADR-008). */
export function LogoMark({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 32 32" className={className}>
      <rect x="0" y="0" width="32" height="32" rx="8" className="fill-canvas" />
      <path
        d="M6 14h20M6 19h20M6 24h20"
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="stroke-outline"
      />
      <path
        d="M9.2 21.1c-.5-1.6.9-3.5 3-4.2s4.1-.1 4.6 1.5-.9 3.5-3 4.2-4.1.1-4.6-1.5z"
        className="fill-graphite"
      />
      <path
        d="M16.5 18.6V7"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        className="stroke-graphite"
      />
      <path
        d="M16.5 8l2.8 2.8 5.7-6"
        fill="none"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-paid"
      />
    </svg>
  );
}
