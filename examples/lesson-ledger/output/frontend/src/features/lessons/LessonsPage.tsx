import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { hasStatus, isShownFailure, UNREACHABLE_ON_SUBMIT } from "../../shared/api/client";
import { formatCents, formatLessonDate, localToday } from "../../shared/format";
import { Button } from "../../shared/ui/Button";
import { Form, TextLink } from "../../shared/ui/Form";
import { LoadError } from "../../shared/ui/LoadError";
import { Alert, Page } from "../../shared/ui/Page";
import { SelectField } from "../../shared/ui/SelectField";
import { PaymentStatus } from "../../shared/ui/PaymentStatus";
import { Section } from "../../shared/ui/Section";
import { StatusMessage } from "../../shared/ui/StatusMessage";
import { StudentName } from "../../shared/ui/StudentName";
import { Table, TableCell, TableRow } from "../../shared/ui/Table";
import { TextField } from "../../shared/ui/TextField";
import { invalidFields, useFormErrors } from "../../shared/ui/useFormErrors";
import { useSubmitFocus } from "../../shared/ui/useSubmitFocus";
import { useStudents, type Student } from "../students/api";
import { LESSONS_QUERY_KEY, recordLesson, useLessons } from "./api";
import {
  lessonErrors,
  serverLessonErrors,
  toRequest,
  type LessonField,
  type LessonFormValues,
} from "./validation";
import { Illustration } from "../../shared/ui/Illustration";

const FIELDS: readonly LessonField[] = ["student", "date", "duration", "price"];
const LESSON_COLUMNS = [
  { label: "Student" },
  { label: "Date" },
  { label: "Duration" },
  { label: "Price", numeric: true },
  { label: "Status" },
];
const STUDENT_NOT_FOUND = "That student could not be found. Reload the page and try again.";

export function LessonsPage() {
  return (
    <Page title="Lessons" heading="Lessons" nav>
      <RecordLessonSection />
      <LessonTable />
    </Page>
  );
}

function RecordLessonSection() {
  const query = useStudents();
  return (
    <Section headingId="record-lesson-heading" heading="Record a lesson">
      {query.data ? (
        query.data.total === 0 ? (
          <>
            <p>Add a student before recording a lesson.</p>
            <p>
              <TextLink to="/students">Add a student</TextLink>
            </p>
          </>
        ) : (
          <RecordLessonForm students={query.data.items} />
        )
      ) : query.isError && isShownFailure(query.error) ? (
        <LoadError onRetry={() => void query.refetch()} />
      ) : (
        <StatusMessage>Loading…</StatusMessage>
      )}
    </Section>
  );
}

function RecordLessonForm({ students }: { students: Student[] }) {
  const queryClient = useQueryClient();
  const fieldErrors = useFormErrors(FIELDS);
  const [values, setValues] = useState<LessonFormValues>(() => ({
    studentId: "",
    date: localToday(),
    duration: "",
    price: "",
  }));
  const [alert, setAlert] = useState<string>();
  const [status, setStatus] = useState<string>();

  const mutation = useMutation({
    mutationFn: recordLesson,
    onSuccess: () => {
      setValues((current) => ({ ...current, studentId: "", duration: "", price: "" }));
      setStatus("Lesson recorded.");
      fieldErrors.focus("student");
      void queryClient.invalidateQueries({ queryKey: LESSONS_QUERY_KEY });
    },
    onError: (error) => {
      if (hasStatus(error, 401)) return;
      if (hasStatus(error, 422)) {
        const errors = serverLessonErrors(invalidFields(error.details).keys());
        if (fieldErrors.show(errors)) return;
      }
      setAlert(hasStatus(error, 404) ? STUDENT_NOT_FOUND : UNREACHABLE_ON_SUBMIT);
      focusButton();
    },
  });
  const { buttonRef, focusButton } = useSubmitFocus(mutation.isPending);

  const change = (field: LessonField, key: keyof LessonFormValues) => (value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    fieldErrors.clear(field);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutation.isPending) return;
    setAlert(undefined);
    setStatus(undefined);
    if (fieldErrors.show(lessonErrors(values))) return;
    mutation.mutate(toRequest(values));
  };

  return (
    <Form onSubmit={onSubmit}>
      <SelectField
        id="student"
        label="Student"
        placeholder="Choose a student"
        options={students.map((s) => ({ value: String(s.id), label: s.name }))}
        value={values.studentId}
        onChange={change("student", "studentId")}
        error={fieldErrors.errors.student}
        ref={fieldErrors.ref("student")}
      />
      <TextField
        id="date"
        label="Date"
        type="date"
        min="2000-01-01"
        max="2099-12-31"
        value={values.date}
        onChange={change("date", "date")}
        error={fieldErrors.errors.date}
        ref={fieldErrors.ref("date")}
      />
      <TextField
        id="duration"
        label="Duration (minutes)"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={values.duration}
        onChange={change("duration", "duration")}
        error={fieldErrors.errors.duration}
        ref={fieldErrors.ref("duration")}
      />
      <TextField
        id="price"
        label="Price (USD)"
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={values.price}
        onChange={change("price", "price")}
        error={fieldErrors.errors.price}
        ref={fieldErrors.ref("price")}
      />
      {alert && <Alert>{alert}</Alert>}
      <Button
        ref={buttonRef}
        type="submit"
        icon={mutation.isPending ? undefined : "recordLesson"}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? "Recording…" : "Record lesson"}
      </Button>
      <StatusMessage>{status}</StatusMessage>
    </Form>
  );
}

function LessonTable() {
  const query = useLessons();
  return (
    <Section headingId="your-lessons-heading" heading="Your lessons">
      {query.data ? (
        query.data.total === 0 ? (
          <>
            <Illustration name="lessons" />
            <p>No lessons recorded yet.</p>
          </>
        ) : (
          <>
            <Table caption="Your lessons, newest first" columns={LESSON_COLUMNS}>
              {query.data.items.map((lesson) => (
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
            {query.data.total > query.data.items.length && (
              <p>
                Showing the {query.data.items.length} most recent of {query.data.total} lessons.
              </p>
            )}
          </>
        )
      ) : query.isError && isShownFailure(query.error) ? (
        <LoadError onRetry={() => void query.refetch()} />
      ) : (
        <StatusMessage>Loading…</StatusMessage>
      )}
    </Section>
  );
}
