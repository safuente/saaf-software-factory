import type { ReactNode } from "react";
import { Link } from "react-router";
import { BUTTON_BASE, BUTTON_CORNERS } from "./Button";
import { Icon, type IconName } from "./Icon";

/** A page action that only navigates (docs/design.md: Page actions): a link drawn as a button,
 * `primary` (black) or `secondary` (outlined), with the buttons' hover and focus cues. Its
 * accessible name (`label`) starts with the visible text and adds where it leads. */
const VARIANTS = {
  primary: [
    BUTTON_BASE,
    BUTTON_CORNERS,
    "border-black bg-black text-canvas no-underline",
    "hover:bg-shell-raised focus-visible:bg-shell-raised",
  ].join(" "),
  secondary: [
    BUTTON_BASE,
    BUTTON_CORNERS,
    "border-outline bg-canvas text-graphite no-underline",
    "hover:bg-mist focus-visible:bg-mist",
  ].join(" "),
};

export function ActionLink({
  to,
  label,
  variant = "secondary",
  icon,
  children,
}: {
  to: string;
  label: string;
  variant?: keyof typeof VARIANTS;
  /** Decorative icon before the visible text (docs/design.md: Icons). */
  icon?: IconName;
  children: ReactNode;
}) {
  return (
    <Link to={to} aria-label={label} className={VARIANTS[variant]}>
      {icon && <Icon name={icon} />}
      {children}
    </Link>
  );
}
