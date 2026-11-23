import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { isShownFailure } from "../../shared/api/client";
import { formatCents, formatLessonDate } from "../../shared/format";
import { Button } from "../../shared/ui/Button";
import { LoadError } from "../../shared/ui/LoadError";
import { Alert, Page } from "../../shared/ui/Page";
import { PaymentStatus } from "../../shared/ui/PaymentStatus";
import { StatusMessage } from "../../shared/ui/StatusMessage";
import { StudentName } from "../../shared/ui/StudentName";
import { Table, TableCell, TableRow } from "../../shared/ui/Table";
import type { Lesson, LessonPage } from "../lessons/api";
import {
  monthLessonsKey,
  summaryKey,
  useMonthLessons,
  useMonthlySummary,
  type MonthlySummary,
} from "./api";
import { MetricsPanel } from "./MetricsPanel";
import { PaidButton } from "./PaidButton";
import { FIRST_MONTH, LAST_MONTH, currentMonth, formatMonth, isMonth, shiftMonth } from "./month";
import { Illustration } from "../../shared/ui/Illustration";

const SUMMARY_COLUMNS = [
  { label: "Student" },
  { label: "Date" },
  { label: "Duration" },
  { label: "Price", numeric: true },
  { label: "Status" },
  { label: "Action" },
];

export function SummaryPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("month");
  const valid = isMonth(requested);
  const month = valid ? requested : currentMonth();

  useEffect(() => {
    if (!valid) setParams({ month }, { replace: true });
  }, [valid, month, setParams]);

  const label = formatMonth(month);
  return (
    <Page title="Monthly summary" heading="Monthly summary" nav>
      {/* The month chip (docs/design.md). Below md the chip takes its own row above the two
          buttons; from md all three share one row. DOM and focus order stay Previous, heading,
          Next. */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:flex md:flex-wrap md:items-center">
        <Button
          variant="secondary"
          pill
          disabled={month === FIRST_MONTH}
          onClick={() => setParams({ month: shiftMonth(month, -1) })}
        >
          Previous month
        </Button>
        <h2 className="order-first col-span-2 justify-self-start rounded-pill border border-outline px-4 py-1 md:order-none">
          {label}
        </h2>
        <Button
          variant="secondary"
          pill
          disabled={month === LAST_MONTH}
          onClick={() => setParams({ month: shiftMonth(month, 1) })}
        >
          Next month
        </Button>
      </div>
      {/* Keyed by month so messages of one month never show on another. */}
      {valid && <MonthDetails key={month} month={month} label={label} />}
    </Page>
  );
}

function MonthDetails({ month, label }: { month: string; label: string }) {
  const queryClient = useQueryClient();
  const summary = useMonthlySummary(month);
  const lessons = useMonthLessons(month);
  const [alert, setAlert] = useState<string>();
  const [status, setStatus] = useState<string>();

  /** Shows the response's state at once; `PaidButton` then refreshes every list and total from
   * the server (F03 Behavior: Mark / undo). Totals move only when the paid state actually
   * changed from the lesson as clicked. */
  const onSaved = (updated: Lesson, previous: Lesson): boolean => {
    queryClient.setQueryData<LessonPage>(
      monthLessonsKey(month),
      (page) =>
        page && { ...page, items: page.items.map((l) => (l.id === updated.id ? updated : l)) },
    );
    const current = queryClient.getQueryData<MonthlySummary>(summaryKey(month));
    if (current) {
      const delta =
        updated.paid === previous.paid ? 0 : (updated.paid ? 1 : -1) * updated.price.amount;
      const collected = current.collected.amount + delta;
      const pending = current.pending.amount - delta;
      queryClient.setQueryData<MonthlySummary>(summaryKey(month), {
        ...current,
        collected: { ...current.collected, amount: collected },
        pending: { ...current.pending, amount: pending },
      });
      setStatus(
        `Marked as ${updated.paid ? "paid" : "unpaid"}. ` +
          `Collected: ${formatCents(collected)}, pending: ${formatCents(pending)}.`,
      );
    }
    return false;
  };
  const rowActions = {
    onStart: () => {
      setAlert(undefined);
      setStatus(undefined);
    },
    onSaved,
    onFailed: setAlert,
  };
  const failed = [summary, lessons].find((q) => q.isError && isShownFailure(q.error));

  if (failed) {
    return (
      <LoadError
        onRetry={() => {
          void summary.refetch();
          void lessons.refetch();
        }}
      />
    );
  }
  if (!summary.data || !lessons.data) {
    return <StatusMessage>Loading…</StatusMessage>;
  }
  const { items, total } = lessons.data;
  return (
    <>
      {/* From xl the panel sits right of the table; below xl, above it. DOM order stays panel,
          then alert and table, as the totals were in F03. */}
      <div className="flex flex-col gap-6 xl:flex-row-reverse xl:items-start">
        <MetricsPanel summary={summary.data} />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {alert && <Alert>{alert}</Alert>}
          {total === 0 ? (
            <div>
              <Illustration name="month" />
              <p>No lessons in {label}.</p>
            </div>
          ) : (
            <>
              <Table caption={`Lessons in ${label}, newest first`} columns={SUMMARY_COLUMNS}>
                {items.map((lesson) => (
                  <SummaryRow key={lesson.id} lesson={lesson} actions={rowActions} />
                ))}
              </Table>
              {total > items.length && (
                <p>
                  Showing the {items.length} most recent of {total} lessons in {label}.
                </p>
              )}
            </>
          )}
        </div>
      </div>
      <StatusMessage>{status}</StatusMessage>
    </>
  );
}

function SummaryRow({
  lesson,
  actions,
}: {
  lesson: Lesson;
  actions: Omit<Parameters<typeof PaidButton>[0], "lesson">;
}) {
  // ADR-007: a row just marked as paid fades from green once per success. It stays on this
  // page, unlike on /pending and Home, where it leaves. The status word remains the cue.
  const [highlighted, setHighlighted] = useState(false);
  const rowActions: typeof actions = {
    ...actions,
    onStart: () => {
      setHighlighted(false);
      actions.onStart();
    },
    onSaved: (updated, previous) => {
      if (updated.paid && !previous.paid) setHighlighted(true);
      return actions.onSaved(updated, previous);
    },
  };
  return (
    <TableRow highlighted={highlighted} onHighlightEnd={() => setHighlighted(false)}>
      <TableCell pinned>
        <StudentName name={lesson.student.name} />
      </TableCell>
      <TableCell nowrap>
        <time dateTime={lesson.date}>{formatLessonDate(lesson.date)}</time>
      </TableCell>
      <TableCell>{lesson.duration_minutes} min</TableCell>
      <TableCell numeric nowrap>
        {formatCents(lesson.price.amount)}
      </TableCell>
      <TableCell>
        <PaymentStatus paid={lesson.paid} />
      </TableCell>
      <TableCell nowrap>
        <PaidButton lesson={lesson} {...rowActions} />
      </TableCell>
    </TableRow>
  );
}
