import { ActionLink } from "../../shared/ui/ActionLink";

/** Home's page actions (F07 AC-4): links to the forms on /lessons and /students. Their names
 * add the destination, so they differ from those forms' submit buttons and the sidebar. */
export function QuickActions() {
  return (
    <>
      <ActionLink
        to="/lessons"
        label="Record lesson on the Lessons page"
        variant="primary"
        icon="recordLesson"
      >
        Record lesson
      </ActionLink>
      <ActionLink to="/students" label="Add student on the Students page" icon="addStudent">
        Add student
      </ActionLink>
    </>
  );
}
