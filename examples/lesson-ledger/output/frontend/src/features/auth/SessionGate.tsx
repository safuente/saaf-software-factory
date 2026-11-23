import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { LoadError } from "../../shared/ui/LoadError";
import { Page } from "../../shared/ui/Page";
import { StatusMessage } from "../../shared/ui/StatusMessage";
import type { SessionBody } from "./api";
import { LogOutProvider } from "./LogOutProvider";
import { useSession } from "./session";

/** App pages: render only with a valid session, otherwise go to /login. */
export function RequireSession({ children }: { children: (session: SessionBody) => ReactNode }) {
  const query = useSession();
  if (query.data) return <LogOutProvider>{children(query.data)}</LogOutProvider>;
  if (query.data === null) return <Navigate to="/login" replace />;
  if (query.isError && !query.isFetching) {
    return (
      <Page heading="Lesson Ledger">
        <LoadError onRetry={() => void query.refetch()} />
      </Page>
    );
  }
  return (
    <Page heading="Lesson Ledger">
      <StatusMessage>Loading…</StatusMessage>
    </Page>
  );
}

/** /login and /signup: a teacher who already has a session goes to /. */
export function PublicOnly({ children }: { children: ReactNode }) {
  const query = useSession();
  if (query.data) return <Navigate to="/" replace />;
  return children;
}
