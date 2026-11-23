/** Class lists shared by TextField and SelectField (docs/design.md: Components, Fields). */
export const FIELD = "flex flex-col gap-2";
export const LABEL = "font-medium";
export const HINT = "-mt-1 text-small text-slate";
export const FIELD_ERROR = "text-small font-medium text-danger";

/** An invalid control gets the danger colour and a thicker border: shape, not only colour. */
export function controlClass(invalid: boolean): string {
  const base = "w-full rounded-control bg-canvas px-3 py-2 text-body text-graphite";
  return invalid ? `${base} border-2 border-danger` : `${base} border border-outline`;
}
