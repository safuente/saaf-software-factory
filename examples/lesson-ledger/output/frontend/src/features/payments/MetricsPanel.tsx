import { formatCents } from "../../shared/format";
import { Totals } from "../../shared/ui/Totals";
import type { MonthlySummary } from "./api";
import { averagePerLesson, paidPercent } from "./metrics";

/** The month's metrics (docs/design.md: Metrics panel): the totals list, a paid versus pending
 * bar hidden from assistive technology (its figures follow as text), and the average per
 * lesson. Built only from the summary the page already loads. The bar's segments are SVG
 * attributes, so it needs no inline style under the CSP. */
export function MetricsPanel({ summary }: { summary: MonthlySummary }) {
  const collected = summary.collected.amount;
  const pending = summary.pending.amount;
  const paid = paidPercent(collected, pending);
  const average = averagePerLesson(collected + pending, summary.lesson_count);
  return (
    <div
      data-metrics-panel
      className="flex flex-col gap-4 rounded-panel border border-rule p-5 xl:w-panel xl:shrink-0"
    >
      <Totals
        fadeIn
        items={[
          { term: "Lessons:", value: summary.lesson_count },
          { term: "Collected:", value: formatCents(collected) },
          { term: "Pending:", value: formatCents(pending) },
        ]}
      />
      <div className="flex flex-col gap-2">
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 100 2"
          preserveAspectRatio="none"
          className="block h-2 w-full overflow-hidden rounded-pill"
        >
          <rect width="100" height="2" className="fill-rule" />
          {paid !== undefined && (
            <>
              <rect data-segment="paid" width={paid} height="2" className="fill-paid motion-grow" />
              <rect
                data-segment="pending"
                x={paid}
                width={100 - paid}
                height="2"
                className="fill-pending-bar"
              />
            </>
          )}
        </svg>
        <p className="text-small text-slate motion-fade">
          {paid === undefined ? "No amounts this month." : `${paid}% paid · ${100 - paid}% pending`}
        </p>
      </div>
      <p className="font-semibold tabular-nums motion-fade">
        Average per lesson: {average === undefined ? "—" : formatCents(average)}
      </p>
    </div>
  );
}
