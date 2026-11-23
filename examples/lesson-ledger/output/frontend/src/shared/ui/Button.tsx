import type { ComponentProps } from "react";
import { Icon, type IconName } from "./Icon";

/** Buttons of docs/design.md (Components: Buttons). `primary` is the solid black button that
 * submits a form; `secondary` is the white, outlined button for every other action (row
 * actions, month steps, Try again, Log out). Hover and keyboard focus give the same cue;
 * disabled turns grey. */
export const BUTTON_BASE =
  "inline-flex cursor-pointer items-center justify-center gap-2 self-start border py-2 text-body font-medium whitespace-nowrap motion-interaction";
/** Corners: `control` radius, or a pill for the month chip's buttons (narrower on phones, so
 * both share a row at 320 px). */
export const BUTTON_CORNERS = "rounded-control px-4";
const PILL = "rounded-pill px-3 sm:px-4";
const VARIANTS = {
  primary: [
    BUTTON_BASE,
    "border-black bg-black text-canvas",
    "hover:enabled:bg-shell-raised focus-visible:enabled:bg-shell-raised",
    "disabled:cursor-not-allowed disabled:border-slate disabled:bg-slate",
  ].join(" "),
  secondary: [
    BUTTON_BASE,
    "border-outline bg-canvas text-graphite",
    "hover:enabled:bg-mist focus-visible:enabled:bg-mist",
    "disabled:cursor-not-allowed disabled:border-rule disabled:text-slate",
  ].join(" "),
};

export function Button({
  type = "button",
  variant = "primary",
  pill = false,
  icon,
  children,
  ...props
}: Omit<ComponentProps<"button">, "className"> & {
  variant?: keyof typeof VARIANTS;
  pill?: boolean;
  /** Decorative icon before the label (docs/design.md: Icons). Leave it out while the button
   * reads anything other than its label, such as "Saving…". */
  icon?: IconName;
}) {
  return (
    <button
      {...props}
      type={type}
      className={`${VARIANTS[variant]} ${pill ? PILL : BUTTON_CORNERS}`}
    >
      {icon && <Icon name={icon} />}
      {children}
    </button>
  );
}
