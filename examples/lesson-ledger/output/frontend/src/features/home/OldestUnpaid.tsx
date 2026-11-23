import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { formatCents, formatLessonDate } from "../../shared/format";
import { TextLink } from "../../shared/ui/Form";
import { Alert } from "../../shared/ui/Alert";
import { Section } from "../../shared/ui/Section";
import { StatusMessage } from "../../shared/ui/StatusMessage";
import { StudentName } from "../../shared/ui/StudentName";
import { Table, TableCell, TableRow } from "../../shared/ui/Table";
import type { Lesson, LessonPage } from "../lessons/api";
import { summaryKey, type MonthlySummary, type PendingLessons } from "../payments/api";
import { PaidButton } from "../payments/PaidButton";
import { paidAnnouncement, pendingTotal, usePendingRows } from "../payments/pendingRows";
import { homeLessonsKey, homePendingKey } from "./api";

const COLUMNS = [
  { label: "Student" },
  { label: "Date" },
  { label: "Duration" },
  { label: "Price", numeric: true },
  { label: "Action" },
];

const HEADING_ID = "home-oldest-heading";

/** The 5 oldest unpaid lessons with "Mark as paid", and the F03 total over all months
 * (F07 AC-2 a, AC-3). A mark follows F03 AC-3, except that focus goes to this section's h2
 * when the table empties. It also moves the month's figures, when the lesson is in `month`,
 * and its status in Latest lessons; `PaidButton` then refreshes every list from the server,
 * so the table refills up to 5 rows. */
export function OldestUnpaid({
  pending,
  month,
  hasLessons,
}: {
  pending: PendingLessons;
  month: string;
  /** Whether the teacher has any lesson: the empty message differs (spec Behavior). */
  hasLessons: boolean;
}) {
  const queryClient = useQueryClient();
  const [alert, setAlert] = useState<string>();
  const [status, setStatus] = useState<string>();
  const { remove, buttonRef } = usePendingRows(homePendingKey, () =>
    document.getElementById(HEADING_ID),
  );

  const onSaved = (updated: Lesson, previous: Lesson): boolean => {
    queryClient.setQueryData<LessonPage>(
      homeLessonsKey,
      (page) =>
        page && { ...page, items: page.items.map((l) => (l.id === updated.id ? updated : l)) },
    );
    if (updated.date.startsWith(month) && updated.paid !== previous.paid) {
      queryClient.setQueryData<MonthlySummary>(
        summaryKey(month),
        (summary) =>
          summary && {
            ...summary,
            collected: {
              ...summary.collected,
              amount: summary.collected.amount + previous.price.amount,
            },
            pending: { ...summary.pending, amount: summary.pending.amount - previous.price.amount },
          },
      );
    }
    const amount = remove(previous);
    if (amount === undefined) return false;
    setStatus(paidAnnouncement(previous, amount));
    return true;
  };
  const actions = {
    onStart: () => {
      setAlert(undefined);
      setStatus(undefined);
    },
    onSaved,
    onFailed: setAlert,
  };

  return (
    <Section headingId={HEADING_ID} heading="Oldest unpaid lessons" focusable>
      {alert && (
        <div className="mb-4">
          <Alert>{alert}</Alert>
        </div>
      )}
      {pending.total === 0 ? (
        <p>{hasLessons ? "Nothing pending. Every lesson is paid." : "Nothing pending."}</p>
      ) : (
        <>
          <p className="mb-4 font-semibold">
            {pendingTotal(pending.amount_pending.amount, pending.total)}
          </p>
          <Table caption="Oldest unpaid lessons, oldest first" columns={COLUMNS}>
            {pending.items.map((lesson) => (
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
                  <PaidButton lesson={lesson} {...actions} buttonRef={buttonRef(lesson.id)} />
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </>
      )}
      <p>
        <TextLink to="/pending">View all pending payments</TextLink>
      </p>
      <StatusMessage>{status}</StatusMessage>
    </Section>
  );
}
