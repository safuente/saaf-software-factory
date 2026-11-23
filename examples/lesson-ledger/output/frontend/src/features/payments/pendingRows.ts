import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { formatCents, formatLessonDate } from "../../shared/format";
import type { Lesson } from "../lessons/api";
import type { PendingLessons } from "./api";

/** "Total pending: {amount} across {n} lessons" (F03). */
export function pendingTotal(amount: number, count: number): string {
  return `Total pending: ${formatCents(amount)} across ${count} ${count === 1 ? "lesson" : "lessons"}`;
}

/** The F03 success announcement of a mark on a pending list. */
export function paidAnnouncement(paid: Lesson, amountPending: number): string {
  return (
    `Marked ${paid.student.name}'s lesson on ${formatLessonDate(paid.date)} as paid. ` +
    `Total pending: ${formatCents(amountPending)}.`
  );
}

/** Where focus goes after a row leaves the list: the next row's button, else the previous
 * row's, else the page's heading for the list. */
type FocusTarget = number | "heading";

/** A pending list cached under `queryKey` whose paid rows leave it (F03 AC-3). `remove` takes a
 * paid lesson out of the cached list (read at response time, so concurrent changes of other
 * rows are kept), lowers its total and amount, and moves focus after the next render. It
 * returns the new amount pending, or undefined when the lesson was not in the list. */
export function usePendingRows(queryKey: QueryKey, heading: () => HTMLElement | null) {
  const queryClient = useQueryClient();
  const buttons = useRef(new Map<number, HTMLButtonElement>());
  const focusTarget = useRef<FocusTarget>(undefined);

  useEffect(() => {
    const target = focusTarget.current;
    if (target === undefined) return;
    focusTarget.current = undefined;
    const element = target === "heading" ? heading() : buttons.current.get(target);
    element?.focus();
  });

  const remove = (paid: Lesson): number | undefined => {
    const current = queryClient.getQueryData<PendingLessons>(queryKey);
    const index = current ? current.items.findIndex((l) => l.id === paid.id) : -1;
    if (!current || index < 0) return undefined;
    const neighbour = current.items[index + 1] ?? current.items[index - 1];
    focusTarget.current = neighbour ? neighbour.id : "heading";
    const amount = current.amount_pending.amount - paid.price.amount;
    queryClient.setQueryData<PendingLessons>(queryKey, {
      ...current,
      items: current.items.filter((l) => l.id !== paid.id),
      total: current.total - 1,
      amount_pending: { ...current.amount_pending, amount },
    });
    return amount;
  };

  const buttonRef = (id: number) => (element: HTMLButtonElement | null) => {
    if (element) buttons.current.set(id, element);
    else buttons.current.delete(id);
  };

  return { remove, buttonRef };
}
