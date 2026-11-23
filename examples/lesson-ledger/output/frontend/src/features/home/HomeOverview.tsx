import { isShownFailure } from "../../shared/api/client";
import { LoadError } from "../../shared/ui/LoadError";
import { StatusMessage } from "../../shared/ui/StatusMessage";
import { useMonthlySummary } from "../payments/api";
import { currentMonth, formatMonth } from "../payments/month";
import { useLatestLessons, useOldestUnpaid, useStudentCount } from "./api";
import { GetStarted } from "./GetStarted";
import { LatestLessons } from "./LatestLessons";
import { MonthFigures } from "./MonthFigures";
import { OldestUnpaid } from "./OldestUnpaid";

/** Home's overview below the title row (F07): the month's figures and two short lists, or the
 * first steps for a new teacher. One state for the whole page: "Loading…" until all four reads
 * finish, and one load error if any fails, so it never shows half the figures or the first
 * steps by mistake (spec Behavior: One load state). */
export function HomeOverview() {
  const month = currentMonth();
  const summary = useMonthlySummary(month);
  const pending = useOldestUnpaid();
  const lessons = useLatestLessons();
  const students = useStudentCount();
  const reads = [summary, pending, lessons, students];

  if (reads.some((read) => read.isError && isShownFailure(read.error))) {
    return (
      <LoadError
        onRetry={() => {
          for (const read of reads) void read.refetch();
        }}
      />
    );
  }
  if (!summary.data || !pending.data || !lessons.data || !students.data) {
    return <StatusMessage>Loading…</StatusMessage>;
  }
  // Lessons need a student and nothing is deleted, so no students means no lessons (R13).
  if (students.data.total === 0 && lessons.data.total === 0) {
    return <GetStarted />;
  }
  return (
    <>
      <MonthFigures summary={summary.data} label={formatMonth(month)} />
      <OldestUnpaid pending={pending.data} month={month} hasLessons={lessons.data.total > 0} />
      <LatestLessons lessons={lessons.data} />
    </>
  );
}
