import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { hasStatus, isShownFailure, UNREACHABLE_ON_SUBMIT } from "../../shared/api/client";
import { Button } from "../../shared/ui/Button";
import { Form } from "../../shared/ui/Form";
import { LoadError } from "../../shared/ui/LoadError";
import { Alert, Page } from "../../shared/ui/Page";
import { Section } from "../../shared/ui/Section";
import { StatusMessage } from "../../shared/ui/StatusMessage";
import { StudentName } from "../../shared/ui/StudentName";
import { TextField } from "../../shared/ui/TextField";
import { invalidFields, useFormErrors } from "../../shared/ui/useFormErrors";
import { useSubmitFocus } from "../../shared/ui/useSubmitFocus";
import { addStudent, STUDENTS_QUERY_KEY, useStudents } from "./api";
import { nameError, nameMessageForServerError } from "./validation";
import { Illustration } from "../../shared/ui/Illustration";

const FIELDS = ["name"] as const;

export function StudentsPage() {
  return (
    <Page title="Students" heading="Students" nav>
      <AddStudentForm />
      <StudentList />
    </Page>
  );
}

function AddStudentForm() {
  const queryClient = useQueryClient();
  const fieldErrors = useFormErrors(FIELDS);
  const [name, setName] = useState("");
  const [alert, setAlert] = useState<string>();
  const [status, setStatus] = useState<string>();

  const mutation = useMutation({
    mutationFn: addStudent,
    onSuccess: () => {
      setName("");
      setStatus("Student added.");
      fieldErrors.focus("name");
      void queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY });
    },
    onError: (error) => {
      if (hasStatus(error, 401)) return;
      const nameType = hasStatus(error, 422) ? invalidFields(error.details).get("name") : undefined;
      if (nameType !== undefined) {
        fieldErrors.show({ name: nameMessageForServerError(nameType) });
        return;
      }
      setAlert(UNREACHABLE_ON_SUBMIT);
      focusButton();
    },
  });
  const { buttonRef, focusButton } = useSubmitFocus(mutation.isPending);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutation.isPending) return;
    setAlert(undefined);
    setStatus(undefined);
    if (fieldErrors.show({ name: nameError(name) })) return;
    mutation.mutate(name.trim());
  };

  return (
    <Section headingId="add-student-heading" heading="Add a student">
      <Form onSubmit={onSubmit}>
        <TextField
          id="name"
          label="Name"
          type="text"
          autoComplete="off"
          value={name}
          onChange={(value) => {
            setName(value);
            fieldErrors.clear("name");
          }}
          error={fieldErrors.errors.name}
          ref={fieldErrors.ref("name")}
        />
        {alert && <Alert>{alert}</Alert>}
        <Button
          ref={buttonRef}
          type="submit"
          icon={mutation.isPending ? undefined : "addStudent"}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Adding…" : "Add student"}
        </Button>
        <StatusMessage>{status}</StatusMessage>
      </Form>
    </Section>
  );
}

function StudentList() {
  const query = useStudents();
  return (
    <Section headingId="your-students-heading" heading="Your students" label>
      {query.data ? (
        query.data.total === 0 ? (
          <>
            <Illustration name="students" />
            <p>You have no students yet. Add your first student with the form above.</p>
          </>
        ) : (
          <>
            <ul
              className="mb-4 flex max-w-measure list-none flex-col"
              aria-labelledby="your-students-heading"
            >
              {query.data.items.map((student) => (
                <li key={student.id} className="border-b border-rule py-2">
                  <StudentName name={student.name} />
                </li>
              ))}
            </ul>
            {query.data.total > query.data.items.length && (
              <p>
                Showing the first {query.data.items.length} of {query.data.total} students.
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
