import { NavLink } from "react-router";
import { Icon, type IconName } from "./Icon";

const LINKS: { to: string; label: string; icon: IconName }[] = [
  { to: "/", label: "Home", icon: "home" },
  { to: "/lessons", label: "Lessons", icon: "lessons" },
  { to: "/students", label: "Students", icon: "students" },
  { to: "/summary", label: "Monthly summary", icon: "summary" },
  { to: "/pending", label: "Pending payments", icon: "pending" },
];

/** Sidebar links on the dark shell (docs/design.md: Layout). The current page is a raised,
 * semibold pill; the others are regular weight, so the cue is weight and shape, not only
 * colour. Hover and keyboard focus underline the link. */
const LINK =
  "motion-interaction flex items-center gap-2 rounded-control px-3 py-2 no-underline hover:underline focus-visible:underline";
const CURRENT = `${LINK} bg-shell-raised font-semibold text-shell-text`;
const OTHER = `${LINK} font-normal text-shell-muted`;

/** Navigation between the app pages; NavLink marks the current page with aria-current. Links
 * wrap in the top bar on narrow screens; there is no menu toggle. */
export function MainNav() {
  return (
    <nav aria-label="Main">
      <ul className="flex list-none flex-wrap gap-1 lg:flex-col">
        {LINKS.map(({ to, label, icon }) => (
          <li key={to}>
            <NavLink to={to} end className={({ isActive }) => (isActive ? CURRENT : OTHER)}>
              <Icon name={icon} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
