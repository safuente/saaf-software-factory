import { TextLink } from "../../shared/ui/Form";
import { Section } from "../../shared/ui/Section";
import { Illustration } from "../../shared/ui/Illustration";

/** First steps for a teacher with no students and no lessons (F07 AC-5 a), in the `panel` box
 * the month figures use, where they will appear. The links name the step, so they differ from
 * the sidebar's "Students" and "Lessons". */
export function GetStarted() {
  return (
    <Section headingId="home-start-heading" heading="Get started">
      <Illustration name="start" />
      <ol className="flex max-w-measure flex-col gap-5 rounded-panel border border-rule p-5 pl-10 marker:font-semibold">
        <li>
          <p className="mb-1">Add your students.</p>{" "}
          <TextLink to="/students">Add your first student</TextLink>
        </li>
        <li>
          <p className="mb-1">
            Record each lesson; Home then shows how the month is going and what is unpaid.
          </p>{" "}
          <TextLink to="/lessons">Record your first lesson</TextLink>
        </li>
      </ol>
    </Section>
  );
}
