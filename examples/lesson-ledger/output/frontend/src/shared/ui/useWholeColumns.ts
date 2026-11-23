import { useEffect, useState, type RefObject } from "react";

/** How long scrolling must pause before the region settles, where `scrollend` is missing. */
const SETTLE_MS = 150;

/** The table's width up to the end of its last column, without the room after it. */
function columnsWidth(table: HTMLTableElement): number {
  const cells = table.tHead?.rows[0]?.cells;
  const last = cells?.[cells.length - 1];
  return last ? last.offsetLeft + last.offsetWidth : table.offsetWidth;
}

/** Whether the columns are wider than the region. Offsets round to whole pixels, so columns
 * stretched to fill the region can measure 1 px over it; that is not overflow (else the room
 * after the table would switch on and off for ever). */
function overflows(region: HTMLElement, table: HTMLTableElement): boolean {
  return columnsWidth(table) > region.clientWidth + 1;
}

/** Scroll positions where a column starts exactly at the pinned column's right edge, from the
 * start of the table up to the first one at or past the table's natural end. */
function restPositions(region: HTMLElement, table: HTMLTableElement): number[] {
  const headers = [...(table.tHead?.rows[0]?.cells ?? [])];
  const pinned = headers[0]?.getBoundingClientRect().right ?? 0;
  const naturalEnd = columnsWidth(table) - region.clientWidth;
  const positions: number[] = [];
  for (const header of headers.slice(1)) {
    const position = region.scrollLeft + header.getBoundingClientRect().left - pinned;
    if (position < -0.5) continue;
    positions.push(Math.max(0, position));
    if (position >= naturalEnd - 0.5) break;
  }
  return positions;
}

/** Whether `element` lies fully between the pinned column and the region's right edge once the
 * region is scrolled to `position`. */
function fitsAt(region: HTMLElement, table: HTMLTableElement, element: Element, position: number) {
  const pinned = table.tHead?.rows[0]?.cells[0]?.getBoundingClientRect().right ?? 0;
  const box = region.getBoundingClientRect();
  const right = box.left + region.clientLeft + region.clientWidth;
  const shift = position - region.scrollLeft;
  const r = element.getBoundingClientRect();
  return r.left - shift >= pinned - 0.5 && r.right - shift <= right + 0.5;
}

/** Moves the region to the nearest rest position that keeps a focused control in it fully in
 * view, so no column rests partly under the pinned column. */
function settle(region: HTMLElement, table: HTMLTableElement): void {
  if (!overflows(region, table)) return;
  const positions = restPositions(region, table);
  const focused = document.activeElement;
  const keepsFocus = (position: number) =>
    !focused || focused === region || !region.contains(focused)
      ? true
      : fitsAt(region, table, focused, position);
  const candidates = positions.some(keepsFocus) ? positions.filter(keepsFocus) : positions;
  const current = region.scrollLeft;
  const target = candidates.reduce<number | undefined>(
    (best, position) =>
      best === undefined || Math.abs(position - current) < Math.abs(best - current)
        ? position
        : best,
    undefined,
  );
  if (target === undefined || Math.abs(target - current) < 0.5) return;
  // Instant: scrolling is not one of the motions ADR-007 allows.
  region.scrollTo({ left: target, behavior: "instant" });
}

/**
 * Keeps whole columns in a sideways-scrolling table with a pinned first column (F05 UX-2):
 * when scrolling stops, the region moves to the nearest position where a column starts at the
 * pinned column's edge, so no figure rests half under it ("$45.00" read as "45.00").
 *
 * Returns whether the table's columns are wider than its region. While they are, the table needs
 * room after its last column, so the last columns can still start at the pinned edge.
 */
export function useWholeColumns(
  regionRef: RefObject<HTMLElement | null>,
  tableRef: RefObject<HTMLTableElement | null>,
): boolean {
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const region = regionRef.current;
    const table = tableRef.current;
    if (!region || !table || typeof ResizeObserver === "undefined") return;
    const measure = () => setOverflowing(overflows(region, table));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(region);
    observer.observe(table);
    return () => observer.disconnect();
  }, [regionRef, tableRef]);

  useEffect(() => {
    const region = regionRef.current;
    if (!region) return;
    // Chrome does not scroll a region sideways when Tab lands on a control it shows only in
    // part (F06: the wider Student column with initials), so bring the control fully into the
    // region; scrolling then settles on whole columns as usual. Listening whatever the measured
    // overflow: after a viewport change, Tab can reach the control before the observer's
    // callback and the re-render mark the table as overflowing, and `nearest` does nothing to
    // a control already in view.
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target !== region) {
        target.scrollIntoView?.({ block: "nearest", inline: "nearest" });
      }
    };
    region.addEventListener("focusin", onFocusIn);
    return () => region.removeEventListener("focusin", onFocusIn);
  }, [regionRef]);

  useEffect(() => {
    const region = regionRef.current;
    const table = tableRef.current;
    if (!region || !table || !overflowing) return;
    const onSettled = () => settle(region, table);
    if ("onscrollend" in window) {
      region.addEventListener("scrollend", onSettled);
      return () => region.removeEventListener("scrollend", onSettled);
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(onSettled, SETTLE_MS);
    };
    region.addEventListener("scroll", onScroll);
    return () => {
      clearTimeout(timer);
      region.removeEventListener("scroll", onScroll);
    };
  }, [regionRef, tableRef, overflowing]);

  return overflowing;
}
