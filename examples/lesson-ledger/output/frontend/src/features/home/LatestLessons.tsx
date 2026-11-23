import { formatCents, formatLessonDate } from "../../shared/format";
import { TextLink } from "../../shared/ui/Form";
import { PaymentStatus } from "../../shared/ui/PaymentStatus";
import { Section } from "../../shared/ui/Section";
import { StudentName } from "../../shared/ui/StudentName";
import { Table, TableCell, TableRow } from "../../shared/ui/Table";
import type { LessonPage } from "../lessons/api";

const COLUMNS = [
  { label: "Student" },
  { label: "Date" },
  { label: "Duration" },
  { label: "Price", numeric: true },
  { label: "Status" },
];

/** The 5 latest lessons, newest first, as on /lessons (F07 AC-2 b). */
export function LatestLessons({ lessons }: { lessons: LessonPage }) {
  return (
    <Section headingId="home-latest-heading" heading="Latest lessons">
      {lessons.total === 0 ? (
        <p>No lessons recorded yet.</p>
      ) : (
        <Table caption="Latest lessons, newest first" columns={COLUMNS}>
          {lessons.items.map((lesson) => (
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
              <TableCell>
                <PaymentStatus paid={lesson.paid} />
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}
      <p>
        <TextLink to="/lessons">View all lessons</TextLink>
      </p>
    </Section>
  );
}
