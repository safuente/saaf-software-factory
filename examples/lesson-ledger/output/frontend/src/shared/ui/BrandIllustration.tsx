/** Rows of the month's ledger page: the y of each ruled line, and whether its lesson is paid. */
const ROWS = [
  { y: 100, paid: true },
  { y: 132, paid: true },
  { y: 164, paid: true },
  { y: 196, paid: false },
];

const LINE = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** The drawing of the signed-out brand panel (ADR-008, docs/design.md: Illustrations): the value
 * line drawn as a ledger. A month's page on a second page, its rows each holding a lesson's note
 * and an amount; three rows end in a paid tick, the last in an open amber ring (a pending fee),
 * and a green paid seal sits on the page's corner. Drawn for the dark `shell` ground in the
 * line language of the logo; decorative, so hidden from assistive technology. Shown from `lg`
 * only: the narrow brand strip has no illustration. */
export function BrandIllustration() {
  return (
    <svg
      data-brand-illustration
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 320 240"
      className="block h-auto w-full max-w-illustration"
    >
      <rect
        x="72"
        y="24"
        width="200"
        height="196"
        rx="14"
        transform="rotate(5 172 122)"
        className="fill-shell-raised"
      />
      <rect x="48" y="20" width="200" height="200" rx="14" className="fill-canvas" />
      <path d="M48 64V34a14 14 0 0 1 14-14h172a14 14 0 0 1 14 14v30z" className="fill-rule" />
      <path d="M68 42h72" {...LINE} strokeWidth="6" className="stroke-graphite" />
      <path d="M188 42h40" {...LINE} strokeWidth="6" className="stroke-outline" />
      {ROWS.map(({ y, paid }) => (
        <g key={y}>
          <path d={`M64 ${y}h168`} {...LINE} strokeWidth="2" className="stroke-rule" />
          <ellipse
            cx="76"
            cy={y - 7}
            rx="5.5"
            ry="4.2"
            transform={`rotate(-20 76 ${y - 7})`}
            className="fill-graphite"
          />
          <path
            d={`M81 ${y - 8}V${y - 25}`}
            {...LINE}
            strokeWidth="2"
            className="stroke-graphite"
          />
          <path d={`M100 ${y - 9}h48`} {...LINE} strokeWidth="4" className="stroke-outline" />
          {paid ? (
            <path
              d={`M194 ${y - 10}l5 5 10-11`}
              {...LINE}
              strokeWidth="3.5"
              className="stroke-paid"
            />
          ) : (
            <circle
              cx="202"
              cy={y - 9}
              r="6"
              fill="none"
              strokeWidth="3"
              className="stroke-pending-bar"
            />
          )}
        </g>
      ))}
      <circle cx="246" cy="204" r="28" className="fill-paid" />
      <path d="M233 204l9 9 17-18" {...LINE} strokeWidth="5" className="stroke-canvas" />
    </svg>
  );
}
