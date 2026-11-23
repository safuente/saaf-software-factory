import { useQuery } from "@tanstack/react-query";
import { getCurrentSession } from "./api";

export const SESSION_QUERY_KEY = ["session"] as const;

/** Checked with the server every time a page using it mounts; never kept in browser storage. */
export function useSession() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: getCurrentSession,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    retry: false,
  });
}
