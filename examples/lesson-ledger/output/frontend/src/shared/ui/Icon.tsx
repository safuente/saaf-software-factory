import {
  CalendarPlus,
  ChartColumn,
  Check,
  CircleAlert,
  Clock,
  House,
  LogOut,
  Music,
  Undo2,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

/** The icon map of docs/design.md (Icons, ADR-007): Lucide glyphs, bundled, one per meaning. */
const ICONS = {
  home: House,
  lessons: Music,
  students: Users,
  summary: ChartColumn,
  pending: Clock,
  recordLesson: CalendarPlus,
  addStudent: UserPlus,
  markPaid: Check,
  undoPaid: Undo2,
  logOut: LogOut,
  alert: CircleAlert,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

/** A decorative icon placed right before the visible text that carries the meaning: hidden
 * from assistive technology, never focusable, drawn in the text's colour (`currentColor`) and
 * sized by the `icon` utility relative to that text. */
export function Icon({ name }: { name: IconName }) {
  const Glyph = ICONS[name];
  return <Glyph aria-hidden="true" focusable="false" className="icon" />;
}
