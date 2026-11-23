import { useState } from "react";
import { isShownFailure } from "../../shared/api/client";
import { formatCents, formatLessonDate } from "../../shared/format";
import { LoadError } from "../../shared/ui/LoadError";
import { Alert, Page } from "../../shared/ui/Page";
import { StatusMessage } from "../../shared/ui/StatusMessage";
import { StudentName } from "../../shared/ui/StudentName";
import { Table, TableCell, TableRow } from "../../shared/ui/Table";
import type { Lesson } from "../lessons/api";
import { PENDING_QUERY_KEY, usePendingLessons } from "./api";
import { PaidButton } from "./PaidButton";
import { paidAnnouncement, pendingTotal, usePendingRows } from "./pendingRows";
import { Illustration } from "../../shared/ui/Illustration";

export function PendingPage() {
  const [alert, setAlert] = useState<string>();
  const [status, setStatus] = useState<string>();
  return (
    <Page title="Pending payments" heading="Pending payments" nav>
      {alert && <Alert>{alert}</Alert>}
      <PendingList
        onStart={() => {
          setAlert(undefined);
          setStatus(undefined);
        }}
        onAnnounce={setStatus}
        onFailed={setAlert}
      />
      <StatusMessage>{status}</StatusMessage>
    </Page>
  );
}

const PENDING_COLUMNS = [
  { label: "Student" },
  { label: "Date" },
  { label: "Duration" },
  { label: "Price", numeric: true },
  { label: "Action" },
];

function PendingList({
  onStart,
  onAnnounce,
  onFailed,
}: {
  onStart: () => void;
  onAnnounce: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const query = usePendingLessons();
  const { remove, buttonRef } = usePendingRows(PENDING_QUERY_KEY, () =>
    document.querySelector<HTMLElement>("main h1"),
  );

  if (query.isError && isShownFailure(query.error)) {
    return <LoadError onRetry={() => void query.refetch()} />;
  }
  if (!query.data) {
    return <StatusMessage>Loading…</StatusMessage>;
  }
  const { items, total, amount_pending } = query.data;

  /** Removes the paid lesson from the list, announces it and moves focus (F03 AC-3): to the
   * next row's button, else the previous row's, else the h1. */
  const onSaved = (_: Lesson, paid: Lesson): boolean => {
    const amount = remove(paid);
    if (amount === undefined) return false;
    onAnnounce(paidAnnouncement(paid, amount));
    return true;
  };

  if (total === 0) {
    return (
      <>
        <Illustration name="paid" />
        <p>Nothing pending. Every lesson is paid.</p>
      </>
    );
  }
  return (
    <>
      <p className="mb-6 font-bold">{pendingTotal(amount_pending.amount, total)}</p>
      <Table caption="Unpaid lessons, oldest first" columns={PENDING_COLUMNS}>
        {items.map((lesson) => (
          <TableRow key={lesson.id}>
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
            <TableCell nowrap>
              <PaidButton
                lesson={lesson}
                onStart={onStart}
                onSaved={onSaved}
                onFailed={onFailed}
                buttonRef={buttonRef(lesson.id)}
              />
            </TableCell>
          </TableRow>
        ))}
      </Table>
      {total > items.length && (
        <p>
          Showing the {items.length} oldest of {total} pending lessons.
        </p>
      )}
    </>
  );
}
