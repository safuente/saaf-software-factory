import { formatCents } from "../../shared/format";
import { Section } from "../../shared/ui/Section";
import type { MonthlySummary } from "../payments/api";
import { averagePerLesson } from "../payments/metrics";

/** The current month's four figures (F07 AC-1, docs/design.md: Home): the F03 totals and the
 * F06 average, from the month's summary only. A `panel` box like the summary's metrics panel;
 * each figure shows its value above its term, while the DOM keeps term, then value. Two per
 * row on phones; from `md` one row that wraps when the text is enlarged, in a box as wide as
 * its figures. */
export function MonthFigures({ summary, label }: { summary: MonthlySummary; label: string }) {
  const collected = summary.collected.amount;
  const pending = summary.pending.amount;
  const average = averagePerLesson(collected + pending, summary.lesson_count);
  const items = [
    { term: "Collected", value: formatCents(collected) },
    { term: "Pending", value: formatCents(pending) },
    { term: "Lessons", value: String(summary.lesson_count) },
    { term: "Average per lesson", value: average === undefined ? "—" : formatCents(average) },
  ];
  return (
    <Section headingId="home-month-heading" heading={label}>
      <div className="rounded-panel border border-rule p-5 md:w-fit">
        <dl className="grid grid-cols-2 gap-5 md:flex md:flex-wrap md:gap-x-12">
          {items.map(({ term, value }) => (
            <div key={term} className="flex flex-col-reverse gap-1">
              <dt className="text-slate">{term}</dt>
              <dd className="text-heading font-semibold tabular-nums motion-fade">{value}</dd>
            </div>
          ))}
        </dl>
        {summary.lesson_count === 0 && <p className="mt-4 text-slate">No lessons in {label}.</p>}
      </div>
    </Section>
  );
}
