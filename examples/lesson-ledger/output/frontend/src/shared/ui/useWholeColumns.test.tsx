import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Table, TableCell, TableRow } from "./Table";

/*
 * jsdom has no layout, so these tests stub the geometry useWholeColumns reads: the region's
 * width and scroll position, each header cell's offset and box, and the box of a focused
 * control. The model: a pinned Student column 100 px wide, then four columns of 100 px, in a
 * region 250 px wide. Columns 1..4 start at 100, 200, 300 and 400 px; the pinned column stays
 * at 0..100 while the region scrolls. The rest positions are therefore 0, 100, 200 and 300.
 */

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  observe = vi.fn();
  disconnect = vi.fn();
  constructor(public callback: () => void) {
    FakeResizeObserver.instances.push(this);
  }
}

interface Geometry {
  regionWidth: number;
  scrollLeft: number;
  /** Left offsets of the header cells, pinned column first. */
  columnLefts: number[];
  columnWidth: number;
}

function renderTable() {
  const view = render(
    <>
      <button type="button">Outside</button>
      <Table
        caption="Monthly summary"
        columns={["Student", "Lessons", "Total", "Paid", "Status"].map((label) => ({ label }))}
      >
        <TableRow>
          <TableCell pinned>Ana</TableCell>
          <TableCell>3</TableCell>
          <TableCell>$135.00</TableCell>
          <TableCell>
            <button type="button">Mark as paid</button>
          </TableCell>
          <TableCell>Pending</TableCell>
        </TableRow>
      </Table>
    </>,
  );
  const region = screen.getByRole("region", { name: "Monthly summary" });
  const table = screen.getByRole("table");
  const headers = screen.getAllByRole("columnheader");
  const button = screen.getByRole("button", { name: "Mark as paid" });
  const geometry: Geometry = {
    regionWidth: 250,
    scrollLeft: 0,
    columnLefts: [0, 100, 200, 300, 400],
    columnWidth: 100,
  };
  const scrollTo = vi.fn();
  Object.defineProperties(region, {
    clientWidth: { configurable: true, get: () => geometry.regionWidth },
    clientLeft: { configurable: true, get: () => 0 },
    scrollLeft: {
      configurable: true,
      get: () => geometry.scrollLeft,
      set: (value: number) => (geometry.scrollLeft = value),
    },
    scrollTo: { configurable: true, value: scrollTo },
  });
  region.getBoundingClientRect = () => new DOMRect(0, 0, geometry.regionWidth, 300);
  headers.forEach((header, index) => {
    const columnLeft = () => geometry.columnLefts[index] ?? 0;
    Object.defineProperties(header, {
      offsetLeft: { configurable: true, get: columnLeft },
      offsetWidth: { configurable: true, get: () => geometry.columnWidth },
    });
    header.getBoundingClientRect = () => {
      const left = index === 0 ? 0 : columnLeft() - geometry.scrollLeft;
      return new DOMRect(left, 0, geometry.columnWidth, 40);
    };
  });
  /** The control's box: `left`..`left + width` in table coordinates, scrolled with the region. */
  const placeButton = (left: number, width: number) => {
    button.getBoundingClientRect = () => new DOMRect(left - geometry.scrollLeft, 50, width, 30);
  };
  placeButton(300, 100);
  return { ...view, region, table, button, geometry, scrollTo, placeButton };
}

function onlyObserver(): FakeResizeObserver {
  const [observer] = FakeResizeObserver.instances;
  if (!observer || FakeResizeObserver.instances.length !== 1) throw new Error("one observer");
  return observer;
}

/** Runs every ResizeObserver callback, as the browser does after a size change. */
function resize() {
  act(() => FakeResizeObserver.instances.forEach((observer) => observer.callback()));
}

/** Renders the table and lets the observer see the stubbed, overflowing geometry. */
function renderOverflowing() {
  const view = renderTable();
  resize();
  expect(view.table).toHaveClass("table-room");
  return view;
}

function scrollEnd(region: HTMLElement, left: number, geometry: Geometry) {
  geometry.scrollLeft = left;
  region.dispatchEvent(new Event("scrollend"));
}

/** Hides `onscrollend` from `window`, as in Safari, until the returned function is called. */
function withoutScrollEnd(): () => void {
  let owner: object | null = window;
  while (owner && !Object.prototype.hasOwnProperty.call(owner, "onscrollend")) {
    owner = Object.getPrototypeOf(owner) as object | null;
  }
  const descriptor = owner && Object.getOwnPropertyDescriptor(owner, "onscrollend");
  if (!owner || !descriptor) return () => {};
  const holder = owner;
  delete (holder as Record<string, unknown>).onscrollend;
  return () => Object.defineProperty(holder, "onscrollend", descriptor);
}

beforeEach(() => {
  FakeResizeObserver.instances = [];
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
});

describe("UX-2 useWholeColumns: overflow and room after the last column", () => {
  it("UX-2 observes the region and the table", () => {
    const { region, table } = renderTable();
    const observer = onlyObserver();
    expect(observer.observe).toHaveBeenCalledWith(region);
    expect(observer.observe).toHaveBeenCalledWith(table);
  });

  it("UX-2 adds table-room while the columns are wider than the region and removes it after", () => {
    const { table, geometry } = renderTable();
    resize();
    expect(table).toHaveClass("table-room");
    geometry.regionWidth = 600;
    resize();
    expect(table).not.toHaveClass("table-room");
  });

  it("UX-2 measures up to the end of the last column, so exactly fitting columns do not overflow", () => {
    const { table, geometry } = renderTable();
    geometry.regionWidth = 500;
    resize();
    expect(table).not.toHaveClass("table-room");
  });

  it("F06 columns stretched to the region and rounded one pixel over it do not overflow", () => {
    // offsetLeft and offsetWidth round to whole pixels, so columns that fill the region can
    // measure 1 px wider than it; counting that as overflow toggled table-room for ever.
    const { table, geometry } = renderTable();
    geometry.regionWidth = 499;
    resize();
    expect(table).not.toHaveClass("table-room");
  });

  it("UX-2 does nothing without ResizeObserver", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const { table, region, geometry, scrollTo } = renderTable();
    scrollEnd(region, 130, geometry);
    expect(table).not.toHaveClass("table-room");
    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe("UX-2 useWholeColumns: settles on whole columns when scrolling stops", () => {
  it.each([
    [130, 100],
    [160, 200],
    [40, 0],
    [290, 300],
  ])("UX-2 from %i px rests on the nearest column start, %i px", (from, to) => {
    const { region, geometry, scrollTo } = renderOverflowing();
    scrollEnd(region, from, geometry);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ left: to, behavior: "instant" });
  });

  it("UX-2 does not scroll when already at a column start or within half a pixel of it", () => {
    const { region, geometry, scrollTo } = renderOverflowing();
    scrollEnd(region, 100, geometry);
    scrollEnd(region, 200.4, geometry);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("UX-2 does not scroll while the columns fit in the region", () => {
    const { region, geometry, scrollTo, table } = renderTable();
    geometry.regionWidth = 600;
    resize();
    expect(table).not.toHaveClass("table-room");
    scrollEnd(region, 130, geometry);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("UX-2 does not scroll when the region grew wider than the columns before it was measured again", () => {
    const { region, geometry, scrollTo } = renderOverflowing();
    geometry.regionWidth = 600;
    scrollEnd(region, 130, geometry);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("UX-2 never rests on a column that starts under the pinned column", () => {
    const { region, geometry, scrollTo } = renderOverflowing();
    // A first column drawn 10 px under the pinned one would need a negative scroll position.
    geometry.columnLefts = [0, 90, 200, 300, 400];
    scrollEnd(region, 40, geometry);
    expect(scrollTo).toHaveBeenCalledWith({ left: 100, behavior: "instant" });
  });

  it("UX-2 keeps a focused control in the region fully in view, even past a nearer column start", () => {
    const { region, geometry, scrollTo, button } = renderOverflowing();
    // The button spans 300..400: whole between the pinned edge (100) and the region's right
    // edge (250) only at 200.
    act(() => button.focus());
    scrollEnd(region, 130, geometry);
    expect(scrollTo).toHaveBeenCalledWith({ left: 200, behavior: "instant" });
  });

  it("F06 AC-6g a control focused in the region is scrolled fully into it, nearest edge first", () => {
    const { button } = renderOverflowing();
    const scrollIntoView = vi.fn();
    button.scrollIntoView = scrollIntoView;
    act(() => button.focus());
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest", inline: "nearest" });
  });

  it("F06 AC-6g a control focused before the observer reports the overflow is still scrolled into the region", () => {
    // After a viewport change, Tab can land in the region before the ResizeObserver callback
    // and React's re-render have marked the table as overflowing (e2e under load).
    const { button, table } = renderTable();
    expect(table).not.toHaveClass("table-room");
    const scrollIntoView = vi.fn();
    button.scrollIntoView = scrollIntoView;
    act(() => button.focus());
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest", inline: "nearest" });
  });

  it("UX-2 falls back to the nearest column start when no rest position shows the focused control whole", () => {
    const { region, geometry, scrollTo, button, placeButton } = renderOverflowing();
    placeButton(300, 200);
    act(() => button.focus());
    scrollEnd(region, 130, geometry);
    expect(scrollTo).toHaveBeenCalledWith({ left: 100, behavior: "instant" });
  });

  it.each([
    ["the region itself", (view: ReturnType<typeof renderTable>) => view.region],
    ["a control outside the region", () => screen.getByRole("button", { name: "Outside" })],
  ])("UX-2 with focus on %s rests on the nearest column start", (_, target) => {
    const view = renderOverflowing();
    act(() => target(view).focus());
    scrollEnd(view.region, 130, view.geometry);
    expect(view.scrollTo).toHaveBeenCalledWith({ left: 100, behavior: "instant" });
  });
});

describe("UX-2 useWholeColumns: Safari, without scrollend", () => {
  let restoreScrollEnd: () => void;

  beforeEach(() => {
    restoreScrollEnd = withoutScrollEnd();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    restoreScrollEnd();
  });

  it("UX-2 settles 150 ms after the last scroll event", () => {
    const { region, geometry, scrollTo } = renderOverflowing();
    geometry.scrollLeft = 130;
    region.dispatchEvent(new Event("scroll"));
    vi.advanceTimersByTime(100);
    region.dispatchEvent(new Event("scroll"));
    vi.advanceTimersByTime(149);
    expect(scrollTo).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ left: 100, behavior: "instant" });
  });

  it("UX-2 ignores scrollend events, which Safari does not send", () => {
    const { region, geometry, scrollTo } = renderOverflowing();
    scrollEnd(region, 130, geometry);
    vi.advanceTimersByTime(1000);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("UX-2 cancels a pending settle on unmount and stops listening", () => {
    const { region, geometry, scrollTo, unmount } = renderOverflowing();
    geometry.scrollLeft = 130;
    region.dispatchEvent(new Event("scroll"));
    unmount();
    vi.advanceTimersByTime(1000);
    region.dispatchEvent(new Event("scroll"));
    vi.advanceTimersByTime(1000);
    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe("UX-2 useWholeColumns: cleanup", () => {
  it("UX-2 disconnects the observer and stops settling on unmount", () => {
    const { region, geometry, scrollTo, unmount } = renderOverflowing();
    const observer = onlyObserver();
    unmount();
    expect(observer.disconnect).toHaveBeenCalled();
    scrollEnd(region, 130, geometry);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("UX-2 stops settling once the columns fit again", () => {
    const { region, geometry, scrollTo } = renderOverflowing();
    geometry.regionWidth = 600;
    resize();
    geometry.regionWidth = 250;
    scrollEnd(region, 130, geometry);
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
