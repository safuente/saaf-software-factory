/** A list of totals: a description list of term and figure pairs, one row each, ruled off
 * like table rows. Terms are slate, figures graphite, semibold and tabular. */
export function Totals({
  items,
  fadeIn = false,
}: {
  items: { term: string; value: string | number }[];
  /** The figures fade in when the list appears (ADR-007), not when they change in place. */
  fadeIn?: boolean;
}) {
  return (
    <dl className="flex flex-col">
      {items.map(({ term, value }) => (
        <div
          key={term}
          className="flex items-baseline justify-between gap-4 border-b border-rule py-2"
        >
          <dt className="text-slate">{term}</dt>{" "}
          <dd
            className={
              fadeIn ? "font-semibold tabular-nums motion-fade" : "font-semibold tabular-nums"
            }
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
