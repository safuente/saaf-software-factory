import type { ReactNode } from "react";

/** Original drawings in the logo's line language (docs/design.md: Illustrations): ruled ledger
 * ruling, notes and the tick, in greys, with `paid` green only where something is paid.
 * Every shape is painted by a theme colour class; stroked shapes say `fill="none"`. */
const LINE = {
  fill: "none",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const DRAWINGS: Record<string, ReactNode> = {
  /** Home "Get started": an open ledger, the left page ruled with a first note on it, the right
   * page still blank. */
  start: (
    <>
      <path d="M40 18c-8-5-20-6-30-4v48c10-2 22-1 30 4z" className="fill-canvas" />
      <path d="M40 18c8-5 20-6 30-4v48c-10-2-22-1-30 4z" className="fill-canvas" />
      <path
        d="M40 18c-8-5-20-6-30-4v48c10-2 22-1 30 4zM40 18c8-5 20-6 30-4v48c-10-2-22-1-30 4zM40 18v48"
        {...LINE}
        className="stroke-outline"
      />
      <path d="M16 28h18M16 37h18M16 46h18M16 55h18" {...LINE} className="stroke-rule" />
      <path d="M46 28h18M46 37h18" {...LINE} strokeDasharray="2 4" className="stroke-rule" />
      <ellipse
        cx="22.5"
        cy="46"
        rx="3.5"
        ry="2.7"
        transform="rotate(-20 22.5 46)"
        className="fill-graphite"
      />
      <path d="M25.6 45V30.5" {...LINE} className="stroke-graphite" />
    </>
  ),
  /** Students: two empty name rows with the app's initials circle, outlined, waiting for names. */
  students: (
    <>
      <rect
        x="8"
        y="16"
        width="64"
        height="20"
        rx="6"
        {...LINE}
        strokeDasharray="3 4"
        className="stroke-outline"
      />
      <rect
        x="8"
        y="44"
        width="64"
        height="20"
        rx="6"
        {...LINE}
        strokeDasharray="3 4"
        className="stroke-outline"
      />
      <circle cx="21" cy="26" r="6" className="fill-rule" />
      <circle cx="21" cy="54" r="6" className="fill-rule" />
      <path d="M33 26h28M33 54h20" {...LINE} className="stroke-outline" />
    </>
  ),
  /** Lessons: a ledger page with empty ruled rows and a note in the margin. */
  lessons: (
    <>
      <rect x="16" y="8" width="48" height="64" rx="6" className="fill-canvas" />
      <rect x="16" y="8" width="48" height="64" rx="6" {...LINE} className="stroke-outline" />
      <path d="M24 22h32M24 32h32M24 42h32M24 52h32M24 62h20" {...LINE} className="stroke-rule" />
      <ellipse
        cx="9.5"
        cy="58"
        rx="3.5"
        ry="2.7"
        transform="rotate(-20 9.5 58)"
        className="fill-slate"
      />
      <path d="M12.6 57V43" {...LINE} className="stroke-slate" />
    </>
  ),
  /** Monthly summary, empty month: a calendar page with no entries and one open note. */
  month: (
    <>
      <rect x="10" y="14" width="60" height="54" rx="6" className="fill-canvas" />
      <path d="M10 26V20a6 6 0 0 1 6-6h48a6 6 0 0 1 6 6v6z" className="fill-rule" />
      <rect x="10" y="14" width="60" height="54" rx="6" {...LINE} className="stroke-outline" />
      <path d="M24 9v9M56 9v9" {...LINE} className="stroke-outline" />
      <path
        d="M20 36h0M30 36h0M40 36h0M50 36h0M60 36h0M20 46h0M30 46h0M50 46h0M60 46h0M20 56h0M30 56h0M40 56h0"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        className="stroke-outline"
      />
      <ellipse
        cx="40"
        cy="46"
        rx="4"
        ry="3"
        transform="rotate(-20 40 46)"
        {...LINE}
        className="stroke-slate"
      />
    </>
  ),
  /** Pending payments, all paid: a ledger page whose rows each end in a tick. */
  paid: (
    <>
      <rect x="14" y="8" width="52" height="64" rx="6" className="fill-canvas" />
      <rect x="14" y="8" width="52" height="64" rx="6" {...LINE} className="stroke-outline" />
      <path d="M22 24h22M22 40h22M22 56h22" {...LINE} className="stroke-rule" />
      <path d="M50 24l3 3 6-6M50 40l3 3 6-6M50 56l3 3 6-6" {...LINE} className="stroke-paid" />
    </>
  ),
};

export type IllustrationName = "start" | "students" | "lessons" | "month" | "paid";

/** A small decorative drawing directly above a guidance or empty-state message (ADR-007). It
 * never replaces the message: it is hidden from assistive technology and has no title. */
export function Illustration({ name }: { name: IllustrationName }) {
  return (
    <svg
      data-illustration={name}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 80 80"
      className="block size-20"
    >
      {DRAWINGS[name]}
    </svg>
  );
}
