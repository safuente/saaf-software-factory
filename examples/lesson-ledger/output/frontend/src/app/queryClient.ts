import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { SESSION_QUERY_KEY } from "../features/auth/session";
import { hasStatus } from "../shared/api/client";

/** Any API call answering 401 not_authenticated ends the session in the app: the session
 * gate then sends the teacher to /login (spec Behavior: Session check). */
export function createQueryClient(): QueryClient {
  const client: QueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    queryCache: new QueryCache({ onError: (error) => endSessionOn401(error) }),
    mutationCache: new MutationCache({ onError: (error) => endSessionOn401(error) }),
  });
  const endSessionOn401 = (error: unknown) => {
    if (hasStatus(error, 401, "not_authenticated")) {
      client.setQueryData(SESSION_QUERY_KEY, null);
    }
  };
  return client;
}
