import { Page } from "../../shared/ui/Page";
import { HomeOverview } from "../home/HomeOverview";
import { QuickActions } from "../home/QuickActions";
import type { SessionBody } from "./api";

/** Home: the title row (h1, the teacher's email, quick actions) and the overview (F07). Log
 * out is in the shell of every app page (F06). */
export function HomePage({ session }: { session: SessionBody }) {
  return (
    <Page
      heading="Lesson Ledger"
      nav
      lead={`Signed in as ${session.teacher.email}`}
      actions={<QuickActions />}
    >
      <HomeOverview />
    </Page>
  );
}
