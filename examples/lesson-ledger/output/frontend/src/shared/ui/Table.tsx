import { useId, useRef, type ReactNode } from "react";
import { useWholeColumns } from "./useWholeColumns";

export interface Column {
  label: string;
  /** Money and counts: right-aligned, tabular figures. */
  numeric?: boolean;
}

const align = (numeric?: boolean) => (numeric ? "text-right tabular-nums" : "text-left");

/** The Student column stays at the left edge while the region scrolls sideways, on the page's
 * white ground so the cells passing under it stay hidden. */
const PINNED = "sticky left-0 bg-canvas";

/** Separate borders, so the pinned cells keep their row rule while they stick, with no gap
 * between cells, so each row rule is one continuous line. Written out whole: Tailwind finds
 * class names only between delimiters, not glued to a template expression. */
const TABLE = "w-full border-separate border-spacing-0";

/** A dense native table (docs/design.md: Tables) with `th scope="col"` headers, so
 * column-position selectors keep working. Grey header text and 1 px rules between rows. The
 * table scrolls sideways inside its own focusable region, named by the caption, so a narrow
 * screen scrolls the table, not the page.
 * While it scrolls, the caption text stays at the region's left edge, the region comes to rest
 * on whole columns, and room after the last column (`table-room`) lets the last columns reach
 * the pinned column's edge (useWholeColumns). */
export function Table({
  caption,
  columns,
  children,
}: {
  caption: ReactNode;
  columns: Column[];
  children: ReactNode;
}) {
  const captionId = useId();
  const regionRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const overflowing = useWholeColumns(regionRef, tableRef);
  return (
    <div
      ref={regionRef}
      className="max-w-full overflow-x-auto"
      role="region"
      aria-labelledby={captionId}
      tabIndex={0}
    >
      <table ref={tableRef} className={overflowing ? `${TABLE} table-room` : TABLE}>
        <caption id={captionId} className="pb-2 text-left text-small text-slate">
          <span className="sticky left-0">{caption}</span>
        </caption>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.label}
                scope="col"
                className={`border-b border-rule px-3 py-2 text-small font-medium text-slate ${align(column.numeric)}${index === 0 ? ` ${PINNED}` : ""}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/** A table row. `highlighted` runs the just-paid highlight once (ADR-007); `onHighlightEnd`
 * is called when it ends, so the row can drop it and run it again on a later success. */
export function TableRow({
  highlighted = false,
  onHighlightEnd,
  children,
}: {
  highlighted?: boolean;
  onHighlightEnd?: () => void;
  children: ReactNode;
}) {
  return (
    <tr
      className={highlighted ? "motion-highlight" : undefined}
      onAnimationEnd={highlighted ? onHighlightEnd : undefined}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  numeric,
  nowrap,
  pinned,
  children,
}: {
  numeric?: boolean;
  /** The first cell of a row (the Student column), kept in view while the table scrolls. */
  pinned?: boolean;
  /** Dates, money and buttons stay on one line; the region scrolls instead. */
  nowrap?: boolean;
  children: ReactNode;
}) {
  const wrap = nowrap ? " whitespace-nowrap" : "";
  const pin = pinned ? ` ${PINNED}` : "";
  return (
    <td className={`border-b border-rule px-3 py-2 align-middle ${align(numeric)}${wrap}${pin}`}>
      {children}
    </td>
  );
}
