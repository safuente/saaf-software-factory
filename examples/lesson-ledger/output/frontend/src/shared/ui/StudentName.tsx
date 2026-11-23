import { initials } from "../format";

/** A student's name with the initials circle before it (docs/design.md: Initials). The circle
 * is generated content with empty alternative text (`initials` in app.css), so the text and
 * the accessible name stay exactly the name. From `sm` the name stays on one line. */
export function StudentName({ name }: { name: string }) {
  return (
    <span
      className="initials inline-flex items-center sm:whitespace-nowrap"
      data-initials={initials(name)}
    >
      {name}
    </span>
  );
}
